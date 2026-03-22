export interface Email {
  id: string;
  from: string;
  fromName: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: Date;
  read: boolean;
  starred: boolean;
  labels: string[];
}

export interface CanvasAssignment {
  id: string;
  courseId: string;
  courseName: string;
  courseColor: string;
  title: string;
  description: string;
  dueDate: Date | null;
  pointsPossible: number | null;
  submissionType: string[];
  submitted: boolean;
  grade: string | null;
  url: string;
}

export interface CanvasCourse {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  notes?: string;
  color: string;
  source: 'personal' | 'canvas' | 'email';
}

export interface Reminder {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedId?: string;
  relatedType?: 'assignment' | 'email' | 'event';
}

export interface AppSettings {
  canvasFeedUrl: string;
  emailConnected: boolean;
  calendarConnected: boolean;
  notificationsEnabled: boolean;
  theme: 'dark' | 'light' | 'auto';
}
