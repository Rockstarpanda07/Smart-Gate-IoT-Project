// API Configuration

// Available API server configurations
const API_SERVERS = {
  PHONE: "http://192.168.187.113:5000",  // Updated to match actual server IP
  COLLEGE: "http://10.31.3.211:5000",
};

// Set the current environment here (change to COLLEGE or PHONE as needed)
export const CURRENT_ENV = "PHONE";  // Changed to PHONE since that's the IP range you're using

// Raspberry Pi's IP address for API connection
export const API_BASE_URL = API_SERVERS[CURRENT_ENV];

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
  STATS: "/api/stats",
  STUDENTS: "/api/students",
  HEALTH: "/api/health"
};

// Data source configuration
export const DATA_SOURCE = {
  // Set to 'supabase' for faster frontend performance or 'local' for direct API access
  STUDENTS: 'local',  // Changed from 'supabase' to 'local'
  ATTENDANCE: 'local', // Changed from 'supabase' to 'local'
  // Hardware-related endpoints must remain 'local'
  CAMERA: 'local',
  DOOR: 'local',
  RECOGNITION: 'local'
};