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

export default function AdminMaterials() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fileType, setFileType] = useState('text');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const coursesRes = await axios.get(`${API_URL}/api/courses`);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const openUploadModal = () => {
    setTitle('');
    setContent('');
    setSelectedCourse('');
    setFileType('text');
    setShowModal(true);
  };

  const uploadMaterial = async () => {
    if (!selectedCourse || !title || !content) {
      Alert.alert('ผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/materials`, {
        course_id: selectedCourse,
        title,
        content,
        file_type: fileType,
      });

      Alert.alert('สำเร็จ', 'อัปโหลดเนื้อหาเรียบร้อยแล้ว');
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error uploading material:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถอัปโหลดเนื้อหาได้');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>อัปโหลดเนื้อหา</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openUploadModal}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={48} color="#6366F1" />
          <Text style={styles.infoTitle}>อัปโหลดเนื้อหาสำหรับสร้าง Quiz</Text>
          <Text style={styles.infoText}>
            อัปโหลดเนื้อหาของคอร์ส บทความ หรือสรุปเนื้อหา
            จากนั้น AI จะสามารถสร้างข้อสอบที่เกี่ยวข้องได้อัตโนมัติ
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>วิธีการใช้งาน</Text>
          
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>อัปโหลดเนื้อหา</Text>
              <Text style={styles.stepText}>
                กดปุ่ม + ด้านบนขวา เลือกคอร์ส และวางเนื้อหา
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>ไปสร้าง Quiz</Text>
              <Text style={styles.stepText}>
                ไปที่เมนู "สร้างแบบทดสอบด้วย AI" เลือกเนื้อหาที่อัปโหลด
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>AI สร้างข้อสอบ</Text>
              <Text style={styles.stepText}>
                AI จะวิเคราะห์เนื้อหาและสร้างข้อสอบที่เหมาะสม
              </Text>
            </View>
          </View>
        </View>

        {/* Course Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เนื้อหาที่อัปโหลด</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#6366F1" />
          ) : courses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>สร้างคอร์สก่อนเพื่ออัปโหลดเนื้อหา</Text>
            </View>
          ) : (
            courses.map((course: any) => (
              <TouchableOpacity
                key={course._id}
                style={styles.courseCard}
                onPress={() => {
                  Alert.alert('ข้อมูล', `เนื้อหาสำหรับ: ${course.title}`);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.courseIcon}>
                  <Ionicons name="document-text" size={24} color="#6366F1" />
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.coursePath}>{course.career_path}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>อัปโหลดเนื้อหา</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>เลือกคอร์ส</Text>
              <View style={styles.pickerContainer}>
                {courses.map((course: any) => (
                  <TouchableOpacity
                    key={course._id}
                    style={[
                      styles.pickerItem,
                      selectedCourse === course._id && styles.pickerItemActive,
                    ]}
                    onPress={() => setSelectedCourse(course._id)}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        selectedCourse === course._id && styles.pickerTextActive,
                      ]}
                    >
                      {course.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>ชื่อเรื่อง</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น: บทที่ 1 - การเริ่มต้นกับ UX Design"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>เนื้อหา</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="วางเนื้อหาของบทเรียน หรือสรุปเนื้อหา..."
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={10}
              />

              <Text style={styles.inputLabel}>ประเภทไฟล์</Text>
              <View style={styles.typeButtons}>
                {['text', 'transcript', 'pdf_extracted'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      fileType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setFileType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        fileType === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type === 'text' ? 'ข้อความ' : type === 'transcript' ? 'ทรานสคริปต์' : 'PDF'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.uploadButton} onPress={uploadMaterial}>
                <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>อัปโหลดเนื้อหา</Text>
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
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  coursePath: {
    fontSize: 13,
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
    minHeight: 150,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    gap: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  pickerItemActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  pickerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  pickerTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#6366F1',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
