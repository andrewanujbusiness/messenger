// API Configuration
// This file automatically detects the correct API URL for different environments

const getApiUrl = () => {
  // For development on physical device or simulator, use computer's IP
  // For web development, use localhost
  if (__DEV__) {
    // Check if we're running on a device/simulator vs web
    const isWeb = typeof window !== 'undefined' && window.location;
    if (isWeb) {
      return 'http://localhost:3001';
    } else {
      // For React Native on device/simulator, use computer's IP
      return 'http://10.0.0.160:3001';
    }
  }
  
  // For production, you would use your actual server URL
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiUrl();
export const SOCKET_URL = getApiUrl(); 