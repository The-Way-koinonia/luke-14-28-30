import Constants from 'expo-constants';
import { Platform } from 'react-native';

const localhost = Platform.OS === 'ios' ? 'localhost:3000' : '10.0.2.2:3000';

const getApiUrl = () => {
  // If we're in development and have a hostUri (Metro bundler IP), use it
  // This allows the app on a physical device to connect to the computer's backend
  if (__DEV__ && Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(':')[0];
    return `http://${host}:3000/api`;
  }
  
  // Fallback to localhost for simulators if hostUri is missing
  return `http://${localhost}/api`;
}

// App-wide configuration constants
export const API_BASE_URL = getApiUrl();
