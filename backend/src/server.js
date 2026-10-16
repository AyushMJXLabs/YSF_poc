const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const multer = require('multer');
const XLSX = require('xlsx');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback

const {
  getDb,
  saveDb,
  initDatabase,
  syncMongoNow,
  getMongoStatus,
  saveFileToMongo,
  getFileFromMongo
} = require('./data');
const { registerAssessmentRoutes, migrateAssessmentData } = require('./assessments');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5002;
const VALID_INSTITUTE_CODE = process.env.INSTITUTE_CODE || '21092';
const YSF_SUPPORT_PHONE = process.env.YSF_SUPPORT_PHONE || '098810-88850';
const YSF_SUPPORT_EMAIL = process.env.YSF_SUPPORT_EMAIL || 'lmssupport@ysfskills.com';

function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim()) {
    return process.env.PUBLIC_BASE_URL.trim().replace(/\/$/, '');
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${protocol}://${host}`;
}

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage for student assignment file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, uniqueSuffix + '-' + safeName);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB

app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// ==========================================
// ADMIN AUTHENTICATION (signed session cookie)
// ==========================================
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@YSF2026!';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.JWT_SECRET || `ysf_admin_${ADMIN_PASSWORD}`;
const ADMIN_COOKIE = 'ysf_admin_session';
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

if (!process.env.ADMIN_PASSWORD) {
  console.warn('[Admin Auth] ADMIN_PASSWORD not set — using built-in default. Set it in .env for production.');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

function signAdminToken(username) {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + ADMIN_SESSION_TTL_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(payload).digest('base64url');
  if (!safeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() ? data : null;
  } catch (e) {
    return null;
  }
}

function getCookie(req, name) {
  const header = req.headers.cookie || '';
  const match = header.split(';').map(c => c.trim()).find(c => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function getAdminSession(req) {
  return verifyAdminToken(getCookie(req, ADMIN_COOKIE));
}

function setAdminCookie(req, res, value, maxAgeMs) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const parts = [
    `${ADMIN_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

// Basic brute-force protection: 10 failed attempts per IP per 15 minutes
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;

app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (record && now - record.first < LOGIN_WINDOW_MS && record.count >= LOGIN_MAX_FAILURES) {
    return res.status(429).json({ success: false, message: 'Too many failed attempts. Try again in a few minutes.' });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  const userOk = safeEqual(String(username).trim(), ADMIN_USERNAME);
  const passOk = safeEqual(String(password), ADMIN_PASSWORD);
  if (!userOk || !passOk) {
    if (!record || now - record.first >= LOGIN_WINDOW_MS) {
      loginAttempts.set(ip, { first: now, count: 1 });
    } else {
      record.count += 1;
    }
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  loginAttempts.delete(ip);
  setAdminCookie(req, res, signAdminToken(ADMIN_USERNAME), ADMIN_SESSION_TTL_MS);
  return res.json({ success: true, admin: { username: ADMIN_USERNAME } });
});

app.post('/api/admin/logout', (req, res) => {
  setAdminCookie(req, res, '', 0);
  return res.json({ success: true });
});

app.get('/api/admin/session', (req, res) => {
  const session = getAdminSession(req);
  if (!session) return res.status(401).json({ success: false, message: 'Not authenticated' });
  return res.json({ success: true, admin: { username: session.u }, expiresAt: session.exp });
});

// Every other /api/admin/* route requires an authenticated admin session
app.use('/api/admin', (req, res, next) => {
  if (getAdminSession(req)) return next();
  return res.status(401).json({ success: false, message: 'Admin authentication required' });
});

// Dedicated file streaming route with MongoDB Atlas cloud persistence fallback
app.get(['/uploads/:filename', '/api/files/:filename'], async (req, res) => {
  const filename = path.basename(req.params.filename);
  const localPath = path.join(UPLOADS_DIR, filename);

  if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  }

  // Cloud persistence fallback if local container was recycled
  try {
    const fileDoc = await getFileFromMongo(filename);
    if (fileDoc && fileDoc.data) {
      try {
        fs.writeFileSync(localPath, fileDoc.data.buffer || fileDoc.data);
      } catch (cacheErr) {}
      res.setHeader('Content-Type', fileDoc.contentType || 'application/octet-stream');
      return res.send(fileDoc.data.buffer || fileDoc.data);
    }
  } catch (err) {
    console.warn(`[File Fetch] Could not retrieve '${filename}' from cloud:`, err.message);
  }

  return res.status(404).json({ success: false, message: "File not found" });
});

// Static uploads serving
app.use('/uploads', express.static(UPLOADS_DIR));

// Admin panel pages — the console is only served to authenticated admins
app.get('/admin/login', (req, res) => {
  if (getAdminSession(req)) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, '../public/login.html'));
});
app.get(['/admin', '/admin/', '/admin/admin.html'], (req, res) => {
  if (!getAdminSession(req)) return res.redirect('/admin/login');
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// ==========================================
// FILE UPLOAD ENDPOINTS
// ==========================================
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const baseUrl = getBaseUrl(req);

  if (req.file) {
    try {
      const buffer = fs.readFileSync(req.file.path);
      await saveFileToMongo(req.file.filename, req.file.originalname, req.file.mimetype, buffer);
    } catch (saveErr) {
      console.warn('[Upload] Mongo file backup notice:', saveErr.message);
    }

    return res.json({
      success: true,
      file: {
        name: req.file.originalname,
        filename: req.file.filename,
        size: `${(req.file.size / 1024).toFixed(1)} KB`,
        url: `${baseUrl}/api/files/${req.file.filename}`,
        relativeUrl: `/api/files/${req.file.filename}`
      }
    });
  }

  // Handle base64 upload fallback
  const { fileName, fileData, fileType } = req.body;
  if (fileName && fileData) {
    const uniqueName = Date.now() + '-' + fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(UPLOADS_DIR, uniqueName);
    
    // Strip header if data URI
    const base64Data = fileData.replace(/^data:.*,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    try {
      await saveFileToMongo(uniqueName, fileName, fileType || 'application/octet-stream', buffer);
    } catch (saveErr) {
      console.warn('[Upload Base64] Mongo file backup notice:', saveErr.message);
    }

    return res.json({
      success: true,
      file: {
        name: fileName,
        filename: uniqueName,
        size: `${(fileData.length / 1024).toFixed(1)} KB`,
        url: `${baseUrl}/api/files/${uniqueName}`,
        relativeUrl: `/api/files/${uniqueName}`
      }
    });
  }

  return res.status(400).json({ success: false, message: "No file provided" });
});

// ==========================================
// CONFIG & HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongoStatus: getMongoStatus(),
    port: PORT,
    baseUrl: getBaseUrl(req)
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    instituteCode: VALID_INSTITUTE_CODE,
    supportPhone: YSF_SUPPORT_PHONE,
    supportEmail: YSF_SUPPORT_EMAIL,
    appName: "Kaushalya LMS",
    foundation: "Yuvashakti Foundation"
  });
});

// ==========================================
// 1. AUTHENTICATION & VALIDATION API
// ==========================================

// Validate Institute Code (Checks code 21092)
app.post('/api/auth/validate-institute', (req, res) => {
  const { instituteCode } = req.body;
  if (!instituteCode) {
    return res.status(400).json({ success: false, message: "Institute code is required" });
  }

  if (instituteCode.trim() === VALID_INSTITUTE_CODE) {
    return res.json({
      success: true,
      message: "Institute code validated successfully",
      institute: {
        code: VALID_INSTITUTE_CODE,
        name: "Yuvashakti Skill India Pvt. Ltd.",
        tagline: "Education • Empowerment • Employability"
      }
    });
  } else {
    return res.status(401).json({
      success: false,
      message: `Invalid Institute Code. Please enter the valid YSF code (${VALID_INSTITUTE_CODE}).`
    });
  }
});

// Trainee Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }

  const db = getDb();
  const trainee = db.trainees.find(t => t.username === username.trim());

  if (!trainee) {
    return res.status(401).json({ success: false, message: "Invalid username or password" });
  }

  // Case-sensitive password check
  if (trainee.password !== password) {
    return res.status(401).json({ success: false, message: "Invalid username or password" });
  }

  if (trainee.status === "Left") {
    return res.status(403).json({ success: false, message: "Account is marked as Left. Contact YSF Admin." });
  }

  return res.json({
    success: true,
    message: "Login successful",
    token: `ysf_jwt_${Date.now()}_${trainee.id}`,
    trainee: {
      id: trainee.id,
      ysfCode: trainee.ysfCode,
      fullName: trainee.fullName,
      courseName: trainee.courseName,
      schemeName: trainee.schemeName,
      sectorName: trainee.sectorName,
      status: trainee.status,
      avatar: trainee.avatar
    }
  });
});

// Forgot Password Request
app.post('/api/auth/forgot-password', (req, res) => {
  const { username } = req.body;
  return res.json({
    success: true,
    message: `Password reset instructions have been forwarded to YSF Admin for ${username || 'the student'}. Contact ${YSF_SUPPORT_PHONE} for immediate assistance.`
  });
});

// Change Password
app.post('/api/auth/change-password', (req, res) => {
  const { traineeId, oldPassword, newPassword } = req.body;
  const db = getDb();
  const trainee = db.trainees.find(t => t.id === traineeId || t.ysfCode === traineeId);

  if (!trainee) {
    return res.status(404).json({ success: false, message: "Trainee record not found" });
  }

  if (trainee.password !== oldPassword) {
    return res.status(400).json({ success: false, message: "Current password does not match" });
  }

  trainee.password = newPassword;
  saveDb(db);

  return res.json({
    success: true,
    message: "Password changed successfully"
  });
});

// ==========================================
// 2. PROFILE MODULE (READ-ONLY)
// ==========================================
app.get('/api/trainee/profile', (req, res) => {
  const db = getDb();
  const traineeId = req.query.traineeId || "T001";
  const trainee = db.trainees.find(t => t.id === traineeId || t.ysfCode === traineeId) || db.trainees[0];

  return res.json({
    success: true,
    data: {
      traineeInfo: {
        ysfCode: trainee.ysfCode,
        fullName: trainee.fullName,
        schemeName: trainee.schemeName,
        sectorName: trainee.sectorName,
        industryPartner: trainee.industryPartner,
        zoneName: trainee.zoneName,
        locationName: trainee.locationName
      },
      courseInfo: {
        courseName: trainee.courseName,
        jobRoleAssigned: trainee.jobRoleAssigned,
        sectorSkillCouncil: trainee.sectorSkillCouncil,
        nsqLevel: trainee.nsqLevel,
        registrationDate: trainee.registrationDate,
        endDate: trainee.endDate,
        presentOJT: trainee.presentOJT
      },
      otherInfo: {
        nativeAddress: trainee.nativeAddress,
        contact1: trainee.contact1,
        contact2: trainee.contact2,
        email: trainee.email,
        aadharNumber: trainee.aadharNumber
      },
      isReadOnly: true,
      notice: "Profile information is auto-generated; you only need to confirm. External changes handled by YSF admins."
    }
  });
});

// ==========================================
// 3. LEARNING RESOURCES MODULE
// ==========================================
app.get('/api/resources/summary', (req, res) => {
  const db = getDb();
  return res.json({
    success: true,
    data: db.learningResources.summary
  });
});

app.get('/api/resources/hierarchy', (req, res) => {
  const db = getDb();
  return res.json({
    success: true,
    data: db.learningResources.hierarchy
  });
});

// Secure viewer endpoint (strictly prevents downloading)
app.get('/api/resources/view/:topicId', (req, res) => {
  const { topicId } = req.params;
  const db = getDb();
  let foundTopic = null;

  for (const h of db.learningResources.hierarchy) {
    const t = h.topics.find(top => top.id === topicId);
    if (t) {
      foundTopic = t;
      break;
    }
  }

  if (!foundTopic) {
    return res.status(404).json({ success: false, message: "Resource not found" });
  }

  // Prevent browser from triggering download
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');

  return res.json({
    success: true,
    data: foundTopic,
    downloadAllowed: false
  });
});

// ADMIN: Add Resource Topic
app.post('/api/admin/resources/topic', (req, res) => {
  const {
    scheme = "NEEM / Skill India",
    sector = "Automotive",
    course = "Diploma in Automotive Manufacturing Technology",
    subject = "Workplace Safety & Standards",
    chapter = "General Training",
    title,
    description,
    fileType = "PDF",
    fileName,
    fileUrl,
    fileSize,
    contentSummary
  } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: "Topic title is required" });
  }

  const db = getDb();
  let chapterItem = db.learningResources.hierarchy.find(
    h => h.chapter.toLowerCase() === chapter.toLowerCase() && h.course === course
  );

  const newTopicId = `TOP-${Date.now().toString().slice(-4)}`;
  const newTopic = {
    id: newTopicId,
    title,
    description: description || title,
    fileType: fileType.toUpperCase(),
    fileName: fileName || `${title.toLowerCase().replace(/\s+/g, '_')}.${fileType.toLowerCase() === 'video' ? 'mp4' : fileType.toLowerCase() === 'ppt' ? 'pptx' : 'pdf'}`,
    fileUrl: fileUrl || (fileName ? `/uploads/${fileName}` : undefined),
    fileSize: fileSize || "1.5 MB",
    contentSummary: contentSummary || "Content uploaded and verified by YSF LMS Admin.",
    slides: [
      { slideNo: 1, title: title, text: contentSummary || description || "Content provided by YSF Admin." },
      { slideNo: 2, title: "Operational Guidelines", text: "Ensure strict adherence to plant safety and operational protocols." }
    ],
    videoDuration: fileType.toUpperCase() === 'VIDEO' ? "12:30" : undefined,
    readStatus: false
  };

  if (chapterItem) {
    chapterItem.topics.push(newTopic);
    chapterItem.topicsCount = chapterItem.topics.length;
  } else {
    chapterItem = {
      scheme,
      sector,
      course,
      subject,
      chapter,
      topicsCount: 1,
      topics: [newTopic]
    };
    db.learningResources.hierarchy.push(chapterItem);
  }

  // Update summary table unread and monthly counts
  const sumRow = db.learningResources.summary.find(s => s.course === course);
  if (sumRow) {
    sumRow.unread += 1;
    sumRow.monthly += 1;
    sumRow.yearly += 1;
  }

  saveDb(db);
  return res.json({ success: true, message: "Resource topic created successfully", data: newTopic });
});

// ADMIN: Delete Resource Topic
app.delete('/api/admin/resources/topic/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  let deleted = false;

  db.learningResources.hierarchy.forEach(chap => {
    const idx = chap.topics.findIndex(t => t.id === id);
    if (idx !== -1) {
      chap.topics.splice(idx, 1);
      chap.topicsCount = chap.topics.length;
      deleted = true;
    }
  });

  // Remove empty chapters
  db.learningResources.hierarchy = db.learningResources.hierarchy.filter(chap => chap.topics.length > 0);

  if (deleted) {
    saveDb(db);
    return res.json({ success: true, message: "Resource topic deleted successfully" });
  }
  return res.status(404).json({ success: false, message: "Resource topic not found" });
});

// ==========================================
// 4-5. ASSIGNMENT & TEST MODULES (see src/assessments.js)
// ==========================================
const assessments = registerAssessmentRoutes(app, {
  getDb, saveDb, upload, getBaseUrl, UPLOADS_DIR, saveFileToMongo, getFileFromMongo
});

// ==========================================
// 6. EVENTS & NOTICES
// ==========================================
app.get('/api/events', (req, res) => {
  const db = getDb();
  return res.json({ success: true, data: db.events });
});

app.post('/api/admin/events', (req, res) => {
  const { title, date, type = "Academic Event", time = "10:00 AM", location = "Campus", description = "" } = req.body;
  if (!title || !date) {
    return res.status(400).json({ success: false, message: "Event title and date are required" });
  }

  const db = getDb();
  const newEvent = {
    id: `EVT-${Date.now().toString().slice(-4)}`,
    title,
    date, // YYYY-MM-DD
    type,
    time,
    location,
    description: description || title
  };

  db.events.push(newEvent);
  saveDb(db);

  return res.json({ success: true, message: "Event scheduled successfully", data: newEvent });
});

app.delete('/api/admin/events/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.events.findIndex(e => e.id === id);

  if (idx !== -1) {
    db.events.splice(idx, 1);
    saveDb(db);
    return res.json({ success: true, message: "Event removed successfully" });
  }
  return res.status(404).json({ success: false, message: "Event not found" });
});

app.get('/api/notices', (req, res) => {
  const db = getDb();
  return res.json({ success: true, data: db.notices });
});

app.post('/api/admin/notices', (req, res) => {
  const { title, content, priority = "normal", starColor = "green" } = req.body;
  if (!title || !content) {
    return res.status(400).json({ success: false, message: "Notice title and content are required" });
  }

  const db = getDb();
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  const fullDateFormatted = today.toISOString().split('T')[0];

  const newNotice = {
    id: `NOT-${Date.now().toString().slice(-4)}`,
    title,
    date: dateFormatted,
    fullDate: fullDateFormatted,
    priority,
    starColor: starColor === "red" ? "red" : "green",
    content
  };

  db.notices.unshift(newNotice);
  saveDb(db);

  return res.json({ success: true, message: "Notice published successfully", data: newNotice });
});

app.delete('/api/admin/notices/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const idx = db.notices.findIndex(n => n.id === id);

  if (idx !== -1) {
    db.notices.splice(idx, 1);
    saveDb(db);
    return res.json({ success: true, message: "Notice deleted successfully" });
  }
  return res.status(404).json({ success: false, message: "Notice not found" });
});

// ==========================================
// 7. SCREEN TIME TELEMETRY & ANALYTICS
// ==========================================
app.post('/api/analytics/screentime', (req, res) => {
  const { traineeId, traineeName, module, durationSeconds } = req.body;
  const db = getDb();

  const log = {
    id: `STL-${Date.now().toString().slice(-4)}`,
    traineeId: traineeId || "T001",
    traineeName: traineeName || "KUMARI K",
    module: module || "General App",
    durationSeconds: parseInt(durationSeconds) || 0,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  db.screenTimeLogs.unshift(log);
  if (db.screenTimeLogs.length > 100) {
    db.screenTimeLogs.pop();
  }
  saveDb(db);

  return res.json({
    success: true,
    message: "Screen time recorded successfully",
    data: log
  });
});

// ==========================================
// 8. ADMIN OVERVIEW & CONTROLS
// ==========================================
app.get('/api/admin/overview', (req, res) => {
  const db = getDb();
  return res.json({
    ...db,
    mongoStatus: getMongoStatus(),
    baseUrl: getBaseUrl(req)
  });
});

app.post('/api/admin/mongo/sync', async (req, res) => {
  try {
    const status = await syncMongoNow();
    return res.json({ success: true, mongoStatus: status });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, mongoStatus: getMongoStatus() });
  }
});

app.post('/api/admin/trainees/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDb();
  const trainee = db.trainees.find(t => t.id === id);

  if (!trainee) {
    return res.status(404).json({ success: false, message: "Trainee not found" });
  }

  trainee.status = status;
  saveDb(db);

  return res.json({ success: true, message: "Status updated successfully", trainee });
});

app.post('/api/admin/trainees', (req, res) => {
  const db = getDb();
  const { ysfCode, fullName, email, courseName, industryPartner, zoneName, locationName, presentOJT, jobRoleAssigned } = req.body;
  const newTrainee = {
    id: `T${String(db.trainees.length + 1).padStart(3, '0')}`,
    ysfCode: ysfCode || `W2307C${String(db.trainees.length + 1).padStart(5, '0')}`,
    username: ysfCode || `W2307C${String(db.trainees.length + 1).padStart(5, '0')}`,
    password: "password123",
    fullName: fullName || "New Trainee",
    schemeName: "NEEM / National Apprenticeship Scheme",
    sectorName: "Automotive Manufacturing",
    industryPartner: industryPartner || "Tata Motors Ltd.",
    zoneName: zoneName || "West Zone - Maharashtra",
    locationName: locationName || "Pune - Chakan Industrial Area",
    courseName: courseName || "Diploma in Automotive Manufacturing Technology",
    jobRoleAssigned: jobRoleAssigned || "Production Technician - Prod",
    sectorSkillCouncil: "1301 - ASDC",
    nsqLevel: "4",
    registrationDate: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
    endDate: "2026/02/28",
    presentOJT: presentOJT || "Active",
    nativeAddress: "Maharashtra, India",
    contact1: "+91 98810 88850",
    contact2: "",
    email: email || "student@ysfskills.com",
    aadharNumber: "XXXX-XXXX-1234",
    status: "Active",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80"
  };
  db.trainees.push(newTrainee);
  saveDb(db);
  return res.json({ success: true, message: "Trainee registered successfully", trainee: newTrainee });
});

app.post('/api/admin/trainees/bulk-status', (req, res) => {
  const { traineeIds, status, endDate, remarks } = req.body;
  const db = getDb();
  if (!Array.isArray(traineeIds) || traineeIds.length === 0) {
    return res.status(400).json({ success: false, message: "No trainees selected for status update" });
  }

  const updatedTrainees = [];
  db.trainees.forEach(t => {
    if (traineeIds.includes(t.id) || traineeIds.includes(t.ysfCode)) {
      t.status = status || t.status;
      if (status === 'Left') {
        t.presentOJT = 'Inactive';
      } else if (status === 'Active') {
        t.presentOJT = 'Active';
      } else if (status === 'Completed') {
        t.presentOJT = 'Graduated';
      }
      if (endDate) t.endDate = endDate;
      updatedTrainees.push(t);
    }
  });

  if (!db.batchStatusHistory) db.batchStatusHistory = [];
  db.batchStatusHistory.unshift({
    id: `BSH-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    updatedBy: "Admin",
    traineesCount: updatedTrainees.length,
    status: status,
    remarks: remarks || `Batch status updated to ${status}`
  });

  saveDb(db);
  return res.json({ success: true, message: `Successfully updated ${updatedTrainees.length} trainee(s) to ${status}`, updatedTrainees });
});

// Master Forms CRUD
app.get('/api/admin/masters/:type', (req, res) => {
  const { type } = req.params;
  const db = getDb();
  const list = (db.masterForms && db.masterForms[type]) || [];
  return res.json({ success: true, data: list });
});

app.post('/api/admin/masters/:type', (req, res) => {
  const { type } = req.params;
  const db = getDb();
  if (!db.masterForms) db.masterForms = {};
  if (!db.masterForms[type]) db.masterForms[type] = [];

  const newItem = {
    id: `${type.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
    status: "Active",
    ...req.body
  };

  db.masterForms[type].push(newItem);
  saveDb(db);
  return res.json({ success: true, message: `${type} master entry added successfully`, data: newItem });
});

app.delete('/api/admin/masters/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const db = getDb();
  if (!db.masterForms || !db.masterForms[type]) {
    return res.status(404).json({ success: false, message: "Master category not found" });
  }

  const initialLen = db.masterForms[type].length;
  db.masterForms[type] = db.masterForms[type].filter(item => item.id !== id);
  if (db.masterForms[type].length === initialLen) {
    return res.status(404).json({ success: false, message: "Entry not found" });
  }

  saveDb(db);
  return res.json({ success: true, message: "Master entry deleted successfully" });
});

// Institutional CMS
app.get('/api/admin/cms/:page', (req, res) => {
  const { page } = req.params;
  const db = getDb();
  const data = (db.cms && db.cms[page]) || null;
  if (!data) return res.status(404).json({ success: false, message: "CMS page not found" });
  return res.json({ success: true, data });
});

app.post('/api/admin/cms/:page', (req, res) => {
  const { page } = req.params;
  const db = getDb();
  if (!db.cms) db.cms = {};
  db.cms[page] = {
    ...db.cms[page],
    ...req.body,
    updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
  saveDb(db);
  return res.json({ success: true, message: `${page} page updated successfully`, data: db.cms[page] });
});

// ==========================================
// 9. QUESTION BANK MANAGEMENT & RANDOMIZER
// ==========================================

// Get Question Bank with course/module metadata
app.get('/api/admin/question-bank', (req, res) => {
  const db = getDb();
  const bank = db.questionBank || [];
  const { course, module: mod, difficulty, search } = req.query;

  let filtered = [...bank];
  if (course && course !== 'all') {
    filtered = filtered.filter(q => (q.course || '').toLowerCase() === course.toLowerCase());
  }
  if (mod && mod !== 'all') {
    filtered = filtered.filter(q => (q.module || '').toLowerCase() === mod.toLowerCase());
  }
  if (difficulty && difficulty !== 'all') {
    filtered = filtered.filter(q => (q.difficulty || '').toLowerCase() === difficulty.toLowerCase());
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(q =>
      (q.question || '').toLowerCase().includes(s) ||
      (q.topic || '').toLowerCase().includes(s) ||
      (q.module || '').toLowerCase().includes(s)
    );
  }

  const courses = [...new Set(bank.map(q => q.course).filter(Boolean))];
  const modules = [...new Set(bank.map(q => q.module).filter(Boolean))];
  const topics = [...new Set(bank.map(q => q.topic).filter(Boolean))];

  return res.json({
    success: true,
    total: bank.length,
    count: filtered.length,
    courses,
    modules,
    topics,
    questions: filtered
  });
});

// Download Question Bank Excel Template
app.get('/api/admin/question-bank/template', (req, res) => {
  try {
    const wb = XLSX.utils.book_new();
    const headers = [
      'Course',
      'Module',
      'Topic',
      'Question',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Correct Option (A/B/C/D or 1-4)',
      'Marks',
      'Difficulty'
    ];
    const sampleRows = [
      [
        'Automotive Manufacturing',
        'Safety',
        'Workplace Standards',
        'What is the mandatory foot protection required on manufacturing shopfloors?',
        'Canvas sneakers',
        'Steel-toed safety shoes',
        'Rubber flip-flops',
        'Standard sports shoes',
        'B',
        2,
        'Easy'
      ],
      [
        'Automotive Manufacturing',
        'Quality',
        'Precision Measurement',
        'Which instrument provides precision measurement for internal cylinder bore diameters?',
        'Steel tape rule',
        'Inside micrometer with bore gauge',
        'Vernier height gauge',
        'Feeler gauge strip',
        'B',
        3,
        'Medium'
      ],
      [
        'Welding Technology',
        'Welding',
        'TIG & Shielding Gas',
        'Which inert shielding gas is most widely used in GTAW / TIG welding of aluminum?',
        'Carbon Dioxide (CO2)',
        '100% Pure Argon',
        'Hydrogen and Nitrogen mix',
        'Compressed plant air',
        'B',
        2,
        'Hard'
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 22 }, { wch: 50 },
      { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 },
      { wch: 28 }, { wch: 8 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'QuestionBankTemplate');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="YSF_Question_Bank_Template.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Question Bank template error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate template' });
  }
});

// Bulk Upload Question Bank (.xlsx / .csv)
app.post('/api/admin/question-bank/bulk-upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No spreadsheet file uploaded' });
  }
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Spreadsheet contains no data rows' });
    }

    const db = getDb();
    if (!db.questionBank) db.questionBank = [];

    let addedCount = 0;
    let updatedCount = 0;

    rows.forEach(row => {
      const course = String(row['Course'] || row['course'] || 'Automotive Manufacturing').trim();
      const mod = String(row['Module'] || row['module'] || 'Safety').trim();
      const topic = String(row['Topic'] || row['topic'] || 'General').trim();
      const questionText = String(row['Question'] || row['question'] || '').trim();
      if (!questionText) return;

      const optA = String(row['Option A'] || row['optionA'] || row['A'] || row['optA'] || '').trim();
      const optB = String(row['Option B'] || row['optionB'] || row['B'] || row['optB'] || '').trim();
      const optC = String(row['Option C'] || row['optionC'] || row['C'] || row['optC'] || '').trim();
      const optD = String(row['Option D'] || row['optionD'] || row['D'] || row['optD'] || '').trim();

      const rawCorrect = String(row['Correct Option (A/B/C/D or 1-4)'] || row['Correct Option'] || row['correctOption'] || row['Answer'] || 'A').trim().toUpperCase();
      let correctIndex = 0;
      if (rawCorrect === 'B' || rawCorrect === '2') correctIndex = 1;
      else if (rawCorrect === 'C' || rawCorrect === '3') correctIndex = 2;
      else if (rawCorrect === 'D' || rawCorrect === '4') correctIndex = 3;

      const marks = parseFloat(row['Marks'] || row['marks'] || 2) || 2;
      const difficulty = String(row['Difficulty'] || row['difficulty'] || 'Medium').trim();

      // Deduplication: match case-insensitively on question + module + course
      const matchKey = (q, m, c) => `${(q || '').toLowerCase().trim()}|${(m || '').toLowerCase().trim()}|${(c || '').toLowerCase().trim()}`;
      const existingIdx = db.questionBank.findIndex(q => matchKey(q.question, q.module, q.course) === matchKey(questionText, mod, course));

      if (existingIdx >= 0) {
        db.questionBank[existingIdx].options = [optA, optB, optC, optD];
        db.questionBank[existingIdx].correctIndex = correctIndex;
        db.questionBank[existingIdx].marks = marks;
        db.questionBank[existingIdx].difficulty = difficulty;
        db.questionBank[existingIdx].topic = topic;
        updatedCount++;
      } else {
        db.questionBank.push({
          id: `QB-${String(db.questionBank.length + 1).padStart(3, '0')}`,
          course,
          module: mod,
          topic,
          difficulty,
          question: questionText,
          options: [optA, optB, optC, optD],
          correctIndex,
          marks,
          createdAt: new Date().toISOString().slice(0, 10)
        });
        addedCount++;
      }
    });

    saveDb(db);
    return res.json({
      success: true,
      message: `Question Bank synchronized: ${addedCount} added, ${updatedCount} updated.`,
      addedCount,
      updatedCount,
      totalBankSize: db.questionBank.length,
      questions: db.questionBank
    });
  } catch (err) {
    console.error('Question Bank bulk upload error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process spreadsheet: ' + err.message });
  }
});

// Randomize Questions from Bank
app.post('/api/admin/question-bank/randomize', (req, res) => {
  const db = getDb();
  const bank = db.questionBank || [];
  const { course, module: mod, count, difficulty } = req.body;
  const targetCount = parseInt(count) || 5;

  let filtered = [...bank];
  if (course && course !== 'all') {
    filtered = filtered.filter(q => (q.course || '').toLowerCase() === course.toLowerCase());
  }
  if (mod && mod !== 'all') {
    filtered = filtered.filter(q => (q.module || '').toLowerCase() === mod.toLowerCase());
  }
  if (difficulty && difficulty !== 'all') {
    filtered = filtered.filter(q => (q.difficulty || '').toLowerCase() === difficulty.toLowerCase());
  }

  if (filtered.length === 0) {
    filtered = [...bank];
  }

  // Fisher-Yates shuffle
  const shuffled = [...filtered];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, targetCount);
  return res.json({
    success: true,
    count: selected.length,
    totalAvailable: filtered.length,
    questions: selected
  });
});

// Manual Add Single Question to Bank
app.post('/api/admin/question-bank', (req, res) => {
  const db = getDb();
  if (!db.questionBank) db.questionBank = [];
  const { course, module: mod, topic, difficulty, question, options, correctIndex, marks } = req.body;

  if (!question || !options || options.length < 2) {
    return res.status(400).json({ success: false, message: 'Question text and at least 2 options are required' });
  }

  const newQ = {
    id: `QB-${String(db.questionBank.length + 1).padStart(3, '0')}`,
    course: course || 'Automotive Manufacturing',
    module: mod || 'General',
    topic: topic || 'Workplace Standards',
    difficulty: difficulty || 'Medium',
    question,
    options,
    correctIndex: parseInt(correctIndex) || 0,
    marks: parseFloat(marks) || 2,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  db.questionBank.push(newQ);
  saveDb(db);
  return res.json({ success: true, message: 'Question saved to bank', question: newQ });
});

// Delete Question from Bank
app.delete('/api/admin/question-bank/:id', (req, res) => {
  const { id } = req.params;
  const db = getDb();
  if (!db.questionBank) db.questionBank = [];
  const initialLen = db.questionBank.length;
  db.questionBank = db.questionBank.filter(q => q.id !== id);
  if (db.questionBank.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }
  saveDb(db);
  return res.json({ success: true, message: 'Question deleted from bank' });
});

// ==========================================
// 10. MASS TRAINEE INGESTION & AADHAAR UPSERT
// ==========================================

const generateTraineeExcelTemplate = (req, res) => {
  try {
    const wb = XLSX.utils.book_new();
    const headers = [
      'Aadhar Number',
      'Trainee ID',
      'Full Name',
      'Mobile',
      'Email',
      'Course',
      'Batch',
      'Company / OJT Site',
      'Trade',
      'Status',
      'Password (Optional)'
    ];
    const sampleRows = [
      [
        '429810238921',
        'W2307C00001',
        'KUMARI K',
        '+91 98810 88850',
        'kumari.k@student.ysfskills.com',
        'Diploma in Automotive Manufacturing Technology',
        'Batch 2023-25',
        'Tata Motors Ltd. / Bharat Forge',
        'Production Technician - Prod',
        'Active',
        'password123'
      ],
      [
        '891234564512',
        'W2307C00002',
        'RAHUL SHINDE',
        '+91 98221 44332',
        'rahul.s@student.ysfskills.com',
        'Diploma in Automotive Manufacturing Technology',
        'Batch 2023-25',
        'Mahindra & Mahindra',
        'Assembly Line Operator',
        'In OJT',
        'password123'
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [
      { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 16 },
      { wch: 28 }, { wch: 38 }, { wch: 16 }, { wch: 28 },
      { wch: 25 }, { wch: 12 }, { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'TraineesUploadTemplate');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="YSF_Trainee_Bulk_Upload_Template.xlsx"');
    return res.send(buffer);
  } catch (err) {
    console.error('Trainee template generation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate template' });
  }
};

app.get('/api/admin/users/template', generateTraineeExcelTemplate);
app.get('/api/admin/trainees/template', generateTraineeExcelTemplate);

const handleTraineeBulkUpload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No spreadsheet file provided' });
  }
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Spreadsheet contains no rows' });
    }

    const db = getDb();
    if (!db.trainees) db.trainees = [];
    if (!db.attendance) db.attendance = {};

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const summaryDetails = [];

    rows.forEach((row, i) => {
      const rawAadhar = String(row['Aadhar Number'] || row['Aadhaar Number'] || row['Aadhaar'] || row['aadhar'] || '').replace(/[^0-9]/g, '');
      const traineeId = String(row['Trainee ID'] || row['TraineeId'] || row['YSF Code'] || row['username'] || '').trim();
      const fullName = String(row['Full Name'] || row['Name'] || row['fullName'] || '').trim();
      const mobile = String(row['Mobile'] || row['Phone'] || row['Contact'] || '').trim();
      const email = String(row['Email'] || '').trim();
      const course = String(row['Course'] || 'Diploma in Automotive Manufacturing Technology').trim();
      const batch = String(row['Batch'] || 'Batch 2023-25').trim();
      const company = String(row['Company / OJT Site'] || row['Company'] || 'Tata Motors Ltd.').trim();
      const trade = String(row['Trade'] || row['Job Role'] || 'Production Technician').trim();
      const status = String(row['Status'] || 'Active').trim();
      const password = String(row['Password (Optional)'] || 'ysf123').trim();

      if (!fullName && !rawAadhar && !traineeId) {
        skippedCount++;
        return;
      }

      // Deduplication: Match by Aadhaar first, then by traineeId / username
      let existingTrainee = null;
      if (rawAadhar && rawAadhar.length === 12) {
        existingTrainee = db.trainees.find(t => (t.aadharNumber || '').replace(/[^0-9]/g, '') === rawAadhar);
      }
      if (!existingTrainee && traineeId) {
        existingTrainee = db.trainees.find(t => t.id === traineeId || t.ysfCode === traineeId || t.username === traineeId);
      }

      if (existingTrainee) {
        // Update existing record (Upsert)
        existingTrainee.fullName = fullName || existingTrainee.fullName;
        existingTrainee.status = status || existingTrainee.status;
        existingTrainee.enrollmentStatus = status || existingTrainee.enrollmentStatus;
        existingTrainee.courseName = course || existingTrainee.courseName;
        existingTrainee.batch = batch || existingTrainee.batch;
        existingTrainee.industryPartner = company || existingTrainee.industryPartner;
        existingTrainee.trade = trade || existingTrainee.trade;
        existingTrainee.jobRoleAssigned = trade || existingTrainee.jobRoleAssigned;
        if (mobile) {
          existingTrainee.contact1 = mobile;
          existingTrainee.mobile = mobile;
        }
        if (email) existingTrainee.email = email;
        if (rawAadhar && rawAadhar.length === 12) existingTrainee.aadharNumber = rawAadhar;
        existingTrainee.updatedAt = new Date().toISOString();

        // Ensure attendance record exists
        if (!db.attendance[existingTrainee.id]) {
          db.attendance[existingTrainee.id] = {
            traineeId: existingTrainee.id,
            ysfCode: existingTrainee.ysfCode,
            traineeName: existingTrainee.fullName,
            presentDays: 20,
            absentDays: 2,
            completedHours: 160,
            targetHours: 240,
            percentage: 66.7,
            updatedAt: new Date().toISOString()
          };
        }

        updatedCount++;
        summaryDetails.push({
          type: 'UPDATED',
          ysfCode: existingTrainee.ysfCode,
          name: existingTrainee.fullName,
          status: existingTrainee.status,
          aadhar: rawAadhar ? `XXXX-XXXX-${rawAadhar.slice(-4)}` : 'Matched by ID'
        });
      } else {
        // Create new trainee
        const newId = `T${String(db.trainees.length + 1).padStart(3, '0')}`;
        const newYsfCode = traineeId || `W2307C${String(db.trainees.length + 1).padStart(5, '0')}`;

        const newTrainee = {
          id: newId,
          ysfCode: newYsfCode,
          username: newYsfCode,
          password: password || 'ysf123',
          fullName: fullName || 'New Trainee',
          schemeName: 'NEEM / National Apprenticeship Scheme',
          sectorName: 'Automotive Manufacturing',
          industryPartner: company,
          zoneName: 'West Zone - Maharashtra',
          locationName: 'Pune - Chakan Industrial Area',
          courseName: course,
          batch,
          trade,
          jobRoleAssigned: trade,
          sectorSkillCouncil: '1301 - ASDC',
          nsqLevel: '4',
          registrationDate: new Date().toISOString().slice(0, 10).replace(/-/g, '/'),
          endDate: '2026/02/28',
          presentOJT: (status === 'Active' || status === 'In OJT') ? 'Active' : 'Inactive',
          nativeAddress: 'Maharashtra, India',
          contact1: mobile || '+91 98810 88850',
          contact2: '',
          mobile: mobile || '+91 98810 88850',
          email: email || `${newYsfCode.toLowerCase()}@student.ysfskills.com`,
          aadharNumber: rawAadhar || '429810238921',
          status: status || 'Active',
          enrollmentStatus: status || 'Active',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=80',
          updatedAt: new Date().toISOString()
        };

        db.trainees.push(newTrainee);

        db.attendance[newId] = {
          traineeId: newId,
          ysfCode: newYsfCode,
          traineeName: newTrainee.fullName,
          presentDays: 0,
          absentDays: 0,
          completedHours: 0,
          targetHours: 240,
          percentage: 0,
          updatedAt: new Date().toISOString()
        };

        insertedCount++;
        summaryDetails.push({
          type: 'INSERTED',
          ysfCode: newYsfCode,
          name: newTrainee.fullName,
          status: newTrainee.status,
          aadhar: rawAadhar ? `XXXX-XXXX-${rawAadhar.slice(-4)}` : 'Generated'
        });
      }
    });

    db.users = db.trainees;
    saveDb(db);

    return res.json({
      success: true,
      message: `Trainee ingestion complete: ${insertedCount} new enrolled, ${updatedCount} updated, ${skippedCount} skipped.`,
      insertedCount,
      updatedCount,
      skippedCount,
      totalTrainees: db.trainees.length,
      summaryDetails
    });
  } catch (err) {
    console.error('Trainee bulk upload error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process trainee spreadsheet: ' + err.message });
  }
};

app.post('/api/admin/users/bulk-upload', upload.single('file'), handleTraineeBulkUpload);
app.post('/api/admin/trainees/bulk-upload', upload.single('file'), handleTraineeBulkUpload);

// ==========================================
// 11. OJT ATTENDANCE & HOURS MANAGEMENT
// ==========================================

app.get('/api/admin/attendance', (req, res) => {
  const db = getDb();
  return res.json({ success: true, attendance: db.attendance || {} });
});

app.post('/api/admin/attendance/update', (req, res) => {
  const traineeId = req.body.traineeId || req.body.ysfCode;
  const { presentDays, absentDays, completedHours, targetHours } = req.body;
  if (!traineeId) {
    return res.status(400).json({ success: false, message: 'traineeId or ysfCode is required' });
  }

  const db = getDb();
  if (!db.attendance) db.attendance = {};

  const trainee = db.trainees.find(t => t.id === traineeId || t.ysfCode === traineeId);
  const name = trainee ? trainee.fullName : (db.attendance[traineeId]?.traineeName || 'Trainee');
  const ysfCode = trainee ? trainee.ysfCode : traineeId;
  const idKey = trainee ? trainee.id : traineeId;

  const pDays = parseInt(presentDays) || 0;
  const aDays = parseInt(absentDays) || 0;
  const cHours = parseFloat(completedHours) || 0;
  const tHours = parseFloat(targetHours) || 180;
  const totalDays = pDays + aDays;
  const percentage = totalDays > 0 ? parseFloat(((pDays / totalDays) * 100).toFixed(1)) : 100.0;

  const recordObj = {
    traineeId: idKey,
    ysfCode,
    traineeName: name,
    presentDays: pDays,
    absentDays: aDays,
    completedHours: cHours,
    targetHours: tHours,
    percentage,
    updatedAt: new Date().toISOString()
  };

  db.attendance[idKey] = recordObj;
  db.attendance[ysfCode] = recordObj;

  saveDb(db);
  return res.json({
    success: true,
    message: `Attendance updated for ${name}`,
    record: recordObj,
    data: recordObj
  });
});

app.get('/api/trainee/attendance', (req, res) => {
  const traineeId = req.query.traineeId || req.query.ysfCode || 'T001';
  const db = getDb();
  let record = null;
  if (db.attendance) {
    if (db.attendance[traineeId]) {
      record = db.attendance[traineeId];
    } else {
      record = Object.values(db.attendance).find(a => a.ysfCode === traineeId || a.traineeId === traineeId);
    }
  }
  if (!record) {
    record = {
      traineeId,
      ysfCode: req.query.ysfCode || 'W2307C00001',
      traineeName: 'KUMARI K',
      presentDays: 24,
      absentDays: 1,
      completedHours: 172,
      targetHours: 180,
      percentage: 96.0,
      updatedAt: new Date().toISOString()
    };
  }
  return res.json({ success: true, record, data: record });
});

// ==========================================
// 12. TECHNICAL QUERIES / HELPDESK TICKETS
// ==========================================

app.get('/api/admin/queries', (req, res) => {
  const db = getDb();
  return res.json({ success: true, queries: db.queries || [] });
});

app.post('/api/admin/queries/reply', (req, res) => {
  const { queryId, reply, status } = req.body;
  if (!queryId || !reply) {
    return res.status(400).json({ success: false, message: 'queryId and reply are required' });
  }

  const db = getDb();
  if (!db.queries) db.queries = [];
  const q = db.queries.find(item => item.id === queryId);
  if (!q) {
    return res.status(404).json({ success: false, message: 'Query ticket not found' });
  }

  q.reply = reply;
  q.status = status || 'Replied';
  q.repliedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
  q.repliedBy = 'YSF LMS Technical Support Desk';

  saveDb(db);
  return res.json({ success: true, message: 'Reply sent successfully to trainee', query: q, data: q });
});

// Public / Mobile queries routes
app.get('/api/queries', (req, res) => {
  const db = getDb();
  const traineeFilter = req.query.traineeId || req.query.ysfCode;
  const queries = traineeFilter
    ? (db.queries || []).filter(q => q.traineeId === traineeFilter || q.ysfCode === traineeFilter)
    : (db.queries || []);
  return res.json({ success: true, count: queries.length, queries, data: queries });
});

app.post('/api/queries', (req, res) => {
  const { course, module: mod, topic, subject, description, message, category, traineeId, traineeName, ysfCode } = req.body;
  const db = getDb();
  if (!db.queries) db.queries = [];

  const newTicket = {
    id: `TKT-${Date.now().toString().slice(-4)}`,
    traineeId: traineeId || 'T001',
    traineeName: traineeName || 'KUMARI K',
    ysfCode: ysfCode || 'W2307C00001',
    course: course || 'Diploma in Automotive Manufacturing Technology',
    module: mod || 'General',
    topic: topic || 'Workplace Query',
    category: category || 'Academic',
    subject: subject || 'Technical Assistance',
    description: description || message || '',
    message: message || description || '',
    status: 'Open',
    reply: null,
    repliedAt: null,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };

  db.queries.unshift(newTicket);
  saveDb(db);
  return res.json({ success: true, message: 'Ticket submitted successfully to YSF Admin', query: newTicket, data: newTicket });
});

// ==========================================
// 14. INSTITUTIONAL CMS PUBLIC API
// ==========================================

app.get('/api/cms', (req, res) => {
  const db = getDb();
  return res.json({ success: true, data: db.cms || {} });
});

// ==========================================
// 15. UNIFIED LIVE SYNC ENDPOINT (MOBILE & ADMIN)
// ==========================================

app.get('/api/sync', (req, res) => {
  const db = getDb();
  const traineeId = req.query.traineeId || 'T001';
  const trainee = db.trainees.find(t => t.id === traineeId || t.ysfCode === traineeId) || db.trainees[0];
  const attendance = (db.attendance && db.attendance[trainee.id]) || {
    traineeId: trainee.id,
    ysfCode: trainee.ysfCode,
    traineeName: trainee.fullName,
    presentDays: 24,
    absentDays: 2,
    completedHours: 192,
    targetHours: 240,
    percentage: 80.0
  };

  return res.json({
    success: true,
    instituteCode: VALID_INSTITUTE_CODE,
    mongoStatus: getMongoStatus(),
    baseUrl: getBaseUrl(req),
    trainee: {
      id: trainee.id,
      ysfCode: trainee.ysfCode,
      fullName: trainee.fullName,
      courseName: trainee.courseName,
      status: trainee.status,
      enrollmentStatus: trainee.enrollmentStatus || trainee.status,
      presentOJT: trainee.presentOJT,
      aadharNumber: trainee.aadharNumber ? `XXXX-XXXX-${trainee.aadharNumber.replace(/[^0-9]/g, '').slice(-4)}` : 'Verified',
      avatar: trainee.avatar
    },
    attendance,
    resourcesSummary: db.learningResources.summary,
    resourcesHierarchy: db.learningResources.hierarchy,
    assignments: (db.assignments || []).filter(a => assessments.visibleToTrainee(a, trainee)).map(a => assessments.assignmentForTrainee(a, trainee)),
    selfAssignments: (db.selfAssignments || []).filter(s => s.traineeId === trainee.id),
    tests: (db.tests || []).filter(t => assessments.visibleToTrainee(t, trainee)).map(t => assessments.testForTrainee(t, trainee, { withQuestions: false })),
    events: db.events,
    notices: db.notices,
    cms: db.cms,
    queries: (db.queries || []).filter(q => q.traineeId === trainee.id),
    timestamp: new Date().toISOString()
  });
});

// Start server with MongoDB Atlas cloud initialization
(async () => {
  try {
    await initDatabase();
  } catch (err) {
    console.warn('[Startup] MongoDB Atlas initialization warning:', err.message);
  }

  const db = getDb();
  if (migrateAssessmentData(db)) {
    saveDb(db);
    console.log('[Startup] Assignment & test records migrated to the per-trainee format.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    const status = getMongoStatus();
    console.log(`=================================================`);
    console.log(`YSF Kaushalya LMS Backend Server running on port ${PORT}`);
    console.log(`Admin Portal: http://localhost:${PORT}/admin`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
    console.log(`Uploads Dir:  http://localhost:${PORT}/uploads`);
    console.log(`MongoDB:      ${status.connected ? `Connected (${status.cluster}/${status.dbName})` : 'Local Fallback'}`);
    console.log(`=================================================`);
  });
})();
