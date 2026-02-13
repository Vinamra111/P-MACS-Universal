# P-MACS Mobile - Quick Build Guide

## Prerequisites Check

Before building, ensure you have:

- [x] Node.js 20+ installed
- [x] Android Studio installed
- [x] JDK 17+ installed
- [x] All dependencies installed (`npm install` completed)
- [x] Next.js built (`npm run build` completed)
- [x] Android platform added (`npx cap add android` completed)

## Build APK - 3 Methods

### Method 1: Gradle Command Line (Fastest)

```bash
# Navigate to Android directory
cd pmacs-mobile-android/android

# For Windows (use gradlew.bat)
gradlew.bat assembleDebug

# For Linux/Mac
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

**Build time**: ~2-5 minutes (first build may take longer)

### Method 2: Android Studio (Best for Debugging)

```bash
# Open Android project in Android Studio
cd pmacs-mobile-android
npx cap open android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Click **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. Wait for build to complete
4. Click "locate" link in notification to find APK

### Method 3: Capacitor CLI (For Testing on Device)

```bash
cd pmacs-mobile-android

# Build and run on connected device/emulator
npx cap run android

# This will:
# 1. Build the APK
# 2. Install on device
# 3. Launch the app
```

## Install APK on Android Device

### Via ADB (USB Connection)

```bash
# 1. Enable USB Debugging on your Android device:
#    Settings > Developer Options > USB Debugging

# 2. Connect device via USB

# 3. Verify device connected
adb devices

# 4. Install APK
adb install pmacs-mobile-android/android/app/build/outputs/apk/debug/app-debug.apk

# 5. Launch app
adb shell am start -n com.pmacs.app/.MainActivity
```

### Via File Transfer

1. Copy APK to device (USB, email, cloud storage)
2. On device, tap the APK file
3. If prompted, allow installation from unknown sources
4. Tap "Install"

## Troubleshooting Build Issues

### Error: "SDK not found"

```bash
# Set ANDROID_HOME environment variable

# Windows:
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk

# Linux/Mac:
export ANDROID_HOME=$HOME/Android/Sdk

# Add to PATH:
# Windows: %ANDROID_HOME%\platform-tools
# Linux/Mac: $ANDROID_HOME/platform-tools
```

### Error: "gradlew: Permission denied" (Linux/Mac)

```bash
cd pmacs-mobile-android/android
chmod +x gradlew
./gradlew assembleDebug
```

### Error: "Build failed" with dependency issues

```bash
# Clean Gradle cache and rebuild
cd pmacs-mobile-android/android
./gradlew clean
./gradlew assembleDebug
```

### Error: "nodejs-mobile not found"

```bash
# Re-sync Capacitor
cd pmacs-mobile-android
npx cap sync android

# Verify plugin installed
npm list nodejs-mobile-cordova
```

## First Launch Setup

After installing the APK:

1. **Launch App**
   - Tap P-MACS icon on device

2. **API Key Setup** (First time only)
   - Enter your OpenAI API key (starts with `sk-`)
   - Get one at: https://platform.openai.com/api-keys
   - Tap "Continue"

3. **Login**
   - Username: `N001` (Nurse)
   - Password: `nurse`

   Other accounts:
   - Pharmacist: `P001` / `pharma`
   - Admin: `M001` / `admin`

4. **Test Chat**
   - Ask: "Where is Morphine?"
   - Should see drug locations in a table

## Verify Everything Works

### Check Node.js Server Started

```bash
# View Android logs
adb logcat | grep -i nodejs

# Should see:
# "P-MACS Mobile Backend running on http://localhost:3000"
```

### Check API Endpoint

From device browser or app console:

```javascript
// Test health endpoint
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(console.log)
// Should return: { status: 'ok', message: 'P-MACS Mobile Backend Running' }
```

### Check Chat API

Send a test message in the app and watch Logcat:

```bash
adb logcat | grep -E "(nodejs|express|langchain)"
```

## Build Release APK (Production)

### 1. Generate Keystore (One-time)

```bash
keytool -genkey -v -keystore pmacs-release.keystore \
  -alias pmacs -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Signing

Edit `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file("../../pmacs-release.keystore")
            storePassword "your_password"
            keyAlias "pmacs"
            keyPassword "your_password"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
        }
    }
}
```

### 3. Build Release APK

```bash
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run build` | Build Next.js static export |
| `npx cap sync android` | Sync web assets to Android |
| `npx cap open android` | Open in Android Studio |
| `./gradlew assembleDebug` | Build debug APK |
| `./gradlew assembleRelease` | Build release APK |
| `adb install <apk>` | Install APK on device |
| `adb logcat` | View Android logs |
| `./gradlew clean` | Clean build artifacts |

## File Locations

```
pmacs-mobile-android/
├── out/                              # Next.js build output
├── android/
│   ├── app/build/outputs/apk/
│   │   ├── debug/app-debug.apk       # Debug APK
│   │   └── release/app-release.apk   # Release APK
│   └── gradlew                       # Gradle wrapper
├── nodejs-assets/nodejs-project/     # Backend server
└── capacitor.config.ts               # Capacitor config
```

## Expected APK Size

- **Debug**: 40-60 MB
- **Release** (with ProGuard): 30-50 MB
- **Release** (with App Bundle): 20-40 MB (Google Play optimized)

## Support

- **Build Issues**: Check Android Studio "Build" tab
- **Runtime Issues**: Use `adb logcat`
- **Node.js Issues**: Filter logcat with `grep nodejs`
- **Network Issues**: Verify network_security_config.xml

---

**Ready to build?** Run this now:

```bash
cd pmacs-mobile-android/android
./gradlew assembleDebug
```

Good luck! 🚀
