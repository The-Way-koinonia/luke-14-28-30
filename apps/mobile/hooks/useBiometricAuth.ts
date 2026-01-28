import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';

export function useBiometricAuth() {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(compatible && enrolled);
    })();
  }, []);

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setIsAuthenticated(true);
        return true;
      } else {
        // Only alert on failure if it wasn't cancelled by user
        if (result.error !== 'user_cancel') {
             Alert.alert('Authentication Failed', 'Please try again.');
        }
        return false;
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Alert.alert('Error', 'Biometric authentication failed.');
      return false;
    }
  };

  return { isBiometricSupported, isAuthenticated, authenticate };
}
