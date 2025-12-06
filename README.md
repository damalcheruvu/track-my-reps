# 💪 Workout Tracker

A mobile-friendly workout tracking app built with React and Vite. Track your daily workout progress with an easy-to-use checklist interface, and sync your data across all devices with Google Sign-In.

## Features

- ✅ **Track Sets**: Check off each set as you complete it
- 📊 **Progress Bar**: Visual progress indicator showing your completion percentage
- 💾 **Cloud Sync**: Sign in with Google to sync across all devices
- 📅 **Weekly Planner**: Create custom workout schedules for the entire week
- 🌴 **Rest Days**: Mark days as rest and track recovery
- 📱 **Mobile-First**: Optimized for mobile browsers with touch-friendly UI
- 🎨 **Modern Design**: Clean, gradient-based interface with smooth animations
- 🔄 **Daily Reset**: Progress automatically resets each day

## Getting Started

### Prerequisites

- Node.js 18+ installed on your system
- npm or yarn package manager
- Firebase account (free) for cloud sync

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

To enable Google Sign-In and cloud sync, you need to set up Firebase:

1. **See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed step-by-step instructions**

2. Quick summary:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
   - Enable Google Authentication
   - Enable Firestore Database
   - Copy your Firebase config to `src/firebase.js`

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

Edit the `DEFAULT_WEEKLY_PLAN` in `src/App.jsx` to customize the default exercises:

```javascript
const DEFAULT_WEEKLY_PLAN = {
  Monday: {
    isRest: false,
    categories: [
      {
        name: 'Chest',
        exercises: [
          { name: 'Bench Press', sets: 3, reps: '8-12' },
          // Add more exercises here
        ]
      }
    ]
  },
  // Add more days here
};
```

Or use the built-in Weekly Planner in the app to create custom workouts!

### Changing Colors

Update the color scheme in `src/App.css`:
- Main gradient: `.app` background
- Progress bar: `.progress-bar` background
- Exercise cards: `.exercise-card` background

## How It Works

### Data Storage

- **With Google Sign-In**: Data is synced to Firestore (Google's cloud database)
  - ✅ Syncs across all devices
  - ✅ Automatic backup
  - ✅ Never lose your data
  
- **Without Sign-In**: Data is stored in browser's LocalStorage
  - ⚠️ Only available on current device
  - ⚠️ Lost if browser data is cleared

### What's Stored

- **Weekly Workout Plan**: Your custom exercises for each day
- **Daily Progress**: Checkbox states for all sets
- **User Preferences**: Theme and settings (coming soon)

## Technologies Used

- **React 19** - UI library
- **Vite 7** - Build tool and dev server
- **Firebase** - Authentication and cloud database
- **Firestore** - Real-time cloud sync
- **CSS3** - Styling with modern features
- **LocalStorage API** - Local data persistence

## Browser Support

Works on all modern browsers including:
- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - feel free to use this project for your own workouts!
