/**
 * Duolingo-style practice screen.
 *
 * Route params:
 *   moduleId  — UUID of the practice_modules row
 *   courseId  — UUID of the course (for back-navigation)
 *   title     — module title (display only)
 *
 * Supported question types:
 *   multiple-choice, comparison, chart-reading, micro-lesson,
 *   fill-blank, scenario, concept-reveal, drag-arrange, chart-comparison
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import ChartRenderer, { ChartConfig } from '../components/ChartRenderer';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const SESSION_SIZE = 60;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface QuestionOption {
  id: string;
  label: string;
  content?: string;
  previewClasses?: string;
}

interface ScenarioNode {
  id: string;
  order: number;
  icon: string;
  situation: string;
  context: string;
  choices: { id: string; label: string; outcome: string; isCorrect: boolean }[];
}

interface MicroCard {
  order: number;
  cardType: 'concept' | 'analogy' | 'example' | 'tip' | 'summary';
  title: string;
  body: string;
  icon: string;
}

interface ConceptReveal {
  contentType: string;
  content: string;
  summary: string;
  hotspots: { id: string; order: number; icon: string; label: string; annotation: string }[];
  language: string | null;
}

interface DragArrange {
  mode: 'categorize' | 'order';
  instruction: string;
  categories?: string[];
  items: { id: string; label: string; category?: string; correctPosition?: number }[];
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'comparison' | 'chart-reading' | 'micro-lesson' |
        'fill-blank' | 'scenario' | 'concept-reveal' | 'drag-arrange' | 'chart-comparison';
  prompt: string;
  answer: string;
  difficulty: number;
  explanation: string;
  content: {
    options?: QuestionOption[];
    cards?: MicroCard[];
    visual?: { type: string; config: ChartConfig & { code?: string; blanks?: any[]; language?: string } };
    scenarioNodes?: ScenarioNode[];
    conceptReveal?: ConceptReveal;
    dragArrange?: DragArrange;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const diffColor = (d: number) =>
  d === 1 ? COLORS.success : d === 2 ? COLORS.warning : COLORS.error;
const diffLabel = (d: number) =>
  d === 1 ? 'ง่าย' : d === 2 ? 'ปานกลาง' : 'ยาก';

const TYPE_LABELS: Record<string, string> = {
  'multiple-choice': '📝 ตัวเลือก',
  'comparison':      '🔍 เปรียบเทียบ',
  'chart-reading':   '📊 อ่านกราฟ',
  'chart-comparison':'📈 เปรียบเทียบกราฟ',
  'micro-lesson':    '💡 เรียนรู้',
  'fill-blank':      '✏️ เติมคำ',
  'scenario':        '🎭 สถานการณ์',
  'concept-reveal':  '🔍 แนวคิด',
  'drag-arrange':    '🗂️ จัดเรียง',
};

// Types that have their own advance mechanism (no feedback panel / no submit button)
const NO_ANSWER_TYPES = new Set(['micro-lesson', 'concept-reveal', 'scenario']);

// ─── Component ────────────────────────────────────────────────────────────────
export default function DuolingoScreen() {
  const router = useRouter();
  const { moduleId, courseId, title } = useLocalSearchParams<{
    moduleId: string; courseId: string; title: string;
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

  // fill-blank state
  const [fillSlots, setFillSlots]       = useState<(string | null)[]>([]);
  const [fillSubmitted, setFillSubmitted] = useState(false);

  // scenario state
  const [scenarioNodeIdx, setScenarioNodeIdx] = useState(0);
  const [scenarioChoice, setScenarioChoice]   = useState<string | null>(null);
  const [scenarioOutcome, setScenarioOutcome] = useState<string | null>(null);
  const [scenarioAdvancing, setScenarioAdvancing] = useState(false);

  // drag-arrange state
  const [dragAssign, setDragAssign]     = useState<Record<string, string>>({});
  const [dragOrder, setDragOrder]       = useState<string[]>([]);
  const [dragSubmitted, setDragSubmitted] = useState(false);
  const [selectedDragItem, setSelectedDragItem] = useState<string | null>(null);

  // concept-reveal
  const [hotspot, setHotspot]           = useState<string | null>(null);

  // micro-lesson
  const [microPage, setMicroPage]       = useState(0);

  // drag-arrange: store shuffled items per question
  const [dragShuffled, setDragShuffled] = useState<any[]>([]);

  // Animated feedback bar
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadModule(); }, [moduleId]);

  const loadModule = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/practice/module/${moduleId}`);
      const allQ: Question[] = res.data.questions || [];
      const shuffled = [...allQ].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, SESSION_SIZE));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Reset per-type state when moving to a new question
  const resetTypeState = (nextQ?: Question) => {
    setFillSlots([]);
    setFillSubmitted(false);
    setScenarioNodeIdx(0);
    setScenarioChoice(null);
    setScenarioOutcome(null);
    setScenarioAdvancing(false);
    setDragAssign({});
    setDragOrder([]);
    setDragSubmitted(false);
    setSelectedDragItem(null);
    setHotspot(null);
    setMicroPage(0);
    // Pre-shuffle drag items for the upcoming question
    if (nextQ?.type === 'drag-arrange' && nextQ.content.dragArrange) {
      setDragShuffled([...nextQ.content.dragArrange.items].sort(() => Math.random() - 0.5));
    } else {
      setDragShuffled([]);
    }
  };

  // Initialise shuffle when first question loads
  useEffect(() => {
    if (questions.length > 0 && questions[0]?.type === 'drag-arrange' && questions[0].content.dragArrange) {
      setDragShuffled([...questions[0].content.dragArrange.items].sort(() => Math.random() - 0.5));
    }
  }, [questions]);

  const showFeedback = () => {
    Animated.spring(feedbackAnim, {
      toValue: 1, useNativeDriver: true, tension: 80, friction: 10,
    }).start();
  };

  const handleSelect = (optionId: string) => {
    if (revealed) return;
    setSelected(optionId);
    const correct = optionId === questions[current].answer;
    setRevealed(true);
    setResults(prev => [...prev, correct]);
    showFeedback();
  };

  const handleNext = useCallback(async () => {
    feedbackAnim.setValue(0);
    const nextIdx = current + 1;
    resetTypeState(questions[nextIdx]);
    if (nextIdx >= questions.length) {
      await saveProgress();
      setFinished(true);
    } else {
      setCurrent(nextIdx);
      setSelected(null);
      setRevealed(false);
    }
  }, [current, questions]);

  // Auto-advance for non-answer types (micro-lesson, concept-reveal)
  const handleAutoNext = () => {
    setResults(prev => [...prev, true]);
    handleNext();
  };

  const saveProgress = async () => {
    if (!moduleId) return;
    setSaving(true);
    const correct = results.filter(Boolean).length;
    const score = Math.round((correct / questions.length) * 100);
    try {
      const res = await axios.post(`${API_URL}/api/practice/progress`, {
        module_id: moduleId, score, correct, total: questions.length,
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
  const score    = results.filter(Boolean).length;
  const pct      = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const passed   = pct >= 70;
  const progress = questions.length ? (current + (revealed || NO_ANSWER_TYPES.has(questions[current]?.type) ? 1 : 0)) / questions.length : 0;
  const q        = questions[current];
  // 'correct'/'__wrong__' are sentinels used by fill-blank and drag-arrange
  const isCorrect = selected === 'correct' || (selected !== null && selected !== '__wrong__' && selected === q?.answer);

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
          <Text style={styles.resultTitle}>{passed ? 'ยอดเยี่ยม! ผ่านแล้ว!' : 'พยายามอีกครั้งนะ!'}</Text>
          <Text style={styles.resultSub}>
            {passed
              ? `คุณตอบถูก ${score}/${questions.length} ข้อ (${pct}%) 🏆`
              : `คุณตอบถูก ${score}/${questions.length} ข้อ (${pct}%) — ต้องการ 70% ขึ้นไป`}
          </Text>
          <View style={[styles.scoreRing, { borderColor: passed ? COLORS.success : COLORS.warning }]}>
            <Text style={[styles.scoreRingPct, { color: passed ? COLORS.success : COLORS.warning }]}>{pct}%</Text>
            <Text style={styles.scoreRingLabel}>คะแนน</Text>
          </View>
          {xpAwarded > 0 && (
            <View style={styles.xpBadge}><Text style={styles.xpBadgeText}>⚡ +{xpAwarded} XP</Text></View>
          )}
          <View style={styles.resultBreakdown}>
            <View style={styles.resultStat}><Text style={styles.resultStatNum}>{score}</Text><Text style={styles.resultStatLabel}>ถูก</Text></View>
            <View style={styles.resultDivider} />
            <View style={styles.resultStat}><Text style={[styles.resultStatNum, { color: COLORS.error }]}>{questions.length - score}</Text><Text style={styles.resultStatLabel}>ผิด</Text></View>
            <View style={styles.resultDivider} />
            <View style={styles.resultStat}><Text style={styles.resultStatNum}>{questions.length}</Text><Text style={styles.resultStatLabel}>ทั้งหมด</Text></View>
          </View>
          <View style={styles.resultActions}>
            {!passed && (
              <TouchableOpacity style={styles.retryButton} onPress={() => {
                setFinished(false); setCurrent(0); setSelected(null);
                setRevealed(false); setResults([]); resetTypeState(); loadModule();
              }}>
                <Text style={styles.retryButtonText}>🔄 ลองอีกครั้ง</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.doneButton} onPress={() => router.replace(`/course-detail?id=${courseId}`)}>
              <Text style={styles.doneButtonText}>{passed ? '🏠 กลับไปคอร์ส' : '🏠 กลับไปก่อน'}</Text>
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
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace(`/course-detail?id=${courseId}`)}>
          <Ionicons name="close" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>{current + 1}/{questions.length}</Text>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Type + difficulty chips */}
        <View style={styles.difficultyRow}>
          <View style={[styles.diffChip, { backgroundColor: diffColor(q.difficulty) + '22' }]}>
            <Text style={[styles.diffChipText, { color: diffColor(q.difficulty) }]}>{diffLabel(q.difficulty)}</Text>
          </View>
          <Text style={styles.qTypeLabel}>{TYPE_LABELS[q.type] ?? '📝 คำถาม'}</Text>
        </View>

        {/* ─────────────── MICRO-LESSON ─────────────── */}
        {q.type === 'micro-lesson' && (() => {
          const cards = [...(q.content.cards || [])].sort((a, b) => a.order - b.order);
          const card = cards[microPage];
          const cardColors: Record<string, string> = {
            concept: '#6366f1', analogy: '#f59e0b', example: '#10b981',
            tip: '#f573bd', summary: '#3b82f6',
          };
          const accent = cardColors[card?.cardType] || '#6366f1';
          return (
            <View style={styles.microWrap}>
              <Text style={styles.prompt}>{q.prompt}</Text>
              <View style={[styles.microCard, { borderTopColor: accent }]}>
                <Text style={styles.microIcon}>{card?.icon}</Text>
                <Text style={[styles.microCardTitle, { color: accent }]}>{card?.title}</Text>
                <Text style={styles.microCardBody}>{card?.body}</Text>
              </View>
              {/* Dots */}
              <View style={styles.microDots}>
                {cards.map((_, i) => (
                  <View key={i} style={[styles.microDot, { backgroundColor: i === microPage ? accent : '#E5E7EB' }]} />
                ))}
              </View>
              {/* Navigation */}
              <View style={styles.microNav}>
                {microPage > 0 && (
                  <TouchableOpacity style={styles.microPrevBtn} onPress={() => setMicroPage(p => p - 1)}>
                    <Text style={styles.microPrevText}>← ก่อนหน้า</Text>
                  </TouchableOpacity>
                )}
                {microPage < cards.length - 1 ? (
                  <TouchableOpacity style={[styles.microNextBtn, { backgroundColor: accent }]} onPress={() => setMicroPage(p => p + 1)}>
                    <Text style={styles.microNextText}>ถัดไป →</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.microNextBtn, { backgroundColor: accent }]} onPress={handleAutoNext}>
                    <Text style={styles.microNextText}>เข้าใจแล้ว ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })()}

        {/* ─────────────── CONCEPT-REVEAL ─────────────── */}
        {q.type === 'concept-reveal' && (() => {
          const cr = q.content.conceptReveal!;
          return (
            <View>
              <Text style={styles.prompt}>{q.prompt}</Text>
              {/* Code block */}
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{cr.content}</Text>
              </View>
              {/* Summary */}
              {cr.summary ? <Text style={styles.conceptSummary}>{cr.summary}</Text> : null}
              {/* Hotspot chips */}
              <Text style={styles.hotspotHint}>แตะหัวข้อเพื่อดูคำอธิบาย</Text>
              <View style={styles.hotspotRow}>
                {[...cr.hotspots].sort((a, b) => a.order - b.order).map(hs => (
                  <TouchableOpacity
                    key={hs.id}
                    style={[styles.hotspotChip, hotspot === hs.id && styles.hotspotChipActive]}
                    onPress={() => setHotspot(hotspot === hs.id ? null : hs.id)}
                  >
                    <Text style={styles.hotspotIcon}>{hs.icon}</Text>
                    <Text style={[styles.hotspotLabel, hotspot === hs.id && { color: COLORS.primary }]}>{hs.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Annotation */}
              {hotspot && (() => {
                const hs = cr.hotspots.find(h => h.id === hotspot);
                return hs ? (
                  <View style={styles.annotationCard}>
                    <Text style={styles.annotationTitle}>{hs.icon} {hs.label}</Text>
                    <Text style={styles.annotationBody}>{hs.annotation}</Text>
                  </View>
                ) : null;
              })()}
              {/* Done button */}
              <TouchableOpacity style={styles.conceptDoneBtn} onPress={handleAutoNext}>
                <Text style={styles.conceptDoneText}>เข้าใจแล้ว →</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </View>
          );
        })()}

        {/* ─────────────── SCENARIO ─────────────── */}
        {q.type === 'scenario' && (() => {
          const nodes = [...(q.content.scenarioNodes || [])].sort((a, b) => a.order - b.order);
          const node = nodes[scenarioNodeIdx];
          if (!node) return null;
          return (
            <View>
              <Text style={styles.prompt}>{q.prompt}</Text>
              {/* Node progress */}
              <View style={styles.scenarioProgress}>
                {nodes.map((_, i) => (
                  <View key={i} style={[styles.scenarioProgressDot, {
                    backgroundColor: i < scenarioNodeIdx ? COLORS.success : i === scenarioNodeIdx ? COLORS.primary : '#E5E7EB'
                  }]} />
                ))}
              </View>
              {/* Situation */}
              <View style={styles.scenarioCard}>
                <Text style={styles.scenarioIcon}>{node.icon}</Text>
                <Text style={styles.scenarioSituation}>{node.situation}</Text>
                {node.context ? <Text style={styles.scenarioContext}>{node.context}</Text> : null}
              </View>
              {/* Choices */}
              {!scenarioOutcome ? (
                <View style={styles.scenarioChoices}>
                  {node.choices.map(ch => (
                    <TouchableOpacity
                      key={ch.id}
                      style={[styles.scenarioChoice, scenarioChoice === ch.id && styles.scenarioChoiceSelected]}
                      onPress={() => {
                        if (scenarioAdvancing) return;
                        setScenarioChoice(ch.id);
                        setScenarioOutcome(ch.outcome);
                        if (ch.isCorrect) {
                          setScenarioAdvancing(true);
                        }
                      }}
                    >
                      <Text style={styles.scenarioChoiceText}>{ch.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              {/* Outcome */}
              {scenarioOutcome && (() => {
                const choiceObj = node.choices.find(c => c.id === scenarioChoice);
                const correct = choiceObj?.isCorrect ?? false;
                return (
                  <View style={[styles.scenarioOutcome, { backgroundColor: correct ? '#D1FAE5' : '#FEE2E2', borderColor: correct ? COLORS.success : COLORS.error }]}>
                    <Ionicons name={correct ? 'checkmark-circle' : 'close-circle'} size={20} color={correct ? COLORS.success : COLORS.error} />
                    <Text style={[styles.scenarioOutcomeText, { color: correct ? '#065F46' : '#991B1B' }]}>{scenarioOutcome}</Text>
                    {correct ? (
                      <TouchableOpacity
                        style={[styles.scenarioNextBtn, { backgroundColor: COLORS.success }]}
                        onPress={() => {
                          const nextIdx = scenarioNodeIdx + 1;
                          if (nextIdx >= nodes.length) {
                            setResults(prev => [...prev, true]);
                            handleNext();
                          } else {
                            setScenarioNodeIdx(nextIdx);
                            setScenarioChoice(null);
                            setScenarioOutcome(null);
                            setScenarioAdvancing(false);
                          }
                        }}
                      >
                        <Text style={styles.scenarioNextBtnText}>
                          {scenarioNodeIdx + 1 >= nodes.length ? 'เสร็จสิ้น ✓' : 'ต่อไป →'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.scenarioNextBtn, { backgroundColor: COLORS.error }]}
                        onPress={() => { setScenarioChoice(null); setScenarioOutcome(null); }}
                      >
                        <Text style={styles.scenarioNextBtnText}>ลองใหม่อีกครั้ง</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })()}
              <View style={{ height: 40 }} />
            </View>
          );
        })()}

        {/* ─────────────── FILL-BLANK ─────────────── */}
        {q.type === 'fill-blank' && (() => {
          // Safe optional chain — visual is absent on "no-template" fill-blank questions
          const vis = q.content.visual?.config;
          const code: string = (vis as any)?.code || '';
          const blanks: { answer?: string; position?: number; id?: string; label?: string }[] = (vis as any)?.blanks || [];
          // When there's no code template, derive blank count from the answer string
          const numBlanks = blanks.length || q.answer.split(',').length;
          const hasCodeTemplate = code.includes('___');

          // Initialize slots
          const slots: (string | null)[] = fillSlots.length === numBlanks ? fillSlots : Array(numBlanks).fill(null);

          // Parse code into parts: text segments and blank slots
          const parts = hasCodeTemplate ? code.split('___') : [];
          // options still in bank (not yet placed)
          const placedOptionIds = new Set(slots.filter(Boolean) as string[]);
          const opts = (q.content.options || []).filter(o => !placedOptionIds.has(o.id));

          const handleFillSelect = (optId: string) => {
            if (fillSubmitted) return;
            const firstEmpty = slots.findIndex(s => s === null);
            if (firstEmpty === -1) return;
            const newSlots = [...slots];
            newSlots[firstEmpty] = optId;
            setFillSlots(newSlots);
          };

          const handleFillRemove = (slotIdx: number) => {
            if (fillSubmitted) return;
            const newSlots = [...slots];
            newSlots[slotIdx] = null;
            setFillSlots(newSlots);
          };

          const handleFillSubmit = () => {
            if (slots.some(s => s === null)) return;
            setFillSubmitted(true);
            const correctIds = q.answer.split(',');
            const allCorrect = correctIds.every((cid, i) => slots[i] === cid);
            setRevealed(true);
            setResults(prev => [...prev, allCorrect]);
            setSelected(allCorrect ? 'correct' : '__wrong__');
            showFeedback();
          };

          const getSlotLabel = (optId: string | null) => {
            if (!optId) return null;
            const opt = q.content.options?.find(o => o.id === optId);
            return opt?.label ?? optId;
          };

          const getSlotCorrect = (slotIdx: number): boolean | null => {
            if (!fillSubmitted) return null;
            const correctIds = q.answer.split(',');
            return slots[slotIdx] === correctIds[slotIdx];
          };

          return (
            <View>
              <Text style={styles.prompt}>{q.prompt}</Text>

              {/* ── Code template with inline blanks (when visual has a code field) ── */}
              {hasCodeTemplate && (
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>
                    {parts.map((part, i) => {
                      const slotIdx = i;
                      const correct = getSlotCorrect(slotIdx);
                      const slotVal = slots[slotIdx];
                      const slotLabel = getSlotLabel(slotVal);
                      return (
                        <Text key={i}>
                          <Text style={styles.codeText}>{part}</Text>
                          {i < parts.length - 1 && (
                            <TouchableOpacity
                              onPress={() => slotVal ? handleFillRemove(slotIdx) : undefined}
                              style={[
                                styles.codeBlank,
                                fillSubmitted && correct === true && styles.codeBlankCorrect,
                                fillSubmitted && correct === false && styles.codeBlankWrong,
                              ]}
                            >
                              <Text style={[
                                styles.codeBlankText,
                                fillSubmitted && correct === true && { color: COLORS.success },
                                fillSubmitted && correct === false && { color: COLORS.error },
                              ]}>
                                {slotLabel || '___'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </Text>
                      );
                    })}
                  </Text>
                </View>
              )}

              {/* ── Numbered slots (when there's no code template) ── */}
              {!hasCodeTemplate && (
                <View style={styles.nakedSlotsWrap}>
                  {slots.map((slotVal, slotIdx) => {
                    const correct = getSlotCorrect(slotIdx);
                    const slotLabel = getSlotLabel(slotVal);
                    return (
                      <TouchableOpacity
                        key={slotIdx}
                        style={[
                          styles.nakedSlot,
                          slotVal && styles.nakedSlotFilled,
                          fillSubmitted && correct === true && styles.nakedSlotCorrect,
                          fillSubmitted && correct === false && styles.nakedSlotWrong,
                        ]}
                        onPress={() => slotVal ? handleFillRemove(slotIdx) : undefined}
                        disabled={!slotVal || fillSubmitted}
                      >
                        <Text style={styles.nakedSlotNum}>{slotIdx + 1}</Text>
                        <Text style={[
                          styles.nakedSlotText,
                          fillSubmitted && correct === true && { color: COLORS.success },
                          fillSubmitted && correct === false && { color: COLORS.error },
                        ]}>
                          {slotLabel || '_ _ _'}
                        </Text>
                        {slotVal && !fillSubmitted && (
                          <Ionicons name="close-circle" size={14} color="#9CA3AF" style={{ marginLeft: 4 }} />
                        )}
                        {fillSubmitted && correct === true && (
                          <Ionicons name="checkmark-circle" size={14} color={COLORS.success} style={{ marginLeft: 4 }} />
                        )}
                        {fillSubmitted && correct === false && (
                          <Ionicons name="close-circle" size={14} color={COLORS.error} style={{ marginLeft: 4 }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Word bank */}
              {!revealed && (
                <>
                  <Text style={styles.wordBankLabel}>คลังคำ — แตะเพื่อเติมในช่องว่าง</Text>
                  <View style={styles.wordBank}>
                    {opts.map(opt => (
                      <TouchableOpacity key={opt.id} style={styles.wordChip} onPress={() => handleFillSelect(opt.id)}>
                        <Text style={styles.wordChipText}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {!fillSubmitted && (
                    <TouchableOpacity
                      style={[styles.fillSubmitBtn, slots.some(s => s === null) && styles.fillSubmitBtnDisabled]}
                      onPress={handleFillSubmit}
                      disabled={slots.some(s => s === null)}
                    >
                      <Text style={styles.fillSubmitText}>ตรวจคำตอบ</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              <View style={{ height: revealed ? 160 : 40 }} />
            </View>
          );
        })()}

        {/* ─────────────── DRAG-ARRANGE ─────────────── */}
        {q.type === 'drag-arrange' && (() => {
          const da = q.content.dragArrange!;
          const shuffledItems = dragShuffled.length > 0 ? dragShuffled : da.items;

          if (da.mode === 'categorize') {
            const categories = da.categories || [];
            return (
              <View>
                <Text style={styles.prompt}>{q.prompt}</Text>
                <Text style={styles.dragInstruction}>{da.instruction}</Text>
                {/* Category buckets */}
                {categories.map(cat => {
                  const assigned = Object.entries(dragAssign)
                    .filter(([, c]) => c === cat)
                    .map(([id]) => da.items.find(i => i.id === id))
                    .filter(Boolean);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={styles.dragBucket}
                      onPress={() => {
                        if (!selectedDragItem || dragSubmitted) return;
                        setDragAssign(prev => ({ ...prev, [selectedDragItem]: cat }));
                        setSelectedDragItem(null);
                      }}
                    >
                      <Text style={styles.dragBucketTitle}>{cat}</Text>
                      <View style={styles.dragBucketItems}>
                        {assigned.map(item => item && (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.dragAssignedChip}
                            onPress={() => {
                              if (dragSubmitted) return;
                              setDragAssign(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                            }}
                          >
                            <Text style={styles.dragChipText}>{item.label}</Text>
                            {!dragSubmitted && <Text style={{ color: '#9CA3AF', marginLeft: 4 }}>✕</Text>}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {/* Unassigned items */}
                <Text style={styles.dragUnassignedLabel}>แตะรายการ แล้วแตะหมวดหมู่ด้านบนเพื่อจัดเรียง</Text>
                <View style={styles.wordBank}>
                  {shuffledItems.filter(item => !dragAssign[item.id]).map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.wordChip, selectedDragItem === item.id && styles.wordChipSelected]}
                      onPress={() => setSelectedDragItem(selectedDragItem === item.id ? null : item.id)}
                    >
                      <Text style={styles.wordChipText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {!dragSubmitted && Object.keys(dragAssign).length === da.items.length && (
                  <TouchableOpacity style={styles.fillSubmitBtn} onPress={() => {
                    setDragSubmitted(true);
                    const correct = da.items.every(item => dragAssign[item.id] === item.category);
                    setRevealed(true);
                    setResults(prev => [...prev, correct]);
                    setSelected(correct ? 'correct' : '__wrong__');
                    showFeedback();
                  }}>
                    <Text style={styles.fillSubmitText}>ตรวจคำตอบ</Text>
                  </TouchableOpacity>
                )}
                <View style={{ height: revealed ? 160 : 40 }} />
              </View>
            );
          }

          // mode: order
          const orderedItems = dragOrder.length === shuffledItems.length
            ? dragOrder.map(id => shuffledItems.find(i => i.id === id)!)
            : shuffledItems;
          const currentOrder = dragOrder.length === shuffledItems.length ? dragOrder : shuffledItems.map(i => i.id);

          const moveItem = (idx: number, dir: -1 | 1) => {
            const newOrder = [...currentOrder];
            const swapIdx = idx + dir;
            if (swapIdx < 0 || swapIdx >= newOrder.length) return;
            [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
            setDragOrder(newOrder);
          };

          return (
            <View>
              <Text style={styles.prompt}>{q.prompt}</Text>
              <Text style={styles.dragInstruction}>{da.instruction}</Text>
              <Text style={styles.dragUnassignedLabel}>ใช้ปุ่ม ↑ ↓ เพื่อเรียงลำดับ</Text>
              {currentOrder.map((itemId, idx) => {
                const item = da.items.find(i => i.id === itemId)!;
                const correctPos = item.correctPosition;
                let bg = '#fff';
                let border = '#E5E7EB';
                if (dragSubmitted && correctPos !== undefined) {
                  const isRight = currentOrder[idx] === da.items.find(i => i.correctPosition === idx + 1)?.id;
                  bg = isRight ? '#D1FAE5' : '#FEE2E2';
                  border = isRight ? COLORS.success : COLORS.error;
                }
                return (
                  <View key={itemId} style={[styles.orderRow, { backgroundColor: bg, borderColor: border }]}>
                    <Text style={styles.orderNum}>{idx + 1}</Text>
                    <Text style={styles.orderLabel}>{item?.label}</Text>
                    {!dragSubmitted && (
                      <View style={styles.orderArrows}>
                        <TouchableOpacity onPress={() => moveItem(idx, -1)} disabled={idx === 0} style={styles.arrowBtn}>
                          <Text style={[styles.arrowText, idx === 0 && { opacity: 0.3 }]}>↑</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => moveItem(idx, 1)} disabled={idx === currentOrder.length - 1} style={styles.arrowBtn}>
                          <Text style={[styles.arrowText, idx === currentOrder.length - 1 && { opacity: 0.3 }]}>↓</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
              {!dragSubmitted && (
                <TouchableOpacity style={styles.fillSubmitBtn} onPress={() => {
                  setDragSubmitted(true);
                  const allCorrect = da.items.every((item, i) => {
                    const posInOrder = currentOrder.indexOf(item.id);
                    return posInOrder === (item.correctPosition! - 1);
                  });
                  setRevealed(true);
                  setResults(prev => [...prev, allCorrect]);
                  setSelected(allCorrect ? 'correct' : '__wrong__');
                  showFeedback();
                }}>
                  <Text style={styles.fillSubmitText}>ตรวจคำตอบ</Text>
                </TouchableOpacity>
              )}
              <View style={{ height: revealed ? 160 : 40 }} />
            </View>
          );
        })()}

        {/* ─────────────── CHART-READING ─────────────── */}
        {q.type === 'chart-reading' && (
          <View>
            <ChartRenderer config={q.content.visual!.config as ChartConfig} />
            <Text style={styles.prompt}>{q.prompt}</Text>
            <View style={styles.mcOptions}>
              {(q.content.options || []).map(opt => {
                const isSelected = selected === opt.id;
                const isAnswer   = opt.id === q.answer;
                let bg = '#fff', border = '#E5E7EB', textColor = '#1F2937';
                if (revealed && isAnswer)                { bg = '#D1FAE5'; border = COLORS.success; }
                if (revealed && isSelected && !isAnswer) { bg = '#FEE2E2'; border = COLORS.error; }
                if (!revealed && isSelected)             { bg = COLORS.primary + '15'; border = COLORS.primary; }
                return (
                  <TouchableOpacity key={opt.id} style={[styles.mcOption, { backgroundColor: bg, borderColor: border }]} onPress={() => handleSelect(opt.id)} activeOpacity={0.8} disabled={revealed}>
                    <View style={[styles.mcBubble, { borderColor: border }]}>
                      {revealed && isAnswer ? <Ionicons name="checkmark" size={14} color={COLORS.success} />
                        : revealed && isSelected && !isAnswer ? <Ionicons name="close" size={14} color={COLORS.error} />
                        : <Text style={[styles.mcBubbleText, { color: border }]}>{opt.id.toUpperCase()}</Text>}
                    </View>
                    <Text style={[styles.mcOptionText, { color: textColor }]}>{opt.label || opt.content}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ height: revealed ? 160 : 80 }} />
          </View>
        )}

        {/* ─────────────── CHART-COMPARISON ─────────────── */}
        {q.type === 'chart-comparison' && (
          <View>
            <Text style={styles.prompt}>{q.prompt}</Text>
            <ChartRenderer config={q.content.visual!.config as ChartConfig} />
            <View style={[styles.placeholderChart]}>
              <Text style={styles.placeholderChartText}>📊 แผนภูมิที่ 2 (กำลังอัปเดตข้อมูล)</Text>
            </View>
            <View style={styles.mcOptions}>
              {(q.content.options || []).map(opt => {
                const isSelected = selected === opt.id;
                const isAnswer   = opt.id === q.answer;
                let bg = '#fff', border = '#E5E7EB';
                if (revealed && isAnswer)                { bg = '#D1FAE5'; border = COLORS.success; }
                if (revealed && isSelected && !isAnswer) { bg = '#FEE2E2'; border = COLORS.error; }
                if (!revealed && isSelected)             { bg = COLORS.primary + '15'; border = COLORS.primary; }
                return (
                  <TouchableOpacity key={opt.id} style={[styles.mcOption, { backgroundColor: bg, borderColor: border }]} onPress={() => handleSelect(opt.id)} activeOpacity={0.8} disabled={revealed}>
                    <View style={[styles.mcBubble, { borderColor: border }]}>
                      {revealed && isAnswer ? <Ionicons name="checkmark" size={14} color={COLORS.success} />
                        : revealed && isSelected && !isAnswer ? <Ionicons name="close" size={14} color={COLORS.error} />
                        : <Text style={[styles.mcBubbleText, { color: border }]}>{opt.id.toUpperCase()}</Text>}
                    </View>
                    <Text style={styles.mcOptionText}>{opt.label || opt.content}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ height: revealed ? 160 : 80 }} />
          </View>
        )}

        {/* ─────────────── MULTIPLE CHOICE ─────────────── */}
        {q.type === 'multiple-choice' && (
          <View>
            <Text style={styles.prompt}>{q.prompt}</Text>
            <View style={styles.mcOptions}>
              {(q.content.options || []).map(opt => {
                const isSelected = selected === opt.id;
                const isAnswer   = opt.id === q.answer;
                let bg = '#fff', border = '#E5E7EB', textColor = '#1F2937';
                if (revealed && isAnswer)                { bg = '#D1FAE5'; border = COLORS.success; }
                if (revealed && isSelected && !isAnswer) { bg = '#FEE2E2'; border = COLORS.error; }
                if (!revealed && isSelected)             { bg = COLORS.primary + '15'; border = COLORS.primary; }
                return (
                  <TouchableOpacity key={opt.id} style={[styles.mcOption, { backgroundColor: bg, borderColor: border }]} onPress={() => handleSelect(opt.id)} activeOpacity={0.8} disabled={revealed}>
                    <View style={[styles.mcBubble, { borderColor: border }]}>
                      {revealed && isAnswer ? <Ionicons name="checkmark" size={14} color={COLORS.success} />
                        : revealed && isSelected && !isAnswer ? <Ionicons name="close" size={14} color={COLORS.error} />
                        : <Text style={[styles.mcBubbleText, { color: border }]}>{opt.id.toUpperCase()}</Text>}
                    </View>
                    <Text style={[styles.mcOptionText, { color: textColor }]}>{opt.content || opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ height: revealed ? 160 : 80 }} />
          </View>
        )}

        {/* ─────────────── COMPARISON ─────────────── */}
        {q.type === 'comparison' && (
          <>
            <Text style={styles.prompt}>{q.prompt}</Text>
            <Text style={styles.compHint}>🔍 แตะที่ภาพเพื่อขยาย • แตะที่ปุ่มด้านล่างเพื่อเลือก</Text>
            <View style={styles.compRow}>
              {(q.content.options || []).map(opt => {
                const isSelected = selected === opt.id;
                const isAnswer   = opt.id === q.answer;
                let border   = '#E5E7EB', headerBg = '#F9FAFB';
                if (revealed && isAnswer)                { border = COLORS.success; headerBg = '#D1FAE5'; }
                if (revealed && isSelected && !isAnswer) { border = COLORS.error;   headerBg = '#FEE2E2'; }
                if (!revealed && isSelected)             { border = COLORS.primary;  headerBg = COLORS.primary + '15'; }
                return (
                  <View key={opt.id} style={[styles.compCard, { borderColor: border, width: (width - SPACING.lg * 2 - SPACING.sm) / 2 }]}>
                    <View style={[styles.compHeader, { backgroundColor: headerBg }]}>
                      {revealed && isAnswer ? <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                        : revealed && isSelected && !isAnswer ? <Ionicons name="close-circle" size={16} color={COLORS.error} /> : null}
                      <Text style={[styles.compLabel, { color: revealed ? (isAnswer ? COLORS.success : isSelected ? COLORS.error : '#6B7280') : '#6B7280' }]}>{opt.label}</Text>
                    </View>
                    <TouchableOpacity style={styles.compPreview} onPress={() => setExpandedHtml({ html: opt.content || '', label: opt.label })} activeOpacity={0.9}>
                      <HtmlPreview html={opt.content || ''} height={170} />
                      <View style={styles.expandBadge}><Ionicons name="expand-outline" size={12} color="#fff" /></View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.compSelectBtn, { backgroundColor: isSelected ? (revealed ? (isAnswer ? COLORS.success : COLORS.error) : COLORS.primary) : '#F3F4F6' }]}
                      onPress={() => handleSelect(opt.id)}
                      disabled={revealed}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.compSelectBtnText, { color: isSelected ? '#fff' : '#6B7280' }]}>
                        {revealed && isAnswer ? '✅ ถูก' : revealed && isSelected && !isAnswer ? '❌ ผิด' : isSelected ? '✓ เลือกแล้ว' : 'เลือก'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
            <Modal visible={expandedHtml !== null} transparent animationType="fade" onRequestClose={() => setExpandedHtml(null)}>
              <View style={styles.overlayBg}>
                <View style={styles.overlayHeader}>
                  <Text style={styles.overlayTitle}>{expandedHtml?.label}</Text>
                  <TouchableOpacity style={styles.overlayCloseBtn} onPress={() => setExpandedHtml(null)}>
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.overlayContent}>
                  {expandedHtml && <HtmlPreview html={expandedHtml.html} height={width * 1.3} />}
                </View>
                {!revealed && (
                  <TouchableOpacity style={styles.overlaySelectBtn} onPress={() => {
                    const optId = q.content.options?.find(o => o.label === expandedHtml?.label)?.id;
                    if (optId) handleSelect(optId);
                    setExpandedHtml(null);
                  }}>
                    <Text style={styles.overlaySelectBtnText}>เลือก {expandedHtml?.label} →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Modal>
            <View style={{ height: revealed ? 160 : 80 }} />
          </>
        )}
      </ScrollView>

      {/* ── Feedback panel (slides up after answer for answer types) ── */}
      {revealed && !NO_ANSWER_TYPES.has(q.type) && (
        <Animated.View
          style={[
            styles.feedbackPanel,
            { backgroundColor: isCorrect ? '#D1FAE5' : '#FEE2E2' },
            { transform: [{ translateY: feedbackAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) }] },
          ]}
        >
          <View style={styles.feedbackTop}>
            <View style={styles.feedbackIcon}>
              <Ionicons name={isCorrect ? 'checkmark-circle' : 'close-circle'} size={28} color={isCorrect ? COLORS.success : COLORS.error} />
              <Text style={[styles.feedbackTitle, { color: isCorrect ? COLORS.success : COLORS.error }]}>
                {isCorrect ? 'ถูกต้อง! 🎉' : 'ยังไม่ถูก 😅'}
              </Text>
            </View>
          </View>
          <Text style={styles.feedbackExplanation} numberOfLines={4}>{q.explanation}</Text>
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: isCorrect ? COLORS.success : COLORS.error }]} onPress={handleNext}>
            <Text style={styles.nextBtnText}>{current + 1 >= questions.length ? 'ดูผลลัพธ์ 🏁' : 'ต่อไป →'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },

  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm, backgroundColor: '#F7F8FA' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  progressTrack: { flex: 1, height: 10, backgroundColor: '#E5E7EB', borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  progressLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, minWidth: 36, textAlign: 'right' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  difficultyRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  diffChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  diffChipText: { fontSize: 12, fontWeight: '700' },
  qTypeLabel: { fontSize: 12, color: COLORS.textSecondary },

  prompt: { fontSize: 18, fontWeight: '700', color: '#1F2937', lineHeight: 27, marginBottom: SPACING.lg },

  // Multiple choice
  mcOptions: { gap: SPACING.sm },
  mcOption: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: 2, gap: SPACING.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  mcBubble: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  mcBubbleText: { fontSize: 12, fontWeight: '700' },
  mcOptionText: { flex: 1, fontSize: 15, lineHeight: 22 },

  // Comparison
  compHint: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.sm, fontStyle: 'italic' },
  compRow: { flexDirection: 'row', gap: SPACING.sm },
  compCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, borderWidth: 2.5, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  compHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, gap: 4, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  compLabel: { fontSize: 14, fontWeight: '700' },
  compPreview: { padding: 4, position: 'relative' },
  expandBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 6, padding: 4 },
  compSelectBtn: { margin: 6, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  compSelectBtnText: { fontSize: 13, fontWeight: '700' },

  // Expand overlay
  overlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-start' },
  overlayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: 56, paddingBottom: SPACING.md },
  overlayTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  overlayCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  overlayContent: { marginHorizontal: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: '#fff' },
  overlaySelectBtn: { margin: SPACING.lg, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center' },
  overlaySelectBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // Feedback panel
  feedbackPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.lg, paddingBottom: SPACING.xl, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  feedbackTop: { marginBottom: SPACING.sm },
  feedbackIcon: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  feedbackTitle: { fontSize: 18, fontWeight: '800' },
  feedbackExplanation: { fontSize: 13, color: '#374151', lineHeight: 20, marginBottom: SPACING.md },
  nextBtn: { paddingVertical: 14, borderRadius: RADIUS.lg, alignItems: 'center' },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // Micro-lesson
  microWrap: { flex: 1 },
  microCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderTopWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, marginBottom: SPACING.lg },
  microIcon: { fontSize: 36, marginBottom: 8, textAlign: 'center' },
  microCardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  microCardBody: { fontSize: 15, color: '#374151', lineHeight: 24 },
  microDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: SPACING.lg },
  microDot: { width: 8, height: 8, borderRadius: 4 },
  microNav: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm },
  microPrevBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: RADIUS.lg, backgroundColor: '#F3F4F6' },
  microPrevText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  microNextBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.lg, alignItems: 'center' },
  microNextText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Code block
  codeBlock: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: SPACING.md },
  codeText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, color: '#E2E8F0', lineHeight: 22 },
  codeBlank: { backgroundColor: '#334155', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1.5, borderColor: '#64748B', minWidth: 60 },
  codeBlankCorrect: { backgroundColor: '#064E3B', borderColor: COLORS.success },
  codeBlankWrong: { backgroundColor: '#7F1D1D', borderColor: COLORS.error },
  codeBlankText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, color: '#93C5FD' },

  // Fill-blank: naked numbered slots (no code template)
  nakedSlotsWrap: {
    gap: 8,
    marginBottom: 16,
  },
  nakedSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  nakedSlotFilled: {
    borderStyle: 'solid',
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '0D',
  },
  nakedSlotCorrect: {
    borderStyle: 'solid',
    borderColor: COLORS.success,
    backgroundColor: '#D1FAE5',
  },
  nakedSlotWrong: {
    borderStyle: 'solid',
    borderColor: COLORS.error,
    backgroundColor: '#FEE2E2',
  },
  nakedSlotNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    width: 16,
    textAlign: 'center',
  },
  nakedSlotText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Fill-blank word bank
  wordBankLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.sm, fontStyle: 'italic' },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  wordChip: { backgroundColor: '#fff', borderRadius: RADIUS.lg, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 2, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  wordChipSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' },
  wordChipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  fillSubmitBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.sm },
  fillSubmitBtnDisabled: { opacity: 0.4 },
  fillSubmitText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // Scenario
  scenarioProgress: { flexDirection: 'row', gap: 6, marginBottom: SPACING.md },
  scenarioProgressDot: { width: 10, height: 10, borderRadius: 5 },
  scenarioCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: SPACING.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  scenarioIcon: { fontSize: 28, marginBottom: 8 },
  scenarioSituation: { fontSize: 14, color: '#1F2937', lineHeight: 22, marginBottom: 8 },
  scenarioContext: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', borderLeftWidth: 3, borderLeftColor: COLORS.primary, paddingLeft: 10 },
  scenarioChoices: { gap: SPACING.sm },
  scenarioChoice: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', padding: 14 },
  scenarioChoiceSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  scenarioChoiceText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  scenarioOutcome: { borderRadius: 12, borderWidth: 1.5, padding: 14, gap: 10, marginTop: SPACING.md },
  scenarioOutcomeText: { fontSize: 13, lineHeight: 20 },
  scenarioNextBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  scenarioNextBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Concept-reveal
  conceptSummary: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: SPACING.md, fontStyle: 'italic' },
  hotspotHint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  hotspotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md },
  hotspotChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: RADIUS.lg, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 2, borderColor: '#E5E7EB' },
  hotspotChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  hotspotIcon: { fontSize: 16 },
  hotspotLabel: { fontSize: 12, color: '#374151', fontWeight: '600' },
  annotationCard: { backgroundColor: '#EFF6FF', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: COLORS.primary, padding: 14, marginBottom: SPACING.md },
  annotationTitle: { fontSize: 13, fontWeight: '700', color: '#1E40AF', marginBottom: 6 },
  annotationBody: { fontSize: 13, color: '#374151', lineHeight: 20 },
  conceptDoneBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.sm },
  conceptDoneText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  // Drag-arrange
  dragInstruction: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: SPACING.sm, fontStyle: 'italic' },
  dragBucket: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', padding: 12, marginBottom: 8, minHeight: 64 },
  dragBucketTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  dragBucketItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dragAssignedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '15', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  dragChipText: { fontSize: 13, color: '#374151' },
  dragUnassignedLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: SPACING.sm, marginTop: SPACING.sm, fontStyle: 'italic' },
  orderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, borderWidth: 2, borderColor: '#E5E7EB', padding: 12, marginBottom: 6, gap: 8 },
  orderNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: '700', color: '#6B7280' },
  orderLabel: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },
  orderArrows: { flexDirection: 'row', gap: 4 },
  arrowBtn: { width: 28, height: 28, backgroundColor: '#F3F4F6', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  arrowText: { fontSize: 16, color: '#374151' },

  // Chart comparison placeholder
  placeholderChart: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  placeholderChartText: { fontSize: 13, color: '#9CA3AF' },

  // Results screen
  resultScroll: { alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: 60 },
  resultEmoji: { marginBottom: SPACING.md },
  resultTitle: { fontSize: 28, fontWeight: '800', color: '#1F2937', textAlign: 'center', marginBottom: SPACING.sm },
  resultSub: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 22 },
  scoreRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 8, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
  scoreRingPct: { fontSize: 32, fontWeight: '900' },
  scoreRingLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  xpBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, marginBottom: SPACING.xl },
  xpBadgeText: { fontSize: 16, fontWeight: '800', color: '#D97706' },
  resultBreakdown: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.lg, width: '100%', marginBottom: SPACING.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  resultStat: { flex: 1, alignItems: 'center' },
  resultStatNum: { fontSize: 28, fontWeight: '900', color: COLORS.success },
  resultStatLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  resultDivider: { width: 1, backgroundColor: '#E5E7EB', marginHorizontal: SPACING.sm },
  resultActions: { width: '100%', gap: SPACING.md },
  retryButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center' },
  retryButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  doneButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center' },
  doneButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
