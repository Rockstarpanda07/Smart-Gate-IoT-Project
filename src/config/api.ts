// API Configuration

// Replace this with your Raspberry Pi's IP address when deploying
export const API_BASE_URL = "http://localhost:5000";

// Helper function to build API endpoints
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Common API endpoints
export const API_ENDPOINTS = {
  CAMERA_SNAPSHOT: "/api/camera-snapshot",
  CAMERA_FEED: "/api/camera-feed",
  DOOR_STATUS: "/api/door-status",
  RECOGNITION_STATUS: "/api/recognition-status",
  ATTENDANCE: "/api/attendance",
  STATS: "/api/stats"
};