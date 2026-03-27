# Ranch Hand - Quick Start Guide

Follow these steps to get Ranch Hand up and running on your Android device.

## Step 1: Firebase Configuration

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Click on your project `ranch-hand-a486d`
3. Click the gear icon ⚙️ next to "Project Overview" > **Project settings**
4. Scroll down to **Your apps** section
5. If you don't see a web app yet:
   - Click **Add app** > Select **Web** (</>)
   - App nickname: `Ranch Hand`
   - Click **Register app**
6. Copy your Firebase configuration values
7. Open `src/config/firebase.ts` in your code editor
8. Replace the placeholder values:
   ```typescript
   const firebaseConfig = {
     apiKey: "PASTE_YOUR_API_KEY_HERE",
     authDomain: "ranch-hand-a486d.firebaseapp.com",
     projectId: "ranch-hand-a486d",
     storageBucket: "ranch-hand-a486d.firebasestorage.app",
     messagingSenderId: "709596435800",
     appId: "PASTE_YOUR_APP_ID_HERE"
   };
   ```

## Step 2: Enable Firebase Services

### Firestore Database
1. In Firebase Console, go to **Build** > **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred region (choose one close to you)
5. Click **Enable**

### Authentication
1. Go to **Build** > **Authentication**
2. Click **Get started**
3. Click on **Email/Password** provider
4. Enable the toggle
5. Click **Save**

### Storage
1. Go to **Build** > **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Click **Next**, then **Done**

## Step 3: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the API key
5. Open `src/services/gemini.ts`
6. Find the line: `const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";`
7. Replace `YOUR_GEMINI_API_KEY` with your actual key

**Important**: For production, you should use environment variables instead of hardcoding the API key.

## Step 4: Install Dependencies

```bash
cd RanchHand
npm install
```

## Step 5: Run the App

### Option A: Using a Physical Android Device

1. Install **Expo Go** from the Google Play Store
2. Make sure your computer and phone are on the same WiFi network
3. Run the development server:
   ```bash
   npm start
   ```
4. Scan the QR code that appears using Expo Go app

### Option B: Using Android Emulator

1. Make sure you have Android Studio installed with an Android emulator set up
2. Start your Android emulator
3. Run:
   ```bash
   npm run android
   ```

## Step 6: Test the App

Once the app loads:

1. Navigate to the **Livestock** tab
2. Tap the **+ Add Animal** button
3. Select "Chickens"
4. Click **Next**
5. Fill in some details (breed, quantity, etc.)
6. Click **Generate AI Care Plan**
7. Wait for the AI to generate a custom care plan
8. Review the plan and click **Save Animal & Create Tasks**
9. Go to the **Tasks** tab to see the auto-generated tasks

## Troubleshooting

### "Firebase: No Firebase App has been created"
- Make sure you've added your Firebase config to `src/config/firebase.ts`
- Check that all fields are filled in correctly

### "Gemini API error"
- Verify your Gemini API key is correct in `src/services/gemini.ts`
- Make sure you have billing enabled on your Google Cloud account
- Check that the Gemini API is enabled in your Google Cloud project

### "Network request failed"
- Make sure your device/emulator has internet connection
- Check that Firebase services are properly enabled
- Verify firewall isn't blocking connections

### App won't load
- Try clearing the cache: `npm start -- --clear`
- Delete `node_modules` and run `npm install` again

## Next Steps

Once you have the basic app working:

1. Add your actual chickens to test the system
2. Start logging daily tasks
3. Track production (egg collection, etc.)
4. Build up financial records for your FSA application
5. Take photos to document your farm operations

## Security Reminder

Before deploying to production or sharing your app:

1. Add proper Firestore security rules
2. Move API keys to environment variables
3. Enable Firebase App Check
4. Set up proper user authentication
5. Change Firebase from "test mode" to production rules

## Need Help?

- Check the main [README.md](README.md) for full documentation
- Review Firebase documentation at https://firebase.google.com/docs
- Check Gemini API docs at https://ai.google.dev/docs

Happy farming! 🌾
