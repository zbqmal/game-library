# Mobile Deployment Guide for Game Library

This guide provides comprehensive instructions for deploying the Game Library web application to Google Play Store and Apple App Store.

## Overview

Game Library is currently a Next.js web application. To deploy to mobile app stores, you have three main approaches:

1. **Capacitor** (Recommended) - Web-to-mobile wrapper, easiest to implement
2. **React Native with Web Reuse** - Native experience with code sharing
3. **Progressive Web App (PWA)** - Web-based alternative (no app store required)

## Approach Comparison

| Feature | Capacitor | React Native | PWA |
|---------|-----------|--------------|-----|
| **Implementation Time** | 1-2 days | 2-4 weeks | 1 day |
| **Code Reuse** | 95%+ | 60-70% | 100% |
| **Native Performance** | Good | Excellent | Good |
| **Native Features** | Via plugins | Full access | Limited |
| **App Store Distribution** | Yes | Yes | No (direct install) |
| **Maintenance** | Low | Medium | Very Low |
| **Offline Support** | Good | Excellent | Good |
| **Development Complexity** | Low | High | Very Low |

## Recommended Approach: Capacitor

Capacitor by Ionic is the recommended solution because:
- ✅ Minimal code changes required
- ✅ Uses your existing Next.js/React codebase
- ✅ Supports both iOS and Android from same codebase
- ✅ Access to native APIs via plugins
- ✅ Fast time to market
- ✅ Easy maintenance

---

## Option 1: Capacitor Implementation (Recommended)

### Prerequisites

1. **For Android:**
   - Android Studio installed
   - Java Development Kit (JDK) 11 or later
   - Android SDK configured

2. **For iOS:**
   - macOS computer
   - Xcode 14 or later
   - Valid Apple Developer account ($99/year)
   - CocoaPods installed

3. **For Both:**
   - Node.js 16+ and npm/yarn installed
   - Git installed

### Step 1: Install Capacitor

```bash
# Install Capacitor dependencies
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# Initialize Capacitor
npx cap init "Game Library" com.yourdomain.gamelibrary
```

### Step 2: Configure Next.js for Static Export

Update `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Use relative paths for mobile apps
  basePath: '',
  assetPrefix: '',
};

export default nextConfig;
```

### Step 3: Add Build Scripts

Update `package.json` to add mobile build scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:mobile": "next build && npx cap sync",
    "start": "next start",
    "lint": "eslint",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "android": "npx cap open android",
    "ios": "npx cap open ios",
    "sync": "npx cap sync"
  }
}
```

### Step 4: Create Capacitor Configuration

Create `capacitor.config.ts` in the root directory:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourdomain.gamelibrary',
  appName: 'Game Library',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false,
    }
  }
};

export default config;
```

### Step 5: Add Android and iOS Platforms

```bash
# Build the Next.js app for static export
npm run build

# Add platforms
npx cap add android
npx cap add ios

# Sync web assets to native platforms
npx cap sync
```

### Step 6: Configure Android

1. **Update AndroidManifest.xml** (`android/app/src/main/AndroidManifest.xml`):

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Required permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <application
        android:label="Game Library"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true">
        <!-- Activities and other config -->
    </application>
</manifest>
```

2. **Update build.gradle** (`android/app/build.gradle`):

```gradle
android {
    namespace 'com.yourdomain.gamelibrary'
    compileSdk 34
    
    defaultConfig {
        applicationId "com.yourdomain.gamelibrary"
        minSdk 22
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. **Open in Android Studio and test:**

```bash
npx cap open android
```

### Step 7: Configure iOS

1. **Open in Xcode:**

```bash
npx cap open ios
```

2. **Configure in Xcode:**
   - Select your project in the navigator
   - Update Bundle Identifier: `com.yourdomain.gamelibrary`
   - Select your Development Team
   - Update version and build number
   - Configure signing certificates

3. **Update Info.plist** if needed for permissions:

```xml
<key>NSCameraUsageDescription</key>
<string>This app uses the camera for game features</string>
```

### Step 8: Add App Icons and Splash Screens

1. **Generate Icons:**
   - Create a 1024x1024 PNG icon
   - Use tools like [Icon Kitchen](https://icon.kitchen/) or [App Icon Generator](https://appicon.co/)

2. **For Android:**
   - Place icons in `android/app/src/main/res/mipmap-*` folders

3. **For iOS:**
   - Add icons to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Step 9: Build for Production

**Android APK/AAB:**

```bash
# Open Android Studio
npx cap open android

# In Android Studio:
# Build > Generate Signed Bundle / APK
# Follow the wizard to create a keystore and sign your app
# Choose Android App Bundle (AAB) for Play Store
```

**iOS IPA:**

```bash
# Open Xcode
npx cap open ios

# In Xcode:
# 1. Select "Any iOS Device (arm64)" as target
# 2. Product > Archive
# 3. Window > Organizer
# 4. Distribute App > App Store Connect
# 5. Follow the wizard
```

### Step 10: Publish to App Stores

#### Google Play Store

1. **Create Google Play Console Account:**
   - Visit [Google Play Console](https://play.google.com/console)
   - Pay one-time $25 registration fee
   - Complete account setup

2. **Create New App:**
   - Click "Create app"
   - Enter app details (name, language, type)
   - Complete store listing:
     - App name: "Game Library"
     - Short description (80 chars)
     - Full description (4000 chars)
     - Screenshots (2-8 screenshots)
     - Feature graphic (1024 x 500)
     - App icon (512 x 512)

3. **Upload AAB:**
   - Go to Production > Create new release
   - Upload your signed AAB file
   - Complete release notes
   - Submit for review

4. **Review Process:**
   - Initial review: 1-7 days
   - Updates: Few hours to 3 days

#### Apple App Store

1. **Create Apple Developer Account:**
   - Visit [Apple Developer](https://developer.apple.com)
   - Pay $99/year membership fee
   - Complete account setup

2. **Create App in App Store Connect:**
   - Visit [App Store Connect](https://appstoreconnect.apple.com)
   - Click "+" > "New App"
   - Enter app details:
     - Platform: iOS
     - Name: "Game Library"
     - Primary Language: English
     - Bundle ID: com.yourdomain.gamelibrary
     - SKU: unique identifier

3. **Complete App Information:**
   - App Privacy details
   - Pricing and Availability (Free)
   - App Information:
     - Screenshots (iPhone, iPad)
     - Description
     - Keywords
     - Support URL
     - Marketing URL (optional)

4. **Upload Build:**
   - Use Xcode > Archive > Distribute
   - Build will appear in TestFlight within 30 minutes
   - Add to App Store submission

5. **Submit for Review:**
   - Complete all required fields
   - Submit for review
   - Review process: 1-3 days typically

---

## Option 2: React Native Implementation

If you need maximum performance and native feel, consider React Native:

### Overview

React Native provides true native components and better performance, but requires more refactoring.

### Implementation Strategy

1. **Create React Native Project:**

```bash
npx react-native init GameLibraryMobile --template react-native-template-typescript
```

2. **Port Components:**
   - Extract game logic from Next.js components
   - Rebuild UI using React Native components
   - Share business logic between web and mobile

3. **Recommended Structure:**

```
game-library/
├── packages/
│   ├── web/              # Next.js app (existing)
│   ├── mobile/           # React Native app
│   └── shared/           # Shared game logic
│       ├── gameLogic/
│       ├── types/
│       └── utils/
```

4. **Use Monorepo Tools:**
   - Yarn Workspaces (already configured)
   - Or: Nx, Turborepo, Lerna

### Pros and Cons

**Pros:**
- Native performance
- Full access to native APIs
- Best user experience
- Better app store optimization

**Cons:**
- Significant refactoring required
- Separate maintenance for mobile
- Longer development time
- More complex CI/CD

---

## Option 3: Progressive Web App (PWA)

If app store distribution isn't critical, consider PWA:

### Implementation

1. **Add PWA Support:**

```bash
npm install next-pwa
```

2. **Configure next.config.ts:**

```typescript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  // your existing config
});
```

3. **Create manifest.json:**

```json
{
  "name": "Game Library",
  "short_name": "Game Library",
  "description": "Collection of fun casual games",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Benefits of PWA

- No app store approval needed
- Instant updates
- Works on all platforms
- Installable from browser
- Offline support
- Push notifications (with permission)

### Limitations

- No app store presence
- Limited native API access
- Users must discover via web
- Less trusted by some users

---

## Storage Considerations

The app currently uses `localStorage`. For mobile apps:

### Capacitor Storage Plugin

```bash
npm install @capacitor/preferences
```

```typescript
import { Preferences } from '@capacitor/preferences';

// Save data
await Preferences.set({ key: 'scores', value: JSON.stringify(scores) });

// Load data
const { value } = await Preferences.get({ key: 'scores' });
const scores = JSON.parse(value || '[]');
```

### Alternative: Add Backend API

For synchronized scores across devices:

1. **Add API Routes** in Next.js
2. **Use Database** (Vercel Postgres, Firebase, Supabase)
3. **Implement in Mobile** using fetch/axios

---

## Testing Mobile Apps

### Android Testing

```bash
# Run on emulator
npx cap run android

# Debug mode
npx cap run android --target <device-id>
```

### iOS Testing

```bash
# Run on simulator
npx cap run ios

# Run on device (requires paid developer account)
npx cap run ios --target <device-id>
```

### Testing Checklist

- [ ] All games work correctly
- [ ] Touch interactions work
- [ ] Scoreboard persists correctly
- [ ] App handles orientation changes
- [ ] Back button works correctly (Android)
- [ ] App resumes correctly after background
- [ ] No console errors
- [ ] Performance is acceptable

---

## CI/CD for Mobile

### GitHub Actions Example

Create `.github/workflows/mobile-build.yml`:

```yaml
name: Mobile Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '11'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build web app
        run: npm run build
        
      - name: Sync Capacitor
        run: npx cap sync android
        
      - name: Build Android APK
        run: |
          cd android
          ./gradlew assembleDebug
          
      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk

  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build web app
        run: npm run build
        
      - name: Sync Capacitor
        run: npx cap sync ios
        
      - name: Build iOS
        run: |
          cd ios/App
          xcodebuild -workspace App.xcworkspace \
                     -scheme App \
                     -configuration Debug \
                     -destination 'platform=iOS Simulator,name=iPhone 14' \
                     build
```

---

## Cost Breakdown

### One-Time Costs
- Google Play Developer Account: $25
- Apple Developer Account: $99/year
- App icons/assets design: $0-500 (optional)

### Ongoing Costs
- Apple Developer renewal: $99/year
- Code signing certificates: Included
- App updates: Free (labor only)

### Total First Year
- Android only: $25
- iOS only: $99
- Both platforms: $124

---

## Maintenance and Updates

### Update Process with Capacitor

1. **Update web code** as usual
2. **Build for production:**
   ```bash
   npm run build
   ```

3. **Sync to mobile:**
   ```bash
   npx cap sync
   ```

4. **Test on devices/emulators**

5. **Build and submit updates** to stores

### Update Frequency

- **Bug fixes:** As needed
- **New features:** Monthly or quarterly
- **Security updates:** Immediately
- **Dependency updates:** Quarterly

---

## Common Issues and Solutions

### Issue: White screen on mobile

**Solution:** Check that `output: 'export'` is set in `next.config.ts` and paths are relative.

### Issue: localStorage not working

**Solution:** Use `@capacitor/preferences` instead of localStorage.

### Issue: App crashes on Android

**Solution:** Check logcat logs:
```bash
adb logcat | grep -i capacitor
```

### Issue: iOS build fails in Xcode

**Solution:** 
- Clean build folder (Cmd+Shift+K)
- Update CocoaPods: `cd ios/App && pod install`
- Check provisioning profiles

### Issue: Icons not showing correctly

**Solution:** 
- Regenerate icons for each platform
- Ensure proper dimensions (1024x1024 base)
- Use solid color background (no transparency for iOS)

---

## Next Steps

1. **Choose your approach** (Capacitor recommended for fastest deployment)
2. **Set up developer accounts** (Google Play and/or Apple Developer)
3. **Follow implementation guide** for your chosen approach
4. **Test thoroughly** on real devices
5. **Prepare store assets** (screenshots, descriptions, icons)
6. **Submit for review** and monitor feedback
7. **Plan for ongoing maintenance** and updates

---

## Resources

### Official Documentation
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [React Native Documentation](https://reactnative.dev/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://developer.apple.com/app-store-connect/)

### Tools
- [Icon Kitchen](https://icon.kitchen/) - Generate app icons
- [App Icon Generator](https://appicon.co/) - Multi-platform icon generator
- [App Store Screenshot Generator](https://www.appscreens.io/) - Create store screenshots

### Communities
- [Capacitor Discord](https://discord.gg/UPYYRhtyzp)
- [React Native Community](https://reactnative.dev/community/overview)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/capacitor)

---

## Support

For questions or issues:
1. Check this documentation first
2. Search existing issues on GitHub
3. Post in relevant community forums
4. Create a GitHub issue with details

---

## License

This guide is provided as-is for the Game Library project. Feel free to adapt for your needs.
