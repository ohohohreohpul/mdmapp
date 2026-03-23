import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CAREER_PATHS = ['UX Design', 'Data Analysis', 'Digital Marketing', 'Project Management', 'Learning Designer', 'General'];

export default function AdminCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [seeding, setSeeding] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [careerPath, setCareerPath] = useState('UX Design');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/courses`);
      setCourses(response.data);
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถโหลดคอร์สได้');
    } finally {
      setLoading(false);
    }
  };

  // Group courses by career path, sorted by sequence_order
  const grouped: Record<string, any[]> = {};
  for (const c of courses) {
    const key = c.career_path || 'General';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  }
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => {
      if (a.sequence_order == null && b.sequence_order == null) return 0;
      if (a.sequence_order == null) return 1;
      if (b.sequence_order == null) return -1;
      return a.sequence_order - b.sequence_order;
    });
  }
  const groupKeys = Object.keys(grouped).sort();

  const openCreateModal = () => {
    setModalMode('create');
    setTitle('');
    setDescription('');
    setCareerPath('UX Design');
    setSelectedCourse(null);
    setShowModal(true);
  };

  const openEditModal = (course: any) => {
    setModalMode('edit');
    setTitle(course.title);
    setDescription(course.description);
    setCareerPath(course.career_path);
    setSelectedCourse(course);
    setShowModal(true);
  };

  const saveCourse = async () => {
    if (!title || !description) {
      Alert.alert('ผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    try {
      if (modalMode === 'create') {
        await axios.post(`${API_URL}/api/courses`, { title, description, career_path: careerPath });
        Alert.alert('สำเร็จ', 'สร้างคอร์สเรียบร้อยแล้ว');
      } else {
        await axios.put(`${API_URL}/api/courses/${selectedCourse._id}`, { title, description });
        Alert.alert('สำเร็จ', 'อัปเดตคอร์สเรียบร้อยแล้ว');
      }
      setShowModal(false);
      loadCourses();
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกคอร์สได้');
    }
  };

  const togglePublish = async (course: any) => {
    try {
      await axios.put(`${API_URL}/api/courses/${course._id}`, { is_published: !course.is_published });
      loadCourses();
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  const toggleCertification = async (course: any) => {
    try {
      await axios.put(`${API_URL}/api/courses/${course._id}`, {
        counts_for_certification: !course.counts_for_certification,
      });
      loadCourses();
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะ Cert ได้');
    }
  };

  const moveSequence = async (course: any, direction: 'up' | 'down', pathCourses: any[]) => {
    const idx = pathCourses.findIndex((c) => c._id === course._id);
    const swapWith = direction === 'up' ? pathCourses[idx - 1] : pathCourses[idx + 1];
    if (!swapWith) return;

    const myOrder = course.sequence_order;
    const theirOrder = swapWith.sequence_order;

    // Assign a temp value to avoid unique constraint collisions if any
    try {
      await Promise.all([
        axios.put(`${API_URL}/api/courses/${course._id}`, { sequence_order: theirOrder ?? null }),
        axios.put(`${API_URL}/api/courses/${swapWith._id}`, { sequence_order: myOrder ?? null }),
      ]);
      loadCourses();
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถเรียงลำดับได้');
    }
  };

  const deleteCourse = (courseId: string) => {
    Alert.alert('ยืนยันการลบ', 'คุณแน่ใจหรือไม่ที่จะลบคอร์สนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/courses/${courseId}`);
            Alert.alert('สำเร็จ', 'ลบคอร์สเรียบร้อยแล้ว');
            loadCourses();
          } catch {
            Alert.alert('ผิดพลาด', 'ไม่สามารถลบคอร์สได้');
          }
        },
      },
    ]);
  };

  const seedSequences = () => {
    Alert.alert(
      'Seed Sequences',
      'นำลำดับคอร์สจากโค้ดมาบันทึกลง DB (ทำครั้งเดียว)',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ดำเนินการ',
          onPress: async () => {
            setSeeding(true);
            try {
              const res = await axios.post(`${API_URL}/api/admin/seed-sequences`);
              Alert.alert('สำเร็จ', res.data.message);
              loadCourses();
            } catch {
              Alert.alert('ผิดพลาด', 'Seed ไม่สำเร็จ');
            } finally {
              setSeeding(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>จัดการคอร์ส</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.seedButton} onPress={seedSequences} disabled={seeding}>
              <Ionicons name="git-merge" size={18} color="#6366F1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="school" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>ยังไม่มีคอร์ส</Text>
            <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
              <Text style={styles.createBtnText}>สร้างคอร์สแรก</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupKeys.map((pathKey) => (
            <View key={pathKey}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{pathKey}</Text>
                <Text style={styles.sectionCount}>{grouped[pathKey].length} คอร์ส</Text>
              </View>

              {grouped[pathKey].map((course: any, idx: number) => {
                const pathCourses = grouped[pathKey];
                const isFirst = idx === 0;
                const isLast = idx === pathCourses.length - 1;
                const certOn = course.counts_for_certification !== false;

                return (
                  <View key={course._id} style={styles.courseCard}>
                    {/* Sequence + order controls */}
                    <View style={styles.seqCol}>
                      <TouchableOpacity
                        style={[styles.arrowBtn, isFirst && styles.arrowBtnDisabled]}
                        onPress={() => !isFirst && moveSequence(course, 'up', pathCourses)}
                        disabled={isFirst}
                      >
                        <Ionicons name="chevron-up" size={16} color={isFirst ? '#D1D5DB' : '#6366F1'} />
                      </TouchableOpacity>
                      <View style={styles.seqBadge}>
                        <Text style={styles.seqText}>
                          {course.sequence_order != null ? `#${course.sequence_order}` : '–'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.arrowBtn, isLast && styles.arrowBtnDisabled]}
                        onPress={() => !isLast && moveSequence(course, 'down', pathCourses)}
                        disabled={isLast}
                      >
                        <Ionicons name="chevron-down" size={16} color={isLast ? '#D1D5DB' : '#6366F1'} />
                      </TouchableOpacity>
                    </View>

                    {/* Course info */}
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                      <View style={styles.badgeRow}>
                        {course.is_published ? (
                          <View style={styles.publishedBadge}>
                            <Text style={styles.publishedText}>เผยแพร่</Text>
                          </View>
                        ) : (
                          <View style={styles.draftBadge}>
                            <Text style={styles.draftText}>ซ่อน</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={[styles.certBadge, certOn ? styles.certBadgeOn : styles.certBadgeOff]}
                          onPress={() => toggleCertification(course)}
                        >
                          <Text style={styles.certBadgeText}>{certOn ? '🏆 นับ Cert' : '– ไม่นับ'}</Text>
                        </TouchableOpacity>
                        <View style={styles.lessonsBadge}>
                          <Ionicons name="book" size={12} color={COLORS.textSecondary} />
                          <Text style={styles.lessonsText}>{course.total_lessons ?? 0}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.actionsCol}>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() =>
                          router.push({
                            pathname: '/admin/course-modules' as any,
                            params: { id: course._id, title: course.title },
                          })
                        }
                      >
                        <Ionicons name="list" size={18} color="#6366F1" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(course)}>
                        <Ionicons name="create" size={18} color={COLORS.success} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => togglePublish(course)}>
                        <Ionicons
                          name={course.is_published ? 'eye-off' : 'eye'}
                          size={18}
                          color={COLORS.warning}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => deleteCourse(course._id)}>
                        <Ionicons name="trash" size={18} color={COLORS.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'สร้างคอร์สใหม่' : 'แก้ไขคอร์ส'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>ชื่อคอร์ส</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น: UX Design สำหรับมือใหม่"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>คำอธิบาย</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="อธิบายเนื้อหาของคอร์ส..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              {modalMode === 'create' && (
                <>
                  <Text style={styles.inputLabel}>เส้นทางอาชีพ</Text>
                  <View style={styles.pathButtons}>
                    {CAREER_PATHS.map((path) => (
                      <TouchableOpacity
                        key={path}
                        style={[styles.pathButton, careerPath === path && styles.pathButtonActive]}
                        onPress={() => setCareerPath(path)}
                      >
                        <Text
                          style={[
                            styles.pathButtonText,
                            careerPath === path && styles.pathButtonTextActive,
                          ]}
                        >
                          {path}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.saveButton} onPress={saveCourse}>
                <Text style={styles.saveButtonText}>บันทึก</Text>
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
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seedButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginTop: SPACING.md },
  createBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sectionCount: { fontSize: 13, color: COLORS.textSecondary },

  courseCard: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    ...SHADOWS.small,
  },

  seqCol: { alignItems: 'center', width: 36, marginRight: SPACING.sm },
  arrowBtn: { padding: 4 },
  arrowBtnDisabled: { opacity: 0.3 },
  seqBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  seqText: { fontSize: 11, fontWeight: '700', color: '#6366F1' },

  courseInfo: { flex: 1, paddingRight: SPACING.sm },
  courseTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  publishedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  publishedText: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  draftBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  draftText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  certBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  certBadgeOn: { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' },
  certBadgeOff: { backgroundColor: '#F9FAFB', borderColor: '#D1D5DB' },
  certBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.textPrimary },
  lessonsBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  lessonsText: { fontSize: 11, color: COLORS.textSecondary },

  actionsCol: { gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.xs,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
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
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pathButtons: { gap: SPACING.sm },
  pathButton: {
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  pathButtonActive: { borderColor: COLORS.primary, backgroundColor: '#fce7f3' },
  pathButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  pathButtonTextActive: { color: COLORS.primary },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
