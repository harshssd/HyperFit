# App Store Publishing Checklist

## Pre-Submission Checklist

### iOS App Store

- [ ] **Firebase Configuration**
  - [ ] Firebase project created
  - [ ] iOS app added to Firebase
  - [ ] `firebase.config.ts` updated with correct values
  - [ ] Firestore database enabled
  - [ ] Anonymous authentication enabled

- [ ] **App Configuration**
  - [ ] Bundle identifier set in `app.json` (e.g., `com.hyperfit.app`)
  - [ ] App version number set (currently 2.1.0)
  - [ ] Build number incremented for each submission
  - [ ] App name and slug configured

- [ ] **App Store Connect Setup**
  - [ ] App created in App Store Connect
  - [ ] App Store Connect App ID noted
  - [ ] Apple Developer account active
  - [ ] Apple Team ID noted
  - [ ] App information completed:
    - [ ] App name
    - [ ] Subtitle
    - [ ] Category: Health & Fitness
    - [ ] Age rating completed
    - [ ] Privacy policy URL (required for health apps)
    - [ ] Support URL
    - [ ] Marketing URL (optional)

- [ ] **App Store Assets**
  - [ ] App icon (1024x1024px PNG, no transparency)
  - [ ] Screenshots for all required device sizes:
    - [ ] 6.7" iPhone (iPhone 14 Pro Max, 15 Pro Max)
    - [ ] 6.5" iPhone (iPhone 11 Pro Max, XS Max)
    - [ ] 5.5" iPhone (iPhone 8 Plus)
    - [ ] iPad Pro 12.9" (if supporting iPad)
    - [ ] iPad Pro 11" (if supporting iPad)
  - [ ] App preview video (optional but recommended)

- [ ] **EAS Configuration**
  - [ ] EAS CLI installed and logged in
  - [ ] `eas.json` updated with:
    - [ ] Apple ID
    - [ ] App Store Connect App ID
    - [ ] Apple Team ID
  - [ ] EAS project ID set in `app.json`

- [ ] **Build & Submit**
  - [ ] Production build created: `eas build --platform ios --profile production`
  - [ ] Build completed successfully
  - [ ] App submitted: `eas submit --platform ios --profile production`
  - [ ] Submission completed

### Android Play Store

- [ ] **Firebase Configuration**
  - [ ] Android app added to Firebase
  - [ ] `google-services.json` downloaded (for native builds)
  - [ ] Package name matches Firebase config

- [ ] **App Configuration**
  - [ ] Package name set in `app.json` (e.g., `com.hyperfit.app`)
  - [ ] Version code incremented for each submission
  - [ ] App name configured

- [ ] **Google Play Console Setup**
  - [ ] App created in Google Play Console
  - [ ] Store listing completed:
    - [ ] App name
    - [ ] Short description (80 characters)
    - [ ] Full description (4000 characters)
    - [ ] Category: Health & Fitness
    - [ ] Privacy policy URL (required)
    - [ ] Content rating completed

- [ ] **Play Store Assets**
  - [ ] App icon (512x512px PNG)
  - [ ] Feature graphic (1024x500px)
  - [ ] Screenshots:
    - [ ] Phone (at least 2, max 8)
    - [ ] 7-inch tablet (optional)
    - [ ] 10-inch tablet (optional)

- [ ] **Service Account Setup**
  - [ ] Google Cloud service account created
  - [ ] Service account key JSON downloaded
  - [ ] Service account granted Play Console access
  - [ ] `eas.json` updated with service account key path

- [ ] **Build & Submit**
  - [ ] Production build created: `eas build --platform android --profile production`
  - [ ] Build completed successfully
  - [ ] App submitted: `eas submit --platform android --profile production`
  - [ ] Submission completed

## Post-Submission

- [ ] **Monitor Submission**
  - [ ] Check App Store Connect / Play Console for status
  - [ ] Respond to any review feedback
  - [ ] Monitor crash reports and analytics

- [ ] **Marketing**
  - [ ] Prepare launch announcement
  - [ ] Update website/social media
  - [ ] Prepare press kit (optional)

## Common Issues & Solutions

### iOS

**Issue: Build fails with code signing error**
- Solution: Ensure Apple Developer account is properly configured in EAS
- Check: `eas credentials` to verify certificates

**Issue: App rejected for missing privacy policy**
- Solution: Add privacy policy URL in App Store Connect
- Ensure URL is publicly accessible

**Issue: Health data usage description missing**
- Solution: Already configured in `app.json` > `ios.infoPlist`
- Verify descriptions are clear and accurate

### Android

**Issue: Service account authentication fails**
- Solution: Verify service account has Play Console access
- Check JSON key file path in `eas.json`

**Issue: Package name mismatch**
- Solution: Ensure package name in `app.json` matches Firebase and Play Console

## Testing Before Submission

- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Verify Firebase connection works
- [ ] Test all major features:
  - [ ] Login/authentication
  - [ ] Workout logging
  - [ ] Challenges
  - [ ] Stats tracking
  - [ ] Data persistence

## Version Updates

When updating the app:

1. Increment version in `app.json`:
   - iOS: Update `version` (e.g., 2.1.0 → 2.1.1)
   - Android: Increment `versionCode`

2. Increment build number:
   - iOS: Update `buildNumber` in `app.json`
   - Android: `versionCode` auto-increments

3. Create new build and submit

## Resources

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)
- [Firebase Console](https://console.firebase.google.com/)

Good luck with your submission! 🚀


