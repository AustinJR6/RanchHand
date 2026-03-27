# Firebase Security Rules

## Current Status: TEST MODE ⚠️

Your Firebase is currently in **test mode**, which means anyone can read/write to your database. This is fine for development but MUST be changed before production.

## Firestore Security Rules

Once you're ready to add authentication, replace your Firestore rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }

    // Helper function to check if user owns the document
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Livestock collection
    match /livestock/{animalId} {
      // Anyone authenticated can read
      allow read: if isSignedIn();
      // Only the owner can create/update/delete
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    // Crops collection
    match /crops/{cropId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    // Tasks collection
    match /tasks/{taskId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    // Financial records
    match /financial/{recordId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    // Production logs
    match /production/{logId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    // Photos
    match /photos/{photoId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    // User settings
    match /users/{userId} {
      allow read, write: if isSignedIn() && isOwner(userId);
    }
  }
}
```

## Storage Security Rules

For Firebase Storage (photos, receipts, etc.):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }

    // Photos and documents
    match /users/{userId}/{allPaths=**} {
      // Allow read if signed in
      allow read: if isSignedIn();
      // Allow write only to own folder
      allow write: if isSignedIn() && request.auth.uid == userId;
    }

    // Limit file size to 10MB
    match /{allPaths=**} {
      allow write: if request.resource.size < 10 * 1024 * 1024;
    }
  }
}
```

## How to Update Security Rules

### Firestore Rules
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project `ranch-hand-a486d`
3. Go to **Firestore Database** > **Rules** tab
4. Copy and paste the Firestore rules above
5. Click **Publish**

### Storage Rules
1. In Firebase Console, go to **Storage** > **Rules** tab
2. Copy and paste the Storage rules above
3. Click **Publish**

## Adding User Authentication

To use these security rules, you'll need to add user authentication to your app:

### 1. Update Data Models

Add a `userId` field to all your data models to track ownership:

```typescript
// Example for Animal type
export interface Animal {
  id: string;
  userId: string;  // <- Add this field
  type: 'chicken' | 'goat' | 'cow' | 'other';
  // ... rest of fields
}
```

### 2. Update Services

Modify your services to include the userId when creating documents:

```typescript
// Example in livestock.service.ts
async addAnimal(animal: Omit<Animal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...animal,
    userId, // <- Add userId to document
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}
```

### 3. Add Login Screen

Create a simple login/signup screen using Firebase Auth:

```typescript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';

// Sign up
await createUserWithEmailAndPassword(auth, email, password);

// Sign in
await signInWithEmailAndPassword(auth, email, password);
```

## When to Update Security Rules

Update your security rules when:

1. **Before sharing the app** with anyone outside your development team
2. **Before deploying to production** or app stores
3. **When you add user authentication** to the app
4. **If you notice any suspicious activity** in your Firebase console

## Testing Security Rules

You can test your rules in the Firebase Console:

1. Go to **Firestore Database** > **Rules** tab
2. Click the **Rules Playground** button
3. Simulate different scenarios to ensure rules work correctly

## Additional Security Recommendations

1. **Enable Firebase App Check** to prevent API abuse
2. **Set up Firebase quota limits** to prevent unexpected costs
3. **Monitor Firebase usage** regularly in the console
4. **Use environment variables** for API keys (not hardcoded)
5. **Enable multi-factor authentication** for your Firebase account
6. **Regularly review Firebase logs** for suspicious activity

## Current Development Setup

For now, keep test mode enabled so you can develop and test freely. Just remember to update before production!

---

**Important**: Never commit API keys or sensitive credentials to Git. Use environment variables and keep `.env` files in `.gitignore`.
