import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const DISMISSED_KEY = 'pwa_dismissed_v1';

// Only runs on web
const isIOS = Platform.OS === 'web' &&
  typeof navigator !== 'undefined' &&
  /iPhone|iPad|iPod/.test(navigator.userAgent);

const isAndroid = Platform.OS === 'web' &&
  typeof navigator !== 'undefined' &&
  /Android/.test(navigator.userAgent);

function isInStandaloneMode(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export default function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const slideAnim = useRef(new Animated.Value(120)).current;
  const sheetAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isInStandaloneMode()) return;

    AsyncStorage.getItem(DISMISSED_KEY).then(val => {
      if (val === 'true') return;
      // Small delay so app finishes loading first
      setTimeout(() => setVisible(true), 3000);
    });

    // Android: capture the beforeinstallprompt event
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const openSheet = () => {
    setShowSheet(true);
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 400,
      duration: 280,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setShowSheet(false));
  };

  const dismiss = async () => {
    await AsyncStorage.setItem(DISMISSED_KEY, 'true');
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 120,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
    if (showSheet) closeSheet();
  };

  const handleInstallPress = async () => {
    if (isAndroid && deferredPrompt) {
      // Android: trigger native prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') await dismiss();
    } else {
      // iOS or fallback: show manual instructions
      openSheet();
    }
  };

  if (!visible || Platform.OS !== 'web') return null;

  return (
    <>
      {/* Floating install button */}
      <Animated.View
        style={[
          styles.floatWrap,
          { transform: [{ translateY: slideAnim }], opacity: fadeAnim },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.floatRow}>
          {/* Dismiss X */}
          <TouchableOpacity style={styles.dismissBtn} onPress={dismiss}>
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          {/* Install button */}
          <TouchableOpacity style={styles.installBtn} onPress={handleInstallPress} activeOpacity={0.85}>
            <View style={styles.installBtnInner}>
              <Ionicons name="add-circle-outline" size={20} color="#FFF" />
              <Text style={styles.installBtnText}>Install Web App</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* iOS instruction sheet */}
      {showSheet && (
        <View style={styles.backdrop} pointerEvents="box-none">
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeSheet} activeOpacity={1} />
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}
          >
            {/* Handle bar */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Install iOS web app</Text>
              <TouchableOpacity style={styles.sheetClose} onPress={() => { closeSheet(); dismiss(); }}>
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Steps */}
            <View style={styles.steps}>
              <Step
                num="1"
                icon="arrow-up-circle-outline"
                text="Press this button at the bottom of the screen"
              />
              <Step
                num="2"
                label="Add to Home Screen"
                text="Press this button from the menu"
              />
              <Step
                num="3"
                label="Add"
                text='Press "Add" at the top right corner'
              />
            </View>

            {/* Bottom safe space */}
            <View style={{ height: 24 }} />
          </Animated.View>
        </View>
      )}
    </>
  );
}

function Step({
  num,
  icon,
  label,
  text,
}: {
  num: string;
  icon?: string;
  label?: string;
  text: string;
}) {
  return (
    <View style={step.row}>
      <Text style={step.num}>{num}</Text>
      <View style={step.badge}>
        {icon ? (
          <Ionicons name={icon as any} size={26} color="#FFF" />
        ) : (
          <View style={step.labelBadge}>
            <Ionicons name="add" size={14} color="#1F2937" style={{ marginRight: 2 }} />
            <Text style={step.labelText}>{label}</Text>
          </View>
        )}
      </View>
      <Text style={step.desc}>{text}</Text>
    </View>
  );
}

const PINK = '#ef5ea8';

const styles = StyleSheet.create({
  floatWrap: {
    position: 'absolute' as any,
    bottom: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none' as any,
  },
  floatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dismissBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  installBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  installBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: PINK,
  },
  installBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.2,
  },

  // Backdrop
  backdrop: {
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 10000,
  },

  // Sheet
  sheet: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  steps: {
    gap: 28,
  },
});

const step = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  num: {
    fontSize: 36,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.3)',
    width: 28,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  desc: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
});
