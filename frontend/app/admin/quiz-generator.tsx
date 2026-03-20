import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Course {
  _id: string;
  title: string;
  career_path?: string;
}

interface Material {
  _id: string;
  title: string;
  content: string;
  file_type: string;
}

interface GeneratedQuestion {
  question: string;
  choices?: string[];
  correct_answer?: string;
}

const QUESTION_COUNTS = [5, 10, 15, 20];
const QUIZ_TYPES = [
  { key: 'lesson_quiz', label: 'แบบทดสอบบทเรียน' },
  { key: 'final_exam', label: 'ข้อสอบปลายภาค' },
];

export default function QuizGenerator() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Generation modal
  const [showGenModal, setShowGenModal] = useState(false);
  const [numQuestions, setNumQuestions] = useState(10);
  const [quizType, setQuizType] = useState<'lesson_quiz' | 'final_exam'>('lesson_quiz');
  const [generating, setGenerating] = useState(false);

  // Result state
  const [generatedResult, setGeneratedResult] = useState<{
    quiz_id?: string;
    question_count?: number;
    questions?: GeneratedQuestion[];
    message?: string;
  } | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/courses`);
      setCourses(res.data || []);
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถโหลดคอร์สได้');
    } finally {
      setLoading(false);
    }
  };

  const selectCourse = async (course: Course) => {
    setSelectedCourse(course);
    setSelectedMaterial(null);
    setGeneratedResult(null);
    setLoadingMaterials(true);
    try {
      const res = await axios.get(`${API_URL}/api/materials/course/${course._id}`);
      setMaterials(res.data || []);
    } catch {
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const openGenerationModal = (material: Material) => {
    setSelectedMaterial(material);
    setNumQuestions(10);
    setQuizType('lesson_quiz');
    setGeneratedResult(null);
    setShowGenModal(true);
  };

  const generateQuiz = async () => {
    if (!selectedMaterial) return;
    try {
      setGenerating(true);
      setGeneratedResult(null);
      const res = await axios.post(`${API_URL}/api/quizzes/generate`, {
        material_id: selectedMaterial._id,
        num_questions: numQuestions,
        quiz_type: quizType,
      });
      setGeneratedResult(res.data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || err?.response?.data?.message || 'ไม่สามารถสร้างแบบทดสอบได้';
      Alert.alert('ผิดพลาด', msg);
    } finally {
      setGenerating(false);
    }
  };

  const fileTypeLabel = (type: string) => {
    if (type === 'text') return '📝 ข้อความ';
    if (type === 'transcript') return '🎙️ Transcript';
    return '📄 PDF';
  };

  const previewText = (content: string) =>
    content ? content.slice(0, 120) + (content.length > 120 ? '...' : '') : '';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>สร้างแบบทดสอบ AI</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Select Course */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>เลือกคอร์ส</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
          ) : courses.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="school" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>สร้างคอร์สและอัพโหลดเนื้อหาก่อน</Text>
            </View>
          ) : (
            courses.map((course) => (
              <TouchableOpacity
                key={course._id}
                style={[
                  styles.courseCard,
                  selectedCourse?._id === course._id && styles.courseCardActive,
                ]}
                onPress={() => selectCourse(course)}
                activeOpacity={0.7}
              >
                <View style={styles.courseIcon}>
                  <Ionicons
                    name="school"
                    size={22}
                    color={selectedCourse?._id === course._id ? COLORS.primary : COLORS.textSecondary}
                  />
                </View>
                <View style={styles.courseInfo}>
                  <Text
                    style={[
                      styles.courseName,
                      selectedCourse?._id === course._id && styles.courseNameActive,
                    ]}
                  >
                    {course.title}
                  </Text>
                  {course.career_path ? (
                    <Text style={styles.careerPath}>{course.career_path}</Text>
                  ) : null}
                </View>
                {selectedCourse?._id === course._id && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Step 2: Select Material */}
        {selectedCourse && (
          <View style={styles.stepSection}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>เลือกเนื้อหา</Text>
            </View>

            {loadingMaterials ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.md }} />
            ) : materials.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="document-text" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>ยังไม่มีเนื้อหาสำหรับคอร์สนี้</Text>
                <TouchableOpacity
                  onPress={() => router.push('/admin/materials' as any)}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkBtnText}>ไปอัพโหลดเนื้อหา</Text>
                </TouchableOpacity>
              </View>
            ) : (
              materials.map((mat) => (
                <TouchableOpacity
                  key={mat._id}
                  style={styles.materialCard}
                  onPress={() => openGenerationModal(mat)}
                  activeOpacity={0.75}
                >
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialTitle}>{mat.title}</Text>
                    <Text style={styles.fileTypeLbl}>{fileTypeLabel(mat.file_type)}</Text>
                    {mat.content ? (
                      <Text style={styles.materialPreview} numberOfLines={2}>
                        {previewText(mat.content)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.generatePill}>
                    <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                    <Text style={styles.generatePillText}>สร้าง Quiz</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Generation Modal */}
      <Modal visible={showGenModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>สร้าง Quiz ด้วย AI</Text>
              <TouchableOpacity onPress={() => { setShowGenModal(false); setGeneratedResult(null); }}>
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedMaterial && (
                <View style={styles.materialSummaryCard}>
                  <Ionicons name="document-text" size={20} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matSummaryTitle}>{selectedMaterial.title}</Text>
                    <Text style={styles.matSummaryPreview} numberOfLines={2}>
                      {previewText(selectedMaterial.content)}
                    </Text>
                  </View>
                </View>
              )}

              {!generatedResult ? (
                <>
                  <Text style={styles.inputLabel}>จำนวนข้อ</Text>
                  <View style={styles.countRow}>
                    {QUESTION_COUNTS.map((n) => (
                      <TouchableOpacity
                        key={n}
                        style={[styles.countBtn, numQuestions === n && styles.countBtnActive]}
                        onPress={() => setNumQuestions(n)}
                      >
                        <Text
                          style={[
                            styles.countBtnText,
                            numQuestions === n && styles.countBtnTextActive,
                          ]}
                        >
                          {n} ข้อ
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>ประเภท Quiz</Text>
                  <View style={styles.quizTypeRow}>
                    {QUIZ_TYPES.map((qt) => (
                      <TouchableOpacity
                        key={qt.key}
                        style={[
                          styles.quizTypeBtn,
                          quizType === qt.key && styles.quizTypeBtnActive,
                        ]}
                        onPress={() => setQuizType(qt.key as any)}
                      >
                        <Text
                          style={[
                            styles.quizTypeBtnText,
                            quizType === qt.key && styles.quizTypeBtnTextActive,
                          ]}
                        >
                          {qt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.genButton, generating && styles.genButtonDisabled]}
                    onPress={generateQuiz}
                    disabled={generating}
                  >
                    {generating ? (
                      <View style={styles.genButtonInner}>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text style={styles.genButtonText}>กำลังสร้าง Quiz...</Text>
                      </View>
                    ) : (
                      <View style={styles.genButtonInner}>
                        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                        <Text style={styles.genButtonText}>สร้าง Quiz</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {generating && (
                    <Text style={styles.generatingNote}>
                      AI กำลังวิเคราะห์เนื้อหาและสร้างข้อสอบ อาจใช้เวลาสักครู่...
                    </Text>
                  )}
                </>
              ) : (
                /* Result View */
                <View>
                  <View style={styles.resultSuccess}>
                    <Ionicons name="checkmark-circle" size={40} color={COLORS.success} />
                    <Text style={styles.resultTitle}>สร้าง Quiz สำเร็จ!</Text>
                    <Text style={styles.resultCount}>
                      {generatedResult.question_count ?? (generatedResult.questions?.length ?? 0)} ข้อ
                      {' '}ถูกบันทึกในระบบแล้ว
                    </Text>
                  </View>

                  {generatedResult.questions && generatedResult.questions.length > 0 && (
                    <>
                      <Text style={styles.previewTitle}>ตัวอย่างข้อสอบ (3 ข้อแรก)</Text>
                      {generatedResult.questions.slice(0, 3).map((q, idx) => (
                        <View key={idx} style={styles.questionPreviewCard}>
                          <Text style={styles.questionNum}>ข้อ {idx + 1}</Text>
                          <Text style={styles.questionText}>{q.question}</Text>
                          {q.choices && q.choices.length > 0 && (
                            <View style={styles.choicesList}>
                              {q.choices.map((choice, ci) => (
                                <Text
                                  key={ci}
                                  style={[
                                    styles.choiceText,
                                    choice === q.correct_answer && styles.correctChoice,
                                  ]}
                                >
                                  {String.fromCharCode(65 + ci)}. {choice}
                                  {choice === q.correct_answer ? ' ✓' : ''}
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => {
                      setShowGenModal(false);
                      setGeneratedResult(null);
                    }}
                  >
                    <Text style={styles.doneButtonText}>เสร็จสิ้น</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  headerSafe: { backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  content: { flex: 1, padding: SPACING.md },
  stepSection: { marginBottom: SPACING.lg },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  stepTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptyBox: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  linkBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#fce7f3',
    borderRadius: RADIUS.full,
  },
  linkBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  courseCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    ...SHADOWS.small,
  },
  courseCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#fdf2f8',
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  courseNameActive: { color: COLORS.primary },
  careerPath: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  materialCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  materialInfo: { flex: 1 },
  materialTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  fileTypeLbl: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  materialPreview: { fontSize: 13, color: COLORS.textTertiary, lineHeight: 18 },
  generatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fce7f3',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginTop: 2,
  },
  generatePillText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  modalBody: { padding: SPACING.lg },
  materialSummaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fdf2f8',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#fce7f3',
  },
  matSummaryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  matSummaryPreview: { fontSize: 12, color: COLORS.textSecondary },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  countRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  countBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  countBtnActive: { borderColor: COLORS.primary, backgroundColor: '#fce7f3' },
  countBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  countBtnTextActive: { color: COLORS.primary },
  quizTypeRow: { gap: SPACING.sm },
  quizTypeBtn: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  quizTypeBtnActive: { borderColor: COLORS.primary, backgroundColor: '#fce7f3' },
  quizTypeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  quizTypeBtnTextActive: { color: COLORS.primary },
  genButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  genButtonDisabled: { backgroundColor: COLORS.textTertiary },
  genButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  genButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  generatingNote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 20,
  },
  resultSuccess: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: '#D1FAE5',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  resultCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  questionPreviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  questionNum: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  choicesList: { gap: 4 },
  choiceText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    paddingLeft: SPACING.sm,
  },
  correctChoice: {
    color: COLORS.success,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  doneButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
