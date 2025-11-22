/**
 * API Configuration
 * Base URL and endpoint configuration for the backend API
 */

const API_BASE_URL = __DEV__
  ? 'http://localhost/testapilamp/student/lamp.php'
  : 'http://gclamp/testapilamp/student/lamp.php';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

export default API_CONFIG;

