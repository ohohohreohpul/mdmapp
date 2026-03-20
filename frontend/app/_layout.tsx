import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from '../contexts/UserContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';

/**
 * Public routes that must always be accessible in a browser without
 * requiring the app to be installed (e.g. certificate verification links
 * shared externally).
 */
const PUBLIC_PATHS = ['/verify/'];

function isPublicPath(): boolean {
  if (typeof window === 'undefined') return false;
  return PUBLIC_PATHS.some(p => window.location.pathname.startsWith(p));
}

/**
 * Detect whether the app is currently running as an installed PWA (standalone).
 * Called synchronously so we can initialise state without a flash.
 */
function checkStandalone(): boolean {
  if (Platform.OS !== 'web') return true;          // native — always show app
  if (typeof window === 'undefined') return true;  // SSR guard
  if (isPublicPath()) return true;                 // public pages bypass gate
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
  // Public paths like /verify/* are exempt so certificate links always work.
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
