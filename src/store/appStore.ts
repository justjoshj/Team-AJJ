import AsyncStorage from '@react-native-async-storage/async-storage';
import { Email, CanvasAssignment, CanvasCourse, CalendarEvent, Reminder, AppSettings } from '../types';
import { MOCK_EMAILS } from '../services/mockData';
import { MOCK_REMINDERS } from '../services/mockData';

const STORAGE_KEYS = {
  SETTINGS: '@hubsync_settings',
  REMINDERS: '@hubsync_reminders',
  CANVAS_ASSIGNMENTS: '@hubsync_assignments',
  CANVAS_COURSES: '@hubsync_courses',
};

// Simple reactive store using callbacks
type Listener = () => void;

interface AppState {
  settings: AppSettings;
  emails: Email[];
  assignments: CanvasAssignment[];
  courses: CanvasCourse[];
  calendarEvents: CalendarEvent[];
  reminders: Reminder[];
  loading: {
    canvas: boolean;
    email: boolean;
    calendar: boolean;
  };
  errors: {
    canvas: string | null;
    email: string | null;
    calendar: string | null;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  canvasFeedUrl: '',
  emailConnected: false,
  calendarConnected: false,
  notificationsEnabled: true,
  theme: 'dark',
};

class AppStore {
  private state: AppState = {
    settings: DEFAULT_SETTINGS,
    emails: MOCK_EMAILS,
    assignments: [],
    courses: [],
    calendarEvents: [],
    reminders: MOCK_REMINDERS,
    loading: { canvas: false, email: false, calendar: false },
    errors: { canvas: null, email: null, calendar: null },
  };

  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  saveEmailData(emails: any[]) {
    this.state.emails = emails;
    this.emit();
  }

  private emit() {
    this.listeners.forEach(l => l());
  }
  
  private notify() {
    this.listeners.forEach((l) => l());
  }

  getState() {
    return this.state;
  }

  private setState(partial: Partial<AppState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  async loadPersistedData() {
    try {
      const [settingsJson, assignmentsJson, coursesJson, remindersJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.CANVAS_ASSIGNMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.CANVAS_COURSES),
        AsyncStorage.getItem(STORAGE_KEYS.REMINDERS),
      ]);

      const settings = settingsJson ? JSON.parse(settingsJson) : DEFAULT_SETTINGS;
      const assignments = assignmentsJson ? JSON.parse(assignmentsJson, dateReviver) : [];
      const courses = coursesJson ? JSON.parse(coursesJson) : [];
      const reminders = remindersJson ? JSON.parse(remindersJson, dateReviver) : MOCK_REMINDERS;

      this.setState({ settings, assignments, courses, reminders });
    } catch (e) {
      console.warn('Failed to load persisted data', e);
    }
  }

  async saveSettings(settings: AppSettings) {
    this.setState({ settings });
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  async addReminder(reminder: Reminder) {
    const reminders = [...this.state.reminders, reminder];
    this.setState({ reminders });
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  }

  async toggleReminderComplete(id: string) {
    const reminders = this.state.reminders.map((r) =>
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    this.setState({ reminders });
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  }

  async deleteReminder(id: string) {
    const reminders = this.state.reminders.filter((r) => r.id !== id);
    this.setState({ reminders });
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
  }

  markEmailRead(id: string) {
    const emails = this.state.emails.map((e) =>
      e.id === id ? { ...e, read: true } : e
    );
    this.setState({ emails });
  }

  toggleEmailStar(id: string) {
    const emails = this.state.emails.map((e) =>
      e.id === id ? { ...e, starred: !e.starred } : e
    );
    this.setState({ emails });
  }

  setCanvasLoading(loading: boolean) {
    this.setState({ loading: { ...this.state.loading, canvas: loading } });
  }

  setCanvasError(error: string | null) {
    this.setState({ errors: { ...this.state.errors, canvas: error } });
  }

  async saveCanvasData(assignments: CanvasAssignment[], courses: CanvasCourse[]) {
    this.setState({ assignments, courses });
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.CANVAS_ASSIGNMENTS, JSON.stringify(assignments)),
      AsyncStorage.setItem(STORAGE_KEYS.CANVAS_COURSES, JSON.stringify(courses)),
    ]);
  }

  setCalendarEvents(events: CalendarEvent[]) {
    this.setState({ calendarEvents: events });
  }
}

function dateReviver(_key: string, value: unknown) {
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime()) && value.includes('T')) return d;
  }
  return value;
}

export const appStore = new AppStore();
