// ==========================================
// ASSIGNMENT & TEST MODULES
// Follows docs/YSF_LMS_Assignment_Module_Flow.pdf and docs/YSF_LMS_Test_Module_Flow.pdf
// ==========================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
const { createZip } = require('./zip');

// Answer-file types an admin can allow on an assignment (extensions, lowercase)
const FILE_TYPE_GROUPS = {
  pdf: ['pdf'],
  image: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
  doc: ['doc', 'docx'],
  excel: ['xls', 'xlsx', 'csv'],
  ppt: ['ppt', 'pptx'],
  video: ['mp4', 'mov', 'm4v'],
};

const norm = (v) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
const uniqueSorted = (values) => [...new Set(values.map(v => String(v || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
const newId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
const nowStamp = () => new Date().toISOString().replace('T', ' ').substring(0, 16);
const toNumber = (v, fallback = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};
const round1 = (n) => Math.round(n * 10) / 10;

function findTrainee(db, idOrCode) {
  if (!idOrCode) return null;
  return (db.trainees || []).find(t => t.id === idOrCode || t.ysfCode === idOrCode || t.username === idOrCode) || null;
}

// An item without a course is open to everyone; otherwise it targets one course.
function visibleToTrainee(item, trainee) {
  if (!trainee || !item.course) return true;
  return norm(item.course) === norm(trainee.courseName);
}

function deadlineEnd(deadline) {
  if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return null;
  return new Date(`${deadline}T23:59:59`);
}

function displayDate(iso) {
  const d = deadlineEnd(iso);
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '';
}

function extensionOf(name) {
  const m = String(name || '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

function allowedExtensions(types) {
  if (!Array.isArray(types) || types.length === 0 || types.includes('any')) return null;
  return types.flatMap(t => FILE_TYPE_GROUPS[t] || []);
}

// Brings older records up to the current shape. Safe to run repeatedly.
function migrateAssessmentData(db) {
  let changed = false;
  if (!Array.isArray(db.selfAssignments)) { db.selfAssignments = []; changed = true; }

  (db.assignments || []).forEach(a => {
    if (!Array.isArray(a.submissions)) { a.submissions = []; changed = true; }
    a.submissions.forEach(s => {
      if (s.gradeStatus === 'Approved') { s.gradeStatus = 'Graded'; changed = true; }
      if (s.gradeStatus === 'Ungraded') { s.gradeStatus = 'Pending'; changed = true; }
    });
    for (const key of ['scheme', 'sector', 'zone', 'industryName']) {
      if (a[key] === undefined) { a[key] = ''; changed = true; }
    }
    if (!Array.isArray(a.allowedFileTypes)) { a.allowedFileTypes = ['any']; changed = true; }
    if (a.deadline === undefined) { a.deadline = ''; changed = true; }
    if (a.attachment === undefined) { a.attachment = null; changed = true; }
  });

  (db.tests || []).forEach(t => {
    if (!Array.isArray(t.attempts)) {
      t.attempts = [];
      // Legacy tests stored one global result; keep it as the demo trainee's attempt.
      if (t.status === 'Solved' && t.score !== null && t.score !== undefined) {
        const tr = findTrainee(db, 'T001');
        t.attempts.push({
          traineeId: 'T001',
          traineeName: tr ? tr.fullName : 'KUMARI K',
          ysfCode: tr ? tr.ysfCode : 'W2307C00001',
          score: t.score,
          maxScore: t.totalMarks,
          passed: t.score >= t.passingMarks,
          correctCount: null,
          totalQuestions: (t.questions || []).length,
          completedAt: t.completedAt || new Date().toISOString(),
        });
      }
      changed = true;
    }
    for (const key of ['scheme', 'sector']) {
      if (t[key] === undefined) { t[key] = ''; changed = true; }
    }
  });
  return changed;
}

function registerAssessmentRoutes(app, { getDb, saveDb, upload, getBaseUrl, UPLOADS_DIR, saveFileToMongo, getFileFromMongo }) {

  // ---------- shared helpers ----------
  function storeAttachments(req, attachments) {
    const baseUrl = getBaseUrl(req);
    return (attachments || []).slice(0, 5).map((att, idx) => {
      let url = att.url || att.uri || '';
      if (att.data) {
        const fileName = `submission_${Date.now()}_${idx}_${(att.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const buffer = Buffer.from(String(att.data).replace(/^data:.*,/, ''), 'base64');
        fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
        Promise.resolve(saveFileToMongo(fileName, att.name || fileName, att.mimeType || 'application/octet-stream', buffer)).catch(() => {});
        url = `${baseUrl}/api/files/${fileName}`;
      }
      return { name: att.name || `Attachment_${idx + 1}`, size: att.size || '', url };
    });
  }

  function checkFileTypes(asg, attachments) {
    const exts = allowedExtensions(asg.allowedFileTypes);
    if (!exts) return null;
    const bad = attachments.find(a => !exts.includes(extensionOf(a.name)));
    return bad ? `"${bad.name}" is not an accepted file type. Allowed: ${exts.map(e => '.' + e).join(', ')}` : null;
  }

  function submissionStatus(asg, sub) {
    if (sub) {
      if (sub.gradeStatus === 'Graded') return 'Graded';
      if (sub.gradeStatus === 'Needs Revision') return 'Needs Revision';
      return 'Submitted';
    }
    const end = deadlineEnd(asg.deadline);
    return end && end < new Date() ? 'Overdue' : 'Pending';
  }

  // What a trainee is allowed to see of an assignment: only their own submission.
  function assignmentForTrainee(asg, trainee) {
    const own = (asg.submissions || []).filter(s => trainee && s.traineeId === trainee.id);
    const mySubmission = own[0] || null;
    return {
      ...asg,
      submissions: own,
      mySubmission,
      status: submissionStatus(asg, mySubmission),
      deadlineLabel: asg.deadline ? displayDate(asg.deadline) : asg.submissionDate || '',
    };
  }

  // Flat list of every submission (admin-assigned + trainee self uploads)
  function allSubmissionRows(db) {
    const rows = [];
    const traineeInfo = (id, fallbackName) => {
      const t = findTrainee(db, id);
      return {
        traineeId: id,
        traineeName: (t && t.fullName) || fallbackName || id,
        ysfCode: (t && t.ysfCode) || '',
        scheme: (t && t.schemeName) || '',
        sector: (t && t.sectorName) || '',
        course: (t && t.courseName) || '',
      };
    };

    (db.assignments || []).forEach(a => {
      (a.submissions || []).forEach(s => {
        const info = traineeInfo(s.traineeId, s.traineeName);
        rows.push({
          ...info,
          scheme: info.scheme || a.scheme || '',
          sector: info.sector || a.sector || '',
          course: info.course || a.course || '',
          source: 'assigned',
          assignmentId: a.id,
          assignmentName: a.name,
          submissionId: s.id,
          submittedAt: s.submittedAt,
          late: !!s.late,
          text: s.text || '',
          attachments: s.attachments || [],
          maxMarks: a.marks,
          gradedMarks: s.gradedMarks ?? null,
          gradeStatus: s.gradeStatus || 'Pending',
          remarks: s.remarks || '',
          gradedAt: s.gradedAt || null,
        });
      });
    });

    (db.selfAssignments || []).forEach(s => {
      rows.push({
        ...traineeInfo(s.traineeId, s.traineeName),
        source: 'self',
        assignmentId: 'SELF',
        assignmentName: s.name,
        submissionId: s.id,
        submittedAt: s.submittedAt,
        late: false,
        text: s.text || '',
        attachments: s.attachments || [],
        maxMarks: s.maxMarks ?? null,
        gradedMarks: s.gradedMarks ?? null,
        gradeStatus: s.gradeStatus || 'Pending',
        remarks: s.remarks || '',
        gradedAt: s.gradedAt || null,
      });
    });

    return rows.sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
  }

  function filterRows(rows, q) {
    return rows.filter(r =>
      (!q.scheme || norm(r.scheme) === norm(q.scheme)) &&
      (!q.sector || norm(r.sector) === norm(q.sector)) &&
      (!q.course || norm(r.course) === norm(q.course)) &&
      (!q.assignmentId || r.assignmentId === q.assignmentId) &&
      (!q.status || (q.status === 'Pending' ? !['Graded', 'Needs Revision'].includes(r.gradeStatus) : r.gradeStatus === q.status)) &&
      (!q.search || [r.traineeName, r.ysfCode, r.assignmentName].some(v => norm(v).includes(norm(q.search))))
    );
  }

  function findSubmission(db, assignmentId, submissionId) {
    if (assignmentId === 'SELF') {
      const sub = (db.selfAssignments || []).find(s => s.id === submissionId);
      return sub ? { sub, maxMarks: sub.maxMarks ?? null } : null;
    }
    const asg = (db.assignments || []).find(a => a.id === assignmentId);
    if (!asg) return null;
    const sub = (asg.submissions || []).find(s => s.id === submissionId || s.traineeId === submissionId);
    return sub ? { sub, asg, maxMarks: asg.marks } : null;
  }

  async function readStoredFile(url) {
    const filename = path.basename(decodeURIComponent(String(url || '').split('?')[0]));
    if (!filename) return null;
    const localPath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(localPath)) return fs.readFileSync(localPath);
    try {
      const doc = await getFileFromMongo(filename);
      if (doc && doc.data) return Buffer.from(doc.data.buffer || doc.data);
    } catch (e) { /* fall through */ }
    return null;
  }

  // ---------- catalogue for the Scheme / Sector / Course / Zone / Industry dropdowns ----------
  app.get('/api/admin/catalog', (req, res) => {
    const db = getDb();
    const masters = db.masterForms || {};
    const hierarchy = (db.learningResources && db.learningResources.hierarchy) || [];
    const trainees = db.trainees || [];

    const courseLinks = [
      ...trainees.map(t => ({ name: t.courseName, scheme: t.schemeName, sector: t.sectorName })),
      ...hierarchy.map(h => ({ name: h.course, scheme: h.scheme, sector: h.sector })),
      ...(db.assignments || []).map(a => ({ name: a.course, scheme: a.scheme, sector: a.sector })),
      ...(db.tests || []).map(t => ({ name: t.course, scheme: t.scheme, sector: t.sector })),
    ].filter(c => c.name);

    const courses = uniqueSorted(courseLinks.map(c => c.name)).map(name => {
      const links = courseLinks.filter(c => norm(c.name) === norm(name));
      return {
        name,
        schemes: uniqueSorted(links.map(l => l.scheme)),
        sectors: uniqueSorted(links.map(l => l.sector)),
      };
    });

    return res.json({
      success: true,
      schemes: uniqueSorted([...(masters.schemes || []).map(s => s.name), ...trainees.map(t => t.schemeName), ...hierarchy.map(h => h.scheme)]),
      sectors: uniqueSorted([...(masters.sectors || []).map(s => s.name), ...trainees.map(t => t.sectorName), ...hierarchy.map(h => h.sector)]),
      courses,
      zones: uniqueSorted([...(masters.zones || []).map(z => z.name), ...trainees.map(t => t.zoneName)]),
      industries: uniqueSorted([...(masters.companies || []).map(c => c.name), ...trainees.map(t => t.industryPartner)]),
      fileTypes: Object.keys(FILE_TYPE_GROUPS),
    });
  });

  // ==========================================
  // ASSIGNMENTS — trainee (mobile app)
  // ==========================================

  // Own uploads that were not assigned by the admin ("NOT ASSIGNED BY ADMIN" branch)
  app.get('/api/assignments/self', (req, res) => {
    const db = getDb();
    const trainee = findTrainee(db, req.query.traineeId);
    const list = (db.selfAssignments || []).filter(s => trainee && s.traineeId === trainee.id);
    return res.json({ success: true, data: list });
  });

  app.post('/api/assignments/self', (req, res) => {
    const { traineeId, name, text, attachments } = req.body || {};
    const db = getDb();
    const trainee = findTrainee(db, traineeId);
    if (!trainee) return res.status(400).json({ success: false, message: 'Unknown trainee' });
    if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: 'Assignment name is required' });
    if (!Array.isArray(attachments) || attachments.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload the assignment file' });
    }

    const entry = {
      id: newId('SELF'),
      name: String(name).trim(),
      traineeId: trainee.id,
      traineeName: trainee.fullName,
      ysfCode: trainee.ysfCode,
      submittedAt: nowStamp(),
      text: text || '',
      attachments: storeAttachments(req, attachments),
      gradeStatus: 'Pending',
      gradedMarks: null,
      maxMarks: null,
      remarks: '',
    };
    db.selfAssignments.unshift(entry);
    saveDb(db);
    return res.json({ success: true, message: 'Assignment uploaded and sent to YSF admin', data: entry });
  });

  // Admin-assigned list for this trainee
  app.get('/api/assignments', (req, res) => {
    const db = getDb();
    const trainee = findTrainee(db, req.query.traineeId);
    const list = (db.assignments || [])
      .filter(a => visibleToTrainee(a, trainee))
      .map(a => assignmentForTrainee(a, trainee));

    if (req.query.filter === 'subjectwise') list.sort((a, b) => String(a.subject || '').localeCompare(String(b.subject || '')));
    return res.json({ success: true, data: list });
  });

  app.get('/api/assignments/:id', (req, res) => {
    const db = getDb();
    const asg = (db.assignments || []).find(a => a.id === req.params.id);
    if (!asg) return res.status(404).json({ success: false, message: 'Assignment not found' });
    return res.json({ success: true, data: assignmentForTrainee(asg, findTrainee(db, req.query.traineeId)) });
  });

  // Trainee uploads the answer file for an admin-assigned assignment
  app.post('/api/assignments/:id/reply', (req, res) => {
    const { traineeId, text, attachments } = req.body || {};
    const db = getDb();
    const asg = (db.assignments || []).find(a => a.id === req.params.id);
    if (!asg) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const trainee = findTrainee(db, traineeId);
    if (!trainee) return res.status(400).json({ success: false, message: 'Unknown trainee' });
    if ((!attachments || attachments.length === 0) && !String(text || '').trim()) {
      return res.status(400).json({ success: false, message: 'Please upload your answer file' });
    }

    const typeError = checkFileTypes(asg, attachments || []);
    if (typeError) return res.status(400).json({ success: false, message: typeError });

    asg.submissions = asg.submissions || [];
    const previous = asg.submissions.find(s => s.traineeId === trainee.id);
    if (previous && previous.gradeStatus === 'Graded') {
      return res.status(409).json({ success: false, message: 'This assignment has already been graded' });
    }

    const end = deadlineEnd(asg.deadline);
    const submission = {
      id: newId('SUB'),
      traineeId: trainee.id,
      traineeName: trainee.fullName,
      ysfCode: trainee.ysfCode,
      submittedAt: nowStamp(),
      late: !!(end && end < new Date()),
      text: text || '',
      attachments: storeAttachments(req, attachments),
      gradeStatus: 'Pending',
    };

    // One live submission per trainee — a resubmission replaces the earlier one
    asg.submissions = [submission, ...asg.submissions.filter(s => s.traineeId !== trainee.id)];
    saveDb(db);

    return res.json({ success: true, message: 'Assignment submitted to YSF admin', data: submission });
  });

  // ==========================================
  // ASSIGNMENTS — admin
  // ==========================================
  function readAssignmentForm(body) {
    const marks = toNumber(body.marks, NaN);
    const errors = [];
    if (!String(body.name || '').trim()) errors.push('Assignment name is required');
    if (!String(body.course || '').trim()) errors.push('Course is required');
    if (!Number.isFinite(marks) || marks <= 0) errors.push('Marks must be greater than 0');
    if (body.deadline && !deadlineEnd(body.deadline)) errors.push('Deadline must be a valid date');

    const types = (Array.isArray(body.allowedFileTypes) ? body.allowedFileTypes : [])
      .filter(t => t === 'any' || FILE_TYPE_GROUPS[t]);

    return {
      errors,
      fields: {
        name: String(body.name || '').trim(),
        scheme: String(body.scheme || '').trim(),
        sector: String(body.sector || '').trim(),
        course: String(body.course || '').trim(),
        zone: String(body.zone || '').trim(),
        industryName: String(body.industryName || '').trim(),
        marks,
        allowedFileTypes: types.length ? types : ['any'],
        deadline: body.deadline || '',
        submissionDate: body.deadline ? displayDate(body.deadline) : '',
        details: String(body.details || '').trim(),
        attachment: body.attachment && body.attachment.url ? {
          name: body.attachment.name, url: body.attachment.url, size: body.attachment.size || ''
        } : null,
      },
    };
  }

  app.post('/api/admin/assignments', (req, res) => {
    const { errors, fields } = readAssignmentForm(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, message: errors.join('. ') });

    const db = getDb();
    const nextNo = (db.assignments || []).reduce((m, a) => Math.max(m, a.no || 0), 0) + 1;
    const asg = {
      id: `ASG-${String(nextNo).padStart(3, '0')}`,
      no: nextNo,
      ...fields,
      shortTitle: fields.course,
      subject: fields.sector,
      topic: '',
      teacher: 'YSF Admin',
      likes: 0,
      status: 'Pending',
      assignedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
      createdAt: new Date().toISOString(),
      submissions: [],
    };
    db.assignments.unshift(asg);
    saveDb(db);
    return res.json({ success: true, message: 'Assignment published to the Kaushalya app', data: asg });
  });

  app.put('/api/admin/assignments/:id', (req, res) => {
    const db = getDb();
    const asg = (db.assignments || []).find(a => a.id === req.params.id);
    if (!asg) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const { errors, fields } = readAssignmentForm(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, message: errors.join('. ') });

    // Keep the existing brief file unless a new one was uploaded or it was removed
    if (!fields.attachment && !req.body.removeAttachment) fields.attachment = asg.attachment || null;
    Object.assign(asg, fields, { updatedAt: new Date().toISOString() });
    saveDb(db);
    return res.json({ success: true, message: 'Assignment updated', data: asg });
  });

  app.delete('/api/admin/assignments/:id', (req, res) => {
    const db = getDb();
    const idx = (db.assignments || []).findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Assignment not found' });
    db.assignments.splice(idx, 1);
    saveDb(db);
    return res.json({ success: true, message: 'Assignment deleted' });
  });

  // SUBMITTED tab: trainee list with Scheme / Course filters
  app.get('/api/admin/assignment-submissions', (req, res) => {
    const db = getDb();
    const all = allSubmissionRows(db);
    const rows = filterRows(all, req.query);
    return res.json({
      success: true,
      total: all.length,
      count: rows.length,
      rows,
      filters: {
        schemes: uniqueSorted(all.map(r => r.scheme)),
        sectors: uniqueSorted(all.map(r => r.sector)),
        courses: uniqueSorted(all.map(r => r.course)),
      },
    });
  });

  // Bulk download (respects the same filters): a .zip of every submitted file + an Excel index
  app.get('/api/admin/assignment-submissions/download', async (req, res) => {
    try {
      const db = getDb();
      const rows = filterRows(allSubmissionRows(db), req.query);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'No submissions match these filters' });

      const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 60) || 'untitled';
      const entries = [];
      const used = new Set();
      const missing = [];

      for (const r of rows) {
        const folder = `${safe(r.source === 'self' ? `Own uploads` : r.assignmentName)}/${safe(`${r.ysfCode || r.traineeId} - ${r.traineeName}`)}`;
        for (const att of r.attachments) {
          const data = await readStoredFile(att.url);
          if (!data) { missing.push(`${r.traineeName}: ${att.name}`); continue; }
          let name = `${folder}/${safe(att.name)}`;
          for (let i = 2; used.has(name); i++) name = `${folder}/${i}_${safe(att.name)}`;
          used.add(name);
          entries.push({ name, data });
        }
      }

      const sheetRows = rows.map((r, i) => ({
        'Sr.': i + 1,
        'YSF Code': r.ysfCode,
        'Trainee Name': r.traineeName,
        'Scheme': r.scheme,
        'Sector': r.sector,
        'Course': r.course,
        'Assignment': r.assignmentName,
        'Type': r.source === 'self' ? 'Own upload' : 'Assigned by admin',
        'Submitted At': r.submittedAt,
        'Late': r.late ? 'Yes' : 'No',
        'Files': r.attachments.map(a => a.name).join(', '),
        'Marks Awarded': r.gradedMarks ?? '',
        'Max Marks': r.maxMarks ?? '',
        'Status': r.gradeStatus,
        'Remarks': r.remarks,
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows), 'Submissions');
      entries.unshift({ name: 'Submissions.xlsx', data: XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) });
      if (missing.length) {
        entries.push({ name: 'MISSING_FILES.txt', data: Buffer.from(`These files could not be found in storage:\n${missing.join('\n')}\n`) });
      }

      const stamp = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="YSF_Assignment_Submissions_${stamp}.zip"`);
      return res.send(createZip(entries));
    } catch (err) {
      console.error('Submission bulk download error:', err);
      return res.status(500).json({ success: false, message: 'Failed to build download: ' + err.message });
    }
  });

  // Give marks — individually or to many trainees at once
  app.post('/api/admin/assignment-submissions/marks', (req, res) => {
    const entries = Array.isArray(req.body && req.body.entries) ? req.body.entries : [];
    if (entries.length === 0) return res.status(400).json({ success: false, message: 'No submissions selected' });

    const db = getDb();
    const problems = [];
    let updated = 0;

    entries.forEach(e => {
      const found = findSubmission(db, e.assignmentId, e.submissionId);
      if (!found) { problems.push(`${e.submissionId}: not found`); return; }
      const marks = toNumber(e.marks, NaN);
      if (!Number.isFinite(marks) || marks < 0) { problems.push(`${found.sub.traineeName}: invalid marks`); return; }
      if (found.maxMarks && marks > found.maxMarks) { problems.push(`${found.sub.traineeName}: marks exceed ${found.maxMarks}`); return; }

      found.sub.gradedMarks = marks;
      found.sub.gradeStatus = e.gradeStatus === 'Needs Revision' ? 'Needs Revision' : 'Graded';
      if (e.remarks !== undefined) found.sub.remarks = String(e.remarks || '');
      found.sub.gradedAt = nowStamp();
      if (e.assignmentId === 'SELF' && e.maxMarks !== undefined && Number.isFinite(toNumber(e.maxMarks, NaN))) {
        found.sub.maxMarks = toNumber(e.maxMarks);
      }
      updated++;
    });

    if (updated) saveDb(db);
    return res.status(updated ? 200 : 400).json({
      success: updated > 0,
      updated,
      problems,
      message: updated ? `Marks saved for ${updated} submission${updated === 1 ? '' : 's'}` : (problems[0] || 'Nothing updated'),
    });
  });

  // Legacy single-grade endpoint (kept for older admin builds)
  app.post('/api/admin/assignments/grade', (req, res) => {
    const { assignmentId, submissionId, remarks } = req.body || {};
    const db = getDb();
    const found = findSubmission(db, assignmentId, submissionId);
    if (!found) return res.status(404).json({ success: false, message: 'Submission not found' });
    found.sub.gradeStatus = req.body.gradeStatus || req.body.status || 'Graded';
    found.sub.gradedMarks = toNumber(req.body.gradedMarks ?? req.body.marks, 0);
    found.sub.remarks = remarks || '';
    found.sub.gradedAt = nowStamp();
    saveDb(db);
    return res.json({ success: true, submission: found.sub });
  });

  // ==========================================
  // TESTS — question Excel parsing
  // ==========================================
  const pick = (row, keys) => {
    for (const k of Object.keys(row)) {
      if (keys.includes(norm(k))) return String(row[k] ?? '').trim();
    }
    return '';
  };

  function parseQuestionSheet(filePath) {
    const workbook = XLSX.readFile(filePath);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
    const questions = [];
    const errors = [];

    rows.forEach((row, i) => {
      const line = i + 2; // header is row 1
      const question = pick(row, ['question', 'question text']);
      if (!question) return;
      const options = [
        pick(row, ['option a', 'a', 'optiona']),
        pick(row, ['option b', 'b', 'optionb']),
        pick(row, ['option c', 'c', 'optionc']),
        pick(row, ['option d', 'd', 'optiond']),
      ].filter(Boolean);
      if (options.length < 2) { errors.push(`Row ${line}: needs at least 2 options`); return; }

      const raw = pick(row, ['correct option', 'correct option (a/b/c/d or 1-4)', 'answer', 'correct answer', 'correct']).toUpperCase();
      const idx = ['A', 'B', 'C', 'D'].indexOf(raw) >= 0 ? ['A', 'B', 'C', 'D'].indexOf(raw) : parseInt(raw, 10) - 1;
      if (!(idx >= 0 && idx < options.length)) { errors.push(`Row ${line}: correct option "${raw || '(blank)'}" is not one of the options`); return; }

      const marks = toNumber(pick(row, ['marks', 'mark']), 1) || 1;
      questions.push({ id: questions.length + 1, question, options, correctIndex: idx, marks });
    });

    if (rows.length === 0) errors.push('The sheet has no data rows');
    return { questions, errors };
  }

  app.get('/api/admin/tests/template', (req, res) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Option', 'Marks'],
      ['What is the mandatory foot protection on a manufacturing shop floor?', 'Canvas sneakers', 'Steel-toed safety shoes', 'Rubber slippers', 'Sports shoes', 'B', 2],
      ['Which formula represents electrical power in a DC circuit?', 'P = V × I', 'P = V / I', 'P = I / R', 'P = R × T', 'A', 2],
    ]);
    ws['!cols'] = [{ wch: 60 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 24 }, { wch: 15 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Questions');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="YSF_Test_Questions_Template.xlsx"');
    return res.send(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  });

  // Upload Excel → preview the parsed questions before Create / Save
  app.post('/api/admin/tests/parse-excel', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please choose an Excel file' });
    try {
      const { questions, errors } = parseQuestionSheet(req.file.path);
      return res.json({
        success: questions.length > 0,
        message: questions.length ? `${questions.length} questions read from ${req.file.originalname}` : (errors[0] || 'No questions found'),
        fileName: req.file.originalname,
        questions,
        errors,
        totalMarks: questions.reduce((s, q) => s + q.marks, 0),
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Could not read the Excel file: ' + err.message });
    } finally {
      fs.unlink(req.file.path, () => {});
    }
  });

  // ==========================================
  // TESTS — admin CRUD
  // ==========================================
  function readTestForm(body, { requireQuestions }) {
    const totalMarks = toNumber(body.totalMarks, NaN);
    const passingMarks = toNumber(body.passingMarks, NaN);
    const duration = parseInt(body.duration, 10);
    const questions = Array.isArray(body.questions) ? body.questions : null;
    const errors = [];

    if (!String(body.name || '').trim()) errors.push('Test name is required');
    if (!String(body.course || '').trim()) errors.push('Course is required');
    if (!Number.isFinite(totalMarks) || totalMarks <= 0) errors.push('Marks must be greater than 0');
    if (!Number.isFinite(passingMarks) || passingMarks < 0) errors.push('Passing marks are required');
    else if (passingMarks > totalMarks) errors.push('Passing marks cannot exceed total marks');
    if (!Number.isFinite(duration) || duration <= 0) errors.push('Test duration must be at least 1 minute');
    if (requireQuestions && (!questions || questions.length === 0)) errors.push('Upload an Excel file with at least one question');

    const cleanQuestions = questions ? questions
      .filter(q => q && String(q.question || '').trim() && Array.isArray(q.options) && q.options.length >= 2)
      .map((q, i) => ({
        id: i + 1,
        question: String(q.question).trim(),
        options: q.options.map(o => String(o)),
        correctIndex: Math.min(Math.max(parseInt(q.correctIndex, 10) || 0, 0), q.options.length - 1),
        marks: toNumber(q.marks, 1) || 1,
      })) : null;

    return {
      errors,
      fields: {
        scheme: String(body.scheme || '').trim(),
        sector: String(body.sector || '').trim(),
        course: String(body.course || '').trim(),
        name: String(body.name || '').trim(),
        totalMarks,
        maxScore: totalMarks,
        passingMarks,
        duration,
        instructions: String(body.instructions || '').trim() || 'You can only select one answer per question.',
        ...(cleanQuestions ? { questions: cleanQuestions } : {}),
        ...(body.sourceFile ? { sourceFile: String(body.sourceFile) } : {}),
      },
    };
  }

  app.post('/api/admin/tests', (req, res) => {
    const { errors, fields } = readTestForm(req.body || {}, { requireQuestions: true });
    if (errors.length) return res.status(400).json({ success: false, message: errors.join('. ') });

    const db = getDb();
    const number = (db.tests || []).reduce((m, t) => Math.max(m, t.number || 0), 0) + 1;
    const test = {
      id: `TEST-${number}`,
      number,
      ...fields,
      testFor: 'Internal Test',
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      createdAt: new Date().toISOString(),
      attachment: null,
      attempts: [],
      status: 'Not solved',
      score: null,
    };
    db.tests.unshift(test);
    saveDb(db);
    return res.json({ success: true, message: 'Test saved and published to the Kaushalya app', data: test });
  });

  app.put('/api/admin/tests/:id', (req, res) => {
    const db = getDb();
    const test = (db.tests || []).find(t => t.id === req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const { errors, fields } = readTestForm(req.body || {}, { requireQuestions: false });
    if (errors.length) return res.status(400).json({ success: false, message: errors.join('. ') });

    Object.assign(test, fields, { updatedAt: new Date().toISOString() });
    saveDb(db);
    return res.json({ success: true, message: 'Test updated', data: test });
  });

  app.delete('/api/admin/tests/:id', (req, res) => {
    const db = getDb();
    const idx = (db.tests || []).findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Test not found' });
    db.tests.splice(idx, 1);
    saveDb(db);
    return res.json({ success: true, message: 'Test deleted' });
  });

  // Allow a retake: clear one trainee's attempt, or every attempt when no trainee is given
  app.post('/api/admin/tests/:id/reset', (req, res) => {
    const db = getDb();
    const test = (db.tests || []).find(t => t.id === req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    const traineeId = req.body && req.body.traineeId;
    test.attempts = traineeId ? (test.attempts || []).filter(a => a.traineeId !== traineeId) : [];
    saveDb(db);
    return res.json({ success: true, message: traineeId ? 'Attempt cleared — trainee can retake the test' : 'All attempts cleared' });
  });

  // ==========================================
  // TESTS — trainee (mobile app)
  // ==========================================
  function testForTrainee(t, trainee, { withQuestions }) {
    const attempt = trainee ? (t.attempts || []).find(a => a.traineeId === trainee.id) : null;
    return {
      id: t.id,
      number: t.number,
      name: t.name,
      scheme: t.scheme || '',
      sector: t.sector || '',
      course: t.course,
      testFor: t.testFor || 'Internal Test',
      date: t.date,
      duration: t.duration,
      totalMarks: t.totalMarks,
      passingMarks: t.passingMarks,
      instructions: t.instructions,
      attachment: t.attachment || null,
      questionCount: (t.questions || []).length,
      status: attempt ? 'Solved' : 'Not solved',
      score: attempt ? attempt.score : null,
      maxScore: t.totalMarks,
      passed: attempt ? attempt.passed : null,
      completedAt: attempt ? attempt.completedAt : null,
      // Correct answers never leave the server before submission
      questions: withQuestions ? (t.questions || []).map(q => ({ id: q.id, question: q.question, options: q.options, marks: q.marks })) : [],
    };
  }

  app.get('/api/tests', (req, res) => {
    const db = getDb();
    const trainee = findTrainee(db, req.query.traineeId);
    const tests = (db.tests || []).filter(t => visibleToTrainee(t, trainee)).map(t => testForTrainee(t, trainee, { withQuestions: false }));

    const byCourse = {};
    tests.forEach(t => {
      const c = byCourse[t.course] || (byCourse[t.course] = { course: t.course, total: 0, solved: 0, unSolved: 0 });
      c.total++;
      if (t.status === 'Solved') c.solved++; else c.unSolved++;
    });

    return res.json({ success: true, courseSummary: Object.values(byCourse), tests });
  });

  app.get('/api/tests/:id', (req, res) => {
    const db = getDb();
    const test = (db.tests || []).find(t => t.id === req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    return res.json({ success: true, data: testForTrainee(test, findTrainee(db, req.query.traineeId), { withQuestions: true }) });
  });

  app.post('/api/tests/:id/submit', (req, res) => {
    const { answers, traineeId } = req.body || {};
    const db = getDb();
    const test = (db.tests || []).find(t => t.id === req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });

    const trainee = findTrainee(db, traineeId);
    if (!trainee) return res.status(400).json({ success: false, message: 'Unknown trainee' });
    test.attempts = test.attempts || [];
    if (test.attempts.some(a => a.traineeId === trainee.id)) {
      return res.status(409).json({ success: false, message: 'You have already attempted this test' });
    }

    const questions = test.questions || [];
    let correctCount = 0;
    let earned = 0;
    let possible = 0;
    const results = questions.map(q => {
      const selected = answers ? answers[q.id] ?? answers[String(q.id)] : undefined;
      const weight = toNumber(q.marks, 1) || 1;
      const isCorrect = selected === q.correctIndex;
      possible += weight;
      if (isCorrect) { correctCount++; earned += weight; }
      return { questionId: q.id, selected: selected ?? null, correctIndex: q.correctIndex, isCorrect };
    });

    // Scale question weights onto the test's total marks
    const score = possible > 0 ? round1((earned / possible) * test.totalMarks) : 0;
    const passed = score >= test.passingMarks;
    const attempt = {
      traineeId: trainee.id,
      traineeName: trainee.fullName,
      ysfCode: trainee.ysfCode,
      score,
      maxScore: test.totalMarks,
      passed,
      correctCount,
      totalQuestions: questions.length,
      completedAt: new Date().toISOString(),
    };
    test.attempts.unshift(attempt);
    saveDb(db);

    return res.json({
      success: true,
      message: 'Test submitted',
      data: {
        testId: test.id,
        testName: test.name,
        totalQuestions: questions.length,
        correctCount,
        score,
        maxScore: test.totalMarks,
        passingMarks: test.passingMarks,
        passed,
        results,
      },
    });
  });

  return { assignmentForTrainee, testForTrainee, findTrainee, visibleToTrainee };
}

module.exports = { registerAssessmentRoutes, migrateAssessmentData };
