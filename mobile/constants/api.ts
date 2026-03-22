// Production Railway URL used for both dev and production.
// To use a local backend in dev, switch to 'http://localhost:3456'
// and run `adb reverse tcp:3456 tcp:3456` (USB or wireless ADB).
export const API_BASE_URL = 'https://poplist-production.up.railway.app';

// Google OAuth client IDs (created in Google Cloud Console)
// expoClientId = Web application type, redirect URI: https://auth.expo.io/@{EXPO_USERNAME}/poplist
export const GOOGLE_EXPO_CLIENT_ID =
  '31083873731-utp0kdcctml6t5770ssrdtqb2ak9cgrk.apps.googleusercontent.com';
// androidClientId = Android type (needed for production standalone builds)
export const GOOGLE_ANDROID_CLIENT_ID = '';
