// Capacitor Configuration
// Install Capacitor packages before using: npm install @capacitor/core @capacitor/cli
// This file is only needed if deploying to mobile app stores
// See MOBILE_DEPLOYMENT.md for complete setup instructions

const config = {
  appId: 'com.zbqmal.gamelibrary',
  appName: 'Game Library',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1a1a",
      showSpinner: false,
    }
  }
};

export default config;
