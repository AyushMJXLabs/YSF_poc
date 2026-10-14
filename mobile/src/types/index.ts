export type Language = 'en' | 'mr';

export interface TraineeInfo {
  ysfCode: string;
  fullName: string;
  schemeName: string;
  sectorName: string;
  industryPartner: string;
  zoneName: string;
  locationName: string;
}

export interface CourseInfo {
  courseName: string;
  jobRoleAssigned: string;
  sectorSkillCouncil: string;
  nsqLevel: string;
  registrationDate: string;
  endDate: string;
  presentOJT: string;
}

export interface OtherInfo {
  nativeAddress: string;
  contact1: string;
  contact2: string;
  email: string;
  aadharNumber: string;
}

export interface FullProfile {
  traineeInfo: TraineeInfo;
  courseInfo: CourseInfo;
  otherInfo: OtherInfo;
  isReadOnly: boolean;
  notice: string;
}

export interface LearningTopic {
  id: string;
  title: string;
  description: string;
  fileType: 'PDF' | 'PPT' | 'VIDEO';
  fileName: string;
  fileUrl?: string;
  fileSize?: string;
  contentSummary: string;
  slides?: { slideNo: number; title: string; text: string }[];
  videoDuration?: string;
  readStatus: boolean;
}

export interface LearningChapter {
  scheme: string;
  sector: string;
  course: string;
  subject: string;
  chapter: string;
  topicsCount: number;
  topics: LearningTopic[];
}

export interface LearningSummaryRow {
  course: string;
  unread: number;
  yesterday: number;
  monthly: number;
  yearly: number;
}

export interface AttendanceRecord {
  ysfCode: string;
  presentDays: number;
  absentDays: number;
  completedHours: number;
  targetHours: number;
  percentage: number;
  lastUpdated?: string;
}

export interface TechnicalQueryTicket {
  id: string;
  traineeId: string;
  traineeName: string;
  ysfCode: string;
  subject: string;
  category: 'Academic' | 'App Technical' | 'OJT Attendance' | 'General';
  message: string;
  status: 'Open' | 'Replied';
  reply?: string;
  repliedAt?: string;
  repliedBy?: string;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  traineeId: string;
  traineeName: string;
  submittedAt: string;
  text: string;
  attachments: { name: string; size?: string; uri?: string; url?: string }[];
  gradeStatus?: 'Ungraded' | 'Graded' | 'Needs Revision';
  gradedMarks?: number;
  remarks?: string;
  gradedAt?: string;
}

export interface Assignment {
  id: string;
  no: number;
  name: string;
  shortTitle: string;
  course: string;
  subject: string;
  topic: string;
  assignedDate: string;
  submissionDate: string;
  marks: number;
  teacher: string;
  details: string;
  likes: number;
  status: 'Pending' | 'Completed';
  submissions: AssignmentSubmission[];
}

export interface MCQQuestion {
  id: number | string;
  question: string;
  options: string[];
  correctIndex: number;
  course?: string;
  module?: string;
  topic?: string;
  marks?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export interface TestItem {
  id: string;
  number: number;
  name: string;
  course: string;
  testFor: string;
  date: string;
  expiryDate?: string;
  duration: number; // in minutes
  totalMarks: number;
  passingMarks: number;
  instructions: string;
  status: 'Not solved' | 'Solved';
  score: number | null;
  maxScore: number;
  attachment?: { name: string; url: string; size?: string };
  questions?: MCQQuestion[];
}

export interface CourseTestSummary {
  course: string;
  total: number;
  solved: number;
  unSolved: number;
}

export interface AcademicEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: string;
  time: string;
  location: string;
  description: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  date: string;
  fullDate: string;
  priority: 'high' | 'normal' | 'low' | 'info';
  starColor: 'red' | 'green';
  content: string;
}

export type ScreenName =
  | 'INSTITUTE_CODE'
  | 'LOGIN'
  | 'DASHBOARD'
  | 'PROFILE'
  | 'LEARNING_RESOURCES'
  | 'ASSIGNMENTS'
  | 'TEST_MODULE'
  | 'EVENTS'
  | 'NOTICES'
  | 'TECHNICAL_QUERY'
  | 'CHANGE_PASSWORD';
