# Trove

Discover and keep the useful things you find online. Trove is a React Native app (built with Expo) that lets you send TikTok links to the app, extract products, and organize everything into categories you control. It’s designed to be fast, offline-friendly, and simple to use.

## Features

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

1. Clone the repository

```bash
git clone https://github.com/yourusername/trove.git
cd trove
```

2. Install dependencies

```bash
npm install
```

3. Go to server

```bash
cd server
```

4. Install dependencies

```bash
npm install
```

5. Environment configuration
   Make a folder in server named .env
   Set up your environment variables in server/.env

GEMINI_API_KEY="SOMETHING"

SCRAPE_CREATORS_API_KEY="SOMETHING"

SERVER_URL="http://127.0.0.1:3000/api/"

6. Run server

```bash
cd extract
npm run dev
```

7. Run on android device

Connect your android device
Set the device to debuggin mode on settings (search how)
Accept laptop connection

Run this :

```bash
adb kill-server
adb start-server
adb devices         # shows a USB device (no :5555)
adb reverse tcp:3000 tcp:3000
adb reverse --list  # confirm mapping
```

Then go to trove and run :

```bash
cd trove
npx expo start --dev-client
```

In another terminal run :

```bash
cd trove
npx expo run:android
```

So you should have three terminals :
One running server
One running --dev-client
One runnning run:android on every build

## Project Structure

```
.(Trove)
├── app
│   └── category
├── server
│   ├── db
│   │   └── repositories
│   ├── routes
│   ├── services
│   └── test
└── trove
    ├── app
    │   ├── (tabs)
    │   └── category
    ├── assets
    │   ├── images
    │   └── trove
    ├── components
    │   └── ui
    ├── constants
    ├── hooks
    ├── screens
    ├── scripts
    ├── src
    └── util

```

## Tech Stack

- React Native with Expo
- Expo Router for navigation
- React Native Reanimated for animations
- React Native Gesture Handler for gestures
- Axios for HTTP requests
- React hooks for state
- StyleSheet API with a small theme layer

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
