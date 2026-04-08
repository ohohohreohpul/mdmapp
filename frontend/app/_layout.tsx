import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserProvider } from '../contexts/UserContext';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// On web, the Stack navigator's built-in SafeAreaView adds paddingBottom equal
// to env(safe-area-inset-bottom) (~34px on iPhone), leaving a white strip at
// the bottom. Override bottom to 0 so the content fills the full screen.
// Individual screens handle their own top insets via useSafeAreaInsets().
function WebBottomInsetZero({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <SafeAreaInsetsContext.Provider value={{ ...insets, bottom: 0 }}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}

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

  // ── Normal app (install gate disabled) ───────────────────────────────────
  return (
    <SafeAreaProvider>
      <WebBottomInsetZero>
        <UserProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 220,
            }}
          />
        </UserProvider>
      </WebBottomInsetZero>
    </SafeAreaProvider>
  );
}
