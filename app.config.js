// app.config.js — replaces app.json so process.env values are actually evaluated
// Expo reads this file as JavaScript, which means .env values get injected at build time.
import 'dotenv/config';

export default {
  expo: {
    name: 'RanchHand',
    slug: 'RanchHand',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    android: {
      package: 'com.ranchhand.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#4CAF50',
          sounds: [],
          androidMode: 'default',
          androidCollapsedTitle: 'RanchHand',
          iosDisplayInForeground: true,
        },
      ],
    ],
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      openaiApiKey: process.env.OPENAI_API_KEY,
      eas: {
        projectId: 'be62f63f-ac26-4cb4-8556-7740fb639b3c',
      },
    },
  },
};
