# Yuvashakti Skill India Pvt. Ltd. — Kaushalya LMS
## Complete Full-Stack Cloud Setup, Production Deployment & APK Guide

This repository contains the institutional-grade **Kaushalya Learning Management System (LMS)** developed for **Yuvashakti Foundation (YSF)**, comprising:
1. **Central Administration Control Center & Backend API** (`backend/`):
   - Express REST API with SheetJS (`xlsx`) Excel ingestion & template generator.
   - **MongoDB Atlas Cloud Database Integration** with real-time bi-directional persistence and offline local fallback.
   - Question Bank repository with Fisher-Yates randomization.
   - Trainee registry with 12-digit Aadhaar deduplication & status upsert.
   - Dynamic URL helpers preventing `localhost` file breakage on cloud deployments.
   - Single-Page Admin SaaS Control Center at `http://localhost:5002/admin` (or on Render at `https://<service>.onrender.com/admin`).
2. **Mobile Learning Application** (`mobile/`):
   - Cross-platform React Native Expo Android application.
   - **In-App Cloud Server Switcher**: Tap ⚙️ on the login / institute code screen to link to any Render URL on the fly.
   - Dynamic URL rewriting ensuring uploaded PDFs, PPTs, videos, and assignment attachments load from Render/MongoDB.
   - OJT Attendance & Training Hours progress tracker.
   - Dynamic MCQ Test Module, Learning Resources reader (PDF/PPT/Video), Assignments submission & evaluation, and Technical Query Helpdesk.

---

## 📋 System Requirements
- **Node.js**: v18.0.0 or higher (v20+ recommended). Check with `node -v`.
- **npm**: v9.0.0 or higher. Check with `npm -v`.
- *(Optional)* **Java 17 & Android SDK** if compiling the APK locally from source.

---

## 🚀 Quick Start (Local Execution)

### Step 1: Install Dependencies
```bash
# 1. Root dependencies
npm install

# 2. Backend dependencies (Express, CORS, Multer, XLSX, MongoDB)
cd backend && npm install && cd ..

# 3. Mobile dependencies (React Native, Expo, Icons, AsyncStorage)
cd mobile && npm install && cd ..
```

---

### Step 2: Start the Backend Server & Admin Control Center
```bash
cd backend
npm start
```
The server will boot on port `5002`:
```text
=================================================
YSF Kaushalya LMS Backend Server running on port 5002
Admin Portal: http://localhost:5002/admin
API Base URL: http://localhost:5002/api
Uploads Dir:  http://localhost:5002/uploads
MongoDB:      Connected (ysfdatabase.vznhwe9.mongodb.net/ysf_kaushalya_lms)
=================================================
```

#### Accessing the Admin Panel:
Open your browser and navigate to:
👉 **`http://localhost:5002/admin`**

---

### Step 3: Run the Mobile Application (Development)

#### Option A: Web Browser
```bash
cd mobile
npx expo start --web
```
- Opens at **`http://localhost:8081`**.
- Press `F12` to toggle the smartphone device simulator view.

#### Option B: Standalone Release APK on Physical Android Device
A ready-to-install standalone APK has been built and placed at the root of the workspace:
👉 **`./YSF_Kaushalya_LMS_Client_Demo.apk`**

Transfer this `.apk` to any Android phone via WhatsApp, Google Drive, or USB cable, tap to install, and test immediately!

---

## ☁️ 1-Click Render Cloud Deployment

This repository includes a native Render Blueprint (`render.yaml`) and `Dockerfile` for seamless cloud hosting:

1. Push this repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com/):
   - Click **New +** ➔ **Blueprint**.
   - Select your Git repository.
   - Render will detect `render.yaml` and automatically configure the web service with:
     - Runtime: `Node 20`
     - Root Directory: `backend`
     - Build Command: `npm install`
     - Start Command: `node src/server.js`
     - Health Check: `/api/health`
     - Pre-configured `MONGODB_URI` pointing to the live Atlas cluster.
3. Once deployed, Render will provide a live HTTPS URL (e.g., `https://ysf-kaushalya-lms.onrender.com`).
4. Opening the root Render URL automatically loads the Admin Control Center!

---

## ⚙️ In-App Dynamic Cloud Server Switcher

Even after the standalone `.apk` is installed on a client's device, you can point it to your live Render backend in seconds:
1. Open the **Kaushalya LMS** mobile app.
2. On either the **Institute Code Screen** or **Login Screen**, tap the **⚙️ (Settings)** icon in the top right corner.
3. The **Cloud Server Settings** modal will open:
   - View the current active endpoint.
   - Tap **☁️ Render Cloud** or paste your custom Render URL (e.g. `https://ysf-kaushalya-lms.onrender.com/api`).
   - Tap **"Test & Save"**. The app pings `/api/health`, verifies the MongoDB Atlas connection, and stores the endpoint in `AsyncStorage`.
   - The app will now communicate directly with your live Render backend without needing any APK rebuild!

---

## 🔑 Demo Credentials for Testing
- **Institute Code:** `21092`
- **Username / Trainee ID:** `W2307C00001`
- **Password:** `password123`
- *(Or tap the **"1-Tap Demo / Guest Login"** button on the mobile login screen)*

---

## 🗄️ MongoDB Atlas Cloud Details
- **Cluster:** `ysfdatabase.vznhwe9.mongodb.net`
- **Database:** `ysf_kaushalya_lms`
- **Collections:**
  - `lms_state`: Master snapshot synchronized across all sessions
  - `lms_files`: Cloud binary backup for uploaded PDFs, PPTs, and assignment submissions
  - `users`: Trainee registry with 12-digit Aadhaar deduplication
  - `questionBank`: Question Bank repository for 3-mode test builder
  - `tests`: Active and archived MCQ tests
  - `assignments`: Assignments and student submissions
  - `events`: Academic calendar events
  - `notices`: Institutional notice board
  - `queries`: Technical query helpdesk tickets
