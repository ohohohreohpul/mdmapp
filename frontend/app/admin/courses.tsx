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
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [careerPath, setCareerPath] = useState('UX Design');

  const careerPaths = ['UX Design', 'Data Analysis', 'Digital Marketing', 'Project Management'];

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
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
    } catch (error) {
      console.error('Error saving course:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกคอร์สได้');
    }
  };

  const togglePublish = async (course: any) => {
    try {
      await axios.put(`${API_URL}/api/courses/${course._id}`, {
        is_published: !course.is_published,
      });
      loadCourses();
    } catch (error) {
      console.error('Error toggling publish:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  const deleteCourse = async (courseId: string) => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณแน่ใจหรือไม่ที่จะลบคอร์สนี้?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/courses/${courseId}`);
              Alert.alert('สำเร็จ', 'ลบคอร์สเรียบร้อยแล้ว');
              loadCourses();
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('ผิดพลาด', 'ไม่สามารถลบคอร์สได้');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>จัดการคอร์ส</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>ยังไม่มีคอร์ส</Text>
            <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
              <Text style={styles.createButtonText}>สร้างคอร์สแรก</Text>
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
                      <Ionicons name="book" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{course.total_lessons} บทเรียน</Text>
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
                  onPress={() => router.push(`/admin/course-modules?id=${course._id}`)}
                >
                  <Ionicons name="list" size={20} color="#6366F1" />
                  <Text style={styles.actionText}>โมดูล</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(course)}>
                  <Ionicons name="create" size={20} color="#10B981" />
                  <Text style={styles.actionText}>แก้ไข</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => togglePublish(course)}>
                  <Ionicons
                    name={course.is_published ? 'eye-off' : 'eye'}
                    size={20}
                    color="#F59E0B"
                  />
                  <Text style={styles.actionText}>{course.is_published ? 'ซ่อน' : 'เผยแพร่'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={() => deleteCourse(course._id)}>
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <Text style={styles.actionText}>ลบ</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'สร้างคอร์สใหม่' : 'แก้ไขคอร์ส'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  createButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  courseHeader: {
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  courseSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  publishedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publishedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  courseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pathButtons: {
    gap: 8,
  },
  pathButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  pathButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  pathButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  pathButtonTextActive: {
    color: '#6366F1',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});