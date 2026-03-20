import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from '../contexts/UserContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';

/**
 * Detect whether the app is currently running as an installed PWA (standalone).
 * Called synchronously so we can initialise state without a flash.
 */
function checkStandalone(): boolean {
  if (Platform.OS !== 'web') return true;          // native — always show app
  if (typeof window === 'undefined') return true;  // SSR guard
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export default function RootLayout() {
  // Initialise synchronously to avoid a "flash" of the wrong view
  const [isStandalone, setIsStandalone] = useState<boolean>(checkStandalone);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    // Re-check once the component mounts (covers edge cases / SSR hydration)
    setIsStandalone(checkStandalone());

    // Listen for display-mode changes (e.g. user installs mid-session)
    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Browser (not installed) → show full-screen install gate ──────────────
  if (Platform.OS === 'web' && !isStandalone) {
    return <PWAInstallPrompt />;
  }

  // ── Installed PWA or native → normal app ─────────────────────────────────
  return (
    <SafeAreaProvider>
      <UserProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </UserProvider>
    </SafeAreaProvider>
  );
}
