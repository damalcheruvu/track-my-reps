# 💪 Workout Tracker

A mobile-friendly workout tracking app built with React and Vite. Track your daily workout progress with an easy-to-use checklist interface, and sync your data across all devices with Google Sign-In.

## Features

### Core Features
- ✅ **Track Sets**: Check off each set as you complete it
- 📊 **Progress Bar**: Visual progress indicator showing your completion percentage
- 💾 **Cloud Sync**: Sign in with Google to sync across all devices (via Supabase)
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
- **Supabase** - Authentication and PostgreSQL database
- **@dnd-kit** - Drag-and-drop functionality
- **CSS3** - Modern styling with CSS variables for theming

## Getting Started

### Prerequisites

- Node.js 18+ installed on your system
- npm or yarn package manager
- Supabase account (free) for cloud sync

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

### Supabase Setup (Required for Cloud Sync)

1. Create a Supabase project at [supabase.com](https://supabase.com/)

2. **Enable Google OAuth Provider:**
   - Go to your Supabase Dashboard → Authentication → Providers
   - Find "Google" in the list and click to expand
   - Toggle "Enable Sign in with Google"
   - You'll need to set up Google OAuth credentials:
     1. Go to [Google Cloud Console](https://console.cloud.google.com/)
     2. Create a new project or select an existing one
     3. Go to APIs & Services → Credentials
     4. Click "Create Credentials" → "OAuth client ID"
     5. Select "Web application"
     6. Add authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
     7. Copy the Client ID and Client Secret to Supabase

3. Create the required tables using the SQL in `supabase-setup.sql`

4. Copy your Supabase URL and anon key to `src/supabase.js`:
   ```javascript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
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
├── supabase.js          # Supabase client configuration
├── useSupabase.js       # Custom hooks for auth and data sync
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

- **With Google Sign-In**: Data is synced to Supabase (PostgreSQL database)
  - ✅ Syncs across all devices
  - ✅ Automatic backup
  - ✅ Never lose your data
  
- **Without Sign-In**: App requires sign-in for data persistence

### What's Stored

- **Weekly Workout Plan**: Your custom exercises for each day
- **Daily Progress**: Checkbox states for all sets
- **User Preferences**: Theme preference (stored locally)

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
