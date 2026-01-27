# Board Game Library - Mobile App

React Native mobile app for managing your board game collection. Built with Expo for iOS and Android.

## Features

- 📱 Native iOS and Android apps
- 📷 Barcode scanning to quickly add games
- ⭐ Favorite games tracking
- 📊 Library statistics
- 🔐 Supabase authentication
- 🎮 Track play sessions
- 💰 Mark games for sale

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- For iOS: Xcode (Mac only)
- For Android: Android Studio
- Expo Go app on your phone (for testing)

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and add your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase URL and anon key:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Start Development Server

```bash
npm start
```

This will start the Expo development server. You can then:

- Press `i` to open in iOS Simulator (Mac only)
- Press `a` to open in Android Emulator
- Scan the QR code with Expo Go app on your phone

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
mobile/
├── assets/              # Images, fonts, and other static files
├── src/
│   ├── components/     # Reusable React Native components
│   │   ├── BarcodeScanner.tsx
│   │   └── GameCard.tsx
│   ├── contexts/       # React contexts (Auth)
│   │   └── AuthContext.tsx
│   ├── lib/           # Business logic and API calls
│   │   ├── auth.ts
│   │   ├── games.ts
│   │   └── supabase.ts
│   ├── navigation/    # React Navigation setup
│   │   └── AppNavigator.tsx
│   └── screens/       # App screens
│       ├── AuthScreen.tsx
│       ├── LibraryScreen.tsx
│       └── ProfileScreen.tsx
├── App.tsx            # App entry point
├── app.json          # Expo configuration
├── package.json      # Dependencies
└── tsconfig.json     # TypeScript configuration
```

## Building for Production

### iOS

1. Configure your Apple Developer account in Expo
2. Run build command:

```bash
expo build:ios
```

### Android

1. Configure your Android keystore in Expo
2. Run build command:

```bash
expo build:android
```

## Using Expo EAS Build (Recommended)

For a more modern build process, use EAS Build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Camera Permissions

The app requires camera permissions for barcode scanning:

- **iOS**: Camera permission is requested automatically
- **Android**: Camera permission is requested automatically

Make sure to grant camera permissions when prompted.

## Database Schema

This app uses the same Supabase database as the web version. Make sure your Supabase instance has the following tables:

- `profiles` - User profiles
- `shared_games` - Master game database
- `user_library` - User's game collection

Refer to the main project's `database/` folder for schema details.

## Troubleshooting

### Camera not working

1. Make sure you've granted camera permissions
2. Try restarting the app
3. On iOS Simulator, the camera won't work (use a real device)

### Supabase connection errors

1. Double-check your environment variables in `.env`
2. Make sure your Supabase project is active
3. Check that your Supabase URL and anon key are correct

### Build errors

1. Clear cache: `expo start -c`
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
3. Make sure all peer dependencies are installed

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT
