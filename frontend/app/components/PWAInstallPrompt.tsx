/**
 * PWAInstallPrompt.tsx
 *
 * Full-screen install gate shown when the app is opened in a browser (not
 * installed as a PWA / standalone). The gate blocks the entire app until the
 * user installs it.  Once running in standalone mode the gate is never shown.
 *
 * Platform behaviour:
 *  • Android Chrome  — captures beforeinstallprompt and shows a native prompt
 *  • iOS Safari      — shows a bottom sheet with step-by-step instructions
 *  • Desktop Chrome  — shows browser install instructions
 *  • Other           — generic "open on mobile" message
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ── Platform helpers (only evaluated on web) ─────────────────────────────────
const ua = Platform.OS === 'web' && typeof navigator !== 'undefined'
  ? navigator.userAgent
  : '';

const isIOS     = /iPhone|iPad|iPod/.test(ua);
const isAndroid = /Android/.test(ua);
const isMobile  = isIOS || isAndroid;

// ── Feature list ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: 'school-outline',      label: 'คอร์สเรียนออนไลน์คุณภาพสูง' },
  { icon: 'document-text-outline', label: 'สร้าง Resume & Cover Letter อัจฉริยะ' },
  { icon: 'briefcase-outline',   label: 'โอกาสงานจากบริษัทชั้นนำ' },
  { icon: 'trophy-outline',      label: 'ใบรับรองที่นายจ้างเชื่อถือ' },
];

// ── iOS instruction steps ─────────────────────────────────────────────────────
const IOS_STEPS = [
  { num: '1', icon: 'arrow-up-circle-outline', text: 'แตะปุ่ม Share (กล่องลูกศรชี้ขึ้น) ที่แถบล่าง Safari' },
  { num: '2', label: 'Add to Home Screen',     text: 'เลือก "Add to Home Screen" จากเมนู' },
  { num: '3', label: 'Add',                    text: 'แตะ "Add" มุมขวาบน แล้วเปิดแอปจาก Home Screen' },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIOSSheet, setShowIOSSheet]     = useState(false);
  const [installing, setInstalling]         = useState(false);

  // Entrance fade-in
  const pageOpacity = useRef(new Animated.Value(0)).current;
  // iOS sheet slide
  const sheetY      = useRef(new Animated.Value(500)).current;
  const backdropO   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade page in
    Animated.timing(pageOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Android: capture beforeinstallprompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── Android install ──────────────────────────────────────────────────────
  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setInstalling(false);
    }
  };

  // ── iOS sheet ────────────────────────────────────────────────────────────
  const openIOSSheet = () => {
    setShowIOSSheet(true);
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 0, duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropO, {
        toValue: 1, duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeIOSSheet = () => {
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 500, duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropO, {
        toValue: 0, duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => setShowIOSSheet(false));
  };

  // ── CTA section ─────────────────────────────────────────────────────────
  function renderCTA() {
    if (isAndroid) {
      if (deferredPrompt) {
        return (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleAndroidInstall}
            activeOpacity={0.85}
            disabled={installing}
          >
            <Ionicons name="download-outline" size={22} color="#ef5ea8" />
            <Text style={styles.primaryBtnText}>
              {installing ? 'กำลังติดตั้ง…' : 'ติดตั้งแอป'}
            </Text>
          </TouchableOpacity>
        );
      }
      // Android but prompt not ready yet (e.g. already installed criteria not met)
      return (
        <View style={styles.hint}>
          <Ionicons name="menu-outline" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.hintText}>
            แตะเมนู ⋮ ของ Chrome แล้วเลือก "Add to Home Screen"
          </Text>
        </View>
      );
    }

    if (isIOS) {
      return (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={openIOSSheet}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up-circle-outline" size={22} color="#ef5ea8" />
          <Text style={styles.primaryBtnText}>วิธีติดตั้งบน iPhone / iPad</Text>
        </TouchableOpacity>
      );
    }

    // Desktop
    return (
      <View style={styles.desktopHint}>
        <Ionicons name="desktop-outline" size={28} color="rgba(255,255,255,0.5)" style={{ marginBottom: 10 }} />
        <Text style={styles.desktopHintTitle}>ใช้งานบนมือถือดีกว่า</Text>
        <Text style={styles.desktopHintSub}>
          เปิดลิงก์นี้บนโทรศัพท์ iOS หรือ Android{'\n'}
          แล้วติดตั้งเป็นแอปบน Home Screen
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.root, { opacity: pageOpacity }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Mascot ── */}
        <View style={styles.mascotWrap}>
          <Image
            source={require('../../assets/images/mascot.png')}
            style={styles.mascot}
            resizeMode="contain"
          />
        </View>

        {/* ── Brand ── */}
        <Image
          source={require('../../assets/images/logo-wordmark.png')}
          style={styles.wordmark}
          resizeMode="contain"
        />

        {/* ── Tagline ── */}
        <Text style={styles.tagline}>เรียนรู้ทักษะใหม่ เพื่ออาชีพในฝัน</Text>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Install prompt ── */}
        <View style={styles.installCard}>
          <View style={styles.installCardHeader}>
            <Ionicons name="phone-portrait-outline" size={20} color="#ef5ea8" />
            <Text style={styles.installCardTitle}>
              {isMobile ? 'ติดตั้งแอปเพื่อเริ่มเรียน' : 'เปิดบนมือถือเพื่อติดตั้ง'}
            </Text>
          </View>
          <Text style={styles.installCardSub}>
            ใช้งานได้เต็มที่เมื่อติดตั้งเป็นแอปบน Home Screen — เร็วกว่า ลื่นกว่า ไม่ต้องเปิดเบราว์เซอร์
          </Text>
        </View>

        {/* ── Features ── */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={18} color="#ef5ea8" />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* ── CTA ── */}
        <View style={styles.cta}>
          {renderCTA()}
        </View>
      </ScrollView>

      {/* ── iOS bottom sheet ── */}
      {showIOSSheet && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* Backdrop */}
          <Animated.View style={[styles.backdrop, { opacity: backdropO }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeIOSSheet} activeOpacity={1} />
          </Animated.View>

          {/* Sheet */}
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>วิธีติดตั้งบน iOS</Text>
              <TouchableOpacity style={styles.sheetClose} onPress={closeIOSSheet}>
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={styles.steps}>
              {IOS_STEPS.map((s) => (
                <IOSStep key={s.num} {...s} />
              ))}
            </View>

            <View style={{ height: 36 }} />
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}

// ── iOS step row ──────────────────────────────────────────────────────────────
function IOSStep({ num, icon, label, text }: {
  num: string; icon?: string; label?: string; text: string;
}) {
  return (
    <View style={stepS.row}>
      <Text style={stepS.num}>{num}</Text>
      <View style={stepS.badge}>
        {icon ? (
          <Ionicons name={icon as any} size={24} color="#FFF" />
        ) : (
          <View style={stepS.labelBadge}>
            <Ionicons name="add" size={12} color="#1F2937" style={{ marginRight: 2 }} />
            <Text style={stepS.labelText}>{label}</Text>
          </View>
        )}
      </View>
      <Text style={stepS.desc}>{text}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const PINK = '#ef5ea8';

const styles = StyleSheet.create({
  root: {
    position: 'absolute' as any,
    inset: 0,
    backgroundColor: '#0F0B1A', // dark, lets mascot pink stand out
    zIndex: 99999,
  } as any,
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Mascot
  mascotWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  mascot: {
    width: 130,
    height: 130,
    borderRadius: 36,
    overflow: 'hidden',
  },

  // Brand
  wordmark: {
    width: 140,
    height: 36,
    marginBottom: 10,
    tintColor: '#FFFFFF',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: 28,
  },

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 24,
  },

  // Install card
  installCard: {
    width: '100%',
    backgroundColor: 'rgba(239,94,168,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,94,168,0.25)',
    padding: 20,
    marginBottom: 20,
  },
  installCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  installCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  installCardSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 20,
  },

  // Features
  features: {
    width: '100%',
    gap: 14,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239,94,168,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },

  // CTA
  cta: {
    width: '100%',
    alignItems: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: PINK,
  },

  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 16,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },

  desktopHint: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  desktopHintTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  desktopHintSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  // iOS sheet
  sheet: {
    position: 'absolute' as any,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  sheetHandle: {
    width: 40, height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetClose: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: {
    gap: 24,
  },
});

const stepS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  num: {
    fontSize: 32,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.25)',
    width: 26,
  },
  badge: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
  },
  desc: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 20,
  },
});
