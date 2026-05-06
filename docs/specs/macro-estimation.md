# Macro estimation — design spec

**Status:** draft, pending decision
**Author:** session 2026-05-05
**Goal:** When a user logs a meal with free-text name + quantity (and
optionally per-ingredient breakdown), automatically estimate kcal +
macros so they don't have to look the numbers up. Estimates must be
fast (<2 s), cheap (cached aggressively), and editable.

---

## 1. Locked decisions (from prior conversation)

- **D1 = A** — manual ESTIMATE button, user always sees + can edit
  before saving. No automatic-on-save, no live-as-you-type.
- **D2 = B** — when ingredients[] is populated, estimate per-ingredient
  and sum. Otherwise estimate from `name + quantity_label`.
- **D3 = A** — global cache, project-wide, RLS public-read. Per-user
  corrections tracked but cache itself shared.

Open questions covered below: cache key shape, quantity scaling,
seeding, drift detection.

---

## 2. The hard problem: free-text indexing

A naïve `cache[query] = macros` design fails fast. "3 eggs",
"three eggs", "3 large eggs", "scrambled eggs (3)", "Eggs - 3" all
mean the same thing but hash to five different keys → ~95% cache miss
rate, ~95% wasted Haiku calls.

The fix is to split the *food* from the *quantity* at parse time and
cache each independently. Cache stores macros normalized to a canonical
unit (per-100g for weight-based foods, per-unit for discrete items
like eggs / slices / cups). Lookup multiplies by the user's quantity.

### 2.1 Schema — two tables, not one

```sql
-- Canonical food directory, populated by Haiku + manual review.
-- One row per recognized food. Macros are normalized per canonical unit.
CREATE TABLE food_macros (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name  text NOT NULL UNIQUE,        -- "chicken breast (cooked)"
  canonical_unit  text NOT NULL,               -- 'g' | 'unit' | 'ml' | 'cup' | 'slice'
  -- Macros per ONE canonical_unit. Per 100g for weight-based, per 1 for discrete.
  kcal_per_unit   numeric NOT NULL,
  protein_per_unit numeric NOT NULL,
  carb_per_unit   numeric NOT NULL,
  fat_per_unit    numeric NOT NULL,
  fiber_per_unit  numeric NOT NULL,
  -- For discrete items, the typical weight in grams of one unit.
  -- Lets a query like "200g eggs" (uncommon but possible) still scale.
  unit_grams      numeric,                     -- 50 for "egg", 25 for "slice of bread"
  -- Provenance + drift tracking.
  source          text NOT NULL DEFAULT 'haiku',  -- 'haiku' | 'seed' | 'manual'
  hit_count       integer NOT NULL DEFAULT 0,
  corrected_count integer NOT NULL DEFAULT 0,  -- ++ each time a user edits
  last_estimated_at timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX food_macros_canonical_name_trgm
  ON food_macros USING gin (canonical_name gin_trgm_ops);

-- Aliases: free-text user inputs that map to a canonical food.
-- Populated lazily as Haiku resolves new strings.
CREATE TABLE food_aliases (
  alias        text PRIMARY KEY,               -- normalized user input, e.g. "3 eggs" → "eggs"
  food_id      uuid NOT NULL REFERENCES food_macros(id) ON DELETE CASCADE,
  hit_count    integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX food_aliases_food_id ON food_aliases(food_id);
```

### 2.2 Normalization pipeline

Free text → normalized form, before any cache lookup:

```
"3 Large Eggs"
  → strip extra whitespace          → "3 large eggs"
  → lowercase                       → "3 large eggs"
  → strip leading quantity + unit   → "large eggs"   (quantity: 3, unit: 'unit')
  → strip size modifiers            → "eggs"         (drop: large, small, medium, jumbo, fresh, raw, cooked)
  → singularize via stop-list       → "egg"          (drop trailing 's' for known plurals)
```

The stripped quantity (3) and unit (`unit`) are kept in the *request
context*, not the cache key. Cache key is just `egg`.

Normalization is shared between client and server (TS module +
matching Edge Function helper) so the lookup key is identical.

### 2.3 Lookup flow

```
estimateMacros({ query, ingredients[] }):
  if ingredients[].length:
    for each ingredient:
      result += lookupOne(ingredient.name, ingredient.quantity_label)
    return sum

  return lookupOne(query.name, query.quantity_label)

lookupOne(rawName, rawQty):
  qty, unit, normalized = parse(rawName + ' ' + rawQty)

  # 1. Exact alias hit
  food = SELECT * FROM food_aliases JOIN food_macros WHERE alias = normalized
  if food:
    increment hit_counts
    return scale(food, qty, unit)

  # 2. Trigram fuzzy match against canonical_name (≥ 0.6 similarity)
  food = SELECT * FROM food_macros
         WHERE canonical_name % normalized
         ORDER BY similarity(canonical_name, normalized) DESC
         LIMIT 1
  if food:
    INSERT INTO food_aliases (alias, food_id) VALUES (normalized, food.id)
    return scale(food, qty, unit)

  # 3. Cold miss — call Haiku
  food_data = haiku.estimate(rawName)
  food = INSERT INTO food_macros (...) VALUES (food_data) RETURNING *
  INSERT INTO food_aliases (alias, food_id) VALUES (normalized, food.id)
  return scale(food, qty, unit)

scale(food, qty, unit):
  if food.canonical_unit == unit:
    multiplier = qty
  elif food.canonical_unit == 'unit' and unit == 'g' and food.unit_grams:
    multiplier = qty / food.unit_grams        # 200g eggs → 200/50 = 4 units
  elif food.canonical_unit == 'g' and unit == 'unit' and food.unit_grams:
    multiplier = qty * food.unit_grams / 100  # already per-100g
  elif unit in {'g', 'kg'} and food.canonical_unit == 'g':
    grams = qty if unit == 'g' else qty * 1000
    multiplier = grams / 100                  # canonical is per-100g
  else:
    fallback to Haiku call (unit conversion is hard)

  return {
    kcal:    food.kcal_per_unit    * multiplier,
    protein: food.protein_per_unit * multiplier,
    ...
  }
```

Three-tier match: exact alias → trigram fuzzy → Haiku cold call.
Each tier writes back so the next equivalent query is faster.

---

## 3. Components

### 3.1 Database (`supabase/migrations/<n>_food_macros.sql`)

- `food_macros` + `food_aliases` tables (above)
- `pg_trgm` extension enable
- RLS:
  - `food_macros`: `SELECT TRUE` for `authenticated`, write only via service role
  - `food_aliases`: same
- Trigger to bump `hit_count` on `food_aliases` SELECT — use a stored
  function called explicitly by the Edge Function (PG doesn't have
  cheap row-level read counters)

### 3.2 Edge Function (`supabase/functions/estimate-macros/index.ts`)

- Verifies user JWT (`verify_jwt = true`)
- Body: `{ query: string, qty?: string, ingredients?: Array<{name, quantity_label}> }`
- Implements the lookup flow above
- Calls Haiku via `ANTHROPIC_API_KEY` secret with structured prompt:
  ```
  Estimate macros for one canonical unit of: <food>.
  Output JSON: {
    "canonical_name": string,         // e.g. "chicken breast (cooked)"
    "canonical_unit": "g"|"unit"|"ml"|"cup"|"slice",
    "kcal_per_unit": number,
    "protein_per_unit": number,
    "carb_per_unit": number,
    "fat_per_unit": number,
    "fiber_per_unit": number,
    "unit_grams": number|null         // weight of 1 unit if discrete
  }
  Per-unit means: per 100g if canonical_unit='g', else per 1 of that unit.
  ```
- Uses Haiku 4.5 (`claude-haiku-4-5-20251001`) with `max_tokens: 200`
- Cost ceiling: ~$0.0001 per cold call. 10k unique foods/month = ~$1
- Rate limit: 30 cold calls per user per hour (cache hits don't count)
- Returns scaled totals

### 3.3 Normalization module (`src/utils/foodNormalize.ts` + Edge equivalent)

Shared TypeScript helpers. Same code runs in app (for client-side
optimistic display) and in the function (for canonical lookup).

```ts
export type ParsedQuantity = {
  qty: number;             // numeric amount
  unit: 'g'|'kg'|'oz'|'ml'|'l'|'cup'|'slice'|'unit';
  food: string;            // normalized canonical food name
};
export function parseQuantity(raw: string): ParsedQuantity { ... }
export function normalizeFood(raw: string): string { ... }
```

Word-list dependencies (modifiers to strip, plurals to singularize)
live inline in the module. Boring but bounded.

### 3.4 Service layer (`src/services/macroEstimation.ts`)

```ts
export type EstimatedMacros = {
  kcal: number; protein_g: number; carb_g: number;
  fat_g: number; fiber_g: number;
  source: 'cache' | 'estimate';
};
export const estimateMacros = (input: EstimateInput): Promise<EstimatedMacros>;
```

Just an `invoke` of the Edge Function. No client-side cache — the
Edge Function's database is the single source of truth.

### 3.5 UI — `AddMealModal` integration

- New row beneath the macro inputs:
  `[ ESTIMATE MACROS ]  · "AI estimate · tap to edit"`
- Button enabled when `name.trim().length > 0` OR `ingredients.length > 0`
- Loading state: button shows spinner, fields dim
- Success: pre-fills the 5 macro fields, shows pill "ESTIMATED · tap any to override"
- User edit: pill changes to "EDITED" so we can later track
  `corrected_count` ++ on save
- Error: inline error toast, fields untouched

No UI changes elsewhere — the History/Home/share surfaces don't need
to know whether macros came from cache, Haiku, or manual.

### 3.6 Drift detection (`scripts/audit-macros-cache.ts`)

A Bun script you run weekly (or wire to GitHub Actions cron). Scans
`food_macros` for entries with:

- `corrected_count / hit_count > 0.20` → flag as likely-poisoned
- `last_estimated_at < now() - 90 days AND hit_count > 50` → re-estimate
- Hit-count zero foods older than 30 days → mark for review

Outputs a markdown report you skim. Flagged rows can be re-estimated
via a one-line `re_estimate(food_id)` admin RPC, or hand-edited.

No automatic deletion — corrupted entries get re-estimated, never
silently dropped (would cause ghost cache misses + unstable totals on
shared meals like "burrito" across users).

---

## 4. Pre-population — using your Claude subscription

You're right that one-time seeding via your existing Claude access
(no per-call API cost, just your time) gets us to a high-hit-rate
cache without paying for cold calls during user growth.

Plan:

1. Generate a list of the **top ~800 foods by frequency** in US/UK
   diets. Sources to merge:
   - USDA FoodData Central "branded" + "foundation" most-queried
   - MyFitnessPal public top-1000
   - Manual additions for protein-heavy lifter foods (whey, casein,
     creatine carbs, etc.) since this is a hypertrophy app

2. Run them through Claude (your subscription, claude.ai) using a
   single batch prompt that returns a CSV. ~800 foods, batched 50 at
   a time = 16 requests, ~30 minutes.

3. Save as `supabase/seeds/food_macros_seed.sql` — one INSERT per row
   with `source = 'seed'`. Apply via:
   ```bash
   supabase db push --include-seed seeds/food_macros_seed.sql
   ```

Expected outcome: ~85% of "I logged a meal" queries hit the seed
cache directly. Long-tail queries (regional dishes, brand-name
products) fall through to Haiku.

I'll write a generator script (`scripts/seed-macros-batch.md` =
prompt template + the food list) so you can paste sections into
claude.ai and copy results back. Or a Bun script that uses your local
Claude Code to do it, since that's already authenticated.

---

## 5. Costs

Assuming 10k DAU, average user logs 4 meals/day, 2 cold calls per
meal as the cache fills up (decreasing over time):

- **Haiku cold calls**: 10k × 4 × 2 × 30 days = 2.4M calls/month
  initial. With seed cache active and natural alias accumulation,
  drops to ~5% miss rate within a week → 120k calls/month steady.
- **Per call**: ~$0.0001 (Haiku 4.5 at $1/MTok input + $5/MTok output,
  ~250 in + 100 out tokens per call) = $0.0001 × 120k = **$12/month**
- **Embedding calls** (if we add pgvector later): not in v1.

So this is essentially free at HyperFit's pre-launch scale, and tens
of dollars at meaningful scale. Trivial.

---

## 6. Open questions / risks

1. **Quantity parsing reliability.** "3 eggs" easy, "couple slices
   of bread" hard, "a handful of nuts" near-impossible. Fallback path:
   if parser returns low confidence, ship the raw query straight to
   Haiku with no normalization, accept the cache miss.

2. **Per-100g vs per-serving.** USDA standard is per-100g for raw,
   per-serving for cooked. We pick per-100g for `g` canonical_unit
   uniformly; Haiku's prompt enforces this. Risk: subtle drift if
   prompts change. Mitigation: snapshot a regression test set
   (`__tests__/macroEstimation.test.ts`) of 50 known-correct foods.

3. **Hit-count race conditions.** Concurrent users hitting the same
   food increment `hit_count` non-atomically. PG `UPDATE … SET hit_count
   = hit_count + 1` is safe under MVCC, but expensive at high QPS.
   Workaround if needed: batch increments via a queue table flushed
   every 60 s. Not worth it pre-launch.

4. **User-uploaded barcodes / brand products.** Out of scope for v1.
   Most "Snickers bar" / "Chobani Greek yogurt" queries Haiku will
   handle reasonably; precise brand SKUs are a future feature.

5. **Privacy.** Aliases written to cache include user-typed strings.
   Users could leak meal-name PII (like a partner's name) into the
   shared cache. Mitigation: drop any alias > 30 chars or containing
   suspicious patterns (proper nouns near food terms). Cheap regex
   filter pre-write.

---

## 6.5 Addendum — robust free-text matching

The §2 design (normalize → exact alias → trigram → Haiku) handles
clean inputs but degrades sharply on real-world variation:

| Input | Failure mode of §2 |
|---|---|
| `chiken brest` | trigram similarity ~0.5, below threshold → cold Haiku call |
| `PB sandwich` | trigram "peanut butter" ~0.0 → cold Haiku call |
| `breast chicken` | exact alias miss; trigram matches but weak |
| `scrambled eggs` vs `eggs` | alias miss; user pays for Haiku twice |
| `courgette` vs `zucchini` | semantically same, lexically zero overlap |
| `Cheerios` | brand → generic resolution requires LLM |

The cost is paid in *latency* (cold Haiku ~1-2 s vs cached ~50 ms) and
*money* (cold call vs free) — but worse, it's paid in *user trust*.
"I typed almost exactly that yesterday and it was instant" → "today
it took 2 s and the number's different."

We have four matching strategies, ordered by precision and cost:

### Strategy comparison

| Tier | Tech | Catches | Latency | Cost / call |
|---|---|---|---|---|
| 1 | Exact alias hit (hash lookup) | exact repeats | ~5 ms | free |
| 2 | Normalized exact (after typo dict + abbrev expand + stopword strip) | minor variations, common abbreviations | ~10 ms | free |
| 3 | Trigram fuzzy (`pg_trgm`, threshold 0.4 + top-K ranking) | typos within edit distance 2-3, partial matches | ~30 ms | free |
| 4 | Embedding cosine (pgvector, threshold 0.85) | synonyms, word order, semantic equivalence, language variants | ~80 ms | $0.00002 (one embed of query) |
| 5 | Haiku cold call | true unknowns | ~1500 ms | $0.0001 |

§2's design used only tiers 1, 3, 5. The full design uses 1-5 *with
an autocomplete UI in front* so most queries never even hit the
backend.

### Recommended end-to-end flow

```
USER INTERACTION
  user types "chiken brest" in the meal-name field
  on each keystroke (debounced 200 ms):
    POST /search-foods { query: "chiken brest", limit: 5 }
    → returns: ["chicken breast (cooked)", "chicken thigh", ...]
    UI shows dropdown
  user can:
    (a) tap a candidate → instant macros, candidate.canonical_name
        written to food_aliases as a new alias for the typed string
    (b) ignore dropdown + tap ESTIMATE button → backend runs full pipeline

BACKEND /search-foods
  q_normalized = normalize(q)              # tier 2 normalization
  trigram_hits = SELECT canonical_name, similarity(canonical_name, q_normalized)
                 FROM food_macros
                 WHERE canonical_name % q_normalized
                 ORDER BY similarity DESC LIMIT 10
  embed_hits   = SELECT canonical_name, 1 - (embedding <=> embed(q_normalized))
                 FROM food_macros
                 ORDER BY embedding <=> embed(q_normalized) LIMIT 10
  merge by max-score, dedupe, return top 5

BACKEND /estimate-macros (cold path, ESTIMATE button)
  step 1: exact alias hit → done
  step 2: normalize + exact alias hit → done
  step 3: trigram top-1 with similarity ≥ 0.7 → write alias, done
  step 4: embedding top-1 with cosine ≥ 0.85 → write alias, done
  step 5: Haiku cold call → write food + alias, done
```

Tier 2 (normalization) does the heavy lifting cheaply. Mandatory
parts of the normalizer:

- **Typo dictionary** (~50 hand-curated food typos):
  ```
  chiken → chicken
  brest → breast
  yogut → yogurt
  cottge → cottage
  letuce → lettuce
  brocoli → broccoli
  bannana → banana
  ...
  ```
  Curated, not generated. Tiny file (~2 KB). Maintenance burden:
  add ~5 entries per month based on `food_aliases` tail-end queries.

- **Abbreviation expansion** (~20 entries):
  ```
  pb → peanut butter
  gf → gluten free
  ww → whole wheat
  pwo → pre-workout
  evoo → extra virgin olive oil
  ...
  ```

- **Stopword strip**:
  `the, a, of, with, and, some, my, plain, fresh, raw, large, small, medium, jumbo, organic`

- **Singularize** plurals via simple stop-list (eggs→egg, tomatoes→tomato).
  Don't use stemming libraries — over-aggressive on food terms.

### Embedding tier (tier 4) — cost vs benefit

Adding embeddings means:

- **+1 dependency**: pgvector extension (Supabase supports natively)
- **+1 column**: `embedding vector(1536)` on `food_macros`
- **+1 API call** per cold lookup: query embedding via OpenAI
  text-embedding-3-small (~$0.00002/call)
- **+1 backfill job**: embed every existing food row once (~$0.20 for
  1k seed rows total, one-time)
- **HNSW index** for sub-100ms similarity search

Benefit: handles cases trigram fundamentally can't:
- `courgette` ↔ `zucchini` (zero lexical overlap, same food)
- `PB sandwich` ↔ `peanut butter sandwich` (abbreviation expansion
  catches some, embedding catches the rest)
- `morning protein shake` ↔ `whey protein` (semantic, not lexical)

Without embeddings, those cases all fall through to Haiku → ~$0.0001
each instead of ~$0.00002. At 10k DAU, embedding tier is ~$3/mo, saves
~$15/mo in Haiku calls. Net win at scale, but not strictly required.

### Recommended split — what to ship in v1 vs later

- **v1 (must)**: tiers 1, 2, 3, 5. Adds typo dict, abbreviation expand,
  stopword strip on top of §2's design. Skips embeddings.
- **v1 (must)**: autocomplete UI (`/search-foods` endpoint).
  This is where 80% of the matching value lands — user resolves
  ambiguity by tapping, no fuzzy logic needed for resolved cases.
- **v2 (when cache miss rate > 15% at steady state)**: add tier 4
  embeddings. Backfill seed rows + new rows on insert.

Why autocomplete is mandatory in v1: it sidesteps the entire matching
problem for any food that's already in the cache. The backend only
deals with hard cases (user typed something + ignored suggestions).

### Updated component list

Adds to §3:

- **`/search-foods` Edge Function** — same normalization as
  `/estimate-macros`, returns top-5 candidates by trigram score. ~80
  LOC. Public read-only, no Anthropic key needed.
- **`AutocompleteFoodPicker` component** — drop-in to AddMealModal's
  name input. Debounced search, dropdown of candidates, tap to fill.
  ~150 LOC.
- **Typo + abbreviation dictionaries** (`src/utils/foodNormalize.ts`
  + Edge mirror). ~100 LOC of hand-curated entries.

### Updated implementation order

If you go with v1-must list:

1. Migration (food_macros + food_aliases + pg_trgm) — same as before
2. Normalization module + typo/abbrev dicts + tests — ~300 LOC
3. Edge Functions (`estimate-macros` + `search-foods`) — ~350 LOC
4. Seed dataset
5. Service + AutocompleteFoodPicker + AddMealModal integration — ~300 LOC
6. Drift audit

Total: ~1500 LOC, 6 PRs, 3-4 days focused.

If you go with v1+embeddings:

7. (later) Embedding tier — pgvector enable, OpenAI key, backfill,
   tier-4 in `/estimate-macros`. ~150 LOC + backfill script. ~1 day.

---

## 7. Implementation order

If/when we ship this, suggested order (each is a mergeable PR):

1. **Migration** — `food_macros`, `food_aliases`, RLS, pg_trgm
   enable. ~50 LOC SQL.
2. **Normalization module + tests** — `foodNormalize.ts` with
   parsing, modifiers stop-list, unit map. ~200 LOC + 100 LOC tests.
3. **Edge Function** — `estimate-macros/index.ts`. ~250 LOC.
   Includes its own port of `foodNormalize.ts` (duplicate ok, can
   factor into shared `_shared/` if it grows).
4. **Seed dataset** — generator prompt + `food_macros_seed.sql`
   (~800 rows). Manual curation.
5. **Service + UI** — `macroEstimation.ts` + AddMealModal button +
   pill states. ~150 LOC.
6. **Drift audit script** — `scripts/audit-macros-cache.ts`. ~80 LOC.

Total: ~1100 LOC across 6 PRs over ~2-3 days of focused work.

---

## 8. Decision needed before implementation

You. Items 4 (seed) and 6 (drift audit) are optional v1 add-ons; the
core (1, 2, 3, 5) ships in 4 PRs. Anthropic API key needs to land in
Supabase secrets either way.

Reply with go/no-go on:
- (a) ship core 4 PRs + skip seed (ship faster, pay ~$30/mo extra
  for first month while cache warms)
- (b) ship all 6 (ship slower, near-zero cost, you spend an evening
  generating the seed)
- (c) wait — circle back when something else lights up
