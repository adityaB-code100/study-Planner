// API Configuration
// In production, this will be set by environment variables during build
// For development, it defaults to localhost

const getApiBaseUrl = (): string => {
  // Check if we're in production (built app)
  if (process.env.NODE_ENV === 'production') {
    // In production, use relative URLs (same domain as frontend)
    // This works because Flask serves the React build
    return '';
  }
  
  // In development, use the proxy or localhost
  // The proxy in package.json handles this, but we can also use localhost directly
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

export const API_BASE = getApiBaseUrl();

