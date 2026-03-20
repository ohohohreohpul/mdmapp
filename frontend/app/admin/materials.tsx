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
  FlatList,
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
  course_id: string;
}

const FILE_TYPES = [
  { key: 'text', label: 'ข้อความ', emoji: '📝' },
  { key: 'transcript', label: 'Transcript', emoji: '🎙️' },
  { key: 'pdf_extracted', label: 'PDF Extract', emoji: '📄' },
];

export default function AdminMaterials() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload form
  const [formCourseId, setFormCourseId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formFileType, setFormFileType] = useState('text');

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadMaterials(selectedCourseId);
    } else {
      setMaterials([]);
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/courses`);
      const data: Course[] = res.data || [];
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourseId(data[0]._id);
      }
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถโหลดคอร์สได้');
    } finally {
      setLoading(false);
    }
  };

  const loadMaterials = async (courseId: string) => {
    try {
      setLoadingMaterials(true);
      const res = await axios.get(`${API_URL}/api/materials/course/${courseId}`);
      setMaterials(res.data || []);
    } catch {
      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const openUploadModal = () => {
    setFormCourseId(selectedCourseId || (courses[0]?._id ?? ''));
    setFormTitle('');
    setFormContent('');
    setFormFileType('text');
    setShowModal(true);
  };

  const uploadMaterial = async () => {
    if (!formCourseId || !formTitle.trim() || !formContent.trim()) {
      Alert.alert('ผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    try {
      setUploading(true);
      await axios.post(`${API_URL}/api/materials`, {
        course_id: formCourseId,
        title: formTitle.trim(),
        content: formContent.trim(),
        file_type: formFileType,
      });
      Alert.alert('สำเร็จ', 'อัพโหลดเนื้อหาเรียบร้อยแล้ว');
      setShowModal(false);
      if (formCourseId === selectedCourseId) {
        loadMaterials(selectedCourseId);
      }
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถอัพโหลดเนื้อหาได้');
    } finally {
      setUploading(false);
    }
  };

  const deleteMaterial = (matId: string) => {
    Alert.alert('ยืนยันการลบ', 'ลบเนื้อหานี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: () => {
          // Remove locally (no delete endpoint)
          setMaterials((prev) => prev.filter((m) => m._id !== matId));
        },
      },
    ]);
  };

  const fileTypeBadge = (type: string) => {
    const ft = FILE_TYPES.find((f) => f.key === type);
    return ft ? `${ft.emoji} ${ft.label}` : type;
  };

  const fileTypeBadgeColor = (type: string) => {
    if (type === 'text') return '#3B82F6';
    if (type === 'transcript') return '#8B5CF6';
    return '#F59E0B';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>เนื้อหาบทเรียน</Text>
          <TouchableOpacity style={styles.addButton} onPress={openUploadModal}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>อัพโหลด</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Course Filter Pills */}
      {!loading && courses.length > 0 && (
        <View style={styles.pillsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsContent}
          >
            {courses.map((course) => (
              <TouchableOpacity
                key={course._id}
                style={[
                  styles.pill,
                  selectedCourseId === course._id && styles.pillActive,
                ]}
                onPress={() => setSelectedCourseId(course._id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedCourseId === course._id && styles.pillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {course.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="school" size={56} color="#D1D5DB" />
            <Text style={styles.emptyText}>สร้างคอร์สก่อนเพื่ออัพโหลดเนื้อหา</Text>
          </View>
        ) : loadingMaterials ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : materials.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="document-text" size={56} color="#D1D5DB" />
            <Text style={styles.emptyText}>ยังไม่มีเนื้อหาสำหรับคอร์สนี้</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={openUploadModal}>
              <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
              <Text style={styles.uploadBtnText}>อัพโหลดเนื้อหาแรก</Text>
            </TouchableOpacity>
          </View>
        ) : (
          materials.map((mat) => {
            const course = courses.find((c) => c._id === mat.course_id);
            return (
              <View key={mat._id} style={styles.materialCard}>
                <View style={styles.materialHeader}>
                  <View style={styles.materialMeta}>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: fileTypeBadgeColor(mat.file_type) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          { color: fileTypeBadgeColor(mat.file_type) },
                        ]}
                      >
                        {fileTypeBadge(mat.file_type)}
                      </Text>
                    </View>
                    {course && (
                      <Text style={styles.courseName} numberOfLines={1}>
                        {course.title}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => deleteMaterial(mat._id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.materialTitle}>{mat.title}</Text>

                {mat.content ? (
                  <Text style={styles.materialPreview} numberOfLines={3}>
                    {mat.content.slice(0, 150)}
                    {mat.content.length > 150 ? '...' : ''}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>อัพโหลดเนื้อหา</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>เลือกคอร์ส *</Text>
              <View style={styles.pickerContainer}>
                {courses.map((course) => (
                  <TouchableOpacity
                    key={course._id}
                    style={[
                      styles.pickerItem,
                      formCourseId === course._id && styles.pickerItemActive,
                    ]}
                    onPress={() => setFormCourseId(course._id)}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        formCourseId === course._id && styles.pickerTextActive,
                      ]}
                    >
                      {course.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>ชื่อเรื่อง *</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น: บทที่ 1 – แนะนำ UX Design"
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={styles.inputLabel}>เนื้อหา *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="วางเนื้อหาของบทเรียน หรือสรุปเนื้อหา..."
                value={formContent}
                onChangeText={setFormContent}
                multiline
                numberOfLines={10}
              />

              <Text style={styles.inputLabel}>ประเภทไฟล์</Text>
              <View style={styles.typeButtons}>
                {FILE_TYPES.map((ft) => (
                  <TouchableOpacity
                    key={ft.key}
                    style={[
                      styles.typeButton,
                      formFileType === ft.key && styles.typeButtonActive,
                    ]}
                    onPress={() => setFormFileType(ft.key)}
                  >
                    <Text style={styles.typeEmoji}>{ft.emoji}</Text>
                    <Text
                      style={[
                        styles.typeButtonText,
                        formFileType === ft.key && styles.typeButtonTextActive,
                      ]}
                    >
                      {ft.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={uploadMaterial}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                    <Text style={styles.uploadButtonText}>อัพโหลดเนื้อหา</Text>
                  </>
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
  pillsWrapper: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pillsContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    maxWidth: 160,
  },
  pillActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#fce7f3',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: { flex: 1, padding: SPACING.md },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.lg,
  },
  uploadBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  materialCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  materialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  materialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  courseName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  materialPreview: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
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
  textArea: { minHeight: 150, textAlignVertical: 'top' },
  pickerContainer: { gap: SPACING.sm },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  pickerItemActive: { borderColor: COLORS.primary, backgroundColor: '#fce7f3' },
  pickerText: { fontSize: 14, color: COLORS.textSecondary },
  pickerTextActive: { color: COLORS.primary, fontWeight: '600' },
  typeButtons: { flexDirection: 'row', gap: SPACING.sm },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    gap: 4,
  },
  typeButtonActive: { borderColor: COLORS.primary, backgroundColor: '#fce7f3' },
  typeEmoji: { fontSize: 18 },
  typeButtonText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  typeButtonTextActive: { color: COLORS.primary },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  uploadButtonDisabled: { backgroundColor: COLORS.textTertiary },
  uploadButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
