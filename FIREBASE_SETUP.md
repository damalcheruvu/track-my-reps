# Firebase Setup Instructions

Follow these steps to enable Google Sign-In and cloud sync for your workout tracker:

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `workout-tracker` (or any name you prefer)
4. Click Continue
5. Disable Google Analytics (optional, not needed for this app)
6. Click "Create project"
7. Wait for project to be created, then click "Continue"

## Step 2: Register Your Web App

1. In the Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Enter app nickname: `Workout Tracker Web`
3. **Check** "Also set up Firebase Hosting" (for easy deployment)
4. Click "Register app"
5. You'll see your Firebase configuration - **COPY THIS**

## Step 3: Update Firebase Config

1. Open `src/firebase.js` in your project
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 4: Enable Google Sign-In

1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get started"
3. Click on **Google** provider
4. Toggle "Enable"
5. Select a support email from the dropdown
6. Click "Save"

## Step 5: Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Select "Start in **test mode**" (we'll secure it later)
4. Click "Next"
5. Choose your region (closest to you)
6. Click "Enable"

## Step 6: Configure Firestore Security Rules

1. In Firestore, go to the **Rules** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Step 7: Test the App

1. Run `npm run dev` to start your app
2. Click "Sign in with Google"
3. Sign in with your Google account
4. Your workout plan and progress will now sync to the cloud!

## Step 8: Deploy to Firebase Hosting (Optional)

Instead of GitHub Pages, you can deploy to Firebase:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select your project
# Set public directory to: dist
# Configure as single-page app: Yes
# Set up automatic builds: No
npm run build
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

## Troubleshooting

**Error: "Firebase config not found"**
- Make sure you replaced the placeholder values in `src/firebase.js`

**Error: "Permission denied"**
- Check that Firestore security rules are published
- Make sure you're signed in

**Sign-in popup blocked**
- Allow popups for localhost in your browser settings

## What's Synced to Cloud

✅ **Weekly workout plan** - All your custom exercises
✅ **Daily progress** - Checkbox states for each day
✅ **Automatic backup** - Never lose your data
✅ **Multi-device sync** - Access from phone, tablet, computer

## Privacy & Data

- Your data is private and only accessible to you
- Stored securely in Google's cloud infrastructure
- Can delete all data by deleting the document in Firestore console
- No analytics or tracking (unless you enabled Google Analytics)
