# HyperFit Setup Guide

## Quick Start

### 1. Firebase Setup

1. **Create Firebase Project**:
   - Go to https://console.firebase.google.com/
   - Click "Add project"
   - Enter project name: "HyperFit" (or your preferred name)
   - Disable Google Analytics (optional)
   - Click "Create project"

2. **Add iOS App**:
   - Click "Add app" > iOS
   - iOS bundle ID: `com.hyperfit.app` (or your custom bundle ID)
   - App nickname: "HyperFit iOS"
   - App Store ID: Leave blank for now
   - Click "Register app"
   - Download `GoogleService-Info.plist` (you'll need this later)

3. **Add Android App**:
   - Click "Add app" > Android
   - Android package name: `com.hyperfit.app` (or your custom package name)
   - App nickname: "HyperFit Android"
   - Debug signing certificate SHA-1: Leave blank for now
   - Click "Register app"
   - Download `google-services.json` (you'll need this later)

4. **Enable Firestore**:
   - In Firebase Console, go to "Build" > "Firestore Database"
   - Click "Create database"
   - Start in test mode (for development)
   - Choose a location (closest to your users)
   - Click "Enable"

5. **Enable Authentication**:
   - Go to "Build" > "Authentication"
   - Click "Get started"
   - Enable "Anonymous" sign-in method
   - Click "Save"

6. **Get Firebase Config**:
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps"
   - Click on your iOS or Android app
   - Copy the config values
   - Update `firebase.config.ts` with these values

### 2. Update Firebase Config in App

Edit `App.tsx` and replace the inline Firebase config with:

```typescript
import { firebaseConfig } from './firebase.config';
```

Then remove the inline `firebaseConfig` object.

### 3. Configure App Identifiers

Update `app.json`:
- Change `bundleIdentifier` to match your Firebase iOS app
- Change `package` to match your Firebase Android app

### 4. Install EAS CLI

```bash
npm install -g eas-cli
```

### 5. Login to Expo

```bash
eas login
```

### 6. Configure EAS Build

```bash
eas build:configure
```

This will create/update `eas.json` with build profiles.

### 7. Update EAS Configuration

Edit `eas.json` and update:
- `projectId` in `app.json` > `extra.eas.projectId` (you'll get this from EAS)
- Apple Developer credentials in `submit.production.ios`
- Google Play service account in `submit.production.android`

## Building for App Store

### iOS

1. **Prepare App Store Connect**:
   - Go to https://appstoreconnect.apple.com/
   - Create a new app
   - Fill in app information (name, description, screenshots, etc.)
   - Note your App Store Connect App ID

2. **Update eas.json**:
   ```json
   "submit": {
     "production": {
       "ios": {
         "appleId": "your-email@example.com",
         "ascAppId": "1234567890",
         "appleTeamId": "ABCD123456"
       }
     }
   }
   ```

3. **Build**:
   ```bash
   eas build --platform ios --profile production
   ```

4. **Submit**:
   ```bash
   eas submit --platform ios --profile production
   ```

### Android

1. **Prepare Google Play Console**:
   - Go to https://play.google.com/console/
   - Create a new app
   - Fill in app information
   - Complete store listing

2. **Create Service Account**:
   - Go to Google Cloud Console
   - Create a service account
   - Download JSON key file
   - Grant Play Console access

3. **Update eas.json**:
   ```json
   "submit": {
     "production": {
       "android": {
         "serviceAccountKeyPath": "./path-to-key.json",
         "track": "internal"
       }
     }
   }
   ```

4. **Build**:
   ```bash
   eas build --platform android --profile production
   ```

5. **Submit**:
   ```bash
   eas submit --platform android --profile production
   ```

## Testing

### Local Testing

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Test Builds

```bash
# Build for internal testing
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

## Troubleshooting

### Firebase Not Connecting
- Verify config values are correct
- Check Firestore rules allow read/write
- Ensure Authentication is enabled

### Build Fails
- Check EAS build logs: `eas build:list`
- Verify credentials in `eas.json`
- Ensure app identifiers match Firebase config

### App Store Rejection
- Ensure privacy policy URL is accessible
- Verify all required screenshots are provided
- Check that app description matches functionality

## Next Steps

1. ✅ Set up Firebase
2. ✅ Configure app identifiers
3. ✅ Test locally
4. ✅ Create test builds
5. ✅ Submit to stores
6. ✅ Monitor reviews and analytics

Good luck with your app launch! 🚀


