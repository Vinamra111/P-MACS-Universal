# P-MACS Mobile Android 📱

> **Pharmacy Management and Control System** - Mobile edition with embedded AI-powered inventory management

A production-ready Android application for hospital pharmacy management with offline-first architecture, embedded Node.js backend, and AI-powered decision support.

[![NPM Package](https://img.shields.io/badge/npm-@team--bitbot%2Fcore-blue)](https://www.npmjs.com/package/@team-bitbot/core)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 🎯 What is P-MACS Mobile?

P-MACS Mobile is a cross-platform Android application designed for hospital pharmacy staff (nurses, pharmacists, and administrators) to manage medication inventory in real-time. Unlike traditional mobile apps, it runs a **complete Node.js backend embedded inside the APK**, making it fully functional without internet connectivity.

### Key Capabilities:
- ✅ **Offline-First:** Full backend runs on-device at localhost:3000
- ✅ **Real-Time Inventory:** Track 100+ medications across multiple wards
- ✅ **AI Assistant:** OpenAI GPT-4o integration for intelligent queries
- ✅ **Role-Based Access:** Separate dashboards for Nurses, Pharmacists, and Admins
- ✅ **FEFO Compliance:** First-Expiry-First-Out recommendations
- ✅ **Alert System:** Automatic warnings for low stock and expiring medications

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 14 (Static Export)
- React 18 + TypeScript
- Tailwind CSS
- Lucide React Icons

**Backend (Embedded):**
- Node.js (via nodejs-mobile-cordova)
- Express.js REST API
- CSV-based database (4 data files)
- OpenAI GPT-4o integration

**Mobile Framework:**
- Capacitor 6
- Android SDK 28+
- Native NDK components

**Core Library:**
- [@team-bitbot/core](https://www.npmjs.com/package/@team-bitbot/core) - Shared business logic

---

## 📊 Database Schema

The app includes 4 CSV files embedded in the APK:

1. **inventory_master.csv** (16KB) - 100+ medication records
2. **transaction_logs.csv** (363KB) - Complete transaction history
3. **user_access.csv** (2.7KB) - User authentication data
4. **access_logs.csv** (13KB) - Audit trail

---

## 🚀 Features

### For Nurses 👨‍⚕️
- Quick medication lookup by name or location
- Ward stock levels (ICU, Emergency, Pediatric, etc.)
- AI assistant for drug information queries
- FEFO recommendations for dispensing
- Low stock alerts

### For Pharmacists 💊
- Full inventory management dashboard
- Transaction history and analytics
- Expiry tracking with 30-day warnings
- AI-powered forecasting and recommendations
- Slow-moving and top-moving drug reports

### For Administrators 🔐
- System-wide analytics
- User access management
- Audit logs and compliance reports
- Alert configuration
- Performance metrics

---

## 📱 Backend Verification

### Confirmed Working (via ADB logs):
```
[P-MACS] Node.js server started successfully!
P-MACS Mobile Backend running on http://localhost:3000

Available endpoints:
  POST /api/auth/login
  POST /api/nurse/chat
  POST /api/nurse/dashboard
  POST /api/nurse/alerts
  POST /api/pharmacist/chat
  POST /api/admin/dashboard
```

### Demo Credentials:
- **Nurse:** N001 / nurse
- **Pharmacist:** P001 / pharma
- **Administrator:** M001 / admin

---

## 🛠️ Installation

### Prerequisites
- Android Studio (Arctic Fox or later)
- Node.js 16+
- Java 17 (JDK)
- Android NDK

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Vinamra111/P-MACS-Universal.git
cd pmacs-mobile-android

# 2. Install dependencies
npm install

# 3. Build Next.js frontend
npm run build

# 4. Open in Android Studio
npx cap open android

# 5. Build APK
# In Android Studio: Build > Build APK(s)

# 6. Install on device
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Note:** See [BUILD_GUIDE.md](BUILD_GUIDE.md) for detailed build instructions including native component restoration.

---

## 📡 API Endpoints

All endpoints run on embedded server at `http://localhost:3000`

### Authentication
```
POST /api/auth/login
Body: { empId, password }
Response: { success, user: { empId, name, role, status } }
```

### Dashboard
```
POST /api/nurse/dashboard
Response: { success, stats: { totalItems, lowStock, expiringItems, outOfStock } }
```

### Alerts
```
POST /api/nurse/alerts
Response: { success, alerts: [{ id, type, message, details, timestamp }] }
```

### AI Chat
```
POST /api/nurse/chat
POST /api/pharmacist/chat
Body: { message, history }
Response: { success, response }
```

---

## 🔒 Security

- **SHA-256 Password Hashing:** All passwords hashed before storage
- **Network Security Config:** Restricts cleartext traffic to localhost only
- **Role-Based Access Control:** Enforced at frontend and backend
- **Audit Logging:** All actions logged
- **Offline Operation:** Prevents external data leaks

---

## 📈 Performance

- **APK Size:** ~180MB (includes Node.js runtime + data)
- **Startup Time:** ~3 seconds
- **Memory Usage:** ~150MB RAM
- **Database Size:** 395KB (4 CSV files)
- **Supported:** Android 9.0+ (API 28+)

---

## 🧪 Testing

**Device Tested:** Samsung Galaxy A01 (Model: A015)

✅ Backend startup  
✅ User authentication  
✅ API endpoints responding  
✅ Dashboard data calculations  

```bash
# Monitor logs
adb logcat | grep -E "(P-MACS|NODEJS)"
```

---

## 📦 Related Projects

- **P-MACS Universal (Web):** Full web dashboard
- **@team-bitbot/core:** Shared NPM package
- **Repository:** https://github.com/Vinamra111/P-MACS-Universal.git

---

## 🐛 Troubleshooting

### Common Issues:
1. **"www folder not found"** → See BUILD_GUIDE.md step 4
2. **"Undefined C++ symbols"** → Add c++_shared to CMakeLists.txt
3. **"Build cache error"** → File > Invalidate Caches in Android Studio

See [BUILD_GUIDE.md](BUILD_GUIDE.md) for complete troubleshooting.

---

## 📄 License

MIT License - See LICENSE file

---

## 🔗 Links

- **GitHub:** https://github.com/Vinamra111/P-MACS-Universal.git
- **NPM Package:** [@team-bitbot/core](https://www.npmjs.com/package/@team-bitbot/core)
- **Issues:** [GitHub Issues](https://github.com/Vinamra111/P-MACS-Universal/issues)

---

## ✨ Acknowledgments

- OpenAI GPT-4o for AI assistance
- nodejs-mobile-cordova for embedded Node.js
- Capacitor for mobile framework
- Samsung Galaxy A01 for device testing

---

**Built with ❤️ for healthcare professionals**

*Last Updated: February 13, 2026*
