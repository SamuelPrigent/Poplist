// In development, use your local IP (not localhost - doesn't work from phone)
// In production, use the Railway URL
export const API_BASE_URL = 'https://poplist-production.up.railway.app';

// Google OAuth client IDs (created in Google Cloud Console)
// expoClientId = Web application type, redirect URI: https://auth.expo.io/@{EXPO_USERNAME}/poplist
export const GOOGLE_EXPO_CLIENT_ID = '31083873731-utp0kdcctml6t5770ssrdtqb2ak9cgrk.apps.googleusercontent.com';
// androidClientId = Android type (needed for production standalone builds)
export const GOOGLE_ANDROID_CLIENT_ID = '';
