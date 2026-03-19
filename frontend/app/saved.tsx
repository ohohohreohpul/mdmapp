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

export default function Saved() {
  const router = useRouter();

  const savedCourses = [
    {
      id: '1',
      title: 'Advanced UX Research',
      career: 'UX Design',
      lessons: 18,
      savedDate: '5 มีนาคม 2026',
    },
    {
      id: '2',
      title: 'Python for Data Science',
      career: 'Data Analysis',
      lessons: 24,
      savedDate: '3 มีนาคม 2026',
    },
    {
      id: '3',
      title: 'Social Media Marketing',
      career: 'Digital Marketing',
      lessons: 12,
      savedDate: '1 มีนาคม 2026',
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>บันทึกไว้</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{savedCourses.length} คอร์สที่บันทึกไว้</Text>

        {savedCourses.map((course) => (
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
              <Text style={styles.courseCareer}>{course.career}</Text>
              <Text style={styles.courseMeta}>
                {course.lessons} บทเรียน • บันทึกเมื่อ {course.savedDate}
              </Text>
            </View>
            <TouchableOpacity style={styles.bookmarkButton}>
              <Ionicons name="bookmark" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Empty state hint */}
        <View style={styles.hint}>
          <Ionicons name="bulb-outline" size={20} color="#6B7280" />
          <Text style={styles.hintText}>
            กด <Ionicons name="bookmark-outline" size={14} color="#6B7280" /> บนหน้าคอร์สเพื่อบันทึก
          </Text>
        </View>

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
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
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
    marginBottom: 2,
  },
  courseCareer: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookmarkButton: {
    justifyContent: 'center',
    padding: 8,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#6B7280',
  },
});