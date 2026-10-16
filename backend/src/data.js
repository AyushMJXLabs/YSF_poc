const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

const initialData = {
  trainees: [
    {
      id: "T001",
      ysfCode: "W2307C00001",
      username: "W2307C00001",
      password: "password123",
      fullName: "KUMARI K",
      schemeName: "NEEM / National Apprenticeship Scheme",
      sectorName: "Automotive Manufacturing",
      industryPartner: "Tata Motors Ltd. / Bharat Forge",
      zoneName: "West Zone - Maharashtra",
      locationName: "Pune - Chakan Industrial Area",
      courseName: "Diploma in Automotive Manufacturing Technology",
      jobRoleAssigned: "Production Technician - Prod",
      sectorSkillCouncil: "1301 - ASDC",
      nsqLevel: "4",
      registrationDate: "2023/03/01",
      endDate: "2025/02/28",
      presentOJT: "Active",
      nativeAddress: "Plot 42, Shirdi Nagar, Nashik, Maharashtra - 422001",
      contact1: "+91 98810 88850",
      contact2: "+91 89565 37504",
      email: "kumari.k@student.ysfskills.com",
      aadharNumber: "XXXX-XXXX-8921",
      status: "Active", // Active, Left, Completed
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80"
    },
    {
      id: "T002",
      ysfCode: "W2307C00002",
      username: "W2307C00002",
      password: "password123",
      fullName: "RAHUL SHINDE",
      schemeName: "NEEM / National Apprenticeship Scheme",
      sectorName: "Automotive Manufacturing",
      industryPartner: "Mahindra & Mahindra",
      zoneName: "West Zone - Maharashtra",
      locationName: "Nashik MIDC",
      courseName: "Diploma in Automotive Manufacturing Technology",
      jobRoleAssigned: "Assembly Line Operator",
      sectorSkillCouncil: "1301 - ASDC",
      nsqLevel: "4",
      registrationDate: "2023/03/01",
      endDate: "2025/02/28",
      presentOJT: "Active",
      nativeAddress: "Kothrud, Pune, Maharashtra - 411038",
      contact1: "+91 98221 44332",
      contact2: "+91 94220 55667",
      email: "rahul.s@student.ysfskills.com",
      aadharNumber: "XXXX-XXXX-4512",
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80"
    }
  ],
  learningResources: {
    summary: [
      {
        course: "Diploma in Automotive Manufacturing Technology",
        unread: 2,
        yesterday: 0,
        monthly: 12,
        yearly: 48
      }
    ],
    hierarchy: [
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
    ]
  },
  assignments: [
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
  ],
  tests: [
    {
      id: "TEST-54",
      number: 54,
      name: "Knowledge Check: Assessing Your Understanding",
      course: "Diploma in Automotive Manufacturing Technology",
      testFor: "Internal Test",
      date: "2 Mar 2024",
      expiryDate: "30 Mar 2024",
      duration: 60, // in minutes
      totalMarks: 50,
      passingMarks: 30,
      instructions: "You can only select one answer per question.",
      status: "Not solved", // "Not solved" or "Solved"
      score: null,
      maxScore: 50,
      completedAt: null,
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
      completedAt: null,
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
  ],
  events: [
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
  ],
  notices: [
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
  ],
  screenTimeLogs: [
    {
      id: "STL-001",
      traineeId: "T001",
      traineeName: "KUMARI K",
      module: "Learning Resource",
      durationSeconds: 640,
      timestamp: "2024-03-02 10:15:00"
    },
    {
      id: "STL-002",
      traineeId: "T001",
      traineeName: "KUMARI K",
      module: "Assignment",
      durationSeconds: 420,
      timestamp: "2024-03-02 11:30:00"
    },
    {
      id: "STL-003",
      traineeId: "T001",
      traineeName: "KUMARI K",
      module: "Test Module",
      durationSeconds: 980,
      timestamp: "2024-03-02 12:45:00"
    }
  ],
  masterForms: {
    schemes: [
      { id: "SCH-001", code: "NEEM", name: "National Employability Enhancement Mission", authority: "AICTE / MSDE", validity: "2023 - 2028", stipendMin: "₹12,500/mo", enrolledCount: 45, status: "Active" },
      { id: "SCH-002", code: "NAPS", name: "National Apprenticeship Promotion Scheme", authority: "MSDE / NSDC", validity: "2022 - 2027", stipendMin: "₹14,000/mo", enrolledCount: 62, status: "Active" },
      { id: "SCH-003", code: "CTS", name: "Craftsmen Training Scheme", authority: "DGT / NCVT", validity: "2021 - 2026", stipendMin: "₹11,000/mo", enrolledCount: 38, status: "Active" },
      { id: "SCH-004", code: "DDU-GKY", name: "Deen Dayal Upadhyaya Grameen Kaushalya Yojana", authority: "Ministry of Rural Development", validity: "2023 - 2026", stipendMin: "₹10,500/mo", enrolledCount: 25, status: "Active" }
    ],
    sectors: [
      { id: "SEC-001", code: "ASDC-1301", name: "Automotive Manufacturing", ssc: "Automotive Skills Development Council", coursesCount: 4, nsqfLevels: "Level 3 - Level 5", status: "Active" },
      { id: "SEC-002", code: "ESSCI-2104", name: "Electronics & Hardware Technology", ssc: "Electronics Sector Skills Council of India", coursesCount: 3, nsqfLevels: "Level 4 - Level 6", status: "Active" },
      { id: "SEC-003", code: "CGSC-3209", name: "Capital Goods & Precision Machining", ssc: "Capital Goods Skill Council", coursesCount: 5, nsqfLevels: "Level 4 - Level 5", status: "Active" },
      { id: "SEC-004", code: "LSC-4512", name: "Logistics & Supply Chain Operations", ssc: "Logistics Sector Skill Council", coursesCount: 2, nsqfLevels: "Level 3 - Level 4", status: "Active" }
    ],
    companies: [
      { id: "CMP-001", code: "TATA-PUN", name: "Tata Motors Ltd.", plantLocation: "Chakan Industrial Belt, Pune", hrLead: "Vikram Jadhav", contact: "+91 98221 44001", activeTrainees: 28, mouExpiry: "2027-12-31", status: "Active" },
      { id: "CMP-002", code: "MM-NSK", name: "Mahindra & Mahindra Ltd.", plantLocation: "MIDC Satpur, Nashik", hrLead: "Suresh Patil", contact: "+91 98224 55002", activeTrainees: 34, mouExpiry: "2026-08-31", status: "Active" },
      { id: "CMP-003", code: "BFORGE-PUN", name: "Bharat Forge Ltd.", plantLocation: "Mundhwa & Baramati Plants", hrLead: "Pooja Sharma", contact: "+91 98565 66003", activeTrainees: 20, mouExpiry: "2026-11-30", status: "Active" },
      { id: "CMP-004", code: "BAJAJ-AUR", name: "Bajaj Auto Ltd.", plantLocation: "Waluj MIDC, Chhatrapati Sambhajinagar", hrLead: "Dinesh More", contact: "+91 94220 77004", activeTrainees: 18, mouExpiry: "2028-03-31", status: "Active" }
    ],
    zones: [
      { id: "ZON-001", code: "WZ-PUN", name: "West Zone - Pune Division", state: "Maharashtra", hub: "Chakan YSF Regional Hub", officer: "Ramesh Kulkarni", phone: "+91 98810 88850", centersCount: 8, status: "Active" },
      { id: "ZON-002", code: "WZ-NSK", name: "West Zone - Nashik Division", state: "Maharashtra", hub: "Ambad MIDC Training Center", officer: "Sunil Sonawane", phone: "+91 98221 44332", centersCount: 5, status: "Active" },
      { id: "ZON-003", code: "WZ-MUM", name: "West Zone - Mumbai & Thane", state: "Maharashtra", hub: "Navi Mumbai Technical Hub", officer: "Amit Sawant", phone: "+91 98190 22334", centersCount: 6, status: "Active" },
      { id: "ZON-004", code: "NZ-NCR", name: "North Zone - Delhi NCR", state: "Haryana & UP", hub: "Gurugram Skill Coordination Office", officer: "Virender Singh", phone: "+91 124 4058921", centersCount: 4, status: "Active" }
    ],
    employees: [
      { id: "EMP-001", empCode: "YSF-ADM-101", name: "Anuj Deshmukh", role: "Super Admin", department: "IT & LMS Infrastructure", email: "anuj.deshmukh@ysfskills.com", phone: "+91 98810 88850", assignedBatches: "All Batches (Global Access)", status: "Active" },
      { id: "EMP-002", empCode: "YSF-ACD-104", name: "Dr. Rajesh Patil", role: "Academic Supervisor", department: "Curriculum & Assessment", email: "rajesh.patil@ysfskills.com", phone: "+91 98220 11223", assignedBatches: "Automotive 2023-25, Electronics 2024", status: "Active" },
      { id: "EMP-003", empCode: "YSF-INS-108", name: "Sneha Kulkarni", role: "Master Technical Instructor", department: "Workplace Safety & 5S", email: "sneha.k@ysfskills.com", phone: "+91 89565 37504", assignedBatches: "Tata Motors Batch 01, Mahindra Batch 02", status: "Active" },
      { id: "EMP-004", empCode: "YSF-FLD-112", name: "Mahesh Shinde", role: "OJT Field Coordinator", department: "Industry Relations & Verification", email: "mahesh.s@ysfskills.com", phone: "+91 94220 77889", assignedBatches: "Pune & Chakan Cluster", status: "Active" }
    ]
  },
  cms: {
    president: {
      name: "Hon. Balasaheb Deshmukh",
      title: "Founder & President, Yuvashakti Foundation",
      tagline: "Skill Development • Industrial Employment • Nation Building",
      quote: "Our mission is to bridge the chasm between formal classroom learning and high-precision shopfloor demands through world-class vocational On-the-Job training.",
      message: "Welcome to Kaushalya LMS — the institutional digital learning ecosystem of Yuvashakti Skill India Pvt. Ltd. Through Kaushalya, we are empowering thousands of young technicians across India with standardized learning resources, continuous OJT logbook tracking, digital assessment engines, and verified industry credentials. Every trainee enrolled in our dual-education model receives hands-on industrial immersion alongside rigorous safety, 5S, and technical competency building. We remain fiercely committed to nation building under the Skill India Mission.",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80",
      updatedAt: "2024-03-01 10:00"
    },
    visionMission: {
      vision: "To be India's premier benchmark vocational training foundation, pioneering industry-integrated dual-education models that transform young aspirants into globally competitive production professionals.",
      mission: "To empower 1,00,000+ rural and semi-urban youth by 2030 through industry-partnered On-the-Job Training, cutting-edge digital pedagogy, and recognized National Skills Qualifications Framework (NSQF) certifications.",
      coreValues: [
        "Excellence in Vocational Training",
        "Safety & Shopfloor Ethics First",
        "Inclusiveness & Rural Youth Empowerment",
        "Industry-Aligned Curriculum Rigor",
        "Transparency & Digital Innovation"
      ],
      objectives: [
        "Zero-dropout industrial apprenticeship tracking across all plant sectors.",
        "100% compliance with Directorate General of Training (DGT) and NSDC standards.",
        "Guaranteed post-training placement and upward NSQF career mobility."
      ],
      updatedAt: "2024-03-01 10:00"
    },
    aboutUs: {
      title: "About Yuvashakti Skill India Pvt. Ltd.",
      subtitle: "Pioneering Dual-Education & On-the-Job Vocational Apprenticeship Since 2007",
      history: "Yuvashakti Skill India Pvt. Ltd. (YSF) is an accredited vocational training organization dedicated to transforming Indian youth into highly skilled, industry-ready professionals. Operating in strategic alignment with the Ministry of Skill Development and Entrepreneurship (MSDE) and National Skill Development Corporation (NSDC), YSF executes dual-system apprenticeship models across automotive, manufacturing, capital goods, and electronics industries.",
      accreditations: "Affiliated with ASDC (Automotive Skills Development Council), CGSC (Capital Goods Skill Council), and ESSCI. Recognized implementation partner for NEEM, NAPS, and state skill missions.",
      metrics: [
        { label: "Trainees Graduated", value: "50,000+" },
        { label: "Corporate Industry Partners", value: "120+" },
        { label: "Industrial Training Centers", value: "24 Hubs" },
        { label: "Certified Placement Rate", value: "95.4%" }
      ],
      updatedAt: "2024-03-01 10:00"
    },
    contactUs: {
      headOffice: "YSF Central Tower, Plot No. P-42, Chakan MIDC Industrial Area Phase-II, Pune, Maharashtra - 410501",
      phone: "098810-88850 / +91 89565 37504",
      email: "lmssupport@ysfskills.com",
      altEmail: "info@ysfskills.com",
      workingHours: "Monday to Saturday: 08:30 AM – 06:30 PM (IST)",
      zonalCenters: [
        { zone: "Pune Industrial Hub", address: "Chakan MIDC Phase 2, Pune - 410501", phone: "098810-88850" },
        { zone: "Nashik MIDC Branch", address: "Ambad Industrial Estate, Nashik - 422010", phone: "+91 98221 44332" },
        { zone: "Chhatrapati Sambhajinagar", address: "Waluj MIDC Industrial Area - 431136", phone: "+91 94220 55667" },
        { zone: "Delhi NCR Coordination", address: "Sector 18, Udyog Vihar, Gurugram - 122015", phone: "+91 124 4058921" }
      ],
      updatedAt: "2024-03-01 10:00"
    }
  },
  batchStatusHistory: [
    {
      id: "BSH-001",
      timestamp: "2024-03-01 09:30",
      updatedBy: "Admin",
      traineesCount: 2,
      status: "Active",
      scheme: "NEEM",
      company: "Tata Motors Ltd. / M&M",
      remarks: "Batch 2023-2025 verified for Q1 OJT cycle"
    }
  ]
};

let cachedDb = null;
let mongoClient = null;
let mongoDb = null;

const mongoStatus = {
  connected: false,
  cluster: 'ysfdatabase.vznhwe9.mongodb.net',
  dbName: process.env.DB_NAME || 'ysf_kaushalya_lms',
  lastSyncedAt: null,
  error: null
};

function loadLocalDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return JSON.parse(JSON.stringify(initialData));
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(content);
    if (!data.questionBank) data.questionBank = [];
    if (!data.attendance) data.attendance = {};
    if (!data.queries) data.queries = [];
    if (!data.trainees) data.trainees = [];
    data.users = data.trainees;
    return data;
  } catch (err) {
    console.error('[Database] Error reading local db.json:', err);
    return JSON.parse(JSON.stringify(initialData));
  }
}

function getDb() {
  if (!cachedDb) {
    cachedDb = loadLocalDb();
  }
  if (!cachedDb.questionBank) cachedDb.questionBank = [];
  if (!cachedDb.attendance) cachedDb.attendance = {};
  if (!cachedDb.queries) cachedDb.queries = [];
  if (!cachedDb.trainees) cachedDb.trainees = [];
  if (cachedDb.users && !cachedDb.trainees.length) cachedDb.trainees = cachedDb.users;
  if (cachedDb.trainees && !cachedDb.users) cachedDb.users = cachedDb.trainees;
  return cachedDb;
}

async function mirrorCollections(dbObj) {
  if (!mongoDb) return;
  const collectionsToSync = ['users', 'questionBank', 'tests', 'assignments', 'selfAssignments', 'events', 'notices', 'queries'];
  for (const colName of collectionsToSync) {
    try {
      const items = colName === 'users' ? (dbObj.users || dbObj.trainees) : dbObj[colName];
      if (Array.isArray(items)) {
        const col = mongoDb.collection(colName);
        await col.deleteMany({});
        if (items.length > 0) {
          const docs = items.map((item, idx) => {
            const doc = { ...item };
            doc._id = item.id ? String(item.id) : `${colName}_${idx}_${Date.now()}`;
            return doc;
          });
          await col.insertMany(docs);
        }
      }
    } catch (colErr) {
      console.warn(`[MongoDB Atlas] Mirror collection '${colName}' warning:`, colErr.message);
    }
  }
}

async function initDatabase() {
  // Ensure local memory cache is ready immediately
  if (!cachedDb) {
    cachedDb = loadLocalDb();
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || 'ysf_kaushalya_lms';
  mongoStatus.dbName = dbName;

  if (!uri) {
    mongoStatus.connected = false;
    mongoStatus.error = 'No MONGODB_URI provided in environment';
    console.warn('[MongoDB Atlas] No MONGODB_URI set, running in local disk mode.');
    return mongoStatus;
  }

  try {
    console.log(`[MongoDB Atlas] Connecting to cluster (${mongoStatus.cluster})...`);
    mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    await mongoClient.connect();
    mongoDb = mongoClient.db(dbName);

    mongoStatus.connected = true;
    mongoStatus.error = null;

    const stateCol = mongoDb.collection('lms_state');
    const masterDoc = await stateCol.findOne({ _id: 'master_state' });

    if (masterDoc) {
      console.log('[MongoDB Atlas] Found existing master_state in cloud. Hydrating local cache...');
      const { _id, ...cloudData } = masterDoc;
      cachedDb = { ...cachedDb, ...cloudData };
      if (!cachedDb.questionBank) cachedDb.questionBank = [];
      if (!cachedDb.attendance) cachedDb.attendance = {};
      if (!cachedDb.queries) cachedDb.queries = [];
      if (!cachedDb.trainees) cachedDb.trainees = [];
      cachedDb.users = cachedDb.trainees;

      // Update local db.json with cloud data
      fs.writeFileSync(DB_FILE, JSON.stringify(cachedDb, null, 2));

      // Mirror collections if cloud tables are empty
      await mirrorCollections(cachedDb);
    } else {
      console.log('[MongoDB Atlas] First-time cloud initialization. Seeding master_state and collections...');
      const seedState = {
        _id: 'master_state',
        ...cachedDb,
        updatedAt: new Date()
      };
      await stateCol.insertOne(seedState);
      await mirrorCollections(cachedDb);
    }

    mongoStatus.lastSyncedAt = new Date().toISOString();
    console.log(`[MongoDB Atlas] Real-time cloud persistence active on '${dbName}'.`);
    return mongoStatus;
  } catch (err) {
    mongoStatus.connected = false;
    mongoStatus.error = err.message;
    console.warn('[MongoDB Atlas] Connection failed, continuing with local fallback:', err.message);
    return mongoStatus;
  }
}

function saveDb(data) {
  try {
    cachedDb = data;
    // Keep users and trainees synchronized
    if (data.users && !data.trainees) data.trainees = data.users;
    if (data.trainees && !data.users) data.users = data.trainees;

    // 1. Synchronous local file persistence (never crashes)
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

    // 2. Asynchronous MongoDB Atlas cloud upsert
    if (mongoDb && mongoStatus.connected) {
      (async () => {
        try {
          const stateCol = mongoDb.collection('lms_state');
          const stateToSave = { ...data, updatedAt: new Date() };
          delete stateToSave._id;

          await stateCol.updateOne(
            { _id: 'master_state' },
            { $set: stateToSave },
            { upsert: true }
          );

          await mirrorCollections(data);
          mongoStatus.lastSyncedAt = new Date().toISOString();
        } catch (syncErr) {
          console.error('[MongoDB Atlas] Async cloud sync error:', syncErr.message);
        }
      })();
    }
  } catch (err) {
    console.error('[Database] Error saving database:', err);
  }
}

async function syncMongoNow() {
  if (!mongoDb || !mongoStatus.connected) {
    // Attempt reconnection if disconnected
    await initDatabase();
  }
  if (!mongoDb || !mongoStatus.connected) {
    throw new Error(mongoStatus.error || 'MongoDB Atlas is not connected');
  }

  const stateCol = mongoDb.collection('lms_state');
  const masterDoc = await stateCol.findOne({ _id: 'master_state' });

  if (masterDoc) {
    const { _id, ...cloudData } = masterDoc;
    // Merge cloud state with in-memory state
    cachedDb = { ...cachedDb, ...cloudData };
  }

  // Push back any updated fields
  const stateToSave = { ...cachedDb, updatedAt: new Date() };
  delete stateToSave._id;
  await stateCol.updateOne(
    { _id: 'master_state' },
    { $set: stateToSave },
    { upsert: true }
  );

  await mirrorCollections(cachedDb);

  // Write local backup
  fs.writeFileSync(DB_FILE, JSON.stringify(cachedDb, null, 2));
  mongoStatus.lastSyncedAt = new Date().toISOString();
  return mongoStatus;
}

function getMongoStatus() {
  return { ...mongoStatus };
}

async function saveFileToMongo(filename, originalName, mimeType, buffer) {
  if (!mongoDb || !mongoStatus.connected) return null;
  try {
    const filesCol = mongoDb.collection('lms_files');
    const doc = {
      filename,
      originalName: originalName || filename,
      contentType: mimeType || 'application/octet-stream',
      data: buffer,
      size: buffer ? buffer.length : 0,
      createdAt: new Date()
    };
    await filesCol.updateOne(
      { filename },
      { $set: doc },
      { upsert: true }
    );
    return true;
  } catch (err) {
    console.warn(`[MongoDB Atlas] File backup error (${filename}):`, err.message);
    return null;
  }
}

async function getFileFromMongo(filename) {
  if (!mongoDb || !mongoStatus.connected) return null;
  try {
    const filesCol = mongoDb.collection('lms_files');
    return await filesCol.findOne({ filename });
  } catch (err) {
    console.warn(`[MongoDB Atlas] File retrieval error (${filename}):`, err.message);
    return null;
  }
}

const saveDatabase = saveDb;

module.exports = {
  getDb,
  saveDb,
  saveDatabase,
  initDatabase,
  syncMongoNow,
  getMongoStatus,
  saveFileToMongo,
  getFileFromMongo
};

