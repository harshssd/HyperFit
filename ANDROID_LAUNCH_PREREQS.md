# Android launch prereqs

Status as of v2.3.0 push, updated after audit. Original 6-item list was overly pessimistic, several items turn out to be no-ops for our stack.

## Done

- [x] **Permissions cleanup** (commit `81cca2b`) — dropped unused `ACTIVITY_RECOGNITION` + `ACCESS_FINE_LOCATION` from `app.json`. Play Console rejects unjustified sensitive permissions.
- [x] **Apple Sign-In gating** — already `Platform.OS === 'ios'` gated in `LoginView.tsx:326`, won't render or crash on Android.
- [x] **Google OAuth** — uses Supabase as the OAuth client (not a native Android module). The Supabase dashboard already has Google credentials configured (works for both iOS and Android). No new Android client ID needed.
- [x] **Deep link config** — `hyperfit://` custom scheme registered in `app.json` intentFilter. Custom schemes don't need `assetlinks.json` (that's only for HTTPS App Links). The `autoVerify: true` flag is a no-op for custom schemes.
- [x] **Codebase neutrality** — zero `Platform.OS === 'android'` divergent paths. Cross-platform components throughout.

## Required before Play Store submission

### 1. Generate Android keystore + first build (one-time, interactive)

```bash
eas build --platform android --profile preview
```

This:
- Generates a keystore on EAS servers (accept the prompt)
- Builds an APK (`preview` profile = internal distribution `.apk`, install directly)
- Future builds will be non-interactive

Time: ~20-25 min. Output: APK download URL.

### 2. Install APK on Android emulator + smoke test

```bash
# Boot a Pixel 8 (or any modern API 33+ emulator)
$ANDROID_HOME/emulator/emulator -avd <name> &
# Download APK from EAS URL, then:
adb install ~/Downloads/HyperFit-<sha>.apk
adb shell monkey -p com.hyperfocused.hyperfit 1
```

Smoke checklist:
- [ ] Boots without crash
- [ ] Login screen renders (no Apple button — that's correct)
- [ ] Google sign-in completes round-trip via system browser
- [ ] Onboarding 3 screens flow through
- [ ] Workout logging saves a set
- [ ] Nutrition water tap increments
- [ ] Calendar tab loads
- [ ] Profile → Sign Out works

If any native module breaks (likely candidates: react-native-view-shot for share cards, lucide-react-native rendering quirks), patch and rebuild.

### 3. Adaptive icon visual check

Android crops the foreground PNG into circle/squircle/rounded-square masks per device. Open a render preview at https://icon.kitchen or use an emulator launcher screenshot. The foreground at `./assets/adaptive-icon.png` was authored for iOS — verify it doesn't get clipped at the wrong spots.

### 4. Play Console developer account ($25 one-time, you do this)

1. Go to https://play.google.com/console
2. Sign up as an Individual (or Organization) developer — $25 USD one-time fee
3. Verify identity (Google sends a verification email; for Individuals they may ask for ID)
4. Enable 2FA (required)

Once active:
1. Click **Create app** → fill in app name (HyperFit), default language, app type (App), free/paid (Free), declarations
2. App content section needs: privacy policy URL (✅ already live), data safety questionnaire, app category (Health & Fitness), content rating questionnaire, target audience (13+), news app (No), COVID-19 contact tracing (No), data safety form
3. Internal testing track: add tester emails (start with just yours), upload first APK from EAS

### 5. Production EAS Android build

After the preview build smoke-tests clean:

```bash
eas build --platform android --profile production --non-interactive
```

`production` profile uses `autoIncrement: true` for `versionCode` (already configured in `eas.json`). Output is an `.aab` (Android App Bundle) for Play Store upload, not an `.apk`.

### 6. Submit to Play internal track

```bash
eas submit --platform android --profile production --latest
```

Requires Google Play service account JSON (one-time setup):
- In Play Console → Users and permissions → Invite a service account from Google Cloud Console
- Download the JSON key
- `eas credentials configure-build --platform android --profile production` and paste in the JSON path

After internal testing track works (~1-2 days of you using it), promote to production track in Play Console UI.

## Estimated total time

- Steps 1-3 (build + smoke + icon): **2-3 hours** (mostly waiting on builds)
- Step 4 (Play Console setup): **1-2 hours** (forms + verification)
- Steps 5-6 (production build + submit): **1 hour**
- Play Store review: **typically 1-3 days** (faster than Apple)

## Out of scope for this launch

- Apple Sign-In on Android (intentionally not offered; Supabase Apple provider works on Android via web flow but UX is poor — defer)
- Push notifications (no APNs/FCM wiring yet)
- Wear OS companion (separate effort)
