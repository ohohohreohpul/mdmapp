/**
 * Public certificate verification page
 * Accessible at: /verify/MDY-202603-XXXXXX
 * No login required — anyone can verify a certificate.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://app.mydemy.co';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function formatDate(cert: any) {
  const date = new Date(cert.issued_at);
  const d = date.getDate();
  const m = cert.issue_month || (date.getMonth() + 1);
  const y = (cert.issue_year || date.getFullYear()) + 543;
  return `${d} ${THAI_MONTHS[m - 1]} ${y}`;
}

export default function VerifyCertificate() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (code) fetchCert();
  }, [code]);

  const fetchCert = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/certificates/verify/${code}`);
      setCert(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const isCareer = cert?.cert_type === 'career';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ตรวจสอบใบประกาศ</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>กำลังตรวจสอบ...</Text>
        </View>
      ) : notFound ? (
        <View style={styles.center}>
          <View style={styles.notFoundIcon}>
            <Ionicons name="close-circle" size={52} color="#EF4444" />
          </View>
          <Text style={styles.notFoundTitle}>ไม่พบใบประกาศ</Text>
          <Text style={styles.notFoundBody}>
            รหัส {code} ไม่ตรงกับใบประกาศใดๆ ในระบบ
            {'\n'}อาจพิมพ์ผิด หรือใบประกาศนี้ไม่มีอยู่จริง
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Valid badge */}
          <View style={styles.validBadge}>
            <Ionicons name="shield-checkmark" size={22} color="#10B981" />
            <Text style={styles.validText}>ใบประกาศนี้ถูกต้องและออกโดย Mydemy</Text>
          </View>

          {/* Certificate */}
          <View style={[styles.cert, isCareer && styles.certDark]}>
            <View style={[styles.strip, isCareer && styles.stripGold]} />

            {isCareer ? (
              <View style={styles.logoPillDark}>
                <Image
                  source={require('../../assets/images/logo-wordmark.png')}
                  style={styles.logoImgDark}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <Image
                source={require('../../assets/images/logo-wordmark.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
            )}

            <Text style={[styles.certType, isCareer && styles.certTypeDark]}>
              {isCareer ? 'CAREER CERTIFICATION' : 'CERTIFICATE OF COMPLETION'}
            </Text>

            <View style={[styles.divider, isCareer && styles.dividerDark]} />

            <Text style={[styles.presentedTo, isCareer && styles.presentedToDark]}>
              {isCareer ? 'มอบให้แก่' : 'ขอมอบเกียรติบัตรนี้แก่'}
            </Text>
            <Text style={[styles.recipientName, isCareer && styles.recipientNameDark]}>
              {cert.user_display_name}
            </Text>

            <Text style={[styles.completedLabel, isCareer && styles.completedLabelDark]}>
              {isCareer ? 'สำเร็จหลักสูตร' : 'เพื่อแสดงว่าสำเร็จการศึกษาคอร์ส'}
            </Text>
            <Text style={[styles.mainTitle, isCareer && styles.mainTitleDark]}>
              {isCareer ? cert.career_path : cert.course_title}
            </Text>

            {isCareer && cert.career_courses && cert.career_courses.length > 0 && (
              <View style={styles.coursesList}>
                <Text style={styles.coursesListHeader}>📚 คอร์สที่เรียนสำเร็จ</Text>
                {cert.career_courses.map((c: string, i: number) => (
                  <Text key={i} style={styles.coursesListItem}>• {c}</Text>
                ))}
              </View>
            )}

            <View style={[styles.divider, isCareer && styles.dividerDark]} />

            <Text style={[styles.issuedDate, isCareer && styles.issuedDateDark]}>
              ออกให้ ณ วันที่ {formatDate(cert)}
            </Text>

            <View style={[styles.codeBox, isCareer && styles.codeBoxDark]}>
              <Ionicons name="shield-checkmark" size={14} color={isCareer ? '#FFD700' : COLORS.primary} />
              <Text style={[styles.codeText, isCareer && styles.codeTextDark]}>
                {cert.verification_code}
              </Text>
            </View>
          </View>

          {/* Explore Mydemy CTA */}
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Image
              source={require('../../assets/images/logo-wordmark.png')}
              style={styles.ctaLogo}
              resizeMode="contain"
            />
            <Text style={styles.ctaText}>เรียนที่ Mydemy →</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },

  notFoundIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  notFoundTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  notFoundBody: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },

  scroll: { padding: SPACING.lg },

  validBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#6EE7B7',
  },
  validText: { fontSize: 14, fontWeight: '600', color: '#065F46' },

  // Certificate paper
  cert: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    paddingBottom: 28,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  certDark: { backgroundColor: '#111827', borderColor: '#374151' },

  strip: { height: 6, backgroundColor: COLORS.primary },
  stripGold: { backgroundColor: '#F59E0B' },

  logoImg: { width: 120, height: 40, marginTop: 22, marginLeft: 22 },
  logoPillDark: {
    marginTop: 22,
    marginLeft: 22,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  logoImgDark: { width: 90, height: 28 },

  certType: {
    fontSize: 11, fontWeight: '800', color: COLORS.primary,
    letterSpacing: 2, marginTop: 18, marginHorizontal: 22,
  },
  certTypeDark: { color: '#F59E0B' },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 22, marginVertical: 14 },
  dividerDark: { backgroundColor: '#374151' },

  presentedTo: { fontSize: 13, color: COLORS.textSecondary, marginHorizontal: 22, marginBottom: 4 },
  presentedToDark: { color: 'rgba(255,255,255,0.5)' },

  recipientName: {
    fontSize: 26, fontWeight: '900', color: '#1F2937',
    marginHorizontal: 22, letterSpacing: -0.5, lineHeight: 32,
  },
  recipientNameDark: { color: '#F9FAFB' },

  completedLabel: {
    fontSize: 13, color: COLORS.textSecondary,
    marginHorizontal: 22, marginTop: 14, marginBottom: 4,
  },
  completedLabelDark: { color: 'rgba(255,255,255,0.5)' },

  mainTitle: {
    fontSize: 16, fontWeight: '700', color: COLORS.primary,
    marginHorizontal: 22, lineHeight: 24,
  },
  mainTitleDark: { color: '#F59E0B' },

  coursesList: {
    marginHorizontal: 22, marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  coursesListHeader: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  coursesListItem: { fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },

  issuedDate: {
    fontSize: 12, color: COLORS.textSecondary,
    marginHorizontal: 22, marginBottom: 10,
  },
  issuedDateDark: { color: 'rgba(255,255,255,0.5)' },

  codeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 22,
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: RADIUS.md, alignSelf: 'flex-start',
  },
  codeBoxDark: { backgroundColor: 'rgba(245,158,11,0.1)' },
  codeText: { fontSize: 13, fontWeight: '700', color: COLORS.primary, fontFamily: 'monospace' },
  codeTextDark: { color: '#FFD700' },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: SPACING.xl,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: 16, gap: 10,
    borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  ctaLogo: { width: 80, height: 28 },
  ctaText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
