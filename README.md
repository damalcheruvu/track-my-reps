# 💪 Workout Tracker

A mobile-friendly workout tracking app built with React and Vite. Track your daily workout progress with an easy-to-use checklist interface, and sync your data across all devices with Google Sign-In.

## Features

### Core Features
- ✅ **Track Sets**: Check off each set as you complete it
- 📊 **Progress Bar**: Visual progress indicator showing your completion percentage
- 💾 **Cloud Sync**: Sign in with Google to sync across all devices (via Firebase)
- 📅 **Weekly Planner**: Create custom workout schedules for the entire week
- 🌴 **Rest Days**: Mark days as rest and track recovery
- 📱 **Mobile-First**: Optimized for mobile browsers with touch-friendly UI
- 🎨 **Modern Design**: Clean, gradient-based interface with smooth animations
- 🔄 **Daily Reset**: Progress automatically resets each day

### New Features (v2.0)
- 🌙 **Dark Mode**: Toggle between light and dark themes with persistent preference
- 🏋️ **Weight Tracking**: Log weights for each exercise
- 📝 **Exercise Notes**: Add notes to exercises for form reminders or tips
- 🔍 **Searchable Exercise Library**: Quick-add exercises from a built-in library
- 🎯 **Modal-Based Exercise Addition**: Modern modal interface instead of browser prompts
- ♿ **Improved Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- 🔄 **Drag-and-Drop Reordering**: Enhanced visual feedback during exercise reordering
- ⚡ **Performance Optimizations**: Memoized components and debounced saves
- 🛡️ **Error Boundaries**: Graceful error handling with recovery options
- ✔️ **Data Validation**: Input validation for exercise data

## Tech Stack

- **React 19** - UI library with hooks
- **Vite 7** - Build tool and dev server
- **Zustand** - Lightweight state management
- **Firebase** - Google Authentication and Firestore database
- **@dnd-kit** - Drag-and-drop functionality
- **CSS3** - Modern styling with CSS variables for theming

## Getting Started

### Prerequisites

- Node.js 18+ installed on your system
- npm or yarn package manager
- Firebase project (free Spark plan) for cloud sync

### Installation

1. Clone this repository
2. Navigate to the project folder:
   ```bash
   cd workout-tracker
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Firebase Setup (Required for Cloud Sync)

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. **Enable Google Authentication:**
   - Go to Build → Authentication → Sign-in method
   - Enable the **Google** provider
   - Add your deployment domain to authorized domains

3. **Create Firestore Database:**
   - Go to Build → Firestore Database → Create database
   - Start in **production mode**
   - Select a region close to your users

4. **Set up security rules** (in Firestore → Rules):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

5. **Get your Firebase config:**
   - Go to Project Settings → Your apps → Web app (click `</>` icon)
   - Register the app and copy the config to `src/firebase.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── AddExerciseModal.jsx
│   ├── AddExerciseModal.css
│   └── ErrorBoundary.jsx
├── App.jsx              # Main application component
├── App.css              # Global styles with CSS variables
├── store.js             # Zustand state management
├── firebase.js          # Firebase client configuration
├── useFirebase.js       # Custom hooks for auth and Firestore sync
└── main.jsx             # Application entry point
```

## Deploying to GitHub Pages

### Option 1: Using GitHub Actions (Automatic)

1. Create a new repository on GitHub
2. Push your code to the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/workout-tracker.git
   git push -u origin main
   ```

3. Go to your repository's Settings → Pages
4. Under "Build and deployment", set Source to "GitHub Actions"
5. The workflow will automatically deploy your app when you push to main

Your app will be available at: `https://YOUR_USERNAME.github.io/workout-tracker/`

### Option 2: Manual Deployment

Deploy manually using the gh-pages package:
```bash
npm run deploy
```

Make sure to update the `base` property in `vite.config.js` to match your repository name.

## Customization

### Modifying the Default Workout Plan

Edit the `DEFAULT_WEEKLY_PLAN` in `src/store.js` to customize the default exercises:

```javascript
export const DEFAULT_WEEKLY_PLAN = {
  Monday: {
    isRest: false,
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '8-12', weight: null },
      // Add more exercises here
    ]
  },
  // Add more days here
};
```

Or use the built-in Weekly Planner in the app to create custom workouts!

### Adding to the Exercise Library

Edit `EXERCISE_LIBRARY` in `src/store.js` to add more exercises to the searchable library:

```javascript
export const EXERCISE_LIBRARY = [
  { name: 'Your Exercise', category: 'Category' },
  // Add more exercises
];
```

### Changing Colors / Theming

The app uses a dark theme by default with industry-standard colors. Update the CSS variables in `src/App.css`:

```css
:root {
  /* Background colors - Slate palette */
  --bg-primary: #0f172a;      /* Slate 900 */
  --bg-secondary: #1e293b;    /* Slate 800 */
  --bg-tertiary: #334155;     /* Slate 700 */
  
  /* Text colors */
  --text-primary: #f8fafc;    /* Slate 50 */
  --text-secondary: #94a3b8;  /* Slate 400 */
  
  /* Accent colors */
  --accent-primary: #6366f1;  /* Indigo 500 */
  --accent-secondary: #8b5cf6; /* Violet 500 */
}
```

## How It Works

### Data Storage

- **With Google Sign-In**: Data is synced to Firebase Firestore
  - ✅ Syncs across all devices
  - ✅ Free tier never pauses (unlike some alternatives)
  - ✅ Automatic backup
  
- **Without Sign-In**: App requires sign-in for data persistence

### What's Stored

- **Weekly Workout Plan**: Your custom exercises for each day (`users/{uid}/weekly_plans`)
- **Daily Progress**: Checkbox states for all sets (`users/{uid}/completed_sets`)

## Browser Support

Works on all modern browsers including:
- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Improvements

- [ ] Historical data and analytics dashboard
- [ ] Browser notifications for workout reminders
- [ ] Shareable workout plans
- [ ] Undo/redo functionality
- [ ] Offline support with service workers
- [ ] Automated tests

## License

MIT License - feel free to use this project for your own workouts!
