# Mobile App Setup Guide

This guide will help you get the Board Game Library mobile app running on your iOS and Android devices.

## 📋 Prerequisites

1. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
2. **Expo Go App** - Download on your phone:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

Open your terminal and navigate to the mobile directory:

```bash
cd mobile
npm install
```

### Step 2: Set Up Environment Variables

Copy your Supabase credentials from the web app's `.env` file:

```bash
# Create the .env file
cp .env.example .env

# Edit the file and add your credentials
# You can find these in the root .env file
```

Your `mobile/.env` should look like:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Start the Development Server

```bash
npm start
```

This will:
1. Start the Expo development server
2. Show a QR code in your terminal
3. Open a web interface at http://localhost:8081

### Step 4: Open on Your Phone

**Option A: Using Expo Go (Recommended for testing)**
1. Open the Expo Go app on your phone
2. Scan the QR code from the terminal
3. Wait for the app to load

**Option B: Using Simulators/Emulators**
- Press `i` to open iOS Simulator (Mac only)
- Press `a` to open Android Emulator

## 📱 Testing the App

Once the app loads:

1. **Sign In/Sign Up** - Use the same credentials as the web app
2. **Scan a Game** - Tap the + button and scan a board game barcode
3. **View Library** - Your games sync with the web app
4. **Mark Favorites** - Tap the star icon on any game
5. **View Profile** - Check your stats in the Profile tab

## 🔧 Troubleshooting

### "Cannot connect to Metro server"
- Make sure your phone and computer are on the same WiFi network
- Try restarting the Expo server: `npm start -c` (clears cache)

### "Camera not working"
- Grant camera permissions when prompted
- Note: Camera doesn't work in iOS Simulator, use a real device

### "Supabase connection failed"
- Double-check your `.env` file has the correct credentials
- Make sure there are no extra spaces or quotes
- Restart the Expo server after changing `.env`

### "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start -c
```

## 🎯 Next Steps

### Build for Production

Once you're ready to distribute your app:

1. **Install EAS CLI**
```bash
npm install -g eas-cli
```

2. **Configure EAS**
```bash
eas build:configure
```

3. **Build for iOS**
```bash
eas build --platform ios
```

4. **Build for Android**
```bash
eas build --platform android
```

### Add App Icons

1. Create a 1024x1024px icon for your app
2. Save it as `mobile/assets/icon.png`
3. Create a splash screen as `mobile/assets/splash.png`
4. Run `expo prebuild` to generate platform-specific assets

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo)
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)

## 🆘 Need Help?

- Check the main [README.md](README.md) for project overview
- Review [mobile/README.md](mobile/README.md) for detailed mobile docs
- Check Expo's troubleshooting guide: https://docs.expo.dev/troubleshooting/

## ✅ Success Checklist

- [ ] Node.js 18+ installed
- [ ] Expo Go app installed on phone
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
- [ ] Development server running (`npm start`)
- [ ] App opens on phone via Expo Go
- [ ] Can sign in with existing account
- [ ] Camera permissions granted
- [ ] Successfully scanned a barcode

Congratulations! Your mobile app is now running. Enjoy managing your board game collection on the go! 🎮📱
