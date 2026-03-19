import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Share,
  Linking,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://app.mydemy.co';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function formatThaiDate(cert: any) {
  const date = new Date(cert.issued_at);
  const d = date.getDate();
  const m = cert.issue_month || (date.getMonth() + 1);
  const y = (cert.issue_year || date.getFullYear()) + 543;
  return `${d} ${THAI_MONTHS[m - 1]} ${y}`;
}

function getLinkedInUrl(cert: any) {
  const certName = encodeURIComponent(
    cert.cert_type === 'career'
      ? `${cert.career_path} Certification — Mydemy`
      : `${cert.course_title} — Mydemy`
  );
  const issueYear = cert.issue_year || new Date(cert.issued_at).getFullYear();
  const issueMonth = cert.issue_month || new Date(cert.issued_at).getMonth() + 1;
  const certUrl = encodeURIComponent(`${APP_URL}/verify/${cert.verification_code}`);
  const certId = encodeURIComponent(cert.verification_code);
  return (
    `https://www.linkedin.com/profile/add` +
    `?startTask=CERTIFICATION_NAME` +
    `&name=${certName}` +
    `&organizationId=78329299` +
    `&issueYear=${issueYear}` +
    `&issueMonth=${issueMonth}` +
    `&certUrl=${certUrl}` +
    `&certId=${certId}`
  );
}

// ─── Certificate Preview Card (in the list) ──────────────────────────────────
function CertCard({ cert, onView }: { cert: any; onView: () => void }) {
  const isCareer = cert.cert_type === 'career';
  return (
    <TouchableOpacity
      style={[styles.certCard, isCareer && styles.certCardDark]}
      onPress={onView}
      activeOpacity={0.88}
    >
      {/* Top accent strip */}
      <View style={[styles.certStrip, isCareer && styles.certStripGold]} />

      {/* Logo / Brand */}
      {isCareer ? (
        <View style={styles.certLogoPillDark}>
          <Image
            source={require('../assets/images/logo-wordmark.png')}
            style={styles.certLogoImgDark}
            resizeMode="contain"
          />
        </View>
      ) : (
        <Image
          source={require('../assets/images/logo-wordmark.png')}
          style={styles.certLogoImg}
          resizeMode="contain"
        />
      )}

      {/* Type badge */}
      <View style={[styles.typeBadge, isCareer && styles.typeBadgeGold]}>
        <Text style={[styles.typeBadgeText, isCareer && styles.typeBadgeTextGold]}>
          {isCareer ? '🏆 Career Certification' : '🎓 Course Certificate'}
        </Text>
      </View>

      {/* Name */}
      <Text style={[styles.certCardName, isCareer && styles.certCardNameDark]}>
        {cert.user_display_name}
      </Text>

      {/* Title */}
      <Text style={[styles.certCardTitle, isCareer && styles.certCardTitleDark]} numberOfLines={2}>
        {cert.cert_type === 'career' ? cert.career_path : cert.course_title}
      </Text>

      {/* Date + code row */}
      <View style={styles.certCardMeta}>
        <Text style={[styles.certCardDate, isCareer && { color: 'rgba(255,255,255,0.6)' }]}>
          {formatThaiDate(cert)}
        </Text>
        <Text style={[styles.certCardCode, isCareer && { color: 'rgba(255,255,255,0.5)' }]}>
          {cert.verification_code}
        </Text>
      </View>

      {/* "View" chevron */}
      <View style={styles.viewHint}>
        <Text style={[styles.viewHintText, isCareer && { color: 'rgba(255,255,255,0.7)' }]}>
          แตะเพื่อดูใบประกาศ
        </Text>
        <Ionicons
          name="chevron-forward"
          size={14}
          color={isCareer ? 'rgba(255,255,255,0.5)' : COLORS.textTertiary}
        />
      </View>
    </TouchableOpacity>
  );
}

// ─── Certificate HTML for PDF generation ─────────────────────────────────────
function buildCertHtml(cert: any, appUrl: string) {
  const isCareer = cert.cert_type === 'career';
  const title = isCareer ? cert.career_path : cert.course_title;
  const coursesList = isCareer && cert.career_courses?.length
    ? cert.career_courses.map((c: string) => `<li>${c}</li>`).join('')
    : '';
  const stripColor = isCareer ? '#F59E0B' : '#E91E8C';
  const bg = isCareer ? '#111827' : '#ffffff';
  const textColor = isCareer ? '#F9FAFB' : '#1F2937';
  const subColor = isCareer ? 'rgba(255,255,255,0.55)' : '#6B7280';
  const titleColor = isCareer ? '#F59E0B' : '#E91E8C';
  const dividerColor = isCareer ? '#374151' : '#F3F4F6';
  const codeBoxBg = isCareer ? 'rgba(245,158,11,0.15)' : '#FDF2F8';
  const codeColor = isCareer ? '#FFD700' : '#E91E8C';
  const verifyUrl = `${appUrl}/verify/${cert.verification_code}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sarabun', sans-serif; background: #F7F8FA; display: flex; justify-content: center; padding: 32px 16px; }
  .cert {
    background: ${bg};
    border-radius: 20px;
    overflow: hidden;
    width: 600px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.15);
  }
  .strip { height: 8px; background: ${stripColor}; }
  .body { padding: 32px; }
  .logo { font-size: 22px; font-weight: 900; color: ${isCareer ? '#fff' : '#E91E8C'}; margin-bottom: 6px; letter-spacing: -0.5px; }
  .type { font-size: 11px; font-weight: 800; color: ${stripColor}; letter-spacing: 3px; margin-top: 20px; }
  .divider { height: 1px; background: ${dividerColor}; margin: 16px 0; }
  .presented { font-size: 13px; color: ${subColor}; margin-bottom: 4px; }
  .name { font-size: 32px; font-weight: 900; color: ${textColor}; letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 4px; }
  .completed { font-size: 13px; color: ${subColor}; margin-top: 16px; margin-bottom: 4px; }
  .title { font-size: 20px; font-weight: 700; color: ${titleColor}; line-height: 1.4; }
  .courses { margin-top: 16px; background: rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; border: 1px solid rgba(255,255,255,0.1); }
  .courses h4 { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.7); margin-bottom: 8px; }
  .courses li { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 22px; margin-left: 12px; }
  .date { font-size: 13px; color: ${subColor}; margin-bottom: 12px; }
  .code-box { display: inline-flex; align-items: center; gap: 6px; background: ${codeBoxBg}; padding: 8px 12px; border-radius: 8px; margin-bottom: 6px; }
  .code { font-size: 13px; font-weight: 700; color: ${codeColor}; font-family: monospace; }
  .verify { font-size: 10px; color: ${subColor}; }
  .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid ${dividerColor}; font-size: 10px; color: ${subColor}; text-align: center; }
</style>
</head>
<body>
<div class="cert">
  <div class="strip"></div>
  <div class="body">
    <div class="logo">mydemy</div>
    <div class="type">${isCareer ? 'CAREER CERTIFICATION' : 'CERTIFICATE OF COMPLETION'}</div>
    <div class="divider"></div>
    <div class="presented">${isCareer ? 'มอบให้แก่' : 'ขอมอบเกียรติบัตรนี้แก่'}</div>
    <div class="name">${cert.user_display_name}</div>
    <div class="completed">${isCareer ? 'สำเร็จหลักสูตร' : 'เพื่อแสดงว่าสำเร็จการศึกษาคอร์ส'}</div>
    <div class="title">${title}</div>
    ${coursesList ? `<div class="courses"><h4>📚 คอร์สที่เรียนสำเร็จ</h4><ul>${coursesList}</ul></div>` : ''}
    <div class="divider"></div>
    <div class="date">ออกให้ ณ วันที่ ${formatThaiDate(cert)}</div>
    <div class="code-box"><span class="code">✓ ${cert.verification_code}</span></div>
    <div class="verify">ตรวจสอบความถูกต้องที่ ${verifyUrl}</div>
    <div class="footer">© Mydemy — ใบประกาศนียบัตรนี้ออกโดยระบบอัตโนมัติและสามารถตรวจสอบได้ออนไลน์</div>
  </div>
</div>
</body>
</html>`;
}

// ─── Full Certificate Modal ───────────────────────────────────────────────────
function CertModal({
  cert,
  onClose,
}: {
  cert: any;
  onClose: () => void;
}) {
  const isCareer = cert.cert_type === 'career';
  const [exporting, setExporting] = useState(false);
  const verifyUrl = `${APP_URL}/verify/${cert.verification_code}`;
  const certTitle = isCareer ? cert.career_path : cert.course_title;

  const handleLinkedIn = async () => {
    try { await Linking.openURL(getLinkedInUrl(cert)); }
    catch { Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเปิด LinkedIn ได้'); }
  };

  // Social share with rich default message
  const handleShare = async () => {
    const message =
      `🎓 ฉันเพิ่งได้รับ${isCareer ? 'ใบรับรองอาชีพ' : 'ใบประกาศนียบัตร'}จาก Mydemy!\n\n` +
      `📜 "${certTitle}"\n\n` +
      `พัฒนาทักษะ UX Design, Figma และ Digital Skills เพื่ออาชีพในฝัน 🚀\n\n` +
      `ตรวจสอบใบประกาศ: ${verifyUrl}\n` +
      `เรียนกับ Mydemy: https://app.mydemy.co`;
    try {
      await Share.share({ message, url: verifyUrl });
    } catch { /* ignore cancel */ }
  };

  // Generate PDF and share/save
  const handleExportPDF = async () => {
    if (Platform.OS === 'web') {
      // Web: open print dialog
      const html = buildCertHtml(cert, APP_URL);
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); win.print(); }
      return;
    }
    setExporting(true);
    try {
      const { uri } = await Print.printToFileAsync({
        html: buildCertHtml(cert, APP_URL),
        base64: false,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Certificate — ${certTitle}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('บันทึกสำเร็จ', `PDF ถูกบันทึกที่:\n${uri}`);
      }
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถสร้าง PDF ได้');
    } finally {
      setExporting(false);
    }
  };

  // Send via email with verification link
  const handleEmail = async () => {
    const subject = encodeURIComponent(`ใบประกาศนียบัตร Mydemy — ${certTitle}`);
    const body = encodeURIComponent(
      `สวัสดี,\n\nฉันต้องการแชร์ใบประกาศนียบัตรจาก Mydemy\n\n` +
      `คอร์ส: ${certTitle}\n` +
      `ผู้เรียน: ${cert.user_display_name}\n` +
      `วันที่ออก: ${formatThaiDate(cert)}\n\n` +
      `ตรวจสอบใบประกาศออนไลน์ได้ที่:\n${verifyUrl}\n\n` +
      `หมายเลขยืนยัน: ${cert.verification_code}\n\n` +
      `ขอบคุณ,\nMydemy — https://app.mydemy.co`
    );
    const mailto = `mailto:?subject=${subject}&body=${body}`;
    try { await Linking.openURL(mailto); }
    catch { Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเปิดแอปอีเมลได้'); }
  };

  return (
    <Modal visible animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
        {/* Header bar */}
        <View style={modal.bar}>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={modal.barTitle}>ใบประกาศนียบัตร</Text>
          <TouchableOpacity onPress={handleShare} style={modal.shareBtn}>
            <Ionicons name="share-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modal.scroll}>

          {/* ── The Certificate itself ── */}
          <View style={[modal.cert, isCareer && modal.certDark]}>
            <View style={[modal.strip, isCareer && modal.stripGold]} />
            {isCareer ? (
              <View style={modal.logoPillDark}>
                <Image source={require('../assets/images/logo-wordmark.png')} style={modal.logoImgDark} resizeMode="contain" />
              </View>
            ) : (
              <Image source={require('../assets/images/logo-wordmark.png')} style={modal.logoImg} resizeMode="contain" />
            )}
            <Text style={[modal.certTypeLabel, isCareer && modal.certTypeLabelDark]}>
              {isCareer ? 'CAREER CERTIFICATION' : 'CERTIFICATE OF COMPLETION'}
            </Text>
            <View style={[modal.divider, isCareer && modal.dividerDark]} />
            <Text style={[modal.presentedTo, isCareer && modal.presentedToDark]}>
              {isCareer ? 'มอบให้แก่' : 'ขอมอบเกียรติบัตรนี้แก่'}
            </Text>
            <Text style={[modal.recipientName, isCareer && modal.recipientNameDark]}>{cert.user_display_name}</Text>
            <Text style={[modal.completedLabel, isCareer && modal.completedLabelDark]}>
              {isCareer ? 'สำเร็จหลักสูตร' : 'เพื่อแสดงว่าสำเร็จการศึกษาคอร์ส'}
            </Text>
            <Text style={[modal.mainTitle, isCareer && modal.mainTitleDark]}>{certTitle}</Text>
            {isCareer && cert.career_courses?.length > 0 && (
              <View style={modal.coursesList}>
                <Text style={modal.coursesListHeader}>📚 คอร์สที่เรียนสำเร็จ</Text>
                {cert.career_courses.map((c: string, i: number) => (
                  <Text key={i} style={modal.coursesListItem}>• {c}</Text>
                ))}
              </View>
            )}
            <View style={[modal.divider, isCareer && modal.dividerDark]} />
            <Text style={[modal.issuedDate, isCareer && modal.issuedDateDark]}>ออกให้ ณ วันที่ {formatThaiDate(cert)}</Text>
            <View style={[modal.codeBox, isCareer && modal.codeBoxDark]}>
              <Ionicons name="shield-checkmark" size={16} color={isCareer ? '#FFD700' : COLORS.primary} />
              <Text style={[modal.codeText, isCareer && modal.codeTextDark]}>{cert.verification_code}</Text>
            </View>
            <Text style={[modal.verifyHint, isCareer && modal.verifyHintDark]}>ตรวจสอบความถูกต้องที่ app.mydemy.co/verify</Text>
          </View>

          {/* ── Action buttons ── */}
          <View style={modal.actions}>
            {/* LinkedIn */}
            <TouchableOpacity style={modal.linkedinBtn} onPress={handleLinkedIn}>
              <Image
                source={{ uri: 'https://download.linkedin.com/desktop/add2profile/buttons/en_US.png' }}
                style={modal.linkedinImg}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Row: Share + PDF */}
            <View style={modal.actionRow}>
              <TouchableOpacity style={[modal.actionBtn, { backgroundColor: COLORS.primary }]} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={19} color="#fff" />
                <Text style={modal.actionBtnText}>แชร์</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[modal.actionBtn, { backgroundColor: '#1F2937' }]} onPress={handleExportPDF} disabled={exporting}>
                {exporting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="document-outline" size={19} color="#fff" />}
                <Text style={modal.actionBtnText}>บันทึก PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[modal.actionBtn, { backgroundColor: '#0891B2' }]} onPress={handleEmail}>
                <Ionicons name="mail-outline" size={19} color="#fff" />
                <Text style={modal.actionBtnText}>ส่งอีเมล</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Verification info */}
          <View style={modal.verifyBox}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
            <Text style={modal.verifyBoxText}>
              ใบประกาศนียบัตรนี้สามารถตรวจสอบความถูกต้องได้ที่{' '}
              <Text style={{ color: COLORS.primary }}>{APP_URL}/verify/{cert.verification_code}</Text>
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function Certificates() {
  const router = useRouter();
  const { user } = useUser();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  useEffect(() => {
    if (user?._id) {
      loadCerts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadCerts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/certificates/user/${user!._id}`);
      setCerts(res.data || []);
    } catch (err) {
      console.error('Error loading certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ใบประกาศนียบัตร</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : !user ? (
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={56} color={COLORS.textTertiary} />
          <Text style={styles.emptyTitle}>เข้าสู่ระบบก่อนนะ</Text>
          <Text style={styles.emptyBody}>
            ต้อง login ก่อนถึงจะดูใบประกาศของตัวเองได้
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.loginBtnText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {certs.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="ribbon-outline" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>ยังไม่มีใบประกาศ</Text>
              <Text style={styles.emptyBody}>
                เรียนจนจบคอร์สและผ่านข้อสอบเพื่อรับใบประกาศนียบัตรของคุณ!
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push('/(tabs)/explore')}
              >
                <Text style={styles.exploreBtnText}>สำรวจคอร์ส →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>
                ใบประกาศของฉัน ({certs.length})
              </Text>

              {certs.map(cert => (
                <CertCard
                  key={cert.id}
                  cert={cert}
                  onView={() => setSelectedCert(cert)}
                />
              ))}

              <View style={styles.tipBox}>
                <Ionicons name="bulb-outline" size={18} color={COLORS.warning} />
                <Text style={styles.tipText}>
                  แตะใบประกาศเพื่อดูฉบับเต็ม แชร์ หรือเพิ่มใน LinkedIn ได้เลย
                </Text>
              </View>
            </>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      )}

      {/* Full certificate modal */}
      {selectedCert && (
        <CertModal cert={selectedCert} onClose={() => setSelectedCert(null)} />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  safeArea: { backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 44, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg },

  sectionLabel: {
    fontSize: 16, fontWeight: '700', color: '#1F2937',
    marginBottom: SPACING.md,
  },

  // ── Certificate preview card ─────────────────────────────
  certCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    paddingBottom: SPACING.md,
  },
  certCardDark: {
    backgroundColor: '#111827',
  },
  certStrip: {
    height: 5,
    backgroundColor: COLORS.primary,
  },
  certStripGold: {
    backgroundColor: '#F59E0B',
  },
  certLogoImg: {
    width: 110, height: 36,
    marginTop: SPACING.md,
    marginLeft: SPACING.lg,
  },
  certLogoPillDark: {
    marginTop: SPACING.md,
    marginLeft: SPACING.lg,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  certLogoImgDark: {
    width: 90, height: 28,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  typeBadgeGold: {
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  typeBadgeText: {
    fontSize: 11, fontWeight: '600',
    color: COLORS.primary,
  },
  typeBadgeTextGold: {
    color: '#F59E0B',
  },
  certCardName: {
    fontSize: 20, fontWeight: '800',
    color: '#1F2937',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  certCardNameDark: { color: '#F9FAFB' },
  certCardTitle: {
    fontSize: 14, fontWeight: '500',
    color: COLORS.textSecondary,
    marginHorizontal: SPACING.lg,
    marginTop: 4,
    lineHeight: 20,
  },
  certCardTitleDark: { color: 'rgba(255,255,255,0.7)' },
  certCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  certCardDate: { fontSize: 12, color: COLORS.textSecondary },
  certCardCode: { fontSize: 11, color: COLORS.textTertiary, fontFamily: 'monospace' },
  viewHint: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: SPACING.lg,
    marginTop: 8,
    gap: 3,
  },
  viewHintText: { fontSize: 11, color: COLORS.textTertiary },

  // ── Empty states ─────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 96, height: 96,
    borderRadius: 48,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  emptyBody: {
    fontSize: 14, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  exploreBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: RADIUS.lg,
  },
  exploreBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: RADIUS.lg,
    marginTop: 8,
  },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // ── Tip box ──────────────────────────────────────────────
  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  tipText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  shareBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  barTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },

  scroll: { padding: SPACING.lg },

  // ── The certificate "paper" ──────────────────────────────
  cert: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  certDark: {
    backgroundColor: '#111827',
    borderColor: '#374151',
  },

  strip: { height: 6, backgroundColor: COLORS.primary },
  stripGold: { backgroundColor: '#F59E0B' },

  logoImg: {
    width: 130, height: 42,
    marginTop: 24, marginLeft: 24,
  },
  logoPillDark: {
    marginTop: 24,
    marginLeft: 24,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoImgDark: {
    width: 100, height: 32,
  },

  certTypeLabel: {
    fontSize: 11, fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: 20,
    marginHorizontal: 24,
  },
  certTypeLabelDark: { color: '#F59E0B' },

  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 24,
    marginVertical: 16,
  },
  dividerDark: { backgroundColor: '#374151' },

  presentedTo: {
    fontSize: 13, color: COLORS.textSecondary,
    marginHorizontal: 24,
    marginBottom: 4,
  },
  presentedToDark: { color: 'rgba(255,255,255,0.5)' },

  recipientName: {
    fontSize: 28, fontWeight: '900',
    color: '#1F2937',
    marginHorizontal: 24,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  recipientNameDark: { color: '#F9FAFB' },

  completedLabel: {
    fontSize: 13, color: COLORS.textSecondary,
    marginHorizontal: 24,
    marginTop: 16, marginBottom: 4,
  },
  completedLabelDark: { color: 'rgba(255,255,255,0.5)' },

  mainTitle: {
    fontSize: 18, fontWeight: '700',
    color: COLORS.primary,
    marginHorizontal: 24,
    lineHeight: 26,
  },
  mainTitleDark: { color: '#F59E0B' },

  // Courses list (career cert)
  coursesList: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  coursesListHeader: {
    fontSize: 12, fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  coursesListItem: {
    fontSize: 12, color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },

  issuedDate: {
    fontSize: 13, color: COLORS.textSecondary,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  issuedDateDark: { color: 'rgba(255,255,255,0.5)' },

  codeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 24,
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  codeBoxDark: {
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  codeText: {
    fontSize: 13, fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'monospace',
  },
  codeTextDark: { color: '#FFD700' },

  verifyHint: {
    fontSize: 10, color: COLORS.textTertiary,
    marginHorizontal: 24,
  },
  verifyHintDark: { color: 'rgba(255,255,255,0.3)' },

  // ── Action buttons ────────────────────────────────────────
  actions: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  linkedinBtn: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkedinImg: {
    width: 180, height: 36,
  },
  shareFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 8,
  },
  shareFullText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
  },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // ── Verify info ───────────────────────────────────────────
  verifyBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: SPACING.md,
    backgroundColor: '#F9FAFB',
    borderRadius: RADIUS.md,
    padding: 12,
  },
  verifyBoxText: {
    flex: 1, fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
