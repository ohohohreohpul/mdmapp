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
import { useUser } from '../../contexts/UserContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Learning() {
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
        <View style={styles.headerSafe}>
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
      <View style={styles.header}>
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
    backgroundColor: COLORS.background,
  },
  headerSafe: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
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
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  loginButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  loginGradient: {
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  loginButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  browseButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  browseButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  coursesContainer: {
    padding: SPACING.xl,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  courseThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  progressBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  progressBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  courseContent: {},
  courseTitle: {
    ...TYPOGRAPHY.h5,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  courseCareer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  progressInfo: {
    marginBottom: SPACING.md,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xs,
  },
  progressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  continueText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
});