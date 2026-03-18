import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../constants/theme';
import { stripHtml, getExcerpt } from '../utils/contentUtils';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CourseDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const courseId = params.id as string;
  const { user } = useUser();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [lessonsMap, setLessonsMap] = useState<{[key: string]: any[]}>({});

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, modulesRes] = await Promise.all([
        axios.get(`${API_URL}/api/courses/${courseId}`),
        axios.get(`${API_URL}/api/modules/course/${courseId}`),
      ]);

      setCourse(courseRes.data);
      setModules(modulesRes.data);
      
      // Load lessons for each module
      const lessonsData: {[key: string]: any[]} = {};
      for (const module of modulesRes.data) {
        try {
          const lessonsRes = await axios.get(`${API_URL}/api/lessons/module/${module._id}`);
          lessonsData[module._id] = lessonsRes.data;
        } catch (e) {
          lessonsData[module._id] = [];
        }
      }
      setLessonsMap(lessonsData);
      
    } catch (err) {
      console.error('Error loading course:', err);
      setError('ไม่สามารถโหลดข้อมูลคอร์สได้');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const startCourse = () => {
    if (modules.length > 0 && lessonsMap[modules[0]._id]?.length > 0) {
      router.push(`/lesson?id=${lessonsMap[modules[0]._id][0]._id}&courseId=${courseId}`);
    } else {
      alert('คอร์สนี้ยังไม่มีบทเรียน');
    }
  };

  const getUserProgress = () => {
    if (!user?.progress || !user.progress[courseId]) return { completed: 0, percentage: 0 };
    const completed = user.progress[courseId].completed_lessons?.length || 0;
    const percentage = course?.total_lessons > 0 
      ? Math.round((completed / course.total_lessons) * 100) 
      : 0;
    return { completed, percentage };
  };

  const isLessonCompleted = (lessonId: string) => {
    return user?.progress?.[courseId]?.completed_lessons?.includes(lessonId) || false;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.errorContainer}>
          <TouchableOpacity style={styles.backButtonFloat} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'ไม่พบคอร์ส'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCourseData}>
            <Text style={styles.retryButtonText}>ลองอีกครั้ง</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const progress = getUserProgress();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section with Solid Pink */}
        <View style={styles.heroSection}>
          <SafeAreaView edges={['top']}>
            <View style={styles.heroHeader}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={styles.heroContent}>
            <View style={styles.courseBadge}>
              <Text style={styles.courseBadgeText}>{course.career_path}</Text>
            </View>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseDescription}>{stripHtml(course.description)}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="book" size={18} color="rgba(255,255,255,0.9)" />
                <Text style={styles.statText}>{course.total_lessons} บทเรียน</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="layers" size={18} color="rgba(255,255,255,0.9)" />
                <Text style={styles.statText}>{modules.length} โมดูล</Text>
              </View>
              {course.has_final_exam && (
                <View style={styles.statItem}>
                  <Ionicons name="ribbon" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.statText}>มีใบประกาศ</Text>
                </View>
              )}
            </View>
          </View>

          {/* Wave */}
          <View style={styles.waveContainer}>
            <View style={styles.wave} />
          </View>
        </View>

        {/* Progress Card (if enrolled) */}
        {progress.completed > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>ความคืบหน้าของคุณ</Text>
              <Text style={styles.progressPercentage}>{progress.percentage}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress.percentage}%` }]} />
            </View>
            <Text style={styles.progressSubtext}>
              เรียนแล้ว {progress.completed} จาก {course.total_lessons} บทเรียน
            </Text>
          </View>
        )}

        {/* Start/Continue Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.startButton} onPress={startCourse}>
            <View style={styles.startButtonInner}>
              <Ionicons name={progress.completed > 0 ? "play" : "rocket"} size={24} color="#FFFFFF" />
              <Text style={styles.startButtonText}>
                {progress.completed > 0 ? 'เรียนต่อ' : 'เริ่มเรียน'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Curriculum Section */}
        <View style={styles.curriculumSection}>
          <Text style={styles.sectionTitle}>หลักสูตร</Text>

          {modules.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>ยังไม่มีเนื้อหาในคอร์สนี้</Text>
            </View>
          ) : (
            modules.map((module, index) => {
              const isExpanded = expandedModules.includes(module._id);
              const moduleLessons = lessonsMap[module._id] || [];
              const completedInModule = moduleLessons.filter(l => isLessonCompleted(l._id)).length;

              return (
                <View key={module._id} style={styles.moduleCard}>
                  <TouchableOpacity 
                    style={styles.moduleHeader}
                    onPress={() => toggleModule(module._id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.moduleLeft}>
                      <View style={[styles.moduleNumber, { backgroundColor: index === 0 ? COLORS.primary : '#6366F1' }]}>
                        <Text style={styles.moduleNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.moduleInfo}>
                        <Text style={styles.moduleTitle}>{module.title}</Text>
                        <Text style={styles.moduleSubtitle}>
                          {moduleLessons.length} บทเรียน
                          {completedInModule > 0 && ` • ${completedInModule} เสร็จแล้ว`}
                        </Text>
                      </View>
                    </View>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color={COLORS.textSecondary} 
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.lessonsContainer}>
                      {moduleLessons.length === 0 ? (
                        <Text style={styles.noLessonsText}>ยังไม่มีบทเรียน</Text>
                      ) : (
                        moduleLessons.map((lesson, lessonIndex) => {
                          const completed = isLessonCompleted(lesson._id);
                          return (
                            <TouchableOpacity
                              key={lesson._id}
                              style={styles.lessonItem}
                              onPress={() => router.push(`/lesson?id=${lesson._id}&courseId=${courseId}`)}
                            >
                              <View style={[styles.lessonIcon, completed && styles.lessonIconCompleted]}>
                                {completed ? (
                                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                ) : (
                                  <Text style={styles.lessonIndexText}>{lessonIndex + 1}</Text>
                                )}
                              </View>
                              <View style={styles.lessonInfo}>
                                <Text style={[styles.lessonTitle, completed && styles.lessonTitleCompleted]}>
                                  {lesson.title}
                                </Text>
                                <View style={styles.lessonMeta}>
                                  <Ionicons 
                                    name={lesson.content_type === 'video' ? 'play-circle' : lesson.content_type === 'audio' ? 'headset' : 'document-text'} 
                                    size={14} 
                                    color={COLORS.textTertiary} 
                                  />
                                  <Text style={styles.lessonMetaText}>
                                    {lesson.content_type === 'video' ? 'วิดีโอ' : lesson.content_type === 'audio' ? 'เสียง' : 'บทความ'}
                                    {lesson.duration_minutes > 0 && ` • ${lesson.duration_minutes} นาที`}
                                  </Text>
                                </View>
                              </View>
                              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* What You'll Learn */}
        <View style={styles.learnSection}>
          <Text style={styles.sectionTitle}>สิ่งที่คุณจะได้เรียนรู้</Text>
          <View style={styles.learnCard}>
            <View style={styles.learnItem}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              <Text style={styles.learnText}>เนื้อหาครบถ้วนสำหรับเริ่มต้นอาชีพ {course.career_path}</Text>
            </View>
            <View style={styles.learnItem}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              <Text style={styles.learnText}>แบบทดสอบทุกบทเรียนเพื่อวัดความเข้าใจ</Text>
            </View>
            {course.has_final_exam && (
              <View style={styles.learnItem}>
                <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                <Text style={styles.learnText}>สอบปลายภาคและรับใบประกาศนียบัตร</Text>
              </View>
            )}
            <View style={styles.learnItem}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
              <Text style={styles.learnText}>เข้าถึงเนื้อหาได้ตลอดชีวิต</Text>
            </View>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  backButtonFloat: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
  },
  retryButtonText: {
    ...TYPOGRAPHY.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroSection: {
    paddingBottom: 50,
    backgroundColor: COLORS.primary,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  courseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  courseBadgeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  courseTitle: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  courseDescription: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    overflow: 'hidden',
  },
  wave: {
    width: '100%',
    height: 60,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  progressCard: {
    marginHorizontal: SPACING.xl,
    marginTop: -SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  progressPercentage: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xs,
  },
  progressSubtext: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  actionSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  startButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  startButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: SPACING.sm,
  },
  startButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  curriculumSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  moduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moduleNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  moduleNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  moduleSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  lessonsContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    paddingVertical: SPACING.sm,
  },
  noLessonsText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  lessonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  lessonIconCompleted: {
    backgroundColor: COLORS.success,
  },
  lessonIndexText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
  },
  lessonTitleCompleted: {
    color: COLORS.textSecondary,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lessonMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
  learnSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  learnCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  learnItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  learnText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
});
