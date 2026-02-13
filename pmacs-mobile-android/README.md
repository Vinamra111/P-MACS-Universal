# P-MACS Mobile for Android

Pharmacy Management & AI Chatbot System - Android Mobile Application

## Overview

P-MACS Mobile is a standalone Android application built from the P-MACS web platform. It includes:

- **27 AI-powered tools** for pharmacy management
- **Role-based access** (Nurse, Pharmacist, Admin)
- **Offline-capable** with local CSV database
- **Embedded backend** - no external server needed
- **LangChain + GPT-4o** for intelligent chat assistance

## Architecture

```
UI Layer: React + Next.js (Static Export)
├─ ChatInterface, Dashboard components
└─ Tailwind CSS styling

Backend Layer: Embedded Express Server
├─ LangChain agent with 27 tools
├─ Role-based access control
└─ Runs on localhost:3000 (in-app)

Data Layer: CSV Files in Android Storage
├─ inventory_master.csv
├─ user_access.csv
├─ transaction_logs.csv
└─ access_logs.csv

Runtime: nodejs-mobile
└─ Node.js embedded in APK

Build System: Gradle
└─ Standard Android Studio project
```

## Prerequisites

Before building P-MACS Mobile, ensure you have:

### Required Software

1. **Node.js 20+**
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Required components:
     - Android SDK (API 26+)
     - Android SDK Build-Tools
     - Android Emulator (for testing)

3. **JDK 17+**
   - OpenJDK recommended
   - Verify: `java -version`

4. **Git** (for cloning)
   - Download from: https://git-scm.com/

### Required Credentials

- **OpenAI API Key**: Required for AI chatbot functionality
  - Get one at: https://platform.openai.com/api-keys
  - Will be entered in app on first launch

## Installation & Build

### Step 1: Install Dependencies

```bash
cd pmacs-mobile-android

# Install Node.js dependencies
npm install

# Install backend dependencies
cd nodejs-assets/nodejs-project
npm install
cd ../..
```

### Step 2: Add Android Platform

```bash
# Add Capacitor Android platform
npm run cap:add:android

# This creates the android/ directory with Gradle project
```

### Step 3: Build Frontend

```bash
# Build Next.js static export
npm run build

# Output will be in out/ directory
```

### Step 4: Sync to Android

```bash
# Copy web assets and sync to Android project
npm run cap:sync
```

### Step 5: Open in Android Studio

```bash
# Open Android project in Android Studio
npm run cap:open
```

### Step 6: Build APK in Android Studio

1. In Android Studio, select **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Wait for Gradle build to complete
3. APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

## One-Command Build (Advanced)

For automated builds, use the build script:

```bash
# Build everything and generate APK
npm run build:android
```

This will:
1. Build Next.js frontend
2. Sync to Android
3. Run Gradle build
4. Output APK to `android/app/build/outputs/apk/release/`

## Installation on Android Device

### Method 1: Via ADB (Recommended)

```bash
# Connect Android device via USB (with USB debugging enabled)
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Method 2: Manual Transfer

1. Copy APK to your Android device
2. Open file manager and tap the APK
3. Allow installation from unknown sources if prompted
4. Follow on-screen installation instructions

## First Launch Setup

On first launch, P-MACS Mobile will prompt you to:

1. **Enter OpenAI API Key**
   - Your key is stored securely on device
   - Never shared or transmitted
   - Can be changed later in Settings

2. **Login**
   - Use existing P-MACS credentials:
     - **Nurse**: N001 / nurse
     - **Pharmacist**: P001 / pharma
     - **Admin**: M001 / admin

## Features by Role

### Nurse (8 Tools)
- Drug availability lookup
- Ward-specific stock checks
- Full inventory viewing
- Expiring medication alerts
- FEFO (First Expire, First Out) recommendations
- Batch reports with lot numbers
- Expired items report

### Pharmacist (22 Tools)
- All Nurse tools +
- Usage analytics and forecasting
- Safety stock calculations
- Low stock alerts
- Transaction history
- Procurement recommendations
- Seasonal pattern detection
- Demand prediction

### Admin/Master (27 Tools)
- All Pharmacist tools +
- User management
- System-wide analytics
- Access logs
- Advanced reporting

## Project Structure

```
pmacs-mobile-android/
├── android/                    # Android native project (Gradle)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/com/pmacs/app/
│   │   │   └── assets/
│   │   └── build.gradle
│   └── build.gradle
├── src/                        # React frontend source
│   ├── app/                   # Next.js pages
│   ├── components/            # React components
│   ├── hooks/                 # Custom hooks
│   └── lib/                   # Utilities
├── nodejs-assets/             # Backend source
│   └── nodejs-project/
│       ├── server.js          # Express server
│       ├── src/
│       │   ├── core/         # @pmacs/core package
│       │   └── routes/       # API routes
│       └── data/             # CSV files
├── capacitor.config.ts
├── next.config.js
├── package.json
└── README.md (this file)
```

## Development Workflow

### Running on Emulator

```bash
# Start Android Emulator from Android Studio
# Then run:
npx cap run android
```

### Making Changes

1. **Frontend changes**:
   ```bash
   # Edit files in src/
   npm run build
   npm run cap:sync
   ```

2. **Backend changes**:
   ```bash
   # Edit files in nodejs-assets/nodejs-project/
   npm run cap:sync
   ```

3. **Rebuild in Android Studio**

### Debugging

- **Frontend logs**: Chrome DevTools (chrome://inspect)
- **Backend logs**: Android Logcat (in Android Studio)
- **Network requests**: Use Charles Proxy or similar

## Troubleshooting

### Build Issues

**Problem**: Gradle build fails with "SDK not found"
**Solution**:
```bash
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk  # Linux/Mac
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk  # Windows
```

**Problem**: Node.js dependencies error
**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Capacitor sync fails
**Solution**:
```bash
npx cap sync android --force
```

### Runtime Issues

**Problem**: "API key not configured" error
**Solution**: Go to Settings in app and re-enter your OpenAI API key

**Problem**: Chat not responding
**Solution**:
1. Check internet connection (OpenAI API requires network)
2. Verify API key is valid
3. Check Logcat for error messages

**Problem**: Database errors
**Solution**: Clear app data and reinstall

## Building for Production

### Generate Release APK

1. **Create keystore** (first time only):
   ```bash
   keytool -genkey -v -keystore pmacs-release.keystore \
     -alias pmacs -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing** in `android/app/build.gradle`:
   ```gradle
   signingConfigs {
       release {
           storeFile file("../../pmacs-release.keystore")
           storePassword "your_password"
           keyAlias "pmacs"
           keyPassword "your_password"
       }
   }
   ```

3. **Build release APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **APK location**:
   `android/app/build/outputs/apk/release/app-release.apk`

## Performance Notes

- **APK Size**: ~50-100MB (large size is acceptable per project requirements)
- **Startup Time**: <3 seconds on modern devices
- **Memory Usage**: ~150MB during operation
- **Database**: CSV files are cached for 5-10x faster queries

## Security Notes

- OpenAI API key stored in Android KeyStore (encrypted)
- CSV data stored in app's private internal storage
- No external server communication except OpenAI API
- All user data stays on device

## Support & Documentation

- **Main P-MACS Documentation**: See parent project README
- **Issue Tracker**: Report issues to development team
- **Architecture Details**: See IMPLEMENTATION_PLAN.md

## Version History

### v1.0.0 (Current)
- Initial mobile release
- 27 AI tools with role-based access
- Embedded Node.js backend
- Offline-capable with local CSV database
- GPT-4o integration
- Supports Android 8.0+ (API 26+)

## Credits

Built with:
- **Capacitor** - Web-to-native framework
- **Next.js & React** - Frontend framework
- **LangChain** - AI agent orchestration
- **OpenAI GPT-4o** - Language model
- **Express.js** - Backend server
- **nodejs-mobile** - Embedded Node.js runtime

---

**P-MACS Mobile** - Pharmacy Management & AI Chatbot System for Android
