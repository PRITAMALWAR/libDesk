import { create } from 'zustand';
import { addDays, differenceInDays, isSameDay, format } from 'date-fns';
import { resolveApiBaseUrl } from './constants/apiUrl';
import { prepareAttendanceQrPayload } from './utils/attendanceQr';

export type Role = 'admin' | 'student';
export type FeeStatus = 'Paid' | 'Half Paid' | 'Pending';

export interface User {
  id: string;
  role: Role;
  name: string;
  username: string;
  mobile: string;
  pin: string;
  joinDate: string;
  expiryDate: string;
  feeStatus: FeeStatus;
  feeAmount: number;
  isBlocked: boolean;
  photoUrl?: string | null;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string; // ISO string
}

/** Library announcement type (shown to students with badge + styling) */
export type NotificationCategory =
  | 'general'
  | 'festival'
  | 'closure'
  | 'hours'
  | 'rules'
  | 'event';

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  targetId?: string; // 'all' or studentId
  category?: NotificationCategory;
}

export interface StudentInput {
  name: string;
  username: string;
  mobile: string;
  pin: string;
  joinDate?: string;
  feeStatus: FeeStatus;
  feeAmount: number;
  isBlocked: boolean;
}

export interface QrTokenInfo {
  token: string | null;
  generatedAt?: string;
  expiresAt?: string;
  created?: boolean;
  locked?: boolean;
  message?: string;
}

interface AppState {
  currentUser: User | null;
  authToken: string | null;
  users: User[];
  attendances: Attendance[];
  notifications: Notification[];
  dailyQrToken: string | null;

  // Auth
  login: (usernameOrMobile: string, pin: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;

  // Admin - Students
  fetchStudents: () => Promise<void>;
  addStudent: (student: StudentInput) => Promise<{ ok: boolean; message?: string; student?: User }>;
  updateStudent: (id: string, data: Partial<User>) => Promise<{ ok: boolean; message?: string }>;
  deleteStudent: (id: string) => Promise<{ ok: boolean; message?: string }>;
  toggleBlockStudent: (id: string) => Promise<{ ok: boolean; message?: string }>;
  uploadStudentPhoto: (id: string, localUri: string) => Promise<{ ok: boolean; message?: string }>;

  // Admin - Attendance
  generateDailyQr: (opts?: { rotate?: boolean }) => Promise<QrTokenInfo | null>;
  fetchTodayAttendance: () => Promise<void>;
  fetchAttendanceByDate: (date: string) => Promise<void>;

  // Admin - Notifications
  fetchNotifications: (studentId?: string) => Promise<void>;
  sendNotification: (
    title: string,
    message: string,
    targetId?: string,
    category?: NotificationCategory
  ) => Promise<{ ok: boolean; message?: string }>;

  // Student - Attendance
  markAttendance: (token: string) => Promise<{ ok: boolean; alreadyMarked?: boolean; message?: string }>;

  // Helpers
  getTodayAttendance: () => Attendance[];
  getStudentAttendance: (studentId: string) => Attendance[];
  getStudentNotifications: (studentId: string) => Notification[];
}

const initialAdmin: User = {
  id: 'admin-1',
  role: 'admin',
  name: 'Admin',
  username: 'admin',
  mobile: '0000000000',
  pin: 'admin@123',
  joinDate: new Date().toISOString(),
  expiryDate: addDays(new Date(), 3650).toISOString(),
  feeStatus: 'Paid',
  feeAmount: 0,
  isBlocked: false,
};

const API_URL = resolveApiBaseUrl();

async function parseApiError(response: Response) {
  try {
    const data = await response.json();
    return data?.message || 'Request failed';
  } catch {
    return 'Request failed';
  }
}

function mergeStudentsInUsers(currentUsers: User[], students: User[]) {
  const nonStudents = currentUsers.filter((u) => u.role !== 'student');
  return [...nonStudents, ...students];
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  authToken: null,
  users: [initialAdmin],
  attendances: [],
  notifications: [
    {
      id: 'notif-1',
      title: 'Welcome!',
      message: 'Welcome to the Library Management System.',
      date: new Date().toISOString(),
      targetId: 'all',
      category: 'general',
    },
  ],
  dailyQrToken: null,

  login: async (usernameOrMobile, pin) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrMobile, pin }),
      });

      if (!response.ok) {
        return { ok: false, message: await parseApiError(response) };
      }

      const data = (await response.json()) as { user: User; authToken?: string };
      const authenticatedUser = data.user;

      set((state) => ({
        currentUser: authenticatedUser,
        authToken: data.authToken || null,
        users:
          authenticatedUser.role === 'admin'
            ? [authenticatedUser, ...state.users.filter((u) => u.role === 'student')]
            : [initialAdmin, ...state.users.filter((u) => u.role === 'student' || u.id === authenticatedUser.id)],
      }));

      if (authenticatedUser.role === 'admin') {
        await get().fetchStudents();
      }

      return { ok: true };
    } catch {
      return { ok: false, message: `Backend unavailable (${API_URL})` };
    }
  },

  logout: () => set({ currentUser: null, authToken: null }),

  fetchStudents: async () => {
    try {
      const response = await fetch(`${API_URL}/api/students`);
      if (!response.ok) return;
      const students = (await response.json()) as User[];
      set((state) => ({ users: mergeStudentsInUsers(state.users, students) }));
    } catch {
      // Keep existing local users when backend is unavailable.
    }
  },

  addStudent: async (studentData) => {
    try {
      const response = await fetch(`${API_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        return { ok: false, message: await parseApiError(response) };
      }

      const created = (await response.json()) as User;
      set((state) => ({ users: [...state.users.filter((u) => u.role !== 'student' || u.id !== created.id), created] }));
      return { ok: true, student: created };
    } catch {
      return { ok: false, message: `Backend unavailable (${API_URL})` };
    }
  },

  updateStudent: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        return { ok: false, message: await parseApiError(response) };
      }

      const updated = (await response.json()) as User;
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updated : u)),
        currentUser: state.currentUser?.id === id ? updated : state.currentUser,
      }));
      return { ok: true };
    } catch {
      return { ok: false, message: `Backend unavailable (${API_URL})` };
    }
  },

  deleteStudent: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/students/${id}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        return { ok: false, message: await parseApiError(response) };
      }

      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        currentUser: state.currentUser?.id === id ? null : state.currentUser,
      }));
      return { ok: true };
    } catch {
      return { ok: false, message: `Backend unavailable (${API_URL})` };
    }
  },

  uploadStudentPhoto: async (id, localUri) => {
    try {
      const formData = new FormData();
      const filename = localUri.split('/').pop() ?? 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      // React Native FormData accepts this object shape for file uploads
      formData.append('photo', { uri: localUri, name: filename, type } as unknown as Blob);

      const response = await fetch(`${API_URL}/api/students/${id}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        return { ok: false, message: await parseApiError(response) };
      }

      const updated = (await response.json()) as User;
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updated : u)),
        currentUser: state.currentUser?.id === id ? updated : state.currentUser,
      }));
      return { ok: true };
    } catch {
      return { ok: false, message: `Backend unavailable (${API_URL})` };
    }
  },

  toggleBlockStudent: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/students/${id}/block`, { method: 'PATCH' });
      if (!response.ok) {
        return { ok: false, message: await parseApiError(response) };
      }

      const updated = (await response.json()) as User;
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updated : u)),
        currentUser: state.currentUser?.id === id ? updated : state.currentUser,
      }));
      return { ok: true };
    } catch {
      return { ok: false, message: `Backend unavailable (${API_URL})` };
    }
  },

  generateDailyQr: async (opts) => {
    try {
      const response = await fetch(`${API_URL}/api/attendance/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ rotate: Boolean(opts?.rotate) }),
      });
      if (!response.ok) return null;
      const data = (await response.json()) as QrTokenInfo;
      set({ dailyQrToken: data.token || null });
      return data;
    } catch {
      return null;
    }
  },

  fetchTodayAttendance: async () => {
    try {
      const response = await fetch(`${API_URL}/api/attendance/today`);
      if (!response.ok) return;
      const list = (await response.json()) as Attendance[];
      set({ attendances: list });
    } catch {
      // Keep local state if backend fails.
    }
  },

  fetchAttendanceByDate: async (date) => {
    try {
      const response = await fetch(`${API_URL}/api/attendance?date=${encodeURIComponent(date)}`);
      if (!response.ok) return;
      const list = (await response.json()) as Attendance[];
      set({ attendances: list });
    } catch {
      // Keep local state if backend fails.
    }
  },

  fetchNotifications: async (studentId) => {
    try {
      const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
      const response = await fetch(`${API_URL}/api/notifications${query}`);
      if (!response.ok) return;
      const list = (await response.json()) as Notification[];
      set({
        notifications: list.map((n) => ({
          ...n,
          category: (n.category as NotificationCategory) || 'general',
        })),
      });
    } catch {
      // Keep local state if backend fails.
    }
  },

  sendNotification: async (title, message, targetId = 'all', category: NotificationCategory = 'general') => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, targetId, category }),
      });

      if (!response.ok) {
        return { ok: false, message: await parseApiError(response) };
      }

      const created = (await response.json()) as Notification;
      set((state) => ({ notifications: [created, ...state.notifications] }));
      return { ok: true };
    } catch {
      return { ok: false, message: `Backend unavailable (${API_URL})` };
    }
  },

  markAttendance: async (token) => {
    const { currentUser, authToken } = get();
    if (!currentUser || currentUser.role !== 'student') {
      return { ok: false, message: 'Only students can mark attendance' };
    }
    if (!authToken) {
      return { ok: false, message: 'Unauthorized. Please login again.' };
    }

    const normalized = prepareAttendanceQrPayload(token);

    try {
      const response = await fetch(`${API_URL}/api/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ token: normalized }),
      });

      if (!response.ok) {
        const message = await parseApiError(response);
        if (response.status === 401) {
          return { ok: false, message: message || 'Session expired. Log in again, then scan.' };
        }
        return { ok: false, message };
      }
      const data = (await response.json()) as { ok: boolean; alreadyMarked?: boolean; message?: string };
      await get().fetchTodayAttendance();
      return { ok: true, alreadyMarked: Boolean(data.alreadyMarked), message: data.message };
    } catch {
      return { ok: false, message: `Backend unavailable (${API_URL})` };
    }
  },

  getTodayAttendance: () => {
    const { attendances } = get();
    const today = new Date();
    return attendances.filter((a) => isSameDay(new Date(a.date), today));
  },

  getStudentAttendance: (studentId) => {
    const { attendances } = get();
    return attendances.filter((a) => a.studentId === studentId);
  },

  getStudentNotifications: (studentId) => {
    const { notifications, users } = get();
    const student = users.find((u) => u.id === studentId);
    if (!student) return [];

    const studentNotifs = notifications.filter((n) => n.targetId === 'all' || n.targetId === studentId);

    // Auto-generate expiry reminders
    const daysRemaining = differenceInDays(new Date(student.expiryDate), new Date());
    if (daysRemaining <= 3 && daysRemaining >= 0) {
      studentNotifs.unshift({
        id: 'sys-reminder',
        title: 'Membership Expiring Soon',
        message: `Your library membership will expire in ${daysRemaining} days. Please renew soon.`,
        date: new Date().toISOString(),
        targetId: studentId,
        category: 'rules',
      });
    } else if (daysRemaining < 0) {
      studentNotifs.unshift({
        id: 'sys-expired',
        title: 'Membership Expired',
        message: `Your library membership has expired. Please renew to continue access.`,
        date: new Date().toISOString(),
        targetId: studentId,
        category: 'rules',
      });
    }

    return studentNotifs;
  },
}));
