# Quick Start: Deploy to Mobile App Stores

This guide provides a quick path to get your Game Library app on mobile devices.

## 🚀 Fastest Path to Mobile (Capacitor - Recommended)

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] Google Play Developer account ($25 one-time) for Android
- [ ] Apple Developer account ($99/year) for iOS

### Step 1: Install Capacitor (5 minutes)

```bash
# Install Capacitor packages
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios

# Initialize Capacitor
npx cap init "Game Library" com.yourdomain.gamelibrary
```

### Step 2: Configure for Static Export (2 minutes)

Edit `next.config.ts` - uncomment the mobile deployment lines:

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};
```

### Step 3: Build and Add Platforms (5 minutes)

```bash
# Build the app
npm run build

# Add platforms (choose one or both)
npx cap add android    # For Google Play
npx cap add ios        # For Apple App Store

# Sync web assets to native projects
npx cap sync
```

### Step 4: Test Your App (10 minutes)

**For Android:**
```bash
# Open in Android Studio
npx cap open android

# In Android Studio, click the "Run" button (green triangle)
# Select an emulator or connected device
```

**For iOS:**
```bash
# Open in Xcode (macOS only)
npx cap open ios

# In Xcode, select a simulator and click "Run" (▶ button)
```

### Step 5: Prepare Store Assets (30 minutes)

1. **App Icon (Required)**
   - Create a 1024x1024 PNG icon
   - Use [Icon Kitchen](https://icon.kitchen/) to generate all sizes

2. **Screenshots (Required)**
   - Take 2-8 screenshots of your app
   - Minimum 2 screenshots per device type

3. **Store Listing Text**
   - **Title**: "Game Library - Fun Casual Games"
   - **Short Description**: "Collection of fun mini-games including Rock-Paper-Scissors and number guessing"
   - **Full Description**: Write 2-3 paragraphs describing the games and features

### Step 6: Build for Release

**Android (Google Play):**

```bash
# Open Android Studio
npx cap open android

# In Android Studio:
# 1. Build > Generate Signed Bundle / APK
# 2. Choose "Android App Bundle"
# 3. Create a new keystore (save it securely!)
# 4. Sign and build
# 5. Output: android/app/release/app-release.aab
```

**iOS (App Store):**

```bash
# Open Xcode
npx cap open ios

# In Xcode:
# 1. Select your team in Signing & Capabilities
# 2. Product > Archive
# 3. Window > Organizer
# 4. Click "Distribute App"
# 5. Follow the wizard to upload to App Store Connect
```

### Step 7: Submit to Stores

**Google Play Console:**

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create new app
3. Complete store listing
4. Upload AAB file
5. Submit for review (1-7 days)

**Apple App Store Connect:**

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create new app
3. Complete app information
4. Select the build from Xcode
5. Submit for review (1-3 days)

---

## 🌐 Alternative: PWA (No App Store)

If you want mobile installation without app stores:

### Step 1: Add PWA Support (10 minutes)

The `manifest.json` file is already created in the `/public` folder.

### Step 2: Update Your Layout

Add to `app/layout.tsx` in the `<head>`:

```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1a1a1a" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

### Step 3: Deploy

```bash
# Your app is already deployed on Vercel
# Users can "Add to Home Screen" from their browser
```

**How users install:**
- **Android Chrome**: Menu > "Add to Home Screen"
- **iOS Safari**: Share > "Add to Home Screen"

---

## 📋 Checklist for App Store Submission

### Technical Requirements
- [ ] App builds successfully
- [ ] All games work correctly
- [ ] No crashes or errors
- [ ] Works on phones and tablets
- [ ] Handles screen rotation
- [ ] Back button works (Android)

### Store Assets
- [ ] App icon (1024x1024)
- [ ] 2-8 screenshots
- [ ] Feature graphic (Google Play: 1024x500)
- [ ] App title (30 chars)
- [ ] Short description (80 chars)
- [ ] Full description
- [ ] Privacy policy URL
- [ ] Support email

### Legal
- [ ] Privacy policy created
- [ ] Terms of service (if needed)
- [ ] Content rating completed
- [ ] Target audience defined

---

## 🆘 Common Issues

### "White screen" on mobile
**Fix**: Ensure `output: 'export'` is in `next.config.ts`

### localStorage not working
**Fix**: Use `@capacitor/preferences` instead:
```bash
npm install @capacitor/preferences
```

### Build fails in Xcode
**Fix**: 
```bash
cd ios/App
pod install
```

---

## 💰 Cost Summary

| Item | Cost |
|------|------|
| Google Play Developer | $25 (one-time) |
| Apple Developer | $99/year |
| **Both Platforms** | **$124 first year** |

---

## 📞 Need Help?

1. Check the full [MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md) guide
2. Review [Capacitor Documentation](https://capacitorjs.com/docs)
3. Visit [Capacitor Discord](https://discord.gg/UPYYRhtyzp)
4. Open a GitHub issue

---

## 🎯 Next Steps After Deployment

1. **Monitor Analytics**: Add Google Analytics or Firebase
2. **Handle Updates**: Plan monthly or quarterly updates
3. **User Feedback**: Set up in-app feedback or reviews
4. **Marketing**: Share on social media, gaming forums
5. **Monetization** (optional): Consider ads or in-app purchases

---

## ⏱️ Time Estimate

| Task | Time |
|------|------|
| Capacitor setup | 30 mins |
| Testing | 1 hour |
| Store assets | 1-2 hours |
| First submission | 1 hour |
| **Total** | **3-4 hours** |

Review time: 1-7 days for approval

---

Good luck with your mobile deployment! 🚀
