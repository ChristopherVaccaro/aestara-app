# Quick Start: Building Your Android App

## Prerequisites

1. **Install Android Studio**: https://developer.android.com/studio
2. **Install JDK 17+** (included with Android Studio)

## Quick Build Steps

### 1. Build the Web App
```bash
npm run build
```

### 2. Open in Android Studio
```bash
npm run cap:open:android
```

### 3. Run on Emulator or Device

In Android Studio:
- Click the **Run** button (green play icon)
- Select your device/emulator
- Wait for the app to install and launch

## That's It! 🎉

Your AI Image Stylizer is now running as a native Android app!

## Next Steps

- **Test on physical device**: Enable USB debugging and connect via USB
- **Customize app icon**: Use Android Studio's Image Asset Studio
- **Build release APK**: See `ANDROID_SETUP.md` for detailed instructions

## Common Commands

```bash
# Build and sync
npm run build && npx cap sync android

# Open Android Studio
npm run cap:open:android

# Run on device
npm run cap:run:android

# Complete workflow
npm run android:build
```

## Troubleshooting

**Build errors?**
- Run: `npx cap doctor` to check your setup
- In Android Studio: **File** → **Invalidate Caches / Restart**

**App not updating?**
- Always run `npm run build` before syncing
- Run: `npx cap sync android` after building

**Need more help?**
- See `ANDROID_SETUP.md` for comprehensive guide
- Check Capacitor docs: https://capacitorjs.com/docs

## Native Features Ready to Use

Your app includes:
- 📸 Camera access
- 🖼️ Photo gallery picker
- 📤 Native share functionality
- 💾 File system access
- 🎨 Status bar customization

See `utils/capacitorUtils.ts` for implementation examples.
