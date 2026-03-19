/**
 * Duolingo-style practice screen.
 *
 * Route params:
 *   moduleId  — UUID of the practice_modules row
 *   courseId  — UUID of the course (for back-navigation)
 *   title     — module title (display only)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  Modal,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import HtmlPreview from '../components/HtmlPreview';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const SESSION_SIZE = 60;   // full question bank — all questions for mastery

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuestionOption {
  id: string;
  label: string;
  content: string;
  previewClasses?: string;
}
interface Question {
  id: string;
  type: 'multiple-choice' | 'comparison';
  prompt: string;
  answer: string;
  difficulty: number;
  explanation: string;
  content: { options: QuestionOption[] };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DuolingoScreen() {
  const router = useRouter();
  const { moduleId, courseId, title } = useLocalSearchParams<{
    moduleId: string;
    courseId: string;
    title: string;
  }>();
  const { user } = useUser();
  const { width } = useWindowDimensions();

  const [questions, setQuestions]       = useState<Question[]>([]);
  const [current, setCurrent]           = useState(0);
  const [selected, setSelected]         = useState<string | null>(null);
  const [revealed, setRevealed]         = useState(false);
  const [results, setResults]           = useState<boolean[]>([]);
  const [finished, setFinished]         = useState(false);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [xpAwarded, setXpAwarded]       = useState(0);
  const [expandedHtml, setExpandedHtml] = useState<{ html: string; label: string } | null>(null);

  // Animated feedback bar
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadModule(); }, [moduleId]);

  const loadModule = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/practice/module/${moduleId}`);
      const allQ: Question[] = res.data.questions || [];
      // Shuffle and pick SESSION_SIZE
      const shuffled = [...allQ].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, SESSION_SIZE));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Answer selection ─────────────────────────────────────────────────────
  const handleSelect = (optionId: string) => {
    if (revealed) return;
    setSelected(optionId);
    const correct = optionId === questions[current].answer;
    setRevealed(true);
    setResults(prev => [...prev, correct]);

    // Animate feedback panel in
    Animated.spring(feedbackAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  // ── Advance to next question ──────────────────────────────────────────────
  const handleNext = async () => {
    feedbackAnim.setValue(0);
    if (current + 1 >= questions.length) {
      // Session done — save progress
      await saveProgress();
      setFinished(true);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  // ── Save progress ─────────────────────────────────────────────────────────
  const saveProgress = async () => {
    if (!moduleId) return;
    setSaving(true);
    const correct = results.filter(Boolean).length;
    const score = Math.round((correct / questions.length) * 100);
    try {
      const res = await axios.post(`${API_URL}/api/practice/progress`, {
        module_id: moduleId,
        score,
        correct,
        total: questions.length,
        user_id: user?._id || 'demo_user',
      });
      setXpAwarded(res.data.xp_awarded || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const score     = results.filter(Boolean).length;
  const pct       = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const passed    = pct >= 70;
  const progress  = questions.length ? (current + (revealed ? 1 : 0)) / questions.length : 0;
  const q         = questions[current];
  const isCorrect = selected === q?.answer;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>กำลังโหลดคำถาม…</Text>
      </View>
    );
  }

  // ── Finished screen ───────────────────────────────────────────────────────
  if (finished) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.resultEmoji}>
            <Text style={{ fontSize: 80 }}>{passed ? '🎉' : '💪'}</Text>
          </View>

          <Text style={styles.resultTitle}>
            {passed ? 'ยอดเยี่ยม! ผ่านแล้ว!' : 'พยายามอีกครั้งนะ!'}
          </Text>
          <Text style={styles.resultSub}>
            {passed
              ? `คุณตอบถูก ${score}/${questions.length} ข้อ (${pct}%) 🏆`
              : `คุณตอบถูก ${score}/${questions.length} ข้อ (${pct}%) — ต้องการ 70% ขึ้นไป`}
          </Text>

          {/* Score ring */}
          <View style={[styles.scoreRing, { borderColor: passed ? COLORS.success : COLORS.warning }]}>
            <Text style={[styles.scoreRingPct, { color: passed ? COLORS.success : COLORS.warning }]}>
              {pct}%
            </Text>
            <Text style={styles.scoreRingLabel}>คะแนน</Text>
          </View>

          {/* XP badge */}
          {xpAwarded > 0 && (
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>⚡ +{xpAwarded} XP</Text>
            </View>
          )}

          {/* Result breakdown */}
          <View style={styles.resultBreakdown}>
            <View style={styles.resultStat}>
              <Text style={styles.resultStatNum}>{score}</Text>
              <Text style={styles.resultStatLabel}>ถูก</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultStat}>
              <Text style={[styles.resultStatNum, { color: COLORS.error }]}>
                {questions.length - score}
              </Text>
              <Text style={styles.resultStatLabel}>ผิด</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultStat}>
              <Text style={styles.resultStatNum}>{questions.length}</Text>
              <Text style={styles.resultStatLabel}>ทั้งหมด</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.resultActions}>
            {!passed && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setFinished(false);
                  setCurrent(0);
                  setSelected(null);
                  setRevealed(false);
                  setResults([]);
                  loadModule();
                }}
              >
                <Text style={styles.retryButtonText}>🔄 ลองอีกครั้ง</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => router.replace(`/course-detail?id=${courseId}`)}
            >
              <Text style={styles.doneButtonText}>
                {passed ? '🏠 กลับไปคอร์ส' : '🏠 กลับไปก่อน'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!q) return null;

  // ── Question screen ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.replace(`/course-detail?id=${courseId}`)}
        >
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>

        <Text style={styles.progressLabel}>
          {current + 1}/{questions.length}
        </Text>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Difficulty chip */}
        <View style={styles.difficultyRow}>
          <View style={[styles.diffChip, { backgroundColor: diffColor(q.difficulty) + '22' }]}>
            <Text style={[styles.diffChipText, { color: diffColor(q.difficulty) }]}>
              {diffLabel(q.difficulty)}
            </Text>
          </View>
          <Text style={styles.qTypeLabel}>
            {q.type === 'comparison' ? '🔍 เปรียบเทียบ' : '📝 ตัวเลือก'}
          </Text>
        </View>

        {/* Prompt */}
        <Text style={styles.prompt}>{q.prompt}</Text>

        {/* ── MULTIPLE CHOICE ── */}
        {q.type === 'multiple-choice' && (
          <View style={styles.mcOptions}>
            {q.content.options.map(opt => {
              const isSelected = selected === opt.id;
              const isAnswer   = opt.id === q.answer;
              let bg = '#fff';
              let border = '#E5E7EB';
              let textColor = '#1F2937';
              if (revealed && isAnswer)   { bg = '#D1FAE5'; border = COLORS.success; }
              if (revealed && isSelected && !isAnswer) { bg = '#FEE2E2'; border = COLORS.error; }
              if (!revealed && isSelected) { bg = COLORS.primary + '15'; border = COLORS.primary; }

              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.mcOption, { backgroundColor: bg, borderColor: border }]}
                  onPress={() => handleSelect(opt.id)}
                  activeOpacity={0.8}
                  disabled={revealed}
                >
                  <View style={[styles.mcBubble, { borderColor: border }]}>
                    {revealed && isAnswer
                      ? <Ionicons name="checkmark" size={14} color={COLORS.success} />
                      : revealed && isSelected && !isAnswer
                      ? <Ionicons name="close" size={14} color={COLORS.error} />
                      : <Text style={[styles.mcBubbleText, { color: border }]}>{opt.id.toUpperCase()}</Text>
                    }
                  </View>
                  <Text style={[styles.mcOptionText, { color: textColor }]}>{opt.content}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── COMPARISON ── */}
        {q.type === 'comparison' && (
          <>
            <Text style={styles.compHint}>🔍 แตะที่ภาพเพื่อขยาย • แตะที่ปุ่มด้านล่างเพื่อเลือก</Text>
            <View style={styles.compRow}>
              {q.content.options.map(opt => {
                const isSelected = selected === opt.id;
                const isAnswer   = opt.id === q.answer;
                let border   = '#E5E7EB';
                let headerBg = '#F9FAFB';
                if (revealed && isAnswer)                { border = COLORS.success; headerBg = '#D1FAE5'; }
                if (revealed && isSelected && !isAnswer) { border = COLORS.error;   headerBg = '#FEE2E2'; }
                if (!revealed && isSelected)             { border = COLORS.primary;  headerBg = COLORS.primary + '15'; }

                return (
                  <View
                    key={opt.id}
                    style={[styles.compCard, { borderColor: border, width: (width - SPACING.lg * 2 - SPACING.sm) / 2 }]}
                  >
                    {/* Label header — tapping this selects */}
                    <View style={[styles.compHeader, { backgroundColor: headerBg }]}>
                      {revealed && isAnswer
                        ? <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                        : revealed && isSelected && !isAnswer
                        ? <Ionicons name="close-circle" size={16} color={COLORS.error} />
                        : null}
                      <Text style={[styles.compLabel, {
                        color: revealed
                          ? (isAnswer ? COLORS.success : isSelected ? COLORS.error : '#6B7280')
                          : '#6B7280',
                      }]}>
                        {opt.label}
                      </Text>
                    </View>

                    {/* Preview — tap to expand overlay */}
                    <TouchableOpacity
                      style={styles.compPreview}
                      onPress={() => setExpandedHtml({ html: opt.content, label: opt.label })}
                      activeOpacity={0.9}
                    >
                      <HtmlPreview html={opt.content} height={170} />
                      {/* Expand hint badge */}
                      <View style={styles.expandBadge}>
                        <Ionicons name="expand-outline" size={12} color="#fff" />
                      </View>
                    </TouchableOpacity>

                    {/* Select button at the bottom */}
                    <TouchableOpacity
                      style={[
                        styles.compSelectBtn,
                        {
                          backgroundColor: isSelected
                            ? (revealed ? (isAnswer ? COLORS.success : COLORS.error) : COLORS.primary)
                            : '#F3F4F6',
                        },
                      ]}
                      onPress={() => handleSelect(opt.id)}
                      disabled={revealed}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.compSelectBtnText,
                        { color: isSelected ? '#fff' : '#6B7280' },
                      ]}>
                        {revealed && isAnswer
                          ? '✅ ถูก'
                          : revealed && isSelected && !isAnswer
                          ? '❌ ผิด'
                          : isSelected
                          ? '✓ เลือกแล้ว'
                          : 'เลือก'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* ── Full-screen expand overlay ── */}
            <Modal
              visible={expandedHtml !== null}
              transparent
              animationType="fade"
              onRequestClose={() => setExpandedHtml(null)}
            >
              <View style={styles.overlayBg}>
                {/* Header bar */}
                <View style={styles.overlayHeader}>
                  <Text style={styles.overlayTitle}>{expandedHtml?.label}</Text>
                  <TouchableOpacity
                    style={styles.overlayCloseBtn}
                    onPress={() => setExpandedHtml(null)}
                  >
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Full-size HTML preview */}
                <View style={styles.overlayContent}>
                  {expandedHtml && (
                    <HtmlPreview html={expandedHtml.html} height={width * 1.3} />
                  )}
                </View>

                {/* Select from overlay */}
                {!revealed && (
                  <TouchableOpacity
                    style={styles.overlaySelectBtn}
                    onPress={() => {
                      const optId = q.content.options.find(o => o.label === expandedHtml?.label)?.id;
                      if (optId) { handleSelect(optId); }
                      setExpandedHtml(null);
                    }}
                  >
                    <Text style={styles.overlaySelectBtnText}>
                      เลือก {expandedHtml?.label} →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Modal>
          </>
        )}

        {/* Spacer so explanation doesn't get hidden behind the fixed bottom bar */}
        <View style={{ height: revealed ? 160 : 80 }} />
      </ScrollView>

      {/* ── Feedback panel (slides up after answer) ── */}
      {revealed && (
        <Animated.View
          style={[
            styles.feedbackPanel,
            { backgroundColor: isCorrect ? '#D1FAE5' : '#FEE2E2' },
            {
              transform: [{
                translateY: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }),
              }],
            },
          ]}
        >
          <View style={styles.feedbackTop}>
            <View style={styles.feedbackIcon}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={28}
                color={isCorrect ? COLORS.success : COLORS.error}
              />
              <Text style={[styles.feedbackTitle, { color: isCorrect ? COLORS.success : COLORS.error }]}>
                {isCorrect ? 'ถูกต้อง! 🎉' : 'ยังไม่ถูก 😅'}
              </Text>
            </View>
          </View>
          <Text style={styles.feedbackExplanation} numberOfLines={4}>
            {q.explanation}
          </Text>
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: isCorrect ? COLORS.success : COLORS.error }]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>
              {current + 1 >= questions.length ? 'ดูผลลัพธ์ 🏁' : 'ต่อไป →'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const diffColor = (d: number) =>
  d === 1 ? COLORS.success : d === 2 ? COLORS.warning : COLORS.error;
const diffLabel = (d: number) =>
  d === 1 ? 'ง่าย' : d === 2 ? 'ปานกลาง' : 'ยาก';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: '#F7F8FA',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    minWidth: 36,
    textAlign: 'right',
  },

  // Content
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },

  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  diffChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  diffChipText: { fontSize: 12, fontWeight: '700' },
  qTypeLabel: { fontSize: 12, color: COLORS.textSecondary },

  prompt: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 27,
    marginBottom: SPACING.lg,
  },

  // Multiple choice
  mcOptions: { gap: SPACING.sm },
  mcOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    gap: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  mcBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  mcBubbleText: { fontSize: 12, fontWeight: '700' },
  mcOptionText: { flex: 1, fontSize: 15, lineHeight: 22 },

  // Comparison
  compHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  compRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  compCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    borderWidth: 2.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  compLabel: { fontSize: 14, fontWeight: '700' },
  compPreview: {
    padding: 4,
    position: 'relative',
  },
  expandBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    padding: 4,
  },
  compSelectBtn: {
    margin: 6,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  compSelectBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Expand overlay
  overlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-start',
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 56,
    paddingBottom: SPACING.md,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  overlayCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  overlaySelectBtn: {
    margin: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  overlaySelectBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },

  // Feedback panel
  feedbackPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  feedbackTop: { marginBottom: SPACING.sm },
  feedbackIcon: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  feedbackTitle: { fontSize: 18, fontWeight: '800' },
  feedbackExplanation: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  nextBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // Results screen
  resultScroll: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: 60,
  },
  resultEmoji: { marginBottom: SPACING.md },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  resultSub: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  scoreRing: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  scoreRingPct: { fontSize: 32, fontWeight: '900' },
  scoreRingLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  xpBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xl,
  },
  xpBadgeText: { fontSize: 16, fontWeight: '800', color: '#D97706' },

  resultBreakdown: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  resultStat: { flex: 1, alignItems: 'center' },
  resultStatNum: { fontSize: 28, fontWeight: '900', color: COLORS.success },
  resultStatLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  resultDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: SPACING.sm },

  resultActions: { width: '100%', gap: SPACING.md },
  retryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
