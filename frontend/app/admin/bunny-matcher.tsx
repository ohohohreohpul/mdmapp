import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BunnyVideo {
  guid: string;
  title: string;
  length: number;
  embed_url: string;
}

interface LessonItem {
  id: string;
  title: string;
  module_title: string;
  course_title: string;
  current_video_url?: string;
}

interface MatchRow {
  lesson: LessonItem;
  video_guid: string | null;
  video_title: string | null;
  embed_url: string | null;
  confidence: number;
  status: 'pending' | 'confirmed' | 'skipped';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BunnyMatcher() {
  const router = useRouter();

  const [phase, setPhase] = useState<'idle' | 'loading' | 'review' | 'applying'>('idle');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [allVideos, setAllVideos] = useState<BunnyVideo[]>([]);

  // Video picker modal
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const confidenceColor = (c: number) => {
    if (c >= 0.75) return '#10B981';
    if (c >= 0.45) return '#F59E0B';
    return '#EF4444';
  };

  const confidenceLabel = (c: number) => {
    if (c >= 0.75) return 'สูง';
    if (c >= 0.45) return 'กลาง';
    return 'ต่ำ';
  };

  const confirmedCount = matches.filter((m) => m.status === 'confirmed').length;
  const skippedCount = matches.filter((m) => m.status === 'skipped').length;

  // ── Main flow ─────────────────────────────────────────────────────────────

  const runMatcher = useCallback(async () => {
    try {
      setPhase('loading');

      // 1. Fetch Bunny videos
      setLoadingMsg('กำลังดึงวิดีโอจาก Bunny.net…');
      const bunnyRes = await axios.get(`${API_URL}/api/bunny/videos`);
      const videos: BunnyVideo[] = bunnyRes.data.videos || [];
      setAllVideos(videos);

      if (videos.length === 0) {
        Alert.alert('ไม่พบวิดีโอ', 'ไม่พบวิดีโอใน Bunny.net Library กรุณาตรวจสอบ API Key และ Library ID');
        setPhase('idle');
        return;
      }

      // 2. Fetch all courses → modules → lessons
      setLoadingMsg('กำลังโหลดบทเรียนทั้งหมด…');
      const coursesRes = await axios.get(`${API_URL}/api/courses`);
      const courses: any[] = coursesRes.data || [];

      const lessonItems: LessonItem[] = [];
      for (const course of courses) {
        const modulesRes = await axios.get(`${API_URL}/api/modules/course/${course._id}`);
        const modules: any[] = modulesRes.data || [];
        for (const mod of modules) {
          const lessonsRes = await axios.get(`${API_URL}/api/lessons/module/${mod._id}`);
          const lessons: any[] = lessonsRes.data || [];
          for (const lesson of lessons) {
            if (lesson.content_type === 'video') {
              lessonItems.push({
                id: lesson._id,
                title: lesson.title,
                module_title: mod.title,
                course_title: course.title,
                current_video_url: lesson.video_url,
              });
            }
          }
        }
      }

      if (lessonItems.length === 0) {
        Alert.alert('ไม่พบบทเรียนวิดีโอ', 'ยังไม่มีบทเรียนประเภทวิดีโอในระบบ');
        setPhase('idle');
        return;
      }

      // 3. Ask AI to match
      setLoadingMsg(`กำลังให้ AI จับคู่ (${lessonItems.length} บทเรียน ↔ ${videos.length} วิดีโอ)…`);
      const matchRes = await axios.post(`${API_URL}/api/bunny/ai-match`, {
        lessons: lessonItems.map((l) => ({
          id: l.id,
          title: l.title,
          module_title: l.module_title,
          course_title: l.course_title,
        })),
        videos: videos.map((v) => ({
          guid: v.guid,
          title: v.title,
          embed_url: v.embed_url,
        })),
      });

      const rawMatches: any[] = matchRes.data.matches || [];

      // 4. Build MatchRow list
      const lessonMap = Object.fromEntries(lessonItems.map((l) => [l.id, l]));
      const videoMap = Object.fromEntries(videos.map((v) => [v.guid, v]));

      const rows: MatchRow[] = rawMatches
        .filter((m) => lessonMap[m.lesson_id])
        .map((m) => ({
          lesson: lessonMap[m.lesson_id],
          video_guid: m.video_guid || null,
          video_title: m.video_title || null,
          embed_url: m.embed_url || null,
          confidence: m.confidence || 0,
          status: m.video_guid ? 'pending' : 'skipped',
        }));

      // Also add lessons that AI didn't mention
      const matchedIds = new Set(rawMatches.map((m) => m.lesson_id));
      for (const lesson of lessonItems) {
        if (!matchedIds.has(lesson.id)) {
          rows.push({
            lesson,
            video_guid: null,
            video_title: null,
            embed_url: null,
            confidence: 0,
            status: 'skipped',
          });
        }
      }

      setMatches(rows);
      setPhase('review');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'เกิดข้อผิดพลาด';
      Alert.alert('ผิดพลาด', msg);
      setPhase('idle');
    }
  }, []);

  // ── Apply confirmed matches ───────────────────────────────────────────────

  const applyMatches = useCallback(async () => {
    const toApply = matches.filter((m) => m.status === 'confirmed' && m.embed_url);
    if (toApply.length === 0) {
      Alert.alert('ไม่มีรายการ', 'กรุณายืนยัน (✓) อย่างน้อย 1 รายการก่อน');
      return;
    }

    Alert.alert(
      'ยืนยันการบันทึก',
      `บันทึก embed URL ให้ ${toApply.length} บทเรียน?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'บันทึก',
          onPress: async () => {
            setPhase('applying');
            let success = 0;
            let fail = 0;
            for (const row of toApply) {
              try {
                await axios.put(`${API_URL}/api/lessons/${row.lesson.id}`, {
                  video_url: row.embed_url,
                  video_id: row.video_guid,
                });
                success++;
              } catch {
                fail++;
              }
            }
            setPhase('review');
            Alert.alert(
              'เสร็จสิ้น',
              `บันทึกสำเร็จ ${success} บทเรียน${fail > 0 ? ` (ล้มเหลว ${fail})` : ''}`,
            );
          },
        },
      ],
    );
  }, [matches]);

  // ── Row actions ───────────────────────────────────────────────────────────

  const toggleConfirm = (idx: number) => {
    setMatches((prev) =>
      prev.map((m, i) =>
        i === idx
          ? { ...m, status: m.status === 'confirmed' ? 'pending' : 'confirmed' }
          : m,
      ),
    );
  };

  const toggleSkip = (idx: number) => {
    setMatches((prev) =>
      prev.map((m, i) =>
        i === idx
          ? { ...m, status: m.status === 'skipped' ? 'pending' : 'skipped' }
          : m,
      ),
    );
  };

  const confirmAll = () => {
    setMatches((prev) =>
      prev.map((m) => (m.video_guid ? { ...m, status: 'confirmed' } : m)),
    );
  };

  const openPicker = (idx: number) => {
    setPickerTargetIdx(idx);
    setPickerOpen(true);
  };

  const pickVideo = (video: BunnyVideo) => {
    if (pickerTargetIdx === null) return;
    setMatches((prev) =>
      prev.map((m, i) =>
        i === pickerTargetIdx
          ? {
              ...m,
              video_guid: video.guid,
              video_title: video.title,
              embed_url: video.embed_url,
              confidence: 1,
              status: 'confirmed',
            }
          : m,
      ),
    );
    setPickerOpen(false);
    setPickerTargetIdx(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const renderRow = ({ item, index }: { item: MatchRow; index: number }) => {
    const isConfirmed = item.status === 'confirmed';
    const isSkipped = item.status === 'skipped';
    const hasVideo = !!item.video_guid;

    return (
      <View
        style={[
          styles.matchCard,
          isConfirmed && styles.matchCardConfirmed,
          isSkipped && styles.matchCardSkipped,
        ]}
      >
        {/* Lesson info */}
        <View style={styles.lessonBlock}>
          <Text style={styles.lessonTitle} numberOfLines={2}>{item.lesson.title}</Text>
          <Text style={styles.lessonMeta} numberOfLines={1}>
            {item.lesson.course_title} › {item.lesson.module_title}
          </Text>
          {item.lesson.current_video_url ? (
            <Text style={styles.alreadySet}>✅ มี URL อยู่แล้ว</Text>
          ) : null}
        </View>

        {/* Arrow + video suggestion */}
        <View style={styles.arrowBlock}>
          <Ionicons name="arrow-forward" size={18} color={COLORS.textTertiary} />
        </View>

        <View style={styles.videoBlock}>
          {hasVideo ? (
            <>
              <Text style={styles.videoTitle} numberOfLines={2}>{item.video_title}</Text>
              <View style={styles.confidenceRow}>
                <View
                  style={[
                    styles.confidenceBadge,
                    { backgroundColor: confidenceColor(item.confidence) + '20' },
                  ]}
                >
                  <Text style={[styles.confidenceText, { color: confidenceColor(item.confidence) }]}>
                    {confidenceLabel(item.confidence)} {Math.round(item.confidence * 100)}%
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.noMatchText}>ไม่พบคู่ที่เหมาะสม</Text>
          )}
          <TouchableOpacity style={styles.changeBtn} onPress={() => openPicker(index)}>
            <Ionicons name="swap-horizontal" size={13} color={COLORS.primary} />
            <Text style={styles.changeBtnText}>เปลี่ยน</Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.actionBlock}>
          <TouchableOpacity
            style={[styles.actionBtn, isConfirmed && styles.actionBtnActive]}
            onPress={() => toggleConfirm(index)}
            disabled={!hasVideo}
          >
            <Ionicons
              name="checkmark"
              size={18}
              color={isConfirmed ? '#FFFFFF' : hasVideo ? COLORS.success : '#D1D5DB'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, isSkipped && styles.actionBtnSkip]}
            onPress={() => toggleSkip(index)}
          >
            <Ionicons
              name="remove"
              size={18}
              color={isSkipped ? '#FFFFFF' : COLORS.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Screens ──────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🐰 Bunny Video Matcher</Text>
            <Text style={styles.headerSub}>AI จับคู่วิดีโอให้บทเรียนอัตโนมัติ</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* ── IDLE ── */}
      {phase === 'idle' && (
        <View style={styles.centered}>
          <Text style={styles.heroEmoji}>🎬</Text>
          <Text style={styles.heroTitle}>จับคู่วิดีโอ Bunny.net</Text>
          <Text style={styles.heroDesc}>
            AI จะดึงวิดีโอจาก Bunny Library และเปรียบเทียบชื่อกับบทเรียนทั้งหมดของคุณ
            แล้วแนะนำการจับคู่ที่ดีที่สุด คุณสามารถยืนยัน เปลี่ยน หรือข้ามแต่ละรายการได้
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={runMatcher}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>เริ่มจับคู่อัตโนมัติ</Text>
          </TouchableOpacity>
          <Text style={styles.prereqNote}>
            ⚙️ ต้องตั้งค่า Bunny API Key, Library ID และ AI Key ใน Admin → ตั้งค่าระบบ ก่อน
          </Text>
        </View>
      )}

      {/* ── LOADING ── */}
      {phase === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingMsg}>{loadingMsg}</Text>
        </View>
      )}

      {/* ── APPLYING ── */}
      {phase === 'applying' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingMsg}>กำลังบันทึก embed URLs…</Text>
        </View>
      )}

      {/* ── REVIEW ── */}
      {phase === 'review' && (
        <>
          {/* Summary bar */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{matches.length}</Text>
              <Text style={styles.summaryLabel}>ทั้งหมด</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: COLORS.success }]}>{confirmedCount}</Text>
              <Text style={styles.summaryLabel}>ยืนยัน</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: COLORS.textTertiary }]}>{skippedCount}</Text>
              <Text style={styles.summaryLabel}>ข้าม</Text>
            </View>
            <TouchableOpacity style={styles.confirmAllBtn} onPress={confirmAll}>
              <Text style={styles.confirmAllText}>ยืนยันทั้งหมด</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={matches}
            keyExtractor={(_, i) => String(i)}
            renderItem={renderRow}
            contentContainerStyle={styles.listContent}
          />

          {/* Apply button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.applyBtn, confirmedCount === 0 && styles.applyBtnDisabled]}
              onPress={applyMatches}
              disabled={confirmedCount === 0}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>
                บันทึก {confirmedCount} บทเรียน
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryBtn} onPress={() => setPhase('idle')}>
              <Text style={styles.retryBtnText}>เริ่มใหม่</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Video Picker Modal ── */}
      <Modal visible={pickerOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เลือกวิดีโอ</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Ionicons name="close" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allVideos}
              keyExtractor={(v) => v.guid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => pickVideo(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play-circle-outline" size={22} color={COLORS.primary} />
                  <View style={styles.pickerInfo}>
                    <Text style={styles.pickerTitle}>{item.title}</Text>
                    {item.length > 0 && (
                      <Text style={styles.pickerMeta}>
                        {Math.floor(item.length / 60)} นาที {item.length % 60} วินาที
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 32 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  headerSafe: { backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: SPACING.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },

  // Idle / Loading
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  heroDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  prereqNote: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingMsg: {
    marginTop: SPACING.md,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: SPACING.md,
  },
  summaryItem: { alignItems: 'center', minWidth: 44 },
  summaryNum: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  summaryLabel: { fontSize: 11, color: COLORS.textTertiary },
  confirmAllBtn: {
    marginLeft: 'auto',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  confirmAllText: { fontSize: 13, fontWeight: '600', color: COLORS.success },

  // Match card
  listContent: { padding: SPACING.md, gap: SPACING.sm },
  matchCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    ...SHADOWS.small,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  matchCardConfirmed: { borderColor: COLORS.success, backgroundColor: '#F0FDF4' },
  matchCardSkipped: { opacity: 0.45 },
  lessonBlock: { flex: 2 },
  lessonTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 18 },
  lessonMeta: { fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },
  alreadySet: { fontSize: 11, color: COLORS.success, marginTop: 3 },
  arrowBlock: { justifyContent: 'center', paddingTop: 2 },
  videoBlock: { flex: 2.2 },
  videoTitle: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary, lineHeight: 18 },
  noMatchText: { fontSize: 12, color: COLORS.textTertiary, fontStyle: 'italic' },
  confidenceRow: { marginTop: 4 },
  confidenceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  confidenceText: { fontSize: 11, fontWeight: '600' },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  changeBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  actionBlock: { gap: SPACING.xs, alignItems: 'center' },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  actionBtnSkip: { backgroundColor: '#9CA3AF', borderColor: '#9CA3AF' },

  // Footer
  footer: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: SPACING.sm,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  applyBtnDisabled: { backgroundColor: '#D1D5DB' },
  applyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  retryBtn: { alignItems: 'center', paddingVertical: 8 },
  retryBtnText: { fontSize: 14, color: COLORS.textSecondary },

  // Video picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerInfo: { flex: 1 },
  pickerTitle: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  pickerMeta: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
});
