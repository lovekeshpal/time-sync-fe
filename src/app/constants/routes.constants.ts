export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  TIMER: {
    CREATE: '/create-timer',
    EDIT: (id: string) => `/edit-timer/${id}`,
    VIEW: (id: string) => `/timer/${id}`,
  },
};
