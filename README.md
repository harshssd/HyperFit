# HyperFit - Next Gen Training OS

A modern fitness tracking app built with React Native and Expo, featuring workout logging, challenges, stats tracking, and more.

## Features

- 🏋️ **Workout Logging**: Track exercises, sets, reps, and weights
- 🔥 **Challenges**: Participate in fitness challenges
- 📊 **Stats & Analytics**: View your progress and XP
- 👣 **Steps Tracking**: Monitor daily activity
- 🎯 **Rank System**: Level up through your fitness journey
- 💾 **Cloud Sync**: Supabase integration for data persistence
- 🔐 **Authentication**: Email/password and Google OAuth login

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI for building (`npm install -g eas-cli`)
- Supabase project (for authentication and database)
- Apple Developer account (for iOS App Store)
- Google Play Developer account (for Android Play Store)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Go to [Supabase](https://supabase.com/) and create a new project
2. Get your project URL and anon key from Settings > API
3. Update `supabase.config.ts` with your credentials
4. Run the database migration:
   - Go to Supabase SQL Editor
   - Copy and paste contents of `supabase-migration.sql`
   - Execute the migration
5. Enable Google OAuth (see `SUPABASE_SETUP.md` for detailed instructions)
6. Configure email authentication in Supabase dashboard

### 3. Configure App Identifiers

Update `app.json` with your app identifiers:
- iOS: `bundleIdentifier` (e.g., `com.yourcompany.hyperfit`)
- Android: `package` (e.g., `com.yourcompany.hyperfit`)

### 4. Configure EAS

1. Install EAS CLI globally:
```bash
npm install -g eas-cli
```

2. Login to your Expo account:
```bash
eas login
```

3. Link your project:
```bash
eas build:configure
```

4. Update `eas.json` with your Apple Developer and Google Play credentials

## Development

### Run on iOS Simulator
```bash
npm run ios
```

### Run on Android Emulator
```bash
npm run android
```

### Run on Web
```bash
npm run web
```

### Start Development Server
```bash
npm start
```

## Building for Production

### iOS App Store

1. **Configure Apple Developer Account**:
   - Update `eas.json` with your Apple ID, App Store Connect App ID, and Team ID
   - Ensure your Apple Developer account has the necessary certificates

2. **Build for iOS**:
```bash
eas build --platform ios --profile production
```

3. **Submit to App Store**:
```bash
eas submit --platform ios --profile production
```

### Android Play Store

1. **Configure Google Play**:
   - Create a service account in Google Cloud Console
   - Download the service account key JSON file
   - Update `eas.json` with the path to your service account key

2. **Build for Android**:
```bash
eas build --platform android --profile production
```

3. **Submit to Play Store**:
```bash
eas submit --platform android --profile production
```

## App Store Requirements

### iOS App Store

Before submitting to the App Store, ensure you have:

1. **App Store Connect Setup**:
   - App name, description, keywords
   - Screenshots (required sizes: 6.5", 6.7", 5.5")
   - App icon (1024x1024px)
   - Privacy policy URL
   - Support URL

2. **App Information**:
   - Category: Health & Fitness
   - Age rating
   - Pricing and availability

3. **Compliance**:
   - Privacy policy (required for health apps)
   - Health data usage descriptions (already configured in app.json)

### Android Play Store

Before submitting to Play Store, ensure you have:

1. **Play Console Setup**:
   - App name, description, short description
   - Screenshots (phone, 7-inch tablet, 10-inch tablet)
   - App icon (512x512px)
   - Feature graphic (1024x500px)
   - Privacy policy URL

2. **App Information**:
   - Category: Health & Fitness
   - Content rating
   - Pricing and distribution

## Project Structure

```
HyperFit/
├── App.tsx                 # Main app component
├── app.json                # Expo configuration
├── eas.json                # EAS build configuration
├── firebase.config.ts      # Firebase configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
└── assets/                 # App icons and images
```

## Key Technologies

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and tooling
- **TypeScript**: Type-safe JavaScript
- **Supabase**: Backend services (Auth, PostgreSQL database)
- **Lucide React Native**: Icon library

## Troubleshooting

### Supabase Connection Issues
- Verify your Supabase configuration is correct
- Check that the database migration has been run
- Ensure Row Level Security policies are set up correctly
- Verify OAuth redirect URLs match in both Supabase and Google Console

### Build Issues
- Clear Expo cache: `expo start -c`
- Clear node modules: `rm -rf node_modules && npm install`
- Check EAS build logs for specific errors

### App Store Submission Issues
- Ensure all required metadata is filled in App Store Connect
- Verify app icons and screenshots meet requirements
- Check that privacy policy URL is accessible

## License

Copyright © 2024 HyperFit. All rights reserved.

## Support

For issues and questions, please open an issue on the repository.

