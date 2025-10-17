# Android App Setup Guide

This guide will help you build and deploy your AI Image Stylizer as an Android app using Capacitor.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v16 or higher)
2. **Android Studio** (latest version)
   - Download from: https://developer.android.com/studio
3. **Java Development Kit (JDK)** 17 or higher
   - Android Studio includes JDK, or download from: https://adoptium.net/

## Initial Setup (Already Completed)

The following has already been set up for you:

- ✅ Capacitor core and CLI installed
- ✅ Android platform added
- ✅ Configuration files created
- ✅ Mobile-optimized meta tags added
- ✅ Capacitor plugins installed (Camera, Share, Filesystem, etc.)
- ✅ Utility functions for native features

## Environment Setup

### 1. Install Android Studio

1. Download and install Android Studio
2. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (for emulator)

### 2. Configure Android SDK

1. Open Android Studio
2. Go to **Settings/Preferences** → **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Install the following:
   - Android SDK Platform 34 (or latest)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
   - Android Emulator

### 3. Set Environment Variables

Add these to your system environment variables:

```bash
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
```

Add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

## Building Your Android App

### Step 1: Build the Web App

```bash
npm run build
```

This creates the `dist` folder with your compiled web assets.

### Step 2: Sync with Android

```bash
npx cap sync android
```

This copies your web assets to the Android project and updates plugins.

### Step 3: Open in Android Studio

```bash
npm run cap:open:android
```

Or manually:
```bash
npx cap open android
```

This opens your project in Android Studio.

## Running on Emulator

### Create an Android Virtual Device (AVD)

1. In Android Studio, click **Device Manager** (phone icon in toolbar)
2. Click **Create Device**
3. Select a device (e.g., Pixel 6)
4. Download and select a system image (e.g., Android 13 - API 33)
5. Click **Finish**

### Run the App

1. In Android Studio, select your AVD from the device dropdown
2. Click the **Run** button (green play icon)
3. Wait for the emulator to start and the app to install

Or use the command line:
```bash
npm run cap:run:android
```

## Running on Physical Device

### Enable Developer Options

1. On your Android device, go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times to enable Developer Options
3. Go back to **Settings** → **System** → **Developer Options**
4. Enable **USB Debugging**

### Connect and Run

1. Connect your device via USB
2. Accept the USB debugging prompt on your device
3. In Android Studio, select your device from the dropdown
4. Click **Run**

## Building APK for Distribution

### Debug APK (for testing)

1. In Android Studio, go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Once built, click **locate** to find the APK
3. Location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (for production)

1. Generate a signing key:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. In Android Studio, go to **Build** → **Generate Signed Bundle / APK**
3. Select **APK** and click **Next**
4. Create or select your keystore
5. Fill in the required information
6. Select **release** build variant
7. Click **Finish**

The signed APK will be in: `android/app/release/app-release.apk`

## Development Workflow

### Quick Development Cycle

```bash
# Make changes to your code
npm run build

# Sync changes to Android
npx cap sync android

# Run on device/emulator
npm run cap:run:android
```

### Live Reload (Development Mode)

For faster development, you can use live reload:

1. Start your dev server:
```bash
npm run dev
```

2. Update `capacitor.config.ts` to point to your dev server:
```typescript
server: {
  url: 'http://192.168.1.X:5173', // Your local IP
  cleartext: true
}
```

3. Sync and run:
```bash
npx cap sync android
npm run cap:run:android
```

**Note:** Remember to remove the `server` config before building for production!

## Useful Commands

```bash
# Build web app
npm run build

# Sync all platforms
npx cap sync

# Sync Android only
npx cap sync android

# Open Android Studio
npm run cap:open:android

# Run on Android device/emulator
npm run cap:run:android

# Combined build and open
npm run android:build

# Update Capacitor plugins
npx cap update

# Check Capacitor setup
npx cap doctor
```

## Troubleshooting

### Gradle Build Errors

If you encounter Gradle errors:
1. Open `android/build.gradle` and ensure Gradle version is compatible
2. In Android Studio, go to **File** → **Invalidate Caches / Restart**
3. Clean and rebuild: **Build** → **Clean Project**, then **Build** → **Rebuild Project**

### SDK/JDK Issues

If Android Studio can't find SDK or JDK:
1. Go to **File** → **Project Structure**
2. Set the correct SDK and JDK paths
3. Ensure environment variables are set correctly

### Plugin Errors

If plugins aren't working:
```bash
npx cap sync android
```

### App Not Updating

If changes aren't appearing:
1. Clear the app data on your device
2. Uninstall and reinstall the app
3. Run: `npm run build && npx cap sync android`

## Native Features Available

Your app now has access to these native features:

- **Camera**: Take photos directly from the app
- **Photo Gallery**: Pick images from device gallery
- **Share**: Native share dialog for sharing styled images
- **File System**: Save images to device storage
- **Status Bar**: Customize status bar appearance
- **Splash Screen**: Native splash screen on app launch

See `utils/capacitorUtils.ts` for implementation details.

## App Customization

### Change App Name

Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">AI Image Stylizer</string>
```

### Change App Icon

Replace icons in:
- `android/app/src/main/res/mipmap-*` folders

Use Android Studio's **Image Asset Studio**:
1. Right-click `res` folder → **New** → **Image Asset**
2. Select **Launcher Icons**
3. Upload your icon image
4. Click **Next** and **Finish**

### Change Package Name

Edit `capacitor.config.ts`:
```typescript
appId: 'com.yourcompany.aiimagestyler'
```

Then sync:
```bash
npx cap sync android
```

### Change App Colors

Edit `android/app/src/main/res/values/colors.xml`:
```xml
<color name="colorPrimary">#1a1a1a</color>
<color name="colorPrimaryDark">#000000</color>
<color name="colorAccent">#667eea</color>
```

## Publishing to Google Play Store

1. **Create a Google Play Developer Account** ($25 one-time fee)
2. **Build a signed release APK** (see above)
3. **Create a new app** in Google Play Console
4. **Fill in app details**: description, screenshots, category, etc.
5. **Upload your APK** or AAB (Android App Bundle)
6. **Complete content rating questionnaire**
7. **Set pricing and distribution**
8. **Submit for review**

For detailed publishing guide, visit:
https://developer.android.com/studio/publish

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Android Studio User Guide](https://developer.android.com/studio/intro)

## Support

If you encounter issues:
1. Check the [Capacitor Community Forum](https://forum.ionicframework.com/c/capacitor)
2. Review [Capacitor GitHub Issues](https://github.com/ionic-team/capacitor/issues)
3. Consult the [Android Developer Documentation](https://developer.android.com/docs)
