// ==========================================
// LEARNING RESOURCES · PROFILE · USER MASTER · REPORTS · DASHBOARD
// Follows docs/YSF_LMS_Process_Flow.pdf
// ==========================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
const { buildStyledXlsx } = require('./xlsxStyled');

const norm = (v) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
const nowIso = () => new Date().toISOString();
const pad = (n, w = 2) => String(n).padStart(w, '0');

// ---------- date helpers (everything stored as YYYY-MM-DD) ----------
function isoDate(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  if (typeof v === 'number' && v > 20000 && v < 80000) { // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    return d ? `${d.y}-${pad(d.m)}-${pad(d.d)}` : '';
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return validYmd(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); // DD-MM-YYYY
  if (m) return validYmd(+m[3], +m[2], +m[1]);
  return '';
}
function validYmd(y, mo, d) {
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d ? `${y}-${pad(mo)}-${pad(d)}` : '';
}
const strictYmd = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '').trim()) && validYmd(...String(s).trim().split('-').map(Number));
function academicYearFor(start) {
  const d = isoDate(start);
  if (!d) return '';
  const [y, m] = d.split('-').map(Number);
  const from = m >= 4 ? y : y - 1; // Indian academic year starts in April
  return `${from}-${String(from + 1).slice(2)}`;
}
const dmy = (d) => { const x = isoDate(d); return x ? x.split('-').reverse().join('-') : ''; };
function hms(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
function durationSeconds(v) {
  if (!v) return 0;
  const parts = String(v).split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}
function sizeBytes(v) {
  const m = String(v || '').match(/([\d.]+)\s*(B|KB|MB|GB)/i);
  if (!m) return 0;
  return parseFloat(m[1]) * ({ b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 }[m[2].toLowerCase()]);
}
function sizeLabel(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
const maskAadhaar = (a) => { const d = String(a || '').replace(/\D/g, ''); return d.length >= 4 ? `XXXX XXXX ${d.slice(-4)}` : ''; };
const fmtAadhaar = (a) => { const d = String(a || '').replace(/\D/g, ''); return d.length === 12 ? `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}` : d; };

function findTrainee(db, idOrCode) {
  if (!idOrCode) return null;
  return (db.trainees || []).find(t => t.id === idOrCode || t.ysfCode === idOrCode || t.username === idOrCode) || null;
}
const statusOf = (t) => {
  const s = norm(t.status || t.enrollmentStatus);
  if (s === 'left') return 'Left';
  if (s === 'completed') return 'Completed';
  return 'Active';
};
const hasAccess = (t) => statusOf(t) !== 'Left';

// ---------- data migration ----------
function migrateLmsData(db) {
  let changed = false;
  if (!db.resourceViews || typeof db.resourceViews !== 'object') { db.resourceViews = {}; changed = true; }
  const lr = db.learningResources || (db.learningResources = { summary: [], hierarchy: [] });
  (lr.hierarchy || []).forEach(ch => {
    (ch.topics || []).forEach(t => {
      if (!t.createdAt) {
        const fromName = String(t.fileUrl || '').match(/\/(\d{13})-/);
        t.createdAt = fromName ? new Date(+fromName[1]).toISOString() : '2026-03-01T00:00:00.000Z';
        changed = true;
      }
      // Global read flags are replaced by per-trainee views
      if (t.readStatus !== undefined) { delete t.readStatus; changed = true; }
    });
  });
  (db.trainees || []).forEach(t => {
    const s = isoDate(t.registrationDate); if (s && s !== t.registrationDate) { t.registrationDate = s; changed = true; }
    const e = isoDate(t.endDate); if (e && e !== t.endDate) { t.endDate = e; changed = true; }
    if (!t.academicYear && t.registrationDate) { t.academicYear = academicYearFor(t.registrationDate); changed = true; }
    if (!t.status) { t.status = 'Active'; changed = true; }
  });
  if (!Array.isArray(db.screenTimeLogs)) { db.screenTimeLogs = []; changed = true; }
  return changed;
}

function registerLmsRoutes(app, { getDb, saveDb, upload, UPLOADS_DIR }) {

  // ==========================================
  // LEARNING RESOURCES
  // Admin: scheme → sector → course → subject → chapter → topic → upload
  // App: open PDF, PPT and video by course
  // ==========================================
  const chapters = (db) => (db.learningResources && db.learningResources.hierarchy) || [];
  const visibleChapters = (db, trainee) =>
    chapters(db).filter(ch => !trainee || !ch.course || norm(ch.course) === norm(trainee.courseName));
  const viewsOf = (db, trainee) => (trainee && db.resourceViews[trainee.id]) || {};

  function progressFor(db, trainee) {
    const views = viewsOf(db, trainee);
    const byType = { PDF: { total: 0, viewed: 0 }, PPT: { total: 0, viewed: 0 }, VIDEO: { total: 0, viewed: 0 } };
    let total = 0, viewed = 0, lastViewedAt = null;
    visibleChapters(db, trainee).forEach(ch => (ch.topics || []).forEach(t => {
      const type = byType[t.fileType] ? t.fileType : 'PDF';
      total++; byType[type].total++;
      if (views[t.id]) {
        viewed++; byType[type].viewed++;
        if (!lastViewedAt || views[t.id] > lastViewedAt) lastViewedAt = views[t.id];
      }
    }));
    return { totalTopics: total, viewedTopics: viewed, percent: total ? Math.round((viewed / total) * 1000) / 10 : 0, byType, lastViewedAt };
  }

  // Per-course counts for the trainee: total, unread, added this month / this year
  app.get('/api/resources/summary', (req, res) => {
    const db = getDb();
    const trainee = findTrainee(db, req.query.traineeId);
    const views = viewsOf(db, trainee);
    const now = new Date();
    const rows = {};
    visibleChapters(db, trainee).forEach(ch => (ch.topics || []).forEach(t => {
      const r = rows[ch.course] || (rows[ch.course] = { course: ch.course, total: 0, unread: 0, viewed: 0, monthly: 0, yearly: 0 });
      const created = new Date(t.createdAt || 0);
      r.total++;
      if (views[t.id]) r.viewed++; else r.unread++;
      if (created.getFullYear() === now.getFullYear()) {
        r.yearly++;
        if (created.getMonth() === now.getMonth()) r.monthly++;
      }
    }));
    return res.json({ success: true, data: Object.values(rows) });
  });

  // Chapters (with their subject / course) for the trainee's course; readStatus is per trainee
  app.get('/api/resources/hierarchy', (req, res) => {
    const db = getDb();
    const trainee = findTrainee(db, req.query.traineeId);
    const views = viewsOf(db, trainee);
    const data = visibleChapters(db, trainee).map(ch => {
      const topics = (ch.topics || []).map(t => ({ ...t, readStatus: !!views[t.id], viewedAt: views[t.id] || null }));
      return { ...ch, topicsCount: topics.length, viewedCount: topics.filter(t => t.readStatus).length, topics };
    });
    return res.json({ success: true, data });
  });

  app.get('/api/resources/view/:topicId', (req, res) => {
    const db = getDb();
    const topic = chapters(db).flatMap(ch => ch.topics || []).find(t => t.id === req.params.topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.json({ success: true, data: topic, downloadAllowed: false });
  });

  // Trainee opened a topic → counts towards their progress
  app.post('/api/resources/:topicId/viewed', (req, res) => {
    const db = getDb();
    const trainee = findTrainee(db, req.body && req.body.traineeId);
    if (!trainee) return res.status(400).json({ success: false, message: 'Unknown trainee' });
    const exists = chapters(db).some(ch => (ch.topics || []).some(t => t.id === req.params.topicId));
    if (!exists) return res.status(404).json({ success: false, message: 'Resource not found' });
    const views = db.resourceViews[trainee.id] || (db.resourceViews[trainee.id] = {});
    if (!views[req.params.topicId]) {
      views[req.params.topicId] = nowIso();
      saveDb(db);
    }
    return res.json({ success: true, progress: progressFor(db, trainee) });
  });

  app.get('/api/trainee/progress', (req, res) => {
    const db = getDb();
    const trainee = findTrainee(db, req.query.traineeId);
    if (!trainee) return res.status(404).json({ success: false, message: 'Trainee not found' });
    return res.json({ success: true, data: progressFor(db, trainee) });
  });

  // ---------- admin ----------
  function readTopicForm(body) {
    const f = {
      scheme: String(body.scheme || '').trim(),
      sector: String(body.sector || '').trim(),
      course: String(body.course || '').trim(),
      subject: String(body.subject || '').trim(),
      chapter: String(body.chapter || '').trim(),
      title: String(body.title || '').trim(),
      description: String(body.description || '').trim(),
      fileType: String(body.fileType || '').toUpperCase(),
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      fileSize: body.fileSize,
      videoDuration: String(body.videoDuration || '').trim(),
      contentType: body.contentType === 'Soft Skill' ? 'Soft Skill' : 'Technical',
    };
    const errors = [];
    for (const [k, label] of [['scheme', 'Scheme'], ['sector', 'Sector'], ['course', 'Course'], ['subject', 'Subject'], ['chapter', 'Chapter'], ['title', 'Topic name']]) {
      if (!f[k]) errors.push(`${label} is required`);
    }
    if (!['PDF', 'PPT', 'VIDEO'].includes(f.fileType)) errors.push('Content type must be PDF, PPT or Video');
    if (f.videoDuration && !/^\d{1,2}(:\d{2}){1,2}$/.test(f.videoDuration)) errors.push('Video duration must look like 12:30 or 1:05:00');
    return { f, errors };
  }

  function placeTopic(db, f, topic) {
    const lr = db.learningResources;
    let ch = lr.hierarchy.find(h => norm(h.course) === norm(f.course) && norm(h.subject) === norm(f.subject) && norm(h.chapter) === norm(f.chapter));
    if (!ch) {
      ch = { scheme: f.scheme, sector: f.sector, course: f.course, subject: f.subject, chapter: f.chapter, topicsCount: 0, topics: [] };
      lr.hierarchy.push(ch);
    }
    ch.scheme = f.scheme; ch.sector = f.sector;
    ch.topics.push(topic);
    ch.topicsCount = ch.topics.length;
  }

  function pruneEmpty(db) {
    db.learningResources.hierarchy = db.learningResources.hierarchy.filter(ch => (ch.topics || []).length > 0);
    db.learningResources.hierarchy.forEach(ch => { ch.topicsCount = ch.topics.length; });
  }

  app.post('/api/admin/resources/topic', (req, res) => {
    const { f, errors } = readTopicForm(req.body || {});
    if (!f.fileUrl) errors.push('Upload the PDF, PPT or video file');
    if (errors.length) return res.status(400).json({ success: false, message: errors.join('. ') });
    const db = getDb();
    const topic = {
      id: `TOP-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      title: f.title,
      description: f.description || f.title,
      fileType: f.fileType,
      fileName: f.fileName || f.title,
      fileUrl: f.fileUrl,
      fileSize: f.fileSize || '',
      videoDuration: f.fileType === 'VIDEO' ? (f.videoDuration || '') : undefined,
      contentType: f.contentType,
      contentSummary: f.description || '',
      createdAt: nowIso(),
    };
    placeTopic(db, f, topic);
    saveDb(db);
    return res.json({ success: true, message: 'Content uploaded and published to the course trainees', data: topic });
  });

  app.put('/api/admin/resources/topic/:id', (req, res) => {
    const db = getDb();
    const { f, errors } = readTopicForm(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, message: errors.join('. ') });
    let found = null;
    chapters(db).forEach(ch => {
      const i = (ch.topics || []).findIndex(t => t.id === req.params.id);
      if (i !== -1) { found = ch.topics[i]; ch.topics.splice(i, 1); }
    });
    if (!found) return res.status(404).json({ success: false, message: 'Topic not found' });
    Object.assign(found, {
      title: f.title,
      description: f.description || f.title,
      contentSummary: f.description || found.contentSummary || '',
      fileType: f.fileType,
      contentType: f.contentType,
      videoDuration: f.fileType === 'VIDEO' ? (f.videoDuration || found.videoDuration || '') : undefined,
      updatedAt: nowIso(),
      ...(f.fileUrl ? { fileUrl: f.fileUrl, fileName: f.fileName || found.fileName, fileSize: f.fileSize || '' } : {}),
    });
    placeTopic(db, f, found);
    pruneEmpty(db);
    saveDb(db);
    return res.json({ success: true, message: 'Topic updated', data: found });
  });

  app.delete('/api/admin/resources/topic/:id', (req, res) => {
    const db = getDb();
    let deleted = false;
    chapters(db).forEach(ch => {
      const i = (ch.topics || []).findIndex(t => t.id === req.params.id);
      if (i !== -1) { ch.topics.splice(i, 1); deleted = true; }
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Topic not found' });
    Object.values(db.resourceViews || {}).forEach(v => { delete v[req.params.id]; });
    pruneEmpty(db);
    saveDb(db);
    return res.json({ success: true, message: 'Topic deleted' });
  });

  // ==========================================
  // PROFILE — Trainee Information + Course Details (same fields as the reports)
  // ==========================================
  function profileFor(t) {
    const start = isoDate(t.registrationDate);
    return {
      fullName: t.fullName,
      ysfCode: t.ysfCode,
      avatar: t.avatar || null,
      status: statusOf(t),
      sections: [
        {
          key: 'trainee', title: 'Trainee Information', fields: [
            { key: 'traineeName', label: 'Trainee Name', value: t.fullName || '' },
            { key: 'ysfCodeLabel', label: 'YSF Code', value: t.ysfCode || '' },
            { key: 'aadhaarCard', label: 'Aadhaar Card Number', value: maskAadhaar(t.aadharNumber) },
            { key: 'contactNo', label: 'Contact No', value: t.contact1 || t.mobile || '' },
            { key: 'schemeLabel', label: 'Scheme', value: t.schemeName || '' },
            { key: 'zoneLabel', label: 'Zone', value: t.zoneName || '' },
            { key: 'industryName', label: 'Industry Name', value: t.industryPartner || '' },
            { key: 'industryLocation', label: 'Industry Location', value: t.locationName || '' },
          ],
        },
        {
          key: 'course', title: 'Course Details', fields: [
            { key: 'sectorLabel', label: 'Sector', value: t.sectorName || '' },
            { key: 'jobRole', label: 'Job Role', value: t.jobRoleAssigned || t.trade || '' },
            { key: 'courseNameLabel', label: 'Course Name', value: t.courseName || '' },
            { key: 'courseStartDate', label: 'Course Start Date', value: dmy(start) },
            { key: 'courseEndDate', label: 'Course End Date', value: dmy(t.endDate) },
            { key: 'academicYear', label: 'Academic Year', value: t.academicYear || academicYearFor(start) },
          ],
        },
      ],
      notice: 'Profile details come from YSF records. For corrections, please contact the YSF admin.',
    };
  }

  app.get('/api/trainee/profile', (req, res) => {
    const db = getDb();
    const t = findTrainee(db, req.query.traineeId);
    if (!t) return res.status(404).json({ success: false, message: 'Trainee not found' });
    return res.json({ success: true, data: profileFor(t) });
  });

  // Trainee sets a profile picture (file is uploaded first via /api/upload)
  app.post('/api/trainee/avatar', (req, res) => {
    const { traineeId, url } = req.body || {};
    const db = getDb();
    const t = findTrainee(db, traineeId);
    if (!t) return res.status(404).json({ success: false, message: 'Trainee not found' });
    if (!url || !/\.(jpe?g|png|webp|heic|gif)(\?|$)/i.test(String(url))) {
      return res.status(400).json({ success: false, message: 'Please choose a JPG or PNG image' });
    }
    t.avatar = url;
    t.updatedAt = nowIso();
    saveDb(db);
    return res.json({ success: true, message: 'Profile picture updated', avatar: url });
  });

  // ==========================================
  // USER MASTER
  // Sample sheet (red = mandatory, dates YYYY-MM-DD) → Save Student Data →
  // trainees enrolled → login credentials generated automatically
  // ==========================================
  const TRAINEE_COLUMNS = [
    { key: 'fullName', header: 'Trainee Name', required: true, width: 24, aliases: ['fullname', 'name'] },
    { key: 'aadhaar', header: 'Aadhaar Number', required: true, width: 18, aliases: ['aadharnumber', 'aadhaar', 'aadhar'] },
    { key: 'mobile', header: 'Mobile Number', required: true, width: 16, aliases: ['mobile', 'contactno', 'phone', 'contact'] },
    { key: 'scheme', header: 'Scheme', required: true, width: 30, aliases: ['schemename'] },
    { key: 'sector', header: 'Sector', required: true, width: 26, aliases: ['sectorname'] },
    { key: 'course', header: 'Course Name', required: true, width: 40, aliases: ['course'] },
    { key: 'zone', header: 'Zone', required: true, width: 24, aliases: ['zonename'] },
    { key: 'industry', header: 'Industry Name', required: true, width: 26, aliases: ['companyojtsite', 'company', 'industrypartner'] },
    { key: 'location', header: 'Industry Location', required: true, width: 26, aliases: ['location', 'locationname'] },
    { key: 'startDate', header: 'Course Start Date (YYYY-MM-DD)', required: true, width: 20, aliases: ['coursestartdate', 'startdate', 'registrationdate'] },
    { key: 'endDate', header: 'Course End Date (YYYY-MM-DD)', required: true, width: 20, aliases: ['courseenddate', 'enddate'] },
    { key: 'jobRole', header: 'Job Role', required: false, width: 26, aliases: ['jobrole', 'trade', 'jobroleassigned'] },
    { key: 'academicYear', header: 'Academic Year', required: false, width: 14, aliases: ['academicyear'] },
    { key: 'email', header: 'Email', required: false, width: 28, aliases: ['email'] },
    { key: 'ysfCode', header: 'YSF Code (blank = auto-generate)', required: false, width: 22, aliases: ['ysfcode', 'traineeid', 'username'] },
    { key: 'batch', header: 'Batch', required: false, width: 16, aliases: ['batch'] },
  ];
  const headerKey = (h) => String(h || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');
  const COL_BY_ALIAS = {};
  TRAINEE_COLUMNS.forEach(c => { COL_BY_ALIAS[headerKey(c.header)] = c.key; c.aliases.forEach(a => { COL_BY_ALIAS[a] = c.key; }); });
  COL_BY_ALIAS.status = 'status';

  const xlsxResponse = (res, buffer, filename) => {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  };

  const sendTemplate = (req, res) => {
    const db = getDb();
    const sample = (db.trainees || []).slice(0, 2).map(t => [
      t.fullName, String(t.aadharNumber || '').replace(/\D/g, ''), t.contact1 || t.mobile || '', t.schemeName, t.sectorName, t.courseName,
      t.zoneName, t.industryPartner, t.locationName, isoDate(t.registrationDate), isoDate(t.endDate), t.jobRoleAssigned || '',
      t.academicYear || academicYearFor(t.registrationDate), t.email || '', '', t.batch || '',
    ]);
    const buffer = buildStyledXlsx([{
      name: 'Trainees',
      columns: TRAINEE_COLUMNS,
      rows: sample,
      blankRows: 200,
      notes: [
        'How to fill the YSF trainee upload sheet',
        '1. Columns with a RED header are mandatory. Dark-header columns are optional.',
        '2. Write every date as YYYY-MM-DD, for example 2026-04-15.',
        '3. Aadhaar Number must be 12 digits. It is used to find existing trainees, so re-uploading a trainee updates their record instead of duplicating it.',
        '4. Leave "YSF Code" blank to generate one. The YSF Code is the trainee\'s login user name; a password is generated automatically for new trainees.',
        '5. Delete the two sample rows before uploading, then choose the file in the admin panel and click "Save Student Data".',
      ],
    }]);
    return xlsxResponse(res, buffer, 'YSF_Trainee_Upload_Sample_Sheet.xlsx');
  };
  app.get('/api/admin/trainees/template', sendTemplate);
  app.get('/api/admin/users/template', sendTemplate);

  function readSheetRows(filePath) {
    const wb = XLSX.readFile(filePath, { cellDates: true });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: true });
    return rows.map(row => {
      const out = {};
      Object.keys(row).forEach(h => { const k = COL_BY_ALIAS[headerKey(h)]; if (k && (out[k] === undefined || out[k] === '')) out[k] = row[h]; });
      return out;
    });
  }

  const PASS_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const genPassword = () => Array.from(crypto.randomBytes(8)).map(b => PASS_CHARS[b % PASS_CHARS.length]).join('');
  function nextTraineeId(db) {
    const max = (db.trainees || []).reduce((m, t) => Math.max(m, parseInt(String(t.id).replace(/\D/g, ''), 10) || 0), 0);
    return `T${pad(max + 1, 3)}`;
  }
  function nextYsfCode(db) {
    const d = new Date();
    const prefix = `W${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}C`;
    const used = new Set((db.trainees || []).map(t => t.ysfCode));
    let n = (db.trainees || []).length + 1;
    while (used.has(`${prefix}${pad(n, 5)}`)) n++;
    return `${prefix}${pad(n, 5)}`;
  }

  // Applies one row/form to an existing trainee or creates a new one; returns { trainee, created, password }
  function upsertTrainee(db, v) {
    const aadhaar = String(v.aadhaar || '').replace(/\D/g, '');
    let t = null;
    if (aadhaar.length === 12) t = db.trainees.find(x => String(x.aadharNumber || '').replace(/\D/g, '') === aadhaar);
    if (!t && v.ysfCode) t = findTrainee(db, String(v.ysfCode).trim());
    const created = !t;
    let password = null;

    if (created) {
      const ysfCode = String(v.ysfCode || '').trim() || nextYsfCode(db);
      password = genPassword();
      t = {
        id: nextTraineeId(db),
        ysfCode,
        username: ysfCode,
        password,
        status: 'Active',
        enrollmentStatus: 'Active',
        presentOJT: 'Active',
        enrolledAt: nowIso(),
        credentialsIssuedAt: nowIso(),
      };
      db.trainees.push(t);
      if (!db.attendance) db.attendance = {};
      db.attendance[t.id] = { traineeId: t.id, ysfCode, traineeName: v.fullName, presentDays: 0, absentDays: 0, completedHours: 0, targetHours: 240, percentage: 0, updatedAt: nowIso() };
    }

    const set = (field, value) => { if (value !== undefined && value !== null && String(value).trim() !== '') t[field] = String(value).trim(); };
    set('fullName', v.fullName && String(v.fullName).toUpperCase());
    if (aadhaar.length === 12) t.aadharNumber = aadhaar;
    set('contact1', v.mobile); set('mobile', v.mobile);
    set('schemeName', v.scheme); set('sectorName', v.sector); set('courseName', v.course);
    set('zoneName', v.zone); set('industryPartner', v.industry); set('locationName', v.location);
    set('jobRoleAssigned', v.jobRole); set('trade', v.jobRole);
    set('email', v.email); set('batch', v.batch);
    const start = isoDate(v.startDate); if (start) t.registrationDate = start;
    const end = isoDate(v.endDate); if (end) t.endDate = end;
    t.academicYear = String(v.academicYear || '').trim() || t.academicYear || academicYearFor(t.registrationDate);
    t.updatedAt = nowIso();
    return { trainee: t, created, password };
  }

  function validateRow(v, isNew) {
    const errs = [];
    if (isNew) {
      TRAINEE_COLUMNS.filter(c => c.required).forEach(c => { if (String(v[c.key] ?? '').trim() === '') errs.push(`${c.header.replace(/ \(.*\)/, '')} is missing`); });
    }
    const a = String(v.aadhaar || '').replace(/\D/g, '');
    if (v.aadhaar && a.length !== 12) errs.push('Aadhaar Number must be 12 digits');
    for (const [k, label] of [['startDate', 'Course Start Date'], ['endDate', 'Course End Date']]) {
      if (v[k] && !isoDate(v[k])) errs.push(`${label} must be YYYY-MM-DD`);
    }
    if (v.startDate && v.endDate && isoDate(v.startDate) && isoDate(v.endDate) && isoDate(v.endDate) < isoDate(v.startDate)) {
      errs.push('Course End Date is before the Start Date');
    }
    return errs;
  }

  // Credentials of the last uploads, kept in memory for the admin to download once
  const credentialBatches = new Map();

  const handleBulkUpload = (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Choose the filled Excel sheet first' });
    try {
      const rows = readSheetRows(req.file.path);
      if (!rows.length) return res.status(400).json({ success: false, message: 'The sheet has no trainee rows' });
      const db = getDb();
      const errors = [];
      const results = [];
      const credentials = [];

      rows.forEach((v, i) => {
        const line = i + 2;
        if (!Object.values(v).some(x => String(x ?? '').trim() !== '')) return;
        const a = String(v.aadhaar || '').replace(/\D/g, '');
        const exists = (a.length === 12 && db.trainees.some(x => String(x.aadharNumber || '').replace(/\D/g, '') === a)) || (v.ysfCode && findTrainee(db, String(v.ysfCode).trim()));
        const errs = validateRow(v, !exists);
        if (errs.length) { errors.push({ row: line, name: v.fullName || '', errors: errs }); return; }
        const { trainee, created, password } = upsertTrainee(db, v);
        results.push({ row: line, id: trainee.id, ysfCode: trainee.ysfCode, name: trainee.fullName, action: created ? 'Enrolled' : 'Updated' });
        if (created) credentials.push({ ysfCode: trainee.ysfCode, name: trainee.fullName, course: trainee.courseName, username: trainee.username, password });
      });

      if (results.length) saveDb(db);
      let batchId = null;
      if (credentials.length) {
        batchId = crypto.randomBytes(8).toString('hex');
        credentialBatches.set(batchId, { createdAt: nowIso(), credentials });
        if (credentialBatches.size > 20) credentialBatches.delete(credentialBatches.keys().next().value);
      }
      const enrolled = results.filter(r => r.action === 'Enrolled').length;
      return res.status(results.length ? 200 : 400).json({
        success: results.length > 0,
        message: results.length
          ? `${enrolled} trainee${enrolled === 1 ? '' : 's'} enrolled, ${results.length - enrolled} updated${errors.length ? `, ${errors.length} row${errors.length === 1 ? ' needs' : 's need'} fixing` : ''}.`
          : 'No rows could be saved — please fix the errors listed and upload again.',
        enrolledCount: enrolled,
        updatedCount: results.length - enrolled,
        errorCount: errors.length,
        results, errors,
        credentials: credentials.map(c => ({ ...c })),
        credentialsBatchId: batchId,
        totalTrainees: db.trainees.length,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Could not read the Excel file: ' + err.message });
    } finally {
      fs.unlink(req.file.path, () => {});
    }
  };
  app.post('/api/admin/trainees/bulk-upload', upload.single('file'), handleBulkUpload);
  app.post('/api/admin/users/bulk-upload', upload.single('file'), handleBulkUpload);

  app.get('/api/admin/trainees/credentials/:batchId', (req, res) => {
    const batch = credentialBatches.get(req.params.batchId);
    if (!batch) return res.status(404).json({ success: false, message: 'These credentials have expired — view them per trainee in User Master' });
    const buffer = buildStyledXlsx([{
      name: 'Login Credentials',
      columns: [
        { header: 'YSF Code', width: 18 }, { header: 'Trainee Name', width: 26 }, { header: 'Course', width: 40 },
        { header: 'User Name', width: 18, required: true }, { header: 'Password', width: 16, required: true },
      ],
      rows: batch.credentials.map(c => [c.ysfCode, c.name, c.course, c.username, c.password]),
    }]);
    return xlsxResponse(res, buffer, `YSF_Trainee_Credentials_${batch.createdAt.slice(0, 10)}.xlsx`);
  });

  // Single trainee (Add Trainee form)
  app.post('/api/admin/trainees', (req, res) => {
    const db = getDb();
    const v = req.body || {};
    const errs = validateRow(v, true);
    if (errs.length) return res.status(400).json({ success: false, message: errs.join('. ') });
    const a = String(v.aadhaar || '').replace(/\D/g, '');
    if (db.trainees.some(x => String(x.aadharNumber || '').replace(/\D/g, '') === a)) {
      return res.status(409).json({ success: false, message: 'A trainee with this Aadhaar Number is already enrolled' });
    }
    const { trainee, password } = upsertTrainee(db, v);
    saveDb(db);
    return res.json({ success: true, message: `${trainee.fullName} enrolled`, trainee, credentials: { username: trainee.username, password } });
  });

  // ---------- status: Active / Left / Completed ----------
  function applyStatus(t, status, endDate) {
    t.status = status;
    t.enrollmentStatus = status;
    t.presentOJT = status === 'Active' ? 'Active' : status === 'Left' ? 'Inactive' : 'Graduated';
    if (endDate) t.endDate = endDate;
    t.statusUpdatedAt = nowIso();
  }

  app.post('/api/admin/trainees/:id/status', (req, res) => {
    const db = getDb();
    const t = findTrainee(db, req.params.id);
    if (!t) return res.status(404).json({ success: false, message: 'Trainee not found' });
    const status = ['Active', 'Left', 'Completed'].includes(req.body.status) ? req.body.status : null;
    if (!status) return res.status(400).json({ success: false, message: 'Status must be Active, Left or Completed' });
    applyStatus(t, status, isoDate(req.body.endDate));
    saveDb(db);
    return res.json({ success: true, message: `${t.fullName} marked ${status}`, trainee: t });
  });

  app.post('/api/admin/trainees/bulk-status', (req, res) => {
    const { traineeIds, status, remarks } = req.body || {};
    if (!Array.isArray(traineeIds) || traineeIds.length === 0) return res.status(400).json({ success: false, message: 'Select at least one trainee' });
    if (!['Active', 'Left', 'Completed'].includes(status)) return res.status(400).json({ success: false, message: 'Choose Active, Left or Completed' });
    const endDate = req.body.endDate ? isoDate(req.body.endDate) : '';
    if (req.body.endDate && !endDate) return res.status(400).json({ success: false, message: 'End date must be YYYY-MM-DD' });
    if (status !== 'Active' && !endDate) return res.status(400).json({ success: false, message: `Set the end date for trainees marked ${status}` });

    const db = getDb();
    const ids = new Set(traineeIds);
    const updated = db.trainees.filter(t => ids.has(t.id) || ids.has(t.ysfCode));
    updated.forEach(t => applyStatus(t, status, endDate));
    if (!db.batchStatusHistory) db.batchStatusHistory = [];
    db.batchStatusHistory.unshift({
      id: `BSH-${Date.now().toString(36).toUpperCase()}`,
      timestamp: nowIso().replace('T', ' ').slice(0, 16),
      updatedBy: 'Admin',
      traineesCount: updated.length,
      status,
      endDate,
      remarks: remarks || `Status set to ${status}`,
    });
    saveDb(db);
    return res.json({
      success: true,
      message: `LMS access updated for ${updated.length} trainee${updated.length === 1 ? '' : 's'} (${status}${status === 'Left' ? ' — login blocked' : ''})`,
      updatedCount: updated.length,
      updatedTrainees: updated.map(t => ({ id: t.id, ysfCode: t.ysfCode, fullName: t.fullName, status: t.status, endDate: t.endDate })),
    });
  });

  // Status file upload → which trainees it selects (applied with bulk-status)
  app.get('/api/admin/trainees/status-template', (req, res) => {
    const buffer = buildStyledXlsx([{
      name: 'Status Update',
      columns: [
        { header: 'YSF Code', required: true, width: 18 },
        { header: 'Aadhaar Number', width: 18 },
        { header: 'Trainee Name', width: 26 },
      ],
      rows: (getDb().trainees || []).slice(0, 2).map(t => [t.ysfCode, String(t.aadharNumber || '').replace(/\D/g, ''), t.fullName]),
      blankRows: 200,
      notes: ['How to use', 'List the trainees whose status should change — by YSF Code (or Aadhaar Number if the code is unknown).', 'Upload the file in Update Status, then choose the new status and end date and click Apply.'],
    }]);
    return xlsxResponse(res, buffer, 'YSF_Status_Update_Sheet.xlsx');
  });

  app.post('/api/admin/trainees/status-file', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Choose the status file first' });
    try {
      const wb = XLSX.readFile(req.file.path);
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });
      const db = getDb();
      const matched = [];
      const unmatched = [];
      rows.forEach((row, i) => {
        const get = (k) => { const h = Object.keys(row).find(x => headerKey(x) === k); return h ? String(row[h]).trim() : ''; };
        const code = get('ysfcode') || get('traineeid');
        const aadhaar = (get('aadhaarnumber') || get('aadharnumber')).replace(/\D/g, '');
        if (!code && !aadhaar) return;
        const t = (code && findTrainee(db, code)) || (aadhaar && db.trainees.find(x => String(x.aadharNumber || '').replace(/\D/g, '') === aadhaar));
        if (t) { if (!matched.some(m => m.id === t.id)) matched.push({ id: t.id, ysfCode: t.ysfCode, fullName: t.fullName, courseName: t.courseName, status: statusOf(t) }); }
        else unmatched.push({ row: i + 2, value: code || aadhaar });
      });
      return res.json({ success: matched.length > 0, message: `${matched.length} trainee${matched.length === 1 ? '' : 's'} found${unmatched.length ? `, ${unmatched.length} not found` : ''}`, matched, unmatched });
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Could not read the file: ' + err.message });
    } finally {
      fs.unlink(req.file.path, () => {});
    }
  });

  // ==========================================
  // REPORTS — rows keyed exactly like the admin report column keys
  // ==========================================
  function screenTimeBy(db) {
    const map = {};
    (db.screenTimeLogs || []).forEach(l => {
      const m = map[l.traineeId] || (map[l.traineeId] = { total: 0, learning: 0, sessions: 0, last: '' });
      m.total += l.durationSeconds || 0;
      m.sessions++;
      if (/learning/i.test(l.module || '')) m.learning += l.durationSeconds || 0;
      if (String(l.timestamp) > m.last) m.last = String(l.timestamp);
    });
    return map;
  }
  const lastLogin = (t) => t.lastLoginAt ? new Date(t.lastLoginAt).toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).replace(/\//g, '-') : 'Never';
  const base = (t) => ({
    scheme: t.schemeName || '', zone: t.zoneName || '', industry_name: t.industryPartner || '', industry_location: t.locationName || '',
    trainee_name: t.fullName || '', ysf_code: t.ysfCode || '', aadhaar: fmtAadhaar(t.aadharNumber), contact_no: t.contact1 || t.mobile || '',
    sector: t.sectorName || '', job_role: t.jobRoleAssigned || t.trade || '', course_name: t.courseName || '',
    academic_year: t.academicYear || academicYearFor(t.registrationDate),
  });

  function reportRows(db, key, variant) {
    const trainees = db.trainees || [];
    const st = screenTimeBy(db);
    const allTopics = chapters(db).flatMap(ch => (ch.topics || []).map(t => ({ ...t, ch })));

    switch (`${key}${variant ? ':' + variant : ''}`) {
      case 'enrollment:summary': {
        const groups = {};
        trainees.forEach(t => {
          const k = [t.schemeName, t.zoneName, t.industryPartner, t.locationName].join('|');
          const g = groups[k] || (groups[k] = { scheme: t.schemeName || '', zone: t.zoneName || '', industry_name: t.industryPartner || '', industry_location: t.locationName || '', enrollment_count: 0, active_count: 0, left_count: 0, completed: 0, logged_in: 0 });
          g.enrollment_count++;
          const s = statusOf(t);
          if (s === 'Active') g.active_count++; else if (s === 'Left') g.left_count++; else g.completed++;
          if (t.lastLoginAt) g.logged_in++;
        });
        return Object.values(groups);
      }
      case 'enrollment:detail':
        return trainees.map(t => ({ ...base(t), course_start_date: dmy(t.registrationDate), course_end_date: dmy(t.endDate), last_logged_in_time: lastLogin(t) }));
      case 'access':
        return trainees.map(t => ({ ...base(t), status: statusOf(t), lms_access: hasAccess(t) ? 'Yes' : 'No', end_date: dmy(t.endDate), last_logged_in_time: lastLogin(t) }));
      case 'screentime':
        return trainees.map(t => {
          const s = st[t.id] || { total: 0, learning: 0, sessions: 0, last: '' };
          return { ...base(t), sessions: s.sessions, total_screen_time: hms(s.total), learning_screen_time: hms(s.learning), last_active: s.last || '—' };
        });
      case 'progress':
        return trainees.map(t => {
          const topics = allTopics.filter(x => !x.ch.course || norm(x.ch.course) === norm(t.courseName));
          const uploaded = topics.reduce((sum, x) => sum + durationSeconds(x.videoDuration), 0);
          const p = progressFor(db, t);
          return { ...base(t), uploaded_content: hms(uploaded), trainee_screen_time: hms((st[t.id] || {}).learning || 0), content_viewed: `${p.viewedTopics} / ${p.totalTopics} (${p.percent}%)` };
        });
      case 'assessment':
        return trainees.map(t => {
          const tests = (db.tests || []).filter(x => !x.course || norm(x.course) === norm(t.courseName));
          const attempts = tests.map(x => (x.attempts || []).find(a => a.traineeId === t.id)).filter(Boolean);
          return {
            ...base(t),
            uploaded_tests: tests.length,
            marks_of_uploaded_tests: tests.reduce((s, x) => s + (Number(x.totalMarks) || 0), 0),
            completed_tests: attempts.length,
            marks_obtained: attempts.reduce((s, a) => s + (Number(a.score) || 0), 0),
          };
        });
      case 'content:summary': {
        const groups = {};
        allTopics.forEach(x => {
          const k = [x.ch.scheme, x.ch.sector, x.ch.course].join('|');
          const g = groups[k] || (groups[k] = { scheme: x.ch.scheme || '', sector: x.ch.sector || '', courses: x.ch.course || '', uploaded_video: 0, learning_material: 0, test_assessment: 0, trainee_count: 0, bytes: 0 });
          if (x.fileType === 'VIDEO') g.uploaded_video++; else g.learning_material++;
          g.bytes += sizeBytes(x.fileSize);
        });
        Object.values(groups).forEach(g => {
          g.test_assessment = (db.tests || []).filter(x => norm(x.course) === norm(g.courses)).length;
          g.trainee_count = trainees.filter(t => norm(t.courseName) === norm(g.courses)).length;
          g.storage = sizeLabel(g.bytes);
          delete g.bytes;
        });
        return Object.values(groups);
      }
      case 'content:detail':
        return allTopics.map(x => ({
          scheme: x.ch.scheme || '', sector: x.ch.sector || '', course_name: x.ch.course || '',
          academic_year: x.academicYear || '', subject: x.ch.subject || '', unit_name: x.ch.chapter || '', topic_name: x.title,
          content_type: x.contentType || 'Technical',
          uploaded_video: x.fileType === 'VIDEO' ? 1 : 0,
          uploaded_material: x.fileType === 'VIDEO' ? 0 : 1,
          video_duration: x.fileType === 'VIDEO' ? hms(durationSeconds(x.videoDuration)) : '—',
          material_duration: '—',
        }));
      default:
        return null;
    }
  }

  app.get('/api/admin/reports/:key', (req, res) => {
    const db = getDb();
    const rows = reportRows(db, req.params.key, req.query.variant || '');
    if (!rows) return res.status(404).json({ success: false, message: 'Unknown report' });
    return res.json({ success: true, count: rows.length, rows });
  });

  // ==========================================
  // DASHBOARD — summary tiles + enrollment graphs
  // ==========================================
  function uploadsBytes() {
    try {
      return fs.readdirSync(UPLOADS_DIR).reduce((sum, f) => {
        try { return sum + fs.statSync(path.join(UPLOADS_DIR, f)).size; } catch (e) { return sum; }
      }, 0);
    } catch (e) { return 0; }
  }

  app.get('/api/admin/dashboard', (req, res) => {
    const db = getDb();
    const trainees = db.trainees || [];
    const count = (arr, keyFn) => {
      const m = {};
      arr.forEach(x => { const k = keyFn(x) || 'Not set'; m[k] = (m[k] || 0) + 1; });
      return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    };

    // Last 12 months of enrollments (by course start date)
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: d.toLocaleDateString('en-US', { month: 'short' }), value: 0 });
    }
    trainees.forEach(t => {
      const k = String(isoDate(t.enrolledAt) || isoDate(t.registrationDate)).slice(0, 7);
      const m = months.find(x => x.key === k);
      if (m) m.value++;
    });

    // Screen time, last 14 days (minutes)
    const days = [];
    // Screen time logs are stamped in India time, so bucket the days the same way
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' }).slice(0, 10);
      days.push({ key, label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }), value: 0 });
    }
    (db.screenTimeLogs || []).forEach(l => {
      const d = days.find(x => x.key === String(l.timestamp).slice(0, 10));
      if (d) d.value += Math.round((l.durationSeconds || 0) / 60);
    });

    const topics = chapters(db).flatMap(ch => ch.topics || []);
    const courses = new Set([...trainees.map(t => norm(t.courseName)), ...chapters(db).map(c => norm(c.course))].filter(Boolean));
    const contentBytes = topics.reduce((s, t) => s + sizeBytes(t.fileSize), 0);
    const storage = Math.max(uploadsBytes(), contentBytes);

    return res.json({
      success: true,
      tiles: {
        enrollments: trainees.length,
        activeTrainees: trainees.filter(t => statusOf(t) === 'Active').length,
        leftTrainees: trainees.filter(t => statusOf(t) === 'Left').length,
        completedTrainees: trainees.filter(t => statusOf(t) === 'Completed').length,
        loggedIn: trainees.filter(t => t.lastLoginAt).length,
        courses: courses.size,
        storageBytes: storage,
        storageLabel: sizeLabel(storage),
        resources: topics.length,
        tests: (db.tests || []).length,
        assignments: (db.assignments || []).length,
      },
      charts: {
        enrollmentsByMonth: months,
        statusBreakdown: count(trainees, statusOf),
        enrollmentsByCourse: count(trainees, t => t.courseName),
        enrollmentsByScheme: count(trainees, t => t.schemeName),
        screenTimeByDay: days,
        contentByType: count(topics, t => t.fileType),
      },
    });
  });

  return { findTrainee, hasAccess, progressFor };
}

module.exports = { registerLmsRoutes, migrateLmsData, isoDate };
