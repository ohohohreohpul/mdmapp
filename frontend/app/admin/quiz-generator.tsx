import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function QuizGenerator() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState<{[key: string]: any[]}>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const coursesRes = await axios.get(`${API_URL}/api/courses`);
      setCourses(coursesRes.data);

      // Load materials for each course
      const materialsData: {[key: string]: any[]} = {};
      for (const course of coursesRes.data) {
        try {
          const materialsRes = await axios.get(`${API_URL}/api/materials/course/${course._id}`);
          materialsData[course._id] = materialsRes.data;
        } catch (err) {
          materialsData[course._id] = [];
        }
      }
      setMaterials(materialsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async (materialId: string, materialTitle: string) => {
    Alert.alert(
      'สร้างแบบทดสอบ',
      `คุณต้องการใช้ AI สร้างข้อสอบจาก\n"${materialTitle}"\n\nจำนวนข้อสอบที่ต้องการ:`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: '5 ข้อ',
          onPress: () => performGeneration(materialId, 5),
        },
        {
          text: '10 ข้อ',
          onPress: () => performGeneration(materialId, 10),
        },
        {
          text: '15 ข้อ',
          onPress: () => performGeneration(materialId, 15),
        },
      ]
    );
  };

  const performGeneration = async (materialId: string, numQuestions: number) => {
    try {
      setGenerating(true);
      setSelectedMaterial(materialId);

      const response = await axios.post(
        `${API_URL}/api/quizzes/generate?material_id=${materialId}&num_questions=${numQuestions}`
      );

      Alert.alert(
        'การสร้างข้อสอบ',
        response.data.message || 'การสร้างข้อสอบด้วย AI จะถูกพัฒนาในเวอร์ชั่นถัดไป'
      );
    } catch (error) {
      console.error('Error generating quiz:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถสร้างข้อสอบได้');
    } finally {
      setGenerating(false);
      setSelectedMaterial(null);
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
          <Text style={styles.headerTitle}>AI Quiz Generator</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="sparkles" size={48} color="#F59E0B" />
          <Text style={styles.infoTitle}>สร้างข้อสอบด้วย AI</Text>
          <Text style={styles.infoText}>
            เลือกเนื้อหาจากด้านล่าง แล้ว AI จะสร้างข้อสอบ
            ที่เหมาะสมพร้อมรูปภาพประกอบ (ถ้ามี)
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>สร้างคอร์สและอัปโหลดเนื้อหาก่อน</Text>
          </View>
        ) : (
          courses.map((course: any) => {
            const courseMaterials = materials[course._id] || [];
            return (
              <View key={course._id} style={styles.courseSection}>
                <View style={styles.courseSectionHeader}>
                  <View style={styles.courseIcon}>
                    <Ionicons name="school" size={24} color="#6366F1" />
                  </View>
                  <View style={styles.courseHeaderInfo}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseSubtitle}>
                      {courseMaterials.length} เนื้อหา
                    </Text>
                  </View>
                </View>

                {courseMaterials.length === 0 ? (
                  <View style={styles.noMaterialsCard}>
                    <Ionicons name="document-text" size={32} color="#D1D5DB" />
                    <Text style={styles.noMaterialsText}>
                      ยังไม่มีเนื้อหาสำหรับคอร์สนี้
                    </Text>
                    <Text style={styles.noMaterialsSubtext}>
                      อัปโหลดเนื้อหาก่อนเพื่อสร้าง Quiz
                    </Text>
                  </View>
                ) : (
                  courseMaterials.map((material: any) => (
                    <View key={material._id} style={styles.materialCard}>
                      <View style={styles.materialInfo}>
                        <Ionicons name="document" size={20} color="#6B7280" />
                        <View style={styles.materialText}>
                          <Text style={styles.materialTitle}>{material.title}</Text>
                          <Text style={styles.materialType}>
                            {material.file_type === 'text'
                              ? 'ข้อความ'
                              : material.file_type === 'transcript'
                              ? 'ทรานสคริปต์'
                              : 'PDF'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.generateButton,
                          generating && selectedMaterial === material._id && styles.generatingButton,
                        ]}
                        onPress={() => generateQuiz(material._id, material.title)}
                        disabled={generating}
                      >
                        {generating && selectedMaterial === material._id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                            <Text style={styles.generateButtonText}>สร้าง Quiz</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
  content: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#FFFBEB',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FDE68A',
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
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  courseSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  courseSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  courseHeaderInfo: {
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
  },
  noMaterialsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  noMaterialsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  noMaterialsSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  materialInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  materialText: {
    flex: 1,
    marginLeft: 12,
  },
  materialTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  materialType: {
    fontSize: 13,
    color: '#6B7280',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  generatingButton: {
    backgroundColor: '#9CA3AF',
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
