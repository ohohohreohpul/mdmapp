import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  order: number;
  content_type: 'video' | 'article';
  video_url?: string;
  article_content?: string;
  duration_minutes?: number;
}

interface Module {
  _id: string;
  title: string;
  description?: string;
  order: number;
  lessons?: Lesson[];
  expanded?: boolean;
  loadingLessons?: boolean;
}

export default function CourseModules() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; title: string }>();
  const courseId = params.id;
  const courseTitle = params.title || 'คอร์ส';

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  // Module modal
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleOrder, setModuleOrder] = useState('1');

  // Lesson modal
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [targetModuleId, setTargetModuleId] = useState<string>('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonOrder, setLessonOrder] = useState('1');
  const [lessonContentType, setLessonContentType] = useState<'video' | 'article'>('video');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonArticleContent, setLessonArticleContent] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');
  const [savingLesson, setSavingLesson] = useState(false);
  const [savingModule, setSavingModule] = useState(false);

  useEffect(() => {
    if (courseId) loadModules();
  }, [courseId]);

  const loadModules = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/modules/course/${courseId}`);
      const loaded: Module[] = (res.data || []).map((m: any) => ({
        ...m,
        expanded: false,
        lessons: undefined,
        loadingLessons: false,
      }));
      setModules(loaded);
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถโหลดโมดูลได้');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (mod: Module) => {
    if (!mod.expanded && !mod.lessons) {
      // load lessons
      setModules((prev) =>
        prev.map((m) => (m._id === mod._id ? { ...m, loadingLessons: true } : m))
      );
      try {
        const res = await axios.get(`${API_URL}/api/lessons/module/${mod._id}`);
        setModules((prev) =>
          prev.map((m) =>
            m._id === mod._id
              ? { ...m, lessons: res.data || [], loadingLessons: false, expanded: true }
              : m
          )
        );
      } catch {
        setModules((prev) =>
          prev.map((m) =>
            m._id === mod._id ? { ...m, loadingLessons: false, lessons: [] } : m
          )
        );
      }
    } else {
      setModules((prev) =>
        prev.map((m) => (m._id === mod._id ? { ...m, expanded: !m.expanded } : m))
      );
    }
  };

  const openAddModuleModal = () => {
    setModuleTitle('');
    setModuleDescription('');
    setModuleOrder(String(modules.length + 1));
    setShowModuleModal(true);
  };

  const saveModule = async () => {
    if (!moduleTitle.trim()) {
      Alert.alert('ผิดพลาด', 'กรุณากรอกชื่อโมดูล');
      return;
    }
    try {
      setSavingModule(true);
      await axios.post(`${API_URL}/api/modules`, {
        course_id: courseId,
        title: moduleTitle.trim(),
        description: moduleDescription.trim() || undefined,
        order: parseInt(moduleOrder, 10) || modules.length + 1,
      });
      setShowModuleModal(false);
      loadModules();
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถสร้างโมดูลได้');
    } finally {
      setSavingModule(false);
    }
  };

  const deleteModule = (moduleId: string) => {
    Alert.alert('ยืนยันการลบ', 'ลบโมดูลนี้และบทเรียนทั้งหมดในโมดูล?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/modules/${moduleId}`);
            loadModules();
          } catch {
            Alert.alert('ผิดพลาด', 'ไม่สามารถลบโมดูลได้');
          }
        },
      },
    ]);
  };

  const openAddLessonModal = (modId: string, existingLessons: Lesson[] = []) => {
    setTargetModuleId(modId);
    setLessonTitle('');
    setLessonDescription('');
    setLessonOrder(String(existingLessons.length + 1));
    setLessonContentType('video');
    setLessonVideoUrl('');
    setLessonArticleContent('');
    setLessonDuration('');
    setShowLessonModal(true);
  };

  const saveLesson = async () => {
    if (!lessonTitle.trim()) {
      Alert.alert('ผิดพลาด', 'กรุณากรอกชื่อบทเรียน');
      return;
    }
    try {
      setSavingLesson(true);
      await axios.post(`${API_URL}/api/lessons`, {
        module_id: targetModuleId,
        title: lessonTitle.trim(),
        description: lessonDescription.trim() || undefined,
        order: parseInt(lessonOrder, 10) || 1,
        content_type: lessonContentType,
        video_url: lessonContentType === 'video' ? lessonVideoUrl.trim() || undefined : undefined,
        article_content:
          lessonContentType === 'article' ? lessonArticleContent.trim() || undefined : undefined,
        duration_minutes: lessonDuration ? parseInt(lessonDuration, 10) : undefined,
      });
      setShowLessonModal(false);
      // Reload lessons for that module
      setModules((prev) =>
        prev.map((m) => (m._id === targetModuleId ? { ...m, lessons: undefined, expanded: false } : m))
      );
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถสร้างบทเรียนได้');
    } finally {
      setSavingLesson(false);
    }
  };

  const deleteLesson = (lessonId: string, modId: string) => {
    Alert.alert('ยืนยันการลบ', 'ลบบทเรียนนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/lessons/${lessonId}`);
            setModules((prev) =>
              prev.map((m) =>
                m._id === modId
                  ? { ...m, lessons: (m.lessons || []).filter((l) => l._id !== lessonId) }
                  : m
              )
            );
          } catch {
            Alert.alert('ผิดพลาด', 'ไม่สามารถลบบทเรียนได้');
          }
        },
      },
    ]);
  };

  const contentTypeBadgeColor = (type: string) =>
    type === 'video' ? '#3B82F6' : '#10B981';

  const contentTypeLabel = (type: string) =>
    type === 'video' ? 'วิดีโอ' : 'บทความ';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{courseTitle}</Text>
            <Text style={styles.headerSub}>โมดูลและบทเรียน</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAddModuleModal}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>โมดูล</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : modules.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="layers" size={56} color="#D1D5DB" />
            <Text style={styles.emptyText}>ยังไม่มีโมดูล</Text>
            <Text style={styles.emptySubText}>กดปุ่ม "+ โมดูล" ด้านบนเพื่อเริ่มต้น</Text>
          </View>
        ) : (
          modules.map((mod) => (
            <View key={mod._id} style={styles.moduleCard}>
              {/* Module Header */}
              <View style={styles.moduleRow}>
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{mod.order}</Text>
                </View>
                <TouchableOpacity
                  style={styles.moduleTitleArea}
                  onPress={() => toggleModule(mod)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moduleTitle}>{mod.title}</Text>
                  {mod.description ? (
                    <Text style={styles.moduleDesc} numberOfLines={1}>{mod.description}</Text>
                  ) : null}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => deleteModule(mod._id)}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => toggleModule(mod)}
                >
                  <Ionicons
                    name={mod.expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Expanded lessons */}
              {mod.expanded && (
                <View style={styles.lessonsContainer}>
                  {mod.loadingLessons ? (
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: SPACING.md }} />
                  ) : (
                    <>
                      {(mod.lessons || []).length === 0 ? (
                        <Text style={styles.noLessonsText}>ยังไม่มีบทเรียนในโมดูลนี้</Text>
                      ) : (
                        (mod.lessons || []).map((lesson) => (
                          <View key={lesson._id} style={styles.lessonRow}>
                            <View style={styles.lessonInfo}>
                              <View style={styles.lessonTitleRow}>
                                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                                <View
                                  style={[
                                    styles.contentTypeBadge,
                                    { backgroundColor: contentTypeBadgeColor(lesson.content_type) + '20' },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.contentTypeBadgeText,
                                      { color: contentTypeBadgeColor(lesson.content_type) },
                                    ]}
                                  >
                                    {contentTypeLabel(lesson.content_type)}
                                  </Text>
                                </View>
                              </View>
                              {lesson.duration_minutes ? (
                                <Text style={styles.lessonMeta}>{lesson.duration_minutes} นาที</Text>
                              ) : null}
                            </View>
                            <TouchableOpacity
                              onPress={() => deleteLesson(lesson._id, mod._id)}
                              style={styles.iconBtn}
                            >
                              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}

                      <TouchableOpacity
                        style={styles.addLessonBtn}
                        onPress={() => openAddLessonModal(mod._id, mod.lessons || [])}
                      >
                        <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.addLessonBtnText}>+ เพิ่มบทเรียน</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          ))
        )}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Add Module Modal */}
      <Modal visible={showModuleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เพิ่มโมดูลใหม่</Text>
              <TouchableOpacity onPress={() => setShowModuleModal(false)}>
                <Ionicons name="close" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>ชื่อโมดูล *</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น: บทที่ 1 – แนะนำ UX Design"
                value={moduleTitle}
                onChangeText={setModuleTitle}
              />

              <Text style={styles.inputLabel}>คำอธิบาย</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="คำอธิบายโมดูล (ไม่บังคับ)"
                value={moduleDescription}
                onChangeText={setModuleDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>ลำดับที่</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={moduleOrder}
                onChangeText={setModuleOrder}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.saveButton, savingModule && styles.saveButtonDisabled]}
                onPress={saveModule}
                disabled={savingModule}
              >
                {savingModule ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>สร้างโมดูล</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Lesson Modal */}
      <Modal visible={showLessonModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เพิ่มบทเรียน</Text>
              <TouchableOpacity onPress={() => setShowLessonModal(false)}>
                <Ionicons name="close" size={26} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>ชื่อบทเรียน *</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น: การทำ User Research"
                value={lessonTitle}
                onChangeText={setLessonTitle}
              />

              <Text style={styles.inputLabel}>คำอธิบาย</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="คำอธิบายบทเรียน (ไม่บังคับ)"
                value={lessonDescription}
                onChangeText={setLessonDescription}
                multiline
                numberOfLines={2}
              />

              <Text style={styles.inputLabel}>ลำดับที่</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                value={lessonOrder}
                onChangeText={setLessonOrder}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>ประเภทเนื้อหา</Text>
              <View style={styles.typeRow}>
                {(['video', 'article'] as const).map((ct) => (
                  <TouchableOpacity
                    key={ct}
                    style={[
                      styles.typeButton,
                      lessonContentType === ct && styles.typeButtonActive,
                    ]}
                    onPress={() => setLessonContentType(ct)}
                  >
                    <Ionicons
                      name={ct === 'video' ? 'play-circle' : 'document-text'}
                      size={18}
                      color={lessonContentType === ct ? COLORS.primary : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        lessonContentType === ct && styles.typeButtonTextActive,
                      ]}
                    >
                      {ct === 'video' ? 'วิดีโอ' : 'บทความ'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {lessonContentType === 'video' && (
                <>
                  <Text style={styles.inputLabel}>URL วิดีโอ</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://..."
                    value={lessonVideoUrl}
                    onChangeText={setLessonVideoUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </>
              )}

              {lessonContentType === 'article' && (
                <>
                  <Text style={styles.inputLabel}>เนื้อหาบทความ</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
                    placeholder="เนื้อหาบทความ..."
                    value={lessonArticleContent}
                    onChangeText={setLessonArticleContent}
                    multiline
                    numberOfLines={6}
                  />
                </>
              )}

              <Text style={styles.inputLabel}>ระยะเวลา (นาที)</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น: 10"
                value={lessonDuration}
                onChangeText={setLessonDuration}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.saveButton, savingLesson && styles.saveButtonDisabled]}
                onPress={saveLesson}
                disabled={savingLesson}
              >
                {savingLesson ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>สร้างบทเรียน</Text>
                )}
              </TouchableOpacity>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  content: { flex: 1, padding: SPACING.md },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  moduleCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  moduleTitleArea: { flex: 1 },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  moduleDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  iconBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  noLessonsText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: SPACING.sm,
  },
  lessonInfo: { flex: 1 },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  contentTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  contentTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lessonMeta: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  addLessonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  addLessonBtnText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: RADIUS.sm,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  typeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#fce7f3',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeButtonTextActive: {
    color: COLORS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  saveButtonDisabled: { backgroundColor: COLORS.textTertiary },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
