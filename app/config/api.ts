/**
 * API Configuration
 * Base URL and endpoint configuration for the backend API
 * 
 * Note: For React Native:
 * - iOS Simulator: localhost works
 * - Android Emulator: Use 10.0.2.2 instead of localhost
 * - Physical Device: Use your machine's IP address (e.g., 192.168.1.2)
 * 
 * Update the IP address below to match your machine's IP if testing on physical device
 */

// Get your machine IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
// Look for IPv4 Address (usually 192.168.x.x or 10.0.x.x)
const DEV_API_URL = 'http://192.168.1.2/testapilamp/student/lamp.php'; // Update this IP if needed

const API_BASE_URL = __DEV__
  ? DEV_API_URL
  : 'http://localhost/testapilamp/student/lamp.php';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

export default API_CONFIG;

