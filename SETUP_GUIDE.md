# RanchHand Setup Guide

Welcome to RanchHand! This guide will help you set up and run your farm management app.

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- A Firebase account
- A Google AI Studio account (for Gemini API)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing "ranch-hand-a486d"
3. Go to Project Settings > General
4. Under "Your apps", create a Web app if you haven't already
5. Copy the Firebase configuration values

## Step 3: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

## Step 4: Configure Environment Variables

1. Open the `.env` file in the project root
2. Replace the placeholder values:

```env
FIREBASE_API_KEY=<your-firebase-api-key>
FIREBASE_AUTH_DOMAIN=ranch-hand-a486d.firebaseapp.com
FIREBASE_PROJECT_ID=ranch-hand-a486d
FIREBASE_STORAGE_BUCKET=ranch-hand-a486d.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=709596435800
FIREBASE_APP_ID=<your-firebase-app-id>

GEMINI_API_KEY=<your-gemini-api-key>
```

## Step 5: Update app.json

The `app.json` file is already configured to read from environment variables. Make sure your `.env` file has all the required values.

## Step 6: Run the App

```bash
# Start the development server
npx expo start

# Or use npm
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## Features Overview

### 🐓 Livestock Management
- Add chickens, goats, cows, and other animals
- Track quantities and acquisition dates
- AI-generated care plans
- Quick egg collection logging for chickens

### 🌱 Crop Tracking
- Manage greenhouse and outdoor crops
- Track planting and harvest dates
- Monitor growth stages
- Log harvests with quality ratings

### ✅ Task Management
- Create manual or recurring tasks
- Auto-generated tasks from AI care plans
- Filter by today, upcoming, or overdue
- Complete tasks with one tap
- AI-powered weekly schedule generator

### 💰 Financial Records
- Track income and expenses
- Categorize transactions (feed, supplies, equipment, sales, etc.)
- Real-time profit/loss calculations
- Visual financial summary

### 📊 Production Logging
- Log egg collections
- Record crop harvests
- Track production quality
- View production history

### 🤖 AI Assistant
- Ask farming questions
- Get instant expert advice
- Personalized recommendations
- Access from dashboard

### 📈 Dashboard
- Live statistics overview
- Today's tasks at a glance
- Financial summary
- Quick access to all features

## Troubleshooting

### Firebase Connection Issues
- Make sure all Firebase config values are correct in `.env`
- Check that your Firebase project has Firestore enabled
- Verify Firebase rules allow read/write access (for development)

### Gemini API Errors
- Verify your API key is correct
- Check that the API key has proper permissions
- Ensure you have quota remaining in Google AI Studio

### App Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npx expo start --clear
```

## Firebase Security Rules (Production)

When deploying to production, update your Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review Firebase and Gemini API documentation
- Create an issue on the project repository

## Next Steps

1. Start by adding your first livestock or crop
2. Try the AI assistant to ask farming questions
3. Generate an AI-powered weekly schedule
4. Log your first egg collection or harvest
5. Track your farm's finances

Happy farming! 🚜
