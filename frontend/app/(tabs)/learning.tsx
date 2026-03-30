import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Learning() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEnrolledCourses();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/courses`);
      const allCourses = response.data;
      
      const enrolled = allCourses.filter((course: any) => 
        user?.progress && user.progress[course._id]
      );
      
      setEnrolledCourses(enrolled);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerSafe, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>คอร์สเรียนของฉัน</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="book" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.emptyTitle}>เข้าสู่ระบบเพื่อเรียน</Text>
          <Text style={styles.emptyText}>
            เข้าสู่ระบบเพื่อติดตามความคืบหน้าและบันทึกคอร์สของคุณ
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
        <Text style={styles.headerTitle}>คอร์สเรียนของฉัน</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : enrolledCourses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="book" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.emptyTitle}>ยังไม่มีคอร์สที่เรียน</Text>
            <Text style={styles.emptyText}>
              เริ่มต้นเรียนรู้โดยเลือกคอร์สจากหน้าสำรวจ
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/explore')}
            >
              <Text style={styles.browseButtonText}>สำรวจคอร์ส</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.coursesContainer}>
            {enrolledCourses.map((course) => {
              const progress = user.progress[course._id] || {};
              const completedCount = progress.completed_lessons?.length || 0;
              const percentage =
                course.total_lessons > 0
                  ? Math.round((completedCount / course.total_lessons) * 100)
                  : 0;

              return (
                <TouchableOpacity
                  key={course._id}
                  style={styles.courseCard}
                  onPress={() => router.push(`/course-detail?id=${course._id}`)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.courseThumbnail, { backgroundColor: COLORS.primary }]}>
                    <Ionicons name="school" size={32} color="#FFFFFF" />
                    <View style={styles.progressBadge}>
                      <Text style={styles.progressBadgeText}>{percentage}%</Text>
                    </View>
                  </View>

                  <View style={styles.courseContent}>
                    <Text style={styles.courseTitle} numberOfLines={2}>
                      {course.title}
                    </Text>
                    <Text style={styles.courseCareer}>{course.career_path}</Text>

                    <View style={styles.progressInfo}>
                      <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                      </View>
                      <Text style={styles.progressText}>
                        {completedCount} / {course.total_lessons} บทเรียน
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.continueButton}
                      onPress={() => router.push(`/course-detail?id=${course._id}`)}
                    >
                      <Text style={styles.continueText}>เรียนต่อ</Text>
                      <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerSafe: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: SPACING.lg,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingTop: 80,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#636366',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 6,
  },
  loginGradient: {
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  loginButtonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  browseButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  browseButtonText: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '700',
  },
  coursesContainer: {
    padding: 20,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  courseThumbnail: {
    width: '100%',
    height: 130,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  progressBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  progressBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  courseContent: {},
  courseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  courseCareer: {
    fontSize: 13,
    color: '#636366',
    marginBottom: 14,
  },
  progressInfo: {
    marginBottom: 14,
  },
  progressBarContainer: {
    height: 7,
    backgroundColor: '#F2F2F7',
    borderRadius: 9999,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 9999,
  },
  progressText: {
    fontSize: 13,
    color: '#636366',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    backgroundColor: 'rgba(239,94,168,0.08)',
    borderRadius: 14,
    gap: 6,
  },
  continueText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
});