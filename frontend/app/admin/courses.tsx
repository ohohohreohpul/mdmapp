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

export default function AdminCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [careerPath, setCareerPath] = useState('UX Design');

  const careerPaths = ['UX Design', 'Data Analysis', 'Digital Marketing', 'Project Management', 'Learning Designer', 'General'];

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
        await axios.post(`${API_URL}/api/courses`, {
          title,
          description,
          career_path: careerPath,
        });
        Alert.alert('สำเร็จ', 'สร้างคอร์สเรียบร้อยแล้ว');
      } else {
        await axios.put(`${API_URL}/api/courses/${selectedCourse._id}`, {
          title,
          description,
        });
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
      await axios.put(`${API_URL}/api/courses/${course._id}`, {
        is_published: !course.is_published,
      });
      loadCourses();
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้');
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

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>จัดการคอร์ส</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
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
          courses.map((course: any) => (
            <View key={course._id} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseSubtitle}>{course.career_path}</Text>
                  <View style={styles.courseMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="book" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>{course.total_lessons ?? 0} บทเรียน</Text>
                    </View>
                    {course.is_published && (
                      <View style={styles.publishedBadge}>
                        <Text style={styles.publishedText}>เผยแพร่แล้ว</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.courseActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    router.push({
                      pathname: '/admin/course-modules' as any,
                      params: { id: course._id, title: course.title },
                    })
                  }
                >
                  <Ionicons name="list" size={20} color="#6366F1" />
                  <Text style={styles.actionText}>โมดูล</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(course)}>
                  <Ionicons name="create" size={20} color={COLORS.success} />
                  <Text style={styles.actionText}>แก้ไข</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => togglePublish(course)}>
                  <Ionicons
                    name={course.is_published ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.warning}
                  />
                  <Text style={styles.actionText}>{course.is_published ? 'ซ่อน' : 'เผยแพร่'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => deleteCourse(course._id)}>
                  <Ionicons name="trash" size={20} color={COLORS.error} />
                  <Text style={styles.actionText}>ลบ</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
                    {careerPaths.map((path) => (
                      <TouchableOpacity
                        key={path}
                        style={[
                          styles.pathButton,
                          careerPath === path && styles.pathButtonActive,
                        ]}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, padding: SPACING.md },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  createBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  courseCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    ...SHADOWS.small,
  },
  courseHeader: { marginBottom: SPACING.sm },
  courseInfo: { flex: 1 },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  courseSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  courseMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
  publishedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  publishedText: { fontSize: 12, color: COLORS.success, fontWeight: '500' },
  courseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
  },
  actionText: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
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
