export const API = {
  BASE_URL: '/api',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  TIMERS: {
    GET_ALL: '/timers',
    GET_ONE: (id: string) => `/timers/${id}`,
    CREATE: '/timers',
    UPDATE: (id: string) => `/timers/${id}`,
    DELETE: (id: string) => `/timers/${id}`,
  },
  USER: {
    PROFILE: '/user/profile',
    SETTINGS: '/user/settings',
  },
};
