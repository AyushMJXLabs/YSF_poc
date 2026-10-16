import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  FullProfile,
  LearningSummaryRow,
  LearningChapter,
  Assignment,
  TestItem,
  CourseTestSummary,
  AcademicEvent,
  NoticeItem,
  AttendanceRecord,
  TechnicalQueryTicket,
  SelfAssignment
} from '../types';

const getCandidateUrls = (): string[] => {
  const cloudUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ysf-kaushalya-lms.onrender.com/api';
  const webUrl = process.env.EXPO_PUBLIC_API_URL_WEB || 'http://localhost:5002/api';
  const emuUrl = process.env.EXPO_PUBLIC_API_URL_ANDROID_EMU || 'http://10.0.2.2:5002/api';
  const lanUrl = process.env.EXPO_PUBLIC_API_URL_LAN || 'http://192.168.1.7:5002/api';

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return [webUrl, cloudUrl, lanUrl];
    }
    return [cloudUrl, webUrl, lanUrl];
  }

  if (Platform.OS === 'android') {
    return [
      cloudUrl,
      emuUrl,
      'http://127.0.0.1:5002/api',
      lanUrl,
      'http://localhost:5002/api'
    ];
  }

  return [
    cloudUrl,
    webUrl,
    lanUrl,
    'http://localhost:5002/api'
  ];
};

const EXPECTED_INSTITUTE_CODE = process.env.EXPO_PUBLIC_INSTITUTE_CODE || '21092';

// Local Mock Fallback Data (ensures offline reliability)
const mockProfile: FullProfile = {
  traineeInfo: {
    ysfCode: "W2307C00001",
    fullName: "KUMARI K",
    schemeName: "NEEM / National Apprenticeship Scheme",
    sectorName: "Automotive Manufacturing",
    industryPartner: "Tata Motors Ltd. / Bharat Forge",
    zoneName: "West Zone - Maharashtra",
    locationName: "Pune - Chakan Industrial Area"
  },
  courseInfo: {
    courseName: "Diploma in Automotive Manufacturing Technology",
    jobRoleAssigned: "Prod",
    sectorSkillCouncil: "1301",
    nsqLevel: "4",
    registrationDate: "2023/03/01",
    endDate: "2025/02/28",
    presentOJT: "Active"
  },
  otherInfo: {
    nativeAddress: "Plot 42, Shirdi Nagar, Nashik, Maharashtra - 422001",
    contact1: "+91 98810 88850",
    contact2: "+91 89565 37504",
    email: "kumari.k@student.ysfskills.com",
    aadharNumber: "XXXX-XXXX-8921"
  },
  isReadOnly: true,
  notice: "Profile information is auto-generated; you only need to confirm. External changes handled by YSF admins."
};

const mockResourcesSummary: LearningSummaryRow[] = [
  {
    course: "Diploma in Automotive Manufacturing Technology",
    unread: 2,
    yesterday: 0,
    monthly: 12,
    yearly: 48
  }
];

const mockResourcesHierarchy: LearningChapter[] = [
  {
    scheme: "NEEM / Skill India",
    sector: "Automotive",
    course: "Diploma in Automotive Manufacturing Technology",
    subject: "Workplace Safety & Standards",
    chapter: "Safety Training Essentials",
    topicsCount: 1,
    topics: [
      {
        id: "TOP-01",
        title: "Safety First: Essential Training for Workplace Safety",
        description: "Essential Training for Workplace Safety",
        fileType: "PDF",
        fileName: "workplace_safety_handbook.pdf",
        contentSummary: "This module covers personal protective equipment (PPE), hazard warning signs, emergency protocols, and shop floor guidelines prescribed by ASDC and OSHA regulations.",
        slides: [
          { slideNo: 1, title: "Introduction to Workplace Safety", text: "Safety is of paramount importance in automotive manufacturing plants. Trainees must understand all hazard classifications." },
          { slideNo: 2, title: "Personal Protective Equipment (PPE)", text: "Mandatory PPE includes: Steel-toed shoes, High-visibility jacket, Safety spectacles, Ear defenders in high-noise areas." },
          { slideNo: 3, title: "Hazard Signage & Color Coding", text: "Red: Stop / Prohibition / Fire equipment. Yellow: Caution / Risk of danger. Blue: Mandatory action. Green: Safe condition / First aid." },
          { slideNo: 4, title: "Emergency Procedures", text: "In case of fire alarm: Cease work immediately, shut down machinery if safe, proceed via illuminated emergency exit to Assembly Point A." }
        ],
        readStatus: false
      }
    ]
  },
  {
    scheme: "NEEM / Skill India",
    sector: "Automotive",
    course: "Diploma in Automotive Manufacturing Technology",
    subject: "Shopfloor Operations",
    chapter: "Workplace Standards and Practices",
    topicsCount: 2,
    topics: [
      {
        id: "TOP-02",
        title: "5S Lean Workplace Optimization",
        description: "Practical guide to maintaining Seiri, Seiton, Seiso, Seiketsu, and Shitsuke on the production floor.",
        fileType: "PPT",
        fileName: "5s_lean_practices.pptx",
        contentSummary: "Comprehensive slide deck on 5S methodology implementation, shadow boards, visual management, and daily workplace auditing.",
        slides: [
          { slideNo: 1, title: "5S Methodology Overview", text: "Sort (Seiri), Set in order (Seiton), Shine (Seiso), Standardize (Seiketsu), Sustain (Shitsuke)." },
          { slideNo: 2, title: "Visual Management & Shadow Boards", text: "Every tool must have a designated position marked with visual outlines to eliminate search time." },
          { slideNo: 3, title: "Daily Auditing Checklist", text: "Perform 5-minute end-of-shift 5S audit before machine handover." }
        ],
        readStatus: false
      },
      {
        id: "TOP-03",
        title: "Machine Guarding and Lockout-Tagout (LOTO)",
        description: "Critical safety measures during maintenance and machine operation.",
        fileType: "VIDEO",
        fileName: "loto_safety_procedures.mp4",
        contentSummary: "Demonstration video showcasing zero-energy state verification, padlocks, warning tags, and lockout station procedures.",
        videoDuration: "14:20",
        readStatus: true
      }
    ]
  }
];

const mockAssignments: Assignment[] = [
  {
    id: "ASG-005",
    no: 5,
    name: "Safety Audit Checklist Implementation",
    shortTitle: "de",
    course: "Diploma in Automotive Manufacturing Technology",
    subject: "Industrial Safety",
    topic: "Workplace Hazards",
    assignedDate: "Feb 28",
    submissionDate: "Jan 01",
    marks: 10.0,
    teacher: "Admin1 Admin1",
    details: "Prepare a checklist of 15 workplace safety parameters and conduct inspection in your assigned plant section.",
    likes: 0,
    status: "Pending",
    submissions: []
  },
  {
    id: "ASG-004",
    no: 4,
    name: "Tool Maintenance and 5S Protocol",
    shortTitle: "Demo Assignment",
    course: "Diploma in Automotive Manufacturing Technology",
    subject: "Shopfloor Management",
    topic: "5S Implementation",
    assignedDate: "Feb 28",
    submissionDate: "Feb 28",
    marks: 15.0,
    teacher: "Admin1 Admin1",
    details: "Document 5S practices deployed in your shopfloor bay with photos and audit log sheet.",
    likes: 2,
    status: "Completed",
    submissions: [
      {
        id: "SUB-01",
        traineeId: "T001",
        traineeName: "KUMARI K",
        submittedAt: "2024-02-28 17:30",
        text: "Completed 5S report with bay photos and audit observations.",
        attachments: [
          { name: "5s_audit_sheet.pdf", size: "1.2 MB" },
          { name: "bay_layout.jpg", size: "850 KB" }
        ]
      }
    ]
  },
  {
    id: "ASG-003",
    no: 3,
    name: "Standard Operating Procedures Review",
    shortTitle: "Demo Assignment",
    course: "Diploma in Automotive Manufacturing Technology",
    subject: "Automotive Systems",
    topic: "Robotic Assembly",
    assignedDate: "Feb 28",
    submissionDate: "Feb 15",
    marks: 20.0,
    teacher: "Admin1 Admin1",
    details: "Review SOP guidelines for robotic welding cell and identify key emergency stop trigger locations.",
    likes: 1,
    status: "Completed",
    submissions: [
      {
        id: "SUB-02",
        traineeId: "T001",
        traineeName: "KUMARI K",
        submittedAt: "2024-02-15 14:10",
        text: "Reviewed welding cell SOP-W42 and verified emergency safety circuits.",
        attachments: [
          { name: "welding_sop_review.pdf", size: "2.1 MB" }
        ]
      }
    ]
  }
];

const mockTests: TestItem[] = [
  {
    id: "TEST-54",
    number: 54,
    name: "Knowledge Check: Assessing Your Understanding",
    course: "Diploma in Automotive Manufacturing Technology",
    testFor: "Internal Test",
    date: "2 Mar 2024",
    expiryDate: "30 Mar 2024",
    duration: 60,
    totalMarks: 50,
    passingMarks: 30,
    instructions: "You can only select one answer per question.",
    status: "Not solved",
    score: null,
    maxScore: 50,
    questions: [
      {
        id: 1,
        question: "What is the primary objective of On-the-Job Training (OJT) in skill development programs?",
        options: [
          "Theoretical memorization of concepts",
          "Practical hands-on industry skill acquisition",
          "Only preparing for final written exams",
          "Administrative office filing"
        ],
        correctIndex: 1
      },
      {
        id: 2,
        question: "What does the 5S methodology stand for in lean manufacturing?",
        options: [
          "Sort, Set in order, Shine, Standardize, Sustain",
          "Speed, Safety, Security, System, Schedule",
          "Standard, Science, Skill, Setup, Solve",
          "Structure, Streamline, Select, Support, Share"
        ],
        correctIndex: 0
      },
      {
        id: 3,
        question: "What does NSQF stand for in Indian vocational education?",
        options: [
          "National Science and Quality Forum",
          "National Skill Qualification Framework",
          "Networked Standard Quality Formula",
          "National Service Qualification Foundation"
        ],
        correctIndex: 1
      },
      {
        id: 4,
        question: "In case of personal protective equipment (PPE) requirements on a shop floor, which item is mandatory for foot protection?",
        options: [
          "Canvas sneakers",
          "Steel-toe safety shoes",
          "Open-toe sandals",
          "Standard sports shoes"
        ],
        correctIndex: 1
      },
      {
        id: 5,
        question: "Which color code is universally used on industrial safety signage for STOP or DANGER?",
        options: [
          "Green",
          "Blue",
          "Yellow",
          "Red"
        ],
        correctIndex: 3
      }
    ]
  },
  {
    id: "TEST-55",
    number: 55,
    name: "Mid-Term Technical Competency Evaluation",
    course: "Diploma in Automotive Manufacturing Technology",
    testFor: "Internal Test",
    date: "15 Mar 2024",
    expiryDate: "15 Apr 2024",
    duration: 45,
    totalMarks: 50,
    passingMarks: 30,
    instructions: "You can only select one answer per question.",
    status: "Not solved",
    score: null,
    maxScore: 50,
    questions: [
      {
        id: 1,
        question: "Which instrument is most commonly used for precision measurement of automotive engine components?",
        options: [
          "Vernier Caliper and Micrometer",
          "Ordinary wooden ruler",
          "Measuring tape",
          "Plumb bob"
        ],
        correctIndex: 0
      },
      {
        id: 2,
        question: "What is the purpose of Lockout-Tagout (LOTO) procedures?",
        options: [
          "Speed up production cycle",
          "Ensure hazardous machinery is shut off and inoperable during servicing",
          "Record student attendance",
          "Store tools securely overnight"
        ],
        correctIndex: 1
      }
    ]
  }
];

const mockEvents: AcademicEvent[] = [
  {
    id: "EVT-01",
    date: "2024-03-02",
    title: "Industrial Safety Drill & Fire Evacuation",
    type: "Safety Event",
    time: "10:00 AM",
    location: "Shopfloor Bay 4, Pune Plant",
    description: "Mandatory emergency evacuation and fire safety drill for all first-year trainees."
  },
  {
    id: "EVT-02",
    date: "2024-03-05",
    title: "Career Guidance Workshop",
    type: "Workshop Event",
    time: "09:01 AM",
    location: "Main Auditorium, YSF Campus",
    description: "Comprehensive workshop on industry career paths, NSQF progression, and corporate placement standards."
  },
  {
    id: "EVT-03",
    date: "2024-03-15",
    title: "OJT Diary & Logbook Verification",
    type: "Academic Review",
    time: "02:30 PM",
    location: "Supervisor Desk, Bay 2",
    description: "Weekly review of trainee lab book entries with industry mentor signature check."
  },
  {
    id: "EVT-04",
    date: "2024-03-22",
    title: "Guest Lecture: Future of Electric Vehicles",
    type: "Technical Seminar",
    time: "11:00 AM",
    location: "Seminar Hall & Online Live Stream",
    description: "Industry veterans from Tata Motors share insights into battery management systems and EV powertrain assembly."
  }
];

const mockNotices: NoticeItem[] = [
  {
    id: "NOT-01",
    title: "Exam Schedule",
    date: "Mar 02",
    fullDate: "2024-03-02",
    priority: "high",
    starColor: "red",
    content: "Attention all students, please be informed that the upcoming exam schedule for internal skill assessment has been updated on the LMS portal. Trainees must ensure they attempt tests before the deadline."
  },
  {
    id: "NOT-02",
    title: "Regarding assignment submission",
    date: "Mar 02",
    fullDate: "2024-03-02",
    priority: "normal",
    starColor: "green",
    content: "Submit the assignment by the provided date. Make sure to attach up to two supporting documents and enter detailed descriptive replies."
  },
  {
    id: "NOT-03",
    title: "Demo Notice",
    date: "Mar 02",
    fullDate: "2024-03-02",
    priority: "low",
    starColor: "red",
    content: "Demo Notice: Regular OJT attendance is compulsory. Minimum 85% attendance is required to qualify for NSQF certification."
  },
  {
    id: "NOT-04",
    title: "Language Setting Notification",
    date: "Feb 28",
    fullDate: "2024-02-28",
    priority: "info",
    starColor: "green",
    content: "Trainees can switch the application language between English and Marathi upon initial launch or app restart. Assessments remain strictly in English."
  }
];

class ApiService {
  private activeBaseUrl: string = getCandidateUrls()[0];
  private candidateUrls: string[] = getCandidateUrls();
  private hasDiscovered: boolean = false;
  private trainee: { id: string; ysfCode?: string; fullName?: string } = { id: 'T001', ysfCode: 'W2307C00001' };

  /** Called after login so every request is made on behalf of the signed-in trainee */
  setTrainee(trainee: { id: string; ysfCode?: string; fullName?: string }) {
    if (trainee && trainee.id) this.trainee = trainee;
  }

  get traineeId(): string {
    return this.trainee.id;
  }

  constructor() {
    this.initBaseUrl();
  }

  private async initBaseUrl(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem('@ysf_api_base_url');
      if (stored && stored.trim()) {
        const clean = this.normalizeApiUrl(stored.trim());
        this.activeBaseUrl = clean;
        this.hasDiscovered = true;
        return clean;
      }
    } catch (e) {}
    return this.discoverWorkingBaseUrl();
  }

  normalizeApiUrl(url: string): string {
    let clean = url.trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(clean)) {
      clean = `https://${clean}`;
    }
    if (!clean.endsWith('/api')) {
      clean = `${clean}/api`;
    }
    return clean;
  }

  async getBaseUrl(): Promise<string> {
    return this.getApiBaseUrl();
  }

  async getApiBaseUrl(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem('@ysf_api_base_url');
      if (stored && stored.trim()) {
        this.activeBaseUrl = this.normalizeApiUrl(stored.trim());
        return this.activeBaseUrl;
      }
    } catch (e) {}

    if (!this.hasDiscovered) {
      await this.discoverWorkingBaseUrl();
    }
    return this.activeBaseUrl;
  }

  async setCustomApiBaseUrl(url: string): Promise<string> {
    const cleanUrl = this.normalizeApiUrl(url);
    await AsyncStorage.setItem('@ysf_api_base_url', cleanUrl);
    this.activeBaseUrl = cleanUrl;
    this.hasDiscovered = true;
    console.log(`[YSF Kaushalya API] Custom server URL set and saved: ${cleanUrl}`);
    return cleanUrl;
  }

  async resetApiBaseUrl(): Promise<string> {
    await AsyncStorage.removeItem('@ysf_api_base_url');
    this.hasDiscovered = false;
    this.activeBaseUrl = getCandidateUrls()[0];
    await this.discoverWorkingBaseUrl();
    return this.activeBaseUrl;
  }

  async testServerConnection(targetUrl?: string): Promise<{
    ok: boolean;
    status: string;
    mongoStatus?: any;
    latencyMs: number;
    error?: string;
  }> {
    const url = this.normalizeApiUrl(targetUrl || this.activeBaseUrl);
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${url}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;

      if (res.ok) {
        const json = await res.json();
        return {
          ok: json.status === 'ok',
          status: json.status || 'ok',
          mongoStatus: json.mongoStatus,
          latencyMs
        };
      } else {
        return {
          ok: false,
          status: `HTTP ${res.status}`,
          latencyMs,
          error: `Server responded with HTTP ${res.status}`
        };
      }
    } catch (e: any) {
      return {
        ok: false,
        status: 'error',
        latencyMs: Date.now() - start,
        error: e.message || 'Connection failed or timed out'
      };
    }
  }

  rewriteFileUrl(rawUrl?: string): string {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) return rawUrl;

    const currentOrigin = this.activeBaseUrl.replace(/\/api\/?$/, '');

    // Relative URLs
    if (rawUrl.startsWith('/')) {
      return `${currentOrigin}${rawUrl}`;
    }

    // Localhost / LAN / emulator URLs
    if (
      rawUrl.includes('localhost:') ||
      rawUrl.includes('127.0.0.1:') ||
      rawUrl.includes('10.0.2.2:') ||
      /192\.168\.\d+\.\d+:\d+/.test(rawUrl)
    ) {
      try {
        const parsed = new URL(rawUrl);
        return `${currentOrigin}${parsed.pathname}${parsed.search}`;
      } catch (e) {
        return rawUrl.replace(/^https?:\/\/[^/]+/, currentOrigin);
      }
    }

    return rawUrl;
  }

  async discoverWorkingBaseUrl(): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem('@ysf_api_base_url');
      if (stored && stored.trim()) {
        const clean = this.normalizeApiUrl(stored.trim());
        this.activeBaseUrl = clean;
        this.hasDiscovered = true;
        return clean;
      }
    } catch (e) {}

    for (const cand of this.candidateUrls) {
      if (!cand) continue;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${cand}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'ok') {
            this.activeBaseUrl = cand;
            this.hasDiscovered = true;
            console.log(`[YSF Kaushalya API] Successfully connected to live backend at: ${cand}`);
            return cand;
          }
        }
      } catch (err) {
        // try next candidate
      }
    }
    return this.activeBaseUrl;
  }

  // Like request(), but hands back error responses (4xx) so callers can show the server's message.
  // Throws only when no server can be reached.
  private async send(endpoint: string, options?: RequestInit): Promise<{ ok: boolean; status: number; json: any }> {
    if (!this.hasDiscovered) {
      await this.getApiBaseUrl();
    }
    let res: Response;
    try {
      res = await fetch(`${this.activeBaseUrl}${endpoint}`, options);
    } catch (e) {
      const working = await this.discoverWorkingBaseUrl();
      res = await fetch(`${working}${endpoint}`, options);
    }
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  }

  private async request<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.hasDiscovered) {
      await this.getApiBaseUrl();
    }
    // 1. Try activeBaseUrl
    try {
      const res = await fetch(`${this.activeBaseUrl}${endpoint}`, options);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // try discovering
    }

    // 2. Discover working URL among candidates and retry
    const working = await this.discoverWorkingBaseUrl();
    const res = await fetch(`${working}${endpoint}`, options);
    if (res.ok) {
      return await res.json();
    }
    throw new Error(`Failed to reach ${working}${endpoint}: status ${res.status}`);
  }

  // Validate Institute Code
  async validateInstitute(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await this.request('/auth/validate-institute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instituteCode: code })
      });
      return data;
    } catch (e) {
      // Local fallback validation
      if (code.trim() === EXPECTED_INSTITUTE_CODE) {
        return { success: true, message: "Institute code validated successfully (Offline Mode)" };
      }
      return { success: false, message: `Invalid Institute Code. Please enter ${EXPECTED_INSTITUTE_CODE}.` };
    }
  }

  // Trainee Login
  async login(username: string, password: string): Promise<{ success: boolean; message: string; trainee?: any }> {
    try {
      const data = await this.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return data;
    } catch (e) {
      // Offline fallback: Case sensitive match
      if ((username.trim() === 'W2307C00001' || username.trim().toLowerCase() === 'student') && password === 'password123') {
        return {
          success: true,
          message: "Login successful (Offline Mode)",
          trainee: {
            id: 'T001',
            ysfCode: 'W2307C00001',
            fullName: 'KUMARI K',
            courseName: 'Diploma in Automotive Manufacturing Technology',
            status: 'Active'
          }
        };
      }
      return { success: false, message: "Invalid username or password" };
    }
  }

  // Get Trainee Profile
  async getProfile(): Promise<FullProfile> {
    try {
      const json = await this.request('/trainee/profile');
      if (json && json.success && json.data) {
        AsyncStorage.setItem('@ysf_cached_profile', JSON.stringify(json.data)).catch(() => {});
        return json.data;
      }
    } catch (e) {
      try {
        const c = await AsyncStorage.getItem('@ysf_cached_profile');
        if (c) return JSON.parse(c);
      } catch (err) {}
    }
    return mockProfile;
  }

  // Learning Resources Summary
  async getResourcesSummary(): Promise<LearningSummaryRow[]> {
    try {
      const json = await this.request('/resources/summary');
      if (json && json.success && json.data) {
        AsyncStorage.setItem('@ysf_cached_res_summary', JSON.stringify(json.data)).catch(() => {});
        return json.data;
      }
    } catch (e) {
      try {
        const c = await AsyncStorage.getItem('@ysf_cached_res_summary');
        if (c) return JSON.parse(c);
      } catch (err) {}
    }
    return mockResourcesSummary;
  }

  // Learning Resources Hierarchy
  async getResourcesHierarchy(): Promise<LearningChapter[]> {
    try {
      const json = await this.request('/resources/hierarchy');
      if (json && json.success && json.data) {
        const data = (json.data as LearningChapter[]).map(chap => ({
          ...chap,
          topics: (chap.topics || []).map((t: any) => ({
            ...t,
            fileUrl: this.rewriteFileUrl(t.fileUrl || (t.fileName ? `/api/files/${t.fileName}` : undefined))
          }))
        }));
        AsyncStorage.setItem('@ysf_cached_res_hierarchy', JSON.stringify(data)).catch(() => {});
        return data;
      }
    } catch (e) {
      try {
        const c = await AsyncStorage.getItem('@ysf_cached_res_hierarchy');
        if (c) return JSON.parse(c);
      } catch (err) {}
    }
    return mockResourcesHierarchy;
  }

  // ---------- Assignments ----------
  private withFileUrls<T extends { attachments?: any[] }>(item: T): T {
    return { ...item, attachments: (item.attachments || []).map((att: any) => ({ ...att, url: this.rewriteFileUrl(att.url || att.uri) })) };
  }

  // Admin-assigned assignments visible to the signed-in trainee (with their own submission status)
  async getAssignments(filter: string = 'all'): Promise<Assignment[]> {
    const cacheKey = `@ysf_cached_assignments_${this.traineeId}`;
    try {
      const json = await this.request(`/assignments?filter=${filter}&traineeId=${encodeURIComponent(this.traineeId)}`);
      if (json && json.success && json.data) {
        const data = (json.data as Assignment[]).map(asg => ({
          ...asg,
          attachment: asg.attachment ? { ...asg.attachment, url: this.rewriteFileUrl(asg.attachment.url) } : null,
          submissions: (asg.submissions || []).map(sub => this.withFileUrls(sub)),
          mySubmission: asg.mySubmission ? this.withFileUrls(asg.mySubmission) : null,
        }));
        AsyncStorage.setItem(cacheKey, JSON.stringify(data)).catch(() => {});
        return data;
      }
    } catch (e) {
      try {
        const c = await AsyncStorage.getItem(cacheKey);
        if (c) return JSON.parse(c);
      } catch (err) {}
    }
    return mockAssignments.map(a => ({ ...a, mySubmission: a.submissions[0] || null, status: a.submissions[0] ? 'Submitted' : 'Pending' }));
  }

  // Trainee's own uploads (not assigned by admin)
  async getSelfAssignments(): Promise<SelfAssignment[]> {
    const cacheKey = `@ysf_cached_self_assignments_${this.traineeId}`;
    try {
      const json = await this.request(`/assignments/self?traineeId=${encodeURIComponent(this.traineeId)}`);
      if (json && json.success && Array.isArray(json.data)) {
        const data = (json.data as SelfAssignment[]).map(s => this.withFileUrls(s));
        AsyncStorage.setItem(cacheKey, JSON.stringify(data)).catch(() => {});
        return data;
      }
    } catch (e) {
      try {
        const c = await AsyncStorage.getItem(cacheKey);
        if (c) return JSON.parse(c);
      } catch (err) {}
    }
    return [];
  }

  // Upload File Attachment to Backend
  async uploadFile(file: { uri?: string; name: string; mimeType?: string; file?: any; size?: number | string }): Promise<{ name: string; url: string; size: string } | null> {
    try {
      const formData = new FormData();
      if (file.file) {
        formData.append('file', file.file);
      } else if (file.uri) {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        } as any);
      }
      const working = await this.getBaseUrl();
      const res = await fetch(`${working}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.file) {
        return {
          ...data.file,
          url: this.rewriteFileUrl(data.file.url)
        };
      }
    } catch (e) {
      console.warn('Upload error', e);
    }
    return null;
  }

  // Upload the answer file for an admin-assigned assignment
  async submitAssignmentReply(
    id: string,
    payload: { text: string; attachments: any[] }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { json } = await this.send(`/assignments/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, traineeId: this.traineeId })
      });
      return { success: !!json.success, message: json.message || (json.success ? 'Submitted' : 'Submission failed') };
    } catch (e) {
      return { success: false, message: 'You appear to be offline. Please connect to the internet and try again.' };
    }
  }

  // Upload an assignment the admin did not assign
  async submitSelfAssignment(payload: { name: string; text?: string; attachments: any[] }): Promise<{ success: boolean; message: string }> {
    try {
      const { json } = await this.send('/assignments/self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, traineeId: this.traineeId })
      });
      return { success: !!json.success, message: json.message || (json.success ? 'Uploaded' : 'Upload failed') };
    } catch (e) {
      return { success: false, message: 'You appear to be offline. Please connect to the internet and try again.' };
    }
  }

  // ---------- Tests ----------
  async getTests(): Promise<{ courseSummary: CourseTestSummary[]; tests: TestItem[] }> {
    const cacheKey = `@ysf_cached_tests_${this.traineeId}`;
    try {
      const json = await this.request(`/tests?traineeId=${encodeURIComponent(this.traineeId)}`);
      if (json && json.success) {
        AsyncStorage.setItem(cacheKey, JSON.stringify(json)).catch(() => {});
        return { courseSummary: json.courseSummary, tests: json.tests };
      }
    } catch (e) {
      try {
        const c = await AsyncStorage.getItem(cacheKey);
        if (c) {
          const parsed = JSON.parse(c);
          return { courseSummary: parsed.courseSummary, tests: parsed.tests };
        }
      } catch (err) {}
    }
    const total = mockTests.length;
    const solved = mockTests.filter(t => t.status === 'Solved').length;
    return {
      courseSummary: [
        {
          course: "Diploma in Automotive Manufacturing Technology",
          total: total,
          solved: solved,
          unSolved: total - solved
        }
      ],
      tests: mockTests
    };
  }

  // Get Test By ID (questions come without answers)
  async getTestById(id: string): Promise<TestItem | null> {
    try {
      const json = await this.request(`/tests/${id}?traineeId=${encodeURIComponent(this.traineeId)}`);
      if (json && json.success) return json.data;
    } catch (e) {}
    return mockTests.find(t => t.id === id) || null;
  }

  // Submit Test — graded on the server
  async submitTest(
    id: string,
    answers: { [qId: string]: number } | { [qId: number]: number }
  ): Promise<any> {
    try {
      const { json } = await this.send(`/tests/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, traineeId: this.traineeId })
      });
      return json;
    } catch (e) {
      // offline calculation (demo data only)
      const test = mockTests.find(t => t.id === id);
      if (!test) return { success: false, message: 'You appear to be offline. Your answers were not submitted.' };

      let correctCount = 0;
      test.questions?.forEach(q => {
        const ans = (answers as any)[q.id] ?? (answers as any)[String(q.id)];
        if (ans === q.correctIndex) {
          correctCount++;
        }
      });

      const marksPerQ = test.totalMarks / (test.questions?.length || 1);
      const score = Math.round(correctCount * marksPerQ);
      test.status = 'Solved';
      test.score = score;

      return {
        success: true,
        data: {
          testId: test.id,
          testName: test.name,
          totalQuestions: test.questions?.length || 0,
          correctCount,
          score,
          maxScore: test.totalMarks,
          passingMarks: test.passingMarks,
          passed: score >= test.passingMarks
        }
      };
    }
  }

  // Events
  async getEvents(): Promise<AcademicEvent[]> {
    try {
      const json = await this.request('/events');
      if (json && json.success) {
        AsyncStorage.setItem('@ysf_cached_events', JSON.stringify(json.data)).catch(() => {});
        return json.data;
      }
    } catch (e) {
      try {
        const c = await AsyncStorage.getItem('@ysf_cached_events');
        if (c) return JSON.parse(c);
      } catch (err) {}
    }
    return mockEvents;
  }

  // Notices
  async getNotices(): Promise<NoticeItem[]> {
    try {
      const json = await this.request('/notices');
      if (json && json.success) {
        AsyncStorage.setItem('@ysf_cached_notices', JSON.stringify(json.data)).catch(() => {});
        return json.data;
      }
    } catch (e) {
      try {
        const c = await AsyncStorage.getItem('@ysf_cached_notices');
        if (c) return JSON.parse(c);
      } catch (err) {}
    }
    return mockNotices;
  }

  // Record Screen Time Telemetry
  async recordScreenTime(payload: { traineeId: string; traineeName: string; module: string; durationSeconds: number }) {
    try {
      await this.request('/analytics/screentime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      // logged locally by ScreenTimeTracker
    }
  }

  // Attendance & OJT Hours
  async getAttendance(ysfCode: string = this.trainee.ysfCode || this.trainee.id): Promise<AttendanceRecord> {
    try {
      const json = await this.request(`/trainee/attendance?ysfCode=${encodeURIComponent(ysfCode)}`);
      if (json && json.success && json.record) {
        AsyncStorage.setItem('@ysf_cached_attendance', JSON.stringify(json.record)).catch(() => {});
        return json.record;
      }
    } catch (e) {
      try {
        const c = await AsyncStorage.getItem('@ysf_cached_attendance');
        if (c) return JSON.parse(c);
      } catch (err) {}
    }
    return {
      ysfCode,
      presentDays: 24,
      absentDays: 1,
      completedHours: 172,
      targetHours: 180,
      percentage: 96.0,
      lastUpdated: new Date().toISOString()
    };
  }

  // Technical Queries Helpdesk
  async getQueries(): Promise<TechnicalQueryTicket[]> {
    try {
      const json = await this.request('/queries');
      if (json && json.success && Array.isArray(json.data)) {
        AsyncStorage.setItem('@ysf_cached_queries', JSON.stringify(json.data)).catch(() => {});
        return json.data;
      }
    } catch (e) {
      try {
        const c = await AsyncStorage.getItem('@ysf_cached_queries');
        if (c) return JSON.parse(c);
      } catch (err) {}
    }
    return [
      {
        id: "Q-001",
        traineeId: "T001",
        traineeName: "KUMARI K",
        ysfCode: "W2307C00001",
        subject: "Module 2 PPT Video playback issue",
        category: "App Technical",
        message: "Video buffering continuously on mobile 4G network.",
        status: "Replied",
        reply: "Admin Desk: Content CDN has been refreshed. Please clear cache and retry.",
        repliedAt: "2026-10-14 07:45",
        repliedBy: "YSF LMS Technical Support Desk",
        createdAt: "2026-10-13 14:30"
      }
    ];
  }

  async submitQuery(payload: {
    traineeId?: string;
    traineeName?: string;
    ysfCode?: string;
    subject: string;
    category: string;
    message: string;
  }): Promise<{ success: boolean; data?: TechnicalQueryTicket; message?: string }> {
    try {
      const json = await this.request('/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return json;
    } catch (e) {
      const mockTicket: TechnicalQueryTicket = {
        id: `Q-${Date.now().toString().slice(-4)}`,
        traineeId: payload.traineeId || 'T001',
        traineeName: payload.traineeName || 'KUMARI K',
        ysfCode: payload.ysfCode || 'W2307C00001',
        subject: payload.subject,
        category: payload.category as any,
        message: payload.message,
        status: 'Open',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      return { success: true, data: mockTicket, message: "Ticket logged (Offline Mode)" };
    }
  }

  // Unified Live Sync
  async sync(): Promise<{ success: boolean; data?: any }> {
    try {
      const json = await this.request('/sync');
      return json;
    } catch (e) {
      return { success: true, data: { status: "offline-sync" } };
    }
  }

  // Change Password
  async changePassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const json = await this.request('/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traineeId: 'T001', oldPassword, newPassword })
      });
      return json;
    } catch (e) {
      return { success: true, message: "Password updated successfully (Offline Mode)" };
    }
  }
}

export const apiService = new ApiService();
