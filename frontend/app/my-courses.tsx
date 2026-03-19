import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

export default function MyCourses() {
  const router = useRouter();

  // Demo courses data
  const myCourses = [
    {
      id: '1',
      title: 'UX Design สำหรับผู้เริ่มต้น',
      progress: 65,
      lessons: 12,
      completedLessons: 8,
      lastAccessed: '2 ชั่วโมงที่แล้ว',
    },
    {
      id: '2',
      title: 'Data Analysis เบื้องต้น',
      progress: 30,
      lessons: 15,
      completedLessons: 5,
      lastAccessed: 'เมื่อวาน',
    },
    {
      id: '3',
      title: 'Digital Marketing 101',
      progress: 100,
      lessons: 10,
      completedLessons: 10,
      lastAccessed: '3 วันที่แล้ว',
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>คอร์สของฉัน</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>กำลังเรียน</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>เรียนจบ</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>23</Text>
            <Text style={styles.statLabel}>บทเรียน</Text>
          </View>
        </View>

        {/* Course List */}
        <Text style={styles.sectionTitle}>กำลังเรียน</Text>
        
        {myCourses.map((course) => (
          <TouchableOpacity 
            key={course.id} 
            style={styles.courseCard}
            onPress={() => router.push('/course-detail?id=69b57315fba1910c7610277b')}
          >
            <View style={styles.courseIcon}>
              <Ionicons name="school" size={24} color="#FFF" />
            </View>
            <View style={styles.courseContent}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseSubtitle}>
                {course.completedLessons}/{course.lessons} บทเรียน • {course.lastAccessed}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{course.progress}% เสร็จแล้ว</Text>
            </View>
            {course.progress === 100 && (
              <View style={styles.completeBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  courseIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseContent: {
    flex: 1,
    marginLeft: 12,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  courseSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  completeBadge: {
    marginLeft: 8,
    justifyContent: 'center',
  },
});