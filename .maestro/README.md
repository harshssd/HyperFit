# Maestro E2E flows

Mobile end-to-end tests for HyperFit, driven by [Maestro](https://maestro.mobile.dev).

## Install

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
brew install openjdk@17
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
maestro --version
```

## Configure

Copy `.env.example` and fill in credentials for a dedicated Supabase test
user (do **not** use a real account — flows call `clearState` and sign in
repeatedly):

```bash
cp .maestro/.env.example .maestro/.env
# edit .maestro/.env
```

Then export them when running flows:

```bash
set -a; source .maestro/.env; set +a
```

## Run a single flow

You need a running iOS simulator (or Android emulator) with the HyperFit
dev build (or production build) installed:

```bash
# Build + install once via Expo
npx expo run:ios   # or run:android

# Then run any flow
maestro test .maestro/flows/smoke.yaml
maestro test .maestro/flows/auth-signin.yaml
```

## Run all flows

```bash
maestro test .maestro/flows/
```

`_auth-if-needed.yaml` is a sub-flow used by other flows — Maestro will
skip running it on its own when invoked via the directory.

## Record video

```bash
maestro test --format=junit --output report.xml .maestro/flows/auth-signin.yaml
maestro record .maestro/flows/auth-signin.yaml   # interactive recorder
```

## Flows

| Flow | What it does |
| --- | --- |
| `smoke.yaml` | Cold-launch the app, assert the login screen renders. |
| `auth-signin.yaml` | Sign in with `MAESTRO_EMAIL` / `MAESTRO_PASSWORD`, assert HomeView. |
| `auth-signup.yaml` | Toggle to signup, submit a unique timestamped email. |
| `browse-and-activate-plan.yaml` | Open plan library, activate the first plan, assert ACTIVE badge. |
| `create-plan.yaml` | Open plan creator, fill name/description, schedule on Monday, save. |
| `calendar-nav.yaml` | Cycle next/prev month, return to today, verify label changes. |
| `history-empty.yaml` | Open History tab on a fresh user, verify empty state. |

## Conventions

- All selectors use `id:` (testIDs) — see the codebase for naming. Pattern is
  `{component}-{action}` (e.g. `login-submit-button`, `tab-gym`,
  `plan-card-{id}-activate`).
- Adaptive auth: every flow that needs a session calls `_auth-if-needed.yaml`,
  which is a no-op when the user is already signed in.
- `extendedWaitUntil` over `assertVisible` for anything that needs network
  or animation — Maestro retries automatically up to the given timeout.

## CI

`.github/workflows/maestro.yml` is scaffolded but disabled by default
(needs a simulator). Flip the workflow's `if:` guard to enable once a
device runner is wired up.
