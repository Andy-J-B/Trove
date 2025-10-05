# Trove

Discover and keep the useful things you find online. Trove is a React Native app (built with Expo) that lets you send TikTok links to the app, extract products, and organize everything into categories you control. It’s designed to be fast, offline-friendly, and simple to use.

## Features

### Animated Splash Screen
- Custom pickaxe‑and‑chest animation on launch
- Smooth transitions powered by React Native Reanimated

### Share Intent Integration
- Share TikTok links directly into Trove from other apps
- Automatic product extraction after a link is received
- Offline queue so shares are not lost without connectivity

### Category Management
- Flexible category system with support for subcategories
- Swipe‑to‑delete and confirmations for item management
- Sensible fallback categories when the device is offline

### Modern UI/UX
- Dark theme with a clean, focused layout
- Subtle animations and haptic feedback
- Responsive grid for categories and lists

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or a real device with Expo Go)

### Installation

1) Clone the repository
```bash
git clone https://github.com/yourusername/trove.git
cd trove
```

2) Install dependencies
```bash
npm install
```

3) Environment configuration
Create (or update) `app.json` and set your backend URL:
```json
{
  "expo": {
    "extra": {
      "SERVER_URL": "http://your-backend-url/api"
    }
  }
}
```

4) Start the dev server
```bash
npx expo start
```

5) Run on a device or simulator
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Or scan the QR code with the Expo Go app

## Project Structure

```
Trove/
├─ app/                     # Expo Router pages
│  ├─ (tabs)/               # Tab navigation
│  │  ├─ index.tsx          # Home screen
│  │  └─ explore.tsx        # Explore screen
│  ├─ category/             # Category pages
│  │  └─ [slug].tsx         # Dynamic category screen
│  └─ _layout.tsx           # Root layout with splash screen
├─ components/              # Reusable components
│  ├─ splash-screen.tsx     # Animated splash screen
│  ├─ app-with-splash.tsx   # Splash screen wrapper
│  └─ swipeable-list-item.tsx # Swipe‑to‑delete component
├─ src/                     # Core utilities and data layer
│  └─ queue.js              # Offline queue management
├─ assets/                  # Images and static files
└─ App.js                   # App entry
```

## Tech Stack
- React Native with Expo
- Expo Router for navigation
- React Native Reanimated for animations
- React Native Gesture Handler for gestures
- Axios for HTTP requests
- React hooks for state
- StyleSheet API with a small theme layer

## Key Components

### Splash Screen Animation
A custom pickaxe hits a treasure chest on launch. Implemented with Reanimated for consistent, jank‑free motion.

### Swipe‑to‑Delete Lists
Fast, predictable swipe interactions with confirmations and smooth transitions.

### Share Intent Handler (Android)
Receive TikTok links from other apps and send them to extraction. Links are queued if you are offline.

### Offline Queue
Incoming shares are stored locally and processed when connectivity returns. Nothing gets lost.

## Configuration

### Backend Endpoints
Trove talks to a backend for:
- Category management: `/categories`
- Product extraction: `/extract-products`
- Item CRUD: `/products`

### Environment
Set your API base in `app.json`:
```json
{
  "expo": {
    "extra": {
      "SERVER_URL": "https://your-api-domain.com/api"
    }
  }
}
```

## Platform Support
- iOS: fully supported
- Android: fully supported (includes Share Intent)
- Web: limited support (no native share intent)

## Usage
1. Launch the app to see the animated splash.
2. Browse categories; tap a tile to open.
3. Share a TikTok link from another app to Trove.
4. Manage items; swipe left to delete.
5. Pull to refresh to fetch any updates from the server.

## Contributing
1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a pull request

## License
MIT. See [LICENSE](LICENSE) for details.

## Acknowledgments
- Built with Expo
- Animation and iconography inspired by classic treasure‑hunt UI motifs
- Layout and interaction patterns follow common mobile design guidelines
