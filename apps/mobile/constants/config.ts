import { Platform } from 'react-native';

// App-wide configuration constants
export const API_BASE_URL = 
  Platform.OS === 'android' 
    ? 'http://10.0.2.2:3000/api'  // Android emulator maps localhost to 10.0.2.2
    : 'http://localhost:3000/api'; // iOS simulator can use localhost directly
