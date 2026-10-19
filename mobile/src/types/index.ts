export type Language = 'en' | 'mr';

export interface ProfileField {
  /** translation key the app may use for the label */
  key: string;
  label: string;
  value: string;
}

export interface ProfileSection {
  key: 'trainee' | 'course';
  title: string;
  fields: ProfileField[];
}

/** Profile = Trainee Information + Course Details (same fields as the admin reports) */
export interface TraineeProfile {
  fullName: string;
  ysfCode: string;
  avatar: string | null;
  status: 'Active' | 'Left' | 'Completed';
  sections: ProfileSection[];
  notice: string;
}

/** Share of learning content the trainee has opened */
export interface LearningProgress {
  totalTopics: number;
  viewedTopics: number;
  percent: number;
  byType: { PDF: { total: number; viewed: number }; PPT: { total: number; viewed: number }; VIDEO: { total: number; viewed: number } };
  lastViewedAt: string | null;
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
  /** true once this trainee has opened the topic */
  readStatus: boolean;
  viewedAt?: string | null;
  createdAt?: string;
  contentType?: 'Technical' | 'Soft Skill';
}

export interface LearningChapter {
  scheme: string;
  sector: string;
  course: string;
  subject: string;
  chapter: string;
  topicsCount: number;
  viewedCount?: number;
  topics: LearningTopic[];
}

export interface LearningSummaryRow {
  course: string;
  total: number;
  unread: number;
  viewed: number;
  /** topics added this month / this year */
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
  gradeStatus?: 'Pending' | 'Ungraded' | 'Graded' | 'Needs Revision';
  gradedMarks?: number | null;
  late?: boolean;
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
  status: AssignmentStatus;
  submissions: AssignmentSubmission[];
  scheme?: string;
  sector?: string;
  zone?: string;
  industryName?: string;
  /** Answer file types the admin accepts: 'any' | 'pdf' | 'image' | 'doc' | 'excel' | 'ppt' | 'video' */
  allowedFileTypes?: string[];
  /** YYYY-MM-DD */
  deadline?: string;
  deadlineLabel?: string;
  attachment?: { name: string; url: string; size?: string } | null;
  mySubmission?: AssignmentSubmission | null;
}

export type AssignmentStatus = 'Pending' | 'Submitted' | 'Graded' | 'Needs Revision' | 'Overdue' | 'Completed';

/** Trainee's own upload that was not assigned by the admin */
export interface SelfAssignment {
  id: string;
  name: string;
  traineeId: string;
  traineeName: string;
  submittedAt: string;
  text?: string;
  attachments: { name: string; size?: string; url?: string }[];
  gradeStatus?: 'Pending' | 'Graded' | 'Needs Revision';
  gradedMarks?: number | null;
  maxMarks?: number | null;
  remarks?: string;
}

export interface MCQQuestion {
  id: number | string;
  question: string;
  options: string[];
  correctIndex?: number;
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
  attachment?: { name: string; url: string; size?: string } | null;
  questions?: MCQQuestion[];
  questionCount?: number;
  passed?: boolean | null;
  completedAt?: string | null;
  scheme?: string;
  sector?: string;
  /** YYYY-MM-DD; test can be taken from this date until availableUntil */
  availableFrom?: string;
  availableUntil?: string;
  availability?: 'open' | 'upcoming' | 'expired';
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
  | 'LOGIN'
  | 'DASHBOARD'
  | 'PROFILE'
  | 'LEARNING_RESOURCES'
  | 'ASSIGNMENTS'
  | 'TEST_MODULE'
  | 'EVENTS'
  | 'NOTICES'
  | 'TECHNICAL_QUERY';
