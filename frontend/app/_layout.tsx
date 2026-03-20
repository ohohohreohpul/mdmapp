import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from '../contexts/UserContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <Stack screenOptions={{ headerShown: false }} />
        {Platform.OS === 'web' && <PWAInstallPrompt />}
      </UserProvider>
    </SafeAreaProvider>
  );
}
