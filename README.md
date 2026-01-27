# Board Game Library

A full-stack application for managing your board game collection, available as both a web app and native mobile apps for iOS and Android.

## 📱 Platforms

- **Web App** - React + Vite + TypeScript with Tailwind CSS
- **Mobile Apps** - React Native + Expo for iOS and Android

## ✨ Features

- 🎮 Manage your board game collection
- 📷 Barcode scanning to quickly add games
- ⭐ Mark favorite games
- 💰 Track games for sale
- 📊 Library statistics and insights
- 🎲 Log play sessions
- 👥 User authentication and profiles
- 🔍 Search shared games database
- 📱 Native mobile apps with offline support

## 🏗️ Project Structure

```
boardgame-library/
├── src/               # Web app source code
├── mobile/            # React Native mobile app
├── database/          # Supabase database schema
└── supabase/          # Supabase configuration
```

## 🚀 Getting Started

### Web App

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Add your Supabase credentials
```

3. Start development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173)

### Mobile App

See the [mobile/README.md](mobile/README.md) for detailed mobile setup instructions.

Quick start:
```bash
cd mobile
npm install
npm start
```

## 🗄️ Database

This project uses Supabase for:
- Authentication
- PostgreSQL database
- Real-time subscriptions
- Row-level security

### Database Schema

Main tables:
- `profiles` - User profiles and preferences
- `shared_games` - Master game database (shared across users)
- `user_library` - User's personal game collection with ratings and notes

See `database/` folder for full schema and migrations.

## 🛠️ Tech Stack

### Web App
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Barcode Detection API

### Mobile App
- React Native
- Expo
- TypeScript
- React Navigation
- Expo Camera (barcode scanning)
- Supabase

## 📝 Available Scripts

### Web App
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

### Mobile App
- `cd mobile && npm start` - Start Expo dev server
- `cd mobile && npm run ios` - Run on iOS
- `cd mobile && npm run android` - Run on Android

## 🔐 Environment Variables

### Web App (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Mobile App (mobile/.env)
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 Mobile App Features

The mobile app includes all web features plus:
- Native camera integration for barcode scanning
- Optimized mobile UI/UX
- Offline data caching
- Native navigation (bottom tabs)
- Platform-specific optimizations

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📄 License

MIT

## 🙏 Acknowledgments

- Board game data from various sources
- Icons from Lucide React
- Built with Supabase and Expo
