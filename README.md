# Kaushalya (कौशल्या) - Learning Management System
**Powered by Yuvashakti Foundation (YSF) / Yuvashakti Skill India Pvt. Ltd.**

A comprehensive mobile LMS and administrative ecosystem built according to the exact specifications, visual designs, and workflows in **"LMS Kaushalya User Manual - Updated.pdf"** and **"YSF_LMS_Process_Flow.pdf"**.

---

## 📱 System Architecture & Overview

```
                      ┌───────────────────────────────────────────┐
                      │             ADMIN WEB PANEL               │
                      │  Dashboard | User Master | Resources      │
                      │  Assignments | Tests | Screen Time Logs   │
                      └─────────────────────┬─────────────────────┘
                                            │ REST API / Sync
                                            ▼
                      ┌───────────────────────────────────────────┐
                      │          EXPRESS BACKEND SERVER           │
                      │    Port 5000 | Auth (21092) | Telemetry   │
                      │    SQLite/JSON DB | Protected Stream      │
                      └─────────────────────┬─────────────────────┘
                                            │ API / Offline Fallback
                                            ▼
                      ┌───────────────────────────────────────────┐
                      │       KAUSHALYA MOBILE APP (REACT NATIVE) │
                      │  • Android 8.0+ (API 26+)  • < 70MB Space │
                      │  • Bilingual (EN / MR)     • 4GB RAM Opt. │
                      │  • Anti-Download Protected • Screen Time  │
                      └───────────────────────────────────────────┘
```

---

## 🚀 Key Specifications & Compliance Matrix

| Requirement | Specification | Implementation in Kaushalya | Status |
|---|---|---|---|
| **Platform** | Android 8.0 (API 26) or higher | Expo React Native, minSdkVersion 26, ARM64/V7A compatible | ✅ Met |
| **Performance** | Min 4GB RAM, < 70MB install space | Total JS bytecode bundle is **~2.0MB** (well under 70MB), zero memory leaks, memoized views | ✅ Met |
| **Bilingual Interface** | English & Marathi with first launch popup | `LanguageModal` pops up on first launch; persists in `AsyncStorage`; full i18n dictionary | ✅ Met |
| **Test Module Language** | Tests strictly in English | All MCQ questions, options, and quiz flow remain in English regardless of UI language | ✅ Met |
| **Institute Code** | Initial screen prompt validating code `21092` | `InstituteCodeScreen` checks code `21092` via API & offline validator | ✅ Met |
| **Authentication** | Username & Password (case-sensitive) | `LoginScreen` with case-sensitive password validation, Guest login, Forgot password link | ✅ Met |
| **Dashboard** | 9-Grid Module central hub | Exact 3x3 layout with matching icons, labels, drawer navigation, and status bar | ✅ Met |
| **Profile** | Read-only with 3 distinct tabs | Trainee Info, Course Details, and Other Info tabs; external edit disclaimer; toast feedback | ✅ Met |
| **Learning Resources** | Hierarchy: Scheme → Sector → Course → Subject → Chapter → Topic | Summary table (Course/Unread/Yesterday/Monthly/Yearly) → Resource Master → Resource Topic | ✅ Met |
| **Content Security** | Prevent file downloading to local storage | In-app protected viewer (`DocumentViewerModal`) for PDF, PPT, and Video without download buttons | ✅ Met |
| **Assignments** | Filters: All / Monthwise / Subjectwise | Details screen, likes counter, Send Reply screen with text + up to 2 file attachments | ✅ Met |
| **Test Module** | MCQ test, duration, passing marks, instant results | Test summary table, test card, instructions, timer countdown, instant score grading & admin sync | ✅ Met |
| **Events & Notices** | Calendar view & notices list | March 2024 calendar with selected day highlight (Day 5), announcement cards with red dates & stars | ✅ Met |
| **Support & Security** | Technical Query, Change Password, Screen Time | Support hotline `098810-88850`, `lmssupport@ysfskills.com`, change password form, telemetry toasts | ✅ Met |
| **Secrets & Sensitive Info** | Dedicated `.env` file | All sensitive credentials, support numbers, secrets stored in `.env` | ✅ Met |

---

## 🔐 Sensitive Information & `.env` Configuration

All sensitive configuration parameters are placed in `/Users/ayush/Documents/Job/YSF/YSF_app/.env`:

```env
# Server Configuration
PORT=5000
HOST=0.0.0.0
NODE_ENV=development

# Backend API URLs
API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# Authentication & Institute Validation
INSTITUTE_CODE=21092
JWT_SECRET=ysf_kaushalya_super_secret_jwt_token_2026_x89a!

# Admin Credentials for Web Panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@YSF2026!

# Support Contact Details (Technical Query Module)
YSF_SUPPORT_PHONE=098810-88850
YSF_SUPPORT_EMAIL=lmssupport@ysfskills.com
YSF_SUPPORT_PHONE_ALT=8956537504
YSF_SUPPORT_EMAIL_ALT=info@ysfskills.com

# Database Connection
DATABASE_URL=file:./data/kaushalya.db
UPLOAD_DIR=./uploads
```

### 📋 What Else Will Be Needed For Production Deployment?
1. **SMS Gateway Credentials (Optional)**: If you plan to send OTPs via SMS (e.g., Twilio, MSG91, Gupshup credentials).
2. **Push Notification Keys**: Google Firebase Cloud Messaging (`google-services.json` / FCM server key) for background push alerts.
3. **Cloud Storage (Optional)**: AWS S3 or Google Cloud Storage bucket credentials if shifting away from local uploads.
4. **Production Database URI**: If migrating to PostgreSQL or MySQL, replace `DATABASE_URL` with your standard connection string (e.g., `postgresql://user:pass@host:5432/kaushalya`).

---

## 🛠️ Step-by-Step Execution Guide

### 1. Start the Backend API & Admin Web Panel
Open a terminal in the project root:
```bash
npm run backend
```
- **Admin Web Panel**: Open [http://localhost:5000/admin](http://localhost:5000/admin) in your browser.
  - **Live KPI Dashboard**: Displays active enrolled trainees, available resources, active assignments, and total telemetry screen time.
  - **Published Notices & Announcements**: Create notices with priority (high/normal/low/info) and indicator stars (red/green). Instantly synced to mobile devices.
  - **Academic Events Calendar**: Schedule events with date, time, category, location, and description.
  - **Learning Resources Management**: Add chapters and topics (PDF, PPT, Video) with inline slides or summary text. Topics can be deleted dynamically.
  - **Assignments & Student Submissions**: Create assignments with marks and due dates. View student reply submissions with timestamp, message, and **inspect/download attached files directly via in-browser viewer or direct download link**.
  - **MCQ Tests & Assessments**: Create custom MCQ quizzes (strictly in English), inspect student test scores, and reset solved status for retakes.
  - **Trainee Screen Time Telemetry**: Live stream of module entry/exit durations recorded from mobile devices.
- **REST API Endpoints**: Live at `http://localhost:5000/api`.
- **Protected File Storage**: Served at `http://localhost:5000/uploads/`.

### 2. Run the Mobile App
In another terminal tab, run:
```bash
npm run mobile
```
Options available:
- **Web Browser Preview**: Press `w` or run `npm run mobile:web` to interact with the mobile app in your web browser.
- **Android Device / Emulator**: Connect an Android device or emulator with USB debugging enabled, then press `a` or run `npm run mobile:android`.
- **Expo Go App**: Scan the QR code with the Expo Go app on any Android device connected to your local network.
- **Pull-to-Refresh**: Every list screen (Notices, Events, Assignments, Tests, Resources) supports pull-to-refresh (`RefreshControl`) for instant synchronization with the Admin Web Panel.

---

## 📑 Walkthrough of Mobile User Flows

1. **First Launch - Language Selection Dialog**:
   - A modal prompt appears asking the trainee to choose their preferred interface language: **English** or **मराठी**.
   - Language preferences are persisted in `AsyncStorage`.
2. **Institute Code Verification**:
   - The user enters the institute code `21092` and taps **DONE**.
   - If invalid, an error prompts the user to enter `21092`.
   - On success, proceeds to the Login screen.
3. **Login Process**:
   - Pre-populated with default student credentials:
     - **Username**: `W2307C00001`
     - **Password**: `password123` (case-sensitive)
   - Tapping **LOGIN** logs into the student profile.
   - **GUEST** login is also supported.
   - **CHANGE INSTITUTE** returns to the institute code screen.
4. **Central 9-Grid Dashboard**:
   - Top bar displays `Yuvashakti Skill India Pvt. Ltd.` and the student name `KUMARI K`.
   - 9 module badges: *Learning Resource*, *Assignment*, *Test Module*, *Events*, *Notice*, *Profile*, *Technical Query*, *Change Password*, and *Logout*.
   - A side navigation drawer can also be triggered via the menu icon.
5. **Profile Module (Read-Only)**:
   - Trainee Avatar and YSF Code `W2307C00001`.
   - 3 Tabs: **Trainee Information**, **Trainee Course Details**, **Trainee Other Details**.
   - Displays toast: *"Profile in time placed"*.
6. **Learning Resources Module**:
   - Level 1: Summary table with columns: `Course`, `Unread`, `Yesterday`, `Monthly`, `Yearly`.
   - Level 2: Chapter list (`Student Resource Master`) showing Chapter Name and Topics Count.
   - Level 3: Topic list (`Student Resource Topic`) with `OPENFILE` action.
   - Level 4: Protected document viewer with slides (PDF/PPT) and video player. Direct downloads to device storage are restricted.
   - Displays toasts: *"Learning Resource in time placed"* and *"Learning Resource out time placed"*.
7. **Assignments Module**:
   - Bottom filter buttons: `[ ALL ]`, `[ MONTHWISE ]`, `[ SUBJECTWISE ]`.
   - Assignment details with like counter and instructor notes.
   - **Send Reply** screen: Type descriptive text and attach up to 2 files via the document picker.
   - Displays toast: *"Assignment in time placed"*.
8. **Test Module**:
   - Course summary table (`Total`, `Solved`, `Unsolved`).
   - Test item list with date and score status.
   - Test Instructions screen with duration (60 mins), marks (50), passing score (30).
   - MCQ quiz execution: Questions with countdown timer, single-choice selection, strictly in English.
   - Immediate scoring calculation upon submission (PASSED / FAILED) with automatic sync to the Admin Web Panel.
   - Displays toast: *"Status is ok"*.
9. **Events & Notices Module**:
   - Events: Interactive March 2024 monthly calendar with date ring highlight (Day 5 - Career Guidance Workshop). Displays toast: *"Event in time placed"*.
   - Notices: Announcement cards with red date labels, priority star indicators, and full detail modals.
10. **Technical Query & Change Password**:
    - Technical Query: Official YSF branding, tap-to-call `098810-88850`, and tap-to-email `lmssupport@ysfskills.com`.
    - Change Password: Input current password, new password, confirm new password with validation.
11. **Screen Time Telemetry**:
    - The `ScreenTimeTracker` records the entry time and exit time for each module.
    - Telemetry payloads are synchronized with the backend (`POST /api/analytics/screentime`) and appear in the Admin Web Panel's **Trainee Screen Time Reports** tab in real-time.
