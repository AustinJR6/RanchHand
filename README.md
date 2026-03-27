# Ranch Hand 🌾

An AI-powered farm management app designed for small family farms. Built to help demonstrate farm management capabilities for FSA loan applications.

## Features

- **Livestock Management**: Track chickens, goats, and other animals
- **Crop Tracking**: Monitor greenhouse and outdoor crops
- **AI-Assisted Planning**: Get custom care plans when adding new animals or crops
- **Task Management**: Automated task generation based on your farm's needs
- **Financial Records**: Track income and expenses for loan applications
- **Production Logging**: Log egg collection, harvests, and other outputs
- **Photo Documentation**: Visual records of your farm operations
- **FSA-Ready Reports**: Generate professional reports for loan applications
- **Offline-First**: Works even when you're out in the field without internet

## Tech Stack

- **Frontend**: React Native (Expo) + TypeScript
- **UI Library**: React Native Paper
- **Backend**: Firebase (Firestore, Auth, Storage)
- **AI**: Google Gemini API
- **Navigation**: React Navigation

## Setup Instructions

### Prerequisites

- Node.js 20.19.1 or higher
- npm or yarn
- Android device or emulator for testing
- Firebase account
- Google Cloud account (for Gemini API)

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ranch-hand-a486d`
3. Go to **Project Settings** > **General**
4. Scroll to **Your apps** section
5. Click **Add app** > **Web** (</>)
6. Register the app with nickname "Ranch Hand"
7. Copy the Firebase configuration
8. Open `src/config/firebase.ts` and replace the config values:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "ranch-hand-a486d.firebaseapp.com",
  projectId: "ranch-hand-a486d",
  storageBucket: "ranch-hand-a486d.firebasestorage.app",
  messagingSenderId: "709596435800",
  appId: "YOUR_APP_ID"
};
```

9. Enable **Firestore Database**:
   - Go to **Firestore Database** in Firebase Console
   - Click **Create database**
   - Choose **Start in test mode** (we'll add security rules later)
   - Select your preferred region

10. Enable **Authentication**:
    - Go to **Authentication** in Firebase Console
    - Click **Get started**
    - Enable **Email/Password** provider

11. Enable **Storage**:
    - Go to **Storage** in Firebase Console
    - Click **Get started**
    - Use default settings

### 2. Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Open `src/services/gemini.ts`
4. Replace `YOUR_GEMINI_API_KEY` with your actual API key

**Note**: For production, you should use environment variables instead of hardcoding API keys.

### 3. Install Dependencies

```bash
cd RanchHand
npm install
```

### 4. Run the App

**For Android:**
```bash
npm run android
```

**For Development Server:**
```bash
npm start
```

Then scan the QR code with Expo Go app on your Android device.

## Project Structure

```
RanchHand/
├── src/
│   ├── config/          # Firebase configuration
│   ├── navigation/      # App navigation setup
│   ├── screens/         # Main app screens
│   │   ├── DashboardScreen.tsx
│   │   ├── LivestockScreen.tsx
│   │   ├── CropsScreen.tsx
│   │   ├── TasksScreen.tsx
│   │   └── RecordsScreen.tsx
│   ├── components/      # Reusable UI components
│   ├── services/        # Business logic & API calls
│   │   ├── livestock.service.ts
│   │   ├── crops.service.ts
│   │   ├── tasks.service.ts
│   │   └── gemini.ts
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Helper functions
├── App.tsx             # Root component
└── package.json
```

## Usage Guide

### Adding Animals

1. Navigate to **Livestock** tab
2. Tap the **+ Add Animal** button
3. Follow the AI-assisted flow
4. The AI will generate a custom care plan with automated tasks

### Adding Crops

1. Navigate to **Crops** tab
2. Tap the **+ Add Crop** button
3. Provide crop details
4. AI generates growing schedule and care tasks

### Managing Tasks

1. Navigate to **Tasks** tab
2. View today's tasks and upcoming tasks
3. Check off completed tasks
4. Add custom tasks as needed

### Financial Tracking

1. Navigate to **Records** tab
2. Log income (egg sales, produce sales)
3. Log expenses (feed, supplies, equipment)
4. Generate reports for FSA review

## Development Roadmap

### Phase 1 (MVP) ✅
- [x] Basic app structure and navigation
- [x] Firebase integration
- [x] Livestock and crops data models
- [x] Task management system
- [ ] AI-assisted add flows
- [ ] Basic reporting

### Phase 2
- [ ] Photo documentation
- [ ] Weather integration
- [ ] Production analytics
- [ ] Export to PDF
- [ ] Offline sync optimization

### Phase 3
- [ ] Multi-user support
- [ ] Advanced analytics
- [ ] Integration with farming APIs
- [ ] Tablet-optimized UI

## Security Notes

**Important**: Before deploying to production:

1. Add proper Firestore security rules
2. Move API keys to environment variables
3. Enable Firebase App Check
4. Add user authentication
5. Implement proper error handling

## Contributing

This is a personal project for farm management. Contributions welcome!

## License

MIT License

## Support

For questions or issues, please open a GitHub issue.

---

Built with ❤️ for small family farms
