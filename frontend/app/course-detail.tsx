import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../constants/theme';
import { ComingSoonModal } from './components/ComingSoonModal';
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
  const [practiceModules, setPracticeModules] = useState<any[]>([]);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const hasFetchedRef = useRef(false);

  // Load once on first focus. On return from lesson/quiz, user.progress is already updated
  // in context (via updateProgress), so React re-renders automatically — no need to refetch.
  useFocusEffect(useCallback(() => {
    if (!hasFetchedRef.current) {
      loadCourseData(true);
      hasFetchedRef.current = true;
    }
  }, [courseId, user?._id]));

  const loadCourseData = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const [courseRes, modulesRes] = await Promise.all([
        axios.get(`${API_URL}/api/courses/${courseId}`, { params: user?._id ? { user_id: user._id } : {} }),
        axios.get(`${API_URL}/api/modules/course/${courseId}`),
      ]);

      setCourse(courseRes.data);
      // Show coming-soon modal if course is marked as coming soon
      if (courseRes.data?.is_coming_soon === true) {
        setShowComingSoonModal(true);
      }
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

      // Load practice modules (duolingo content) — optional, won't break if absent
      try {
        const practiceRes = await axios.get(
          `${API_URL}/api/practice/course/${courseId}?user_id=${user?._id || 'demo_user'}`
        );
        setPracticeModules(practiceRes.data || []);
      } catch (_) {
        setPracticeModules([]);
      }

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

  // Find the next lesson the user hasn't completed yet
  const getNextLesson = () => {
    for (const module of modules) {
      for (const lesson of (lessonsMap[module._id] || [])) {
        if (!isLessonCompleted(lesson._id)) return lesson;
      }
    }
    return null; // all done
  };

  const startCourse = () => {
    // Interactive-only course → navigate to practice modules
    if (practiceModules.length > 0 && modules.length === 0) {
      const target = practiceModules.find((pm, idx) => {
        const unlocked = idx === 0 || practiceModules[idx - 1]?.user_completed;
        return unlocked && !pm.user_completed;
      }) || practiceModules[0];
      if (target) {
        router.push(`/duolingo?moduleId=${target.id}&courseId=${courseId}&title=${encodeURIComponent(target.title)}`);
      }
      return;
    }
    // Traditional course
    const next = getNextLesson();
    if (next) {
      router.push(`/lesson?id=${next._id}&courseId=${courseId}`);
    } else if (modules.length > 0 && lessonsMap[modules[0]._id]?.length > 0) {
      // All done — restart from lesson 1
      router.push(`/lesson?id=${lessonsMap[modules[0]._id][0]._id}&courseId=${courseId}`);
    } else {
      alert('คอร์สนี้ยังไม่มีบทเรียน');
    }
  };

  const getUserProgress = () => {
    const completedLessons = user?.progress?.[courseId]?.completed_lessons?.length || 0;
    const completedPractice = practiceModules.filter((m: any) => m.user_completed).length;
    const totalLessons = course?.total_lessons || 0;
    const totalPractice = practiceModules.length;
    const totalUnits = totalLessons + totalPractice;
    const completedUnits = completedLessons + completedPractice;
    const percentage = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
    return { completed: completedUnits, percentage, completedLessons, completedPractice, totalPractice };
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
          <TouchableOpacity style={styles.backButtonFloat} onPress={() => router.replace('/(tabs)/explore')}>
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
  // Detect course type: interactive-only = has practice modules but no traditional lessons
  const isInteractive = practiceModules.length > 0 && modules.length === 0;
  const totalInteractiveQuestions = practiceModules.reduce((s, pm) => s + (pm.question_count || 0), 0);
  const isLocked = course.is_locked === true;
  const isComingSoon = course.is_coming_soon === true;
  const seqOrder = course.sequence_order;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section — Cover Image */}
        <View style={styles.heroSection}>
          {/* Cover image or placeholder */}
          {course.thumbnail ? (
            <Image source={{ uri: course.thumbnail }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={[styles.coverImage, { backgroundColor: COLORS.primary }]} />
          )}

          {/* Back / share buttons float on top of image */}
          <SafeAreaView edges={['top']} style={styles.heroOverlay}>
            <View style={styles.heroHeader}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton}>
                <Ionicons name="share-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Title bar at bottom of image — pointerEvents none so it never blocks the back button */}
          <View style={styles.heroContent} pointerEvents="none">
            <View style={styles.heroBadgeRow}>
              <View style={styles.courseBadge}>
                <Text style={styles.courseBadgeText}>{course.career_path}</Text>
              </View>
              {isInteractive && (
                <View style={[styles.courseBadge, styles.interactiveBadge]}>
                  <Text style={styles.courseBadgeText}>⚡ Interactive</Text>
                </View>
              )}
            </View>
            <Text style={styles.courseTitle} numberOfLines={3}>{course.title}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              {isInteractive ? (
                <>
                  <View style={styles.statItem}>
                    <Ionicons name="grid" size={18} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.statText}>{practiceModules.length} โมดูล</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="flash" size={18} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.statText}>{totalInteractiveQuestions} แบบฝึกหัด</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.statItem}>
                    <Ionicons name="book" size={18} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.statText}>{course.total_lessons} บทเรียน</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="layers" size={18} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.statText}>{modules.length} โมดูล</Text>
                  </View>
                </>
              )}
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
              {isInteractive
                ? `โมดูล ${progress.completedPractice}/${progress.totalPractice} ผ่านแล้ว`
                : `บทเรียน ${progress.completedLessons}/${course.total_lessons}${progress.totalPractice > 0 ? `  ·  แบบฝึกหัด ${progress.completedPractice}/${progress.totalPractice}` : ''}`}
            </Text>
          </View>
        )}

        {/* Start/Continue Button or Locked/Coming Soon Banner */}
        {isComingSoon ? (
          <View style={[styles.lockedBanner, styles.comingSoonBanner]}>
            <View style={styles.comingSoonBannerIcon}>
              <Ionicons name="calendar-outline" size={28} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.lockedBannerTitle, styles.comingSoonTitle]}>Coming Soon</Text>
              <Text style={styles.lockedBannerSub}>
                This course will be available in April 2026
              </Text>
            </View>
          </View>
        ) : isLocked ? (
          <View style={styles.lockedBanner}>
            <View style={styles.lockedBannerIcon}>
              <Ionicons name="lock-closed" size={28} color="#AAAAAA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lockedBannerTitle}>คอร์สนี้ยังล็อกอยู่</Text>
              <Text style={styles.lockedBannerSub}>
                {seqOrder && seqOrder > 1
                  ? `ต้องผ่านคอร์สที่ ${seqOrder - 1} ในเส้นทางนี้ก่อน`
                  : 'ต้องผ่านคอร์สก่อนหน้าก่อน'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.startButton} onPress={startCourse}>
              <View style={styles.startButtonInner}>
                <Ionicons
                  name={progress.completed > 0 ? "play" : isInteractive ? "flash" : "rocket"}
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.startButtonText}>
                  {progress.completed > 0
                    ? (isInteractive ? 'ฝึกต่อ' : 'เรียนต่อ')
                    : (isInteractive ? 'เริ่มฝึกทักษะ' : 'เริ่มเรียน')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* About this course */}
        {course.description ? (
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>เกี่ยวกับคอร์สนี้</Text>
            <Text style={styles.aboutText}>{stripHtml(course.description)}</Text>
          </View>
        ) : null}

        {/* ── Unified Curriculum Section (all course types) ── */}
        <View style={styles.curriculumSection}>
          <Text style={styles.sectionTitle}>หลักสูตร</Text>

          {modules.length === 0 && practiceModules.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>ยังไม่มีเนื้อหาในคอร์สนี้</Text>
            </View>
          ) : (
            <>
              {/* Render traditional video modules */}
              {modules.map((module, index) => {
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
              })}

              {/* Render practice modules as collapsible module cards (same style as video modules) */}
              {practiceModules.map((pm, idx) => {
                const unlocked = idx === 0 || practiceModules[idx - 1]?.user_completed;
                const moduleIndex = modules.length + idx;
                const isExpanded = expandedModules.includes(`practice-${pm.id}`);

                return (
                  <View key={`practice-${pm.id}`} style={styles.moduleCard}>
                    <TouchableOpacity
                      style={styles.moduleHeader}
                      onPress={() => unlocked && toggleModule(`practice-${pm.id}`)}
                      activeOpacity={unlocked ? 0.7 : 1}
                    >
                      <View style={styles.moduleLeft}>
                        <View style={[styles.moduleNumber, {
                          backgroundColor: pm.user_completed ? COLORS.success : unlocked ? COLORS.primary : '#9CA3AF'
                        }]}>
                          {pm.user_completed
                            ? <Ionicons name="checkmark" size={18} color="#fff" />
                            : unlocked
                            ? <Text style={styles.moduleNumberText}>{moduleIndex + 1}</Text>
                            : <Ionicons name="lock-closed" size={16} color="#fff" />}
                        </View>
                        <View style={styles.moduleInfo}>
                          <Text style={[styles.moduleTitle, !unlocked && { opacity: 0.6 }]}>
                            {pm.title}
                          </Text>
                          <Text style={[styles.moduleSubtitle, !unlocked && { opacity: 0.6 }]}>
                            {pm.question_count} คำถาม
                            {pm.user_completed && ` • ✅ ผ่านแล้ว (${pm.user_best_score}%)`}
                            {!pm.user_completed && pm.user_attempts > 0 && ` • ลองแล้ว ${pm.user_attempts} ครั้ง`}
                            {!unlocked && ' • 🔒 ทำโมดูลก่อนหน้าให้ผ่านก่อน'}
                          </Text>
                        </View>
                      </View>
                      {unlocked && (
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={24}
                          color={COLORS.textSecondary}
                        />
                      )}
                      {!unlocked && (
                        <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>

                    {isExpanded && unlocked && (
                      <View style={styles.lessonsContainer}>
                        <TouchableOpacity
                          style={styles.lessonItem}
                          onPress={() => router.push(
                            `/duolingo?moduleId=${pm.id}&courseId=${courseId}&title=${encodeURIComponent(pm.title)}`
                          )}
                        >
                          <View style={[styles.lessonIcon, pm.user_completed && styles.lessonIconCompleted]}>
                            {pm.user_completed ? (
                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            ) : (
                              <Ionicons name="play-circle" size={16} color="#FFFFFF" />
                            )}
                          </View>
                          <View style={styles.lessonInfo}>
                            <Text style={[styles.lessonTitle, pm.user_completed && styles.lessonTitleCompleted]}>
                              {pm.title}
                            </Text>
                            <View style={styles.lessonMeta}>
                              <Ionicons
                                name="help-circle"
                                size={14}
                                color={COLORS.textTertiary}
                              />
                              <Text style={styles.lessonMetaText}>
                                {pm.question_count} คำถาม
                                {pm.user_completed && ` • ${pm.user_best_score}%`}
                              </Text>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </View>

        {/* What You'll Learn */}
        <View style={styles.learnSection}>
          <Text style={styles.sectionTitle}>สิ่งที่คุณจะได้เรียนรู้</Text>
          <View style={styles.learnCard}>
            {isInteractive ? (
              <>
                <View style={styles.learnItem}>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                  <Text style={styles.learnText}>เรียนรู้แบบ Interactive ด้วย {totalInteractiveQuestions} แบบฝึกหัด</Text>
                </View>
                <View style={styles.learnItem}>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                  <Text style={styles.learnText}>ฝึกคิดวิเคราะห์ผ่านสถานการณ์จริงและโจทย์หลากหลายรูปแบบ</Text>
                </View>
                <View style={styles.learnItem}>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                  <Text style={styles.learnText}>ได้รับ Feedback ทันทีหลังตอบแต่ละข้อ</Text>
                </View>
                <View style={styles.learnItem}>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                  <Text style={styles.learnText}>เข้าถึงได้ตลอดเวลา ทุกที่ ทุกอุปกรณ์</Text>
                </View>
              </>
            ) : (
              <>
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
              </>
            )}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Coming Soon Modal */}
      <ComingSoonModal
        visible={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
        courseName={course?.title || ''}
        releaseDate="April 2026"
      />
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
    position: 'relative',
    paddingBottom: 50,
  },
  coverImage: {
    width: '100%',
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,      // always above heroContent
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,   // extra top padding so button never clips on any device
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: 50,
    top: 80,           // never encroach above the back button area
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    justifyContent: 'flex-end', // pin content to the bottom of this box
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
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 20,
  },
  lockedBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EBEBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#888888',
    marginBottom: 4,
  },
  lockedBannerSub: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  comingSoonBanner: {
    backgroundColor: COLORS.primary + '08',
    borderColor: COLORS.primary + '30',
  },
  comingSoonBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonTitle: {
    color: COLORS.primary,
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
  aboutSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#F3F4F6',
  },
  aboutText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 26,
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
  // ── Hero badge row ──────────────────────────────────────────────────────────
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  interactiveBadge: {
    backgroundColor: 'rgba(239,94,168,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  // ── Learning Path section ────────────────────────────────────────────────────
  pathSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  pathSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 8,
  },
  pathProgressChip: {
    backgroundColor: COLORS.primary + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pathProgressChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pathNodeWrapper: {
    position: 'relative',
    paddingLeft: 28,      // space for the connector line
    marginBottom: SPACING.sm,
  },
  pathConnector: {
    position: 'absolute',
    left: 19,             // center of the 40px node (pathSection paddingLeft = 28, node center at 28-8=20… adjust)
    top: 52,              // below the node
    width: 2,
    bottom: -SPACING.sm,
    backgroundColor: '#E5E7EB',
    zIndex: 0,
  },
  pathConnectorDone: {
    backgroundColor: COLORS.success,
  },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.small,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
    zIndex: 1,
  },
  pathCardDone: {
    borderLeftColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  pathCardCurrent: {
    borderLeftColor: COLORS.primary,
    backgroundColor: '#FFF5FB',
  },
  pathCardLocked: {
    opacity: 0.5,
  },
  pathNode: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  pathNodeDone: {
    backgroundColor: COLORS.success,
  },
  pathNodeCurrent: {
    backgroundColor: COLORS.primary,
  },
  pathNodeLocked: {
    backgroundColor: '#9CA3AF',
  },
  pathNodeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pathCardBody: {
    flex: 1,
  },
  pathCardTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pathCardTitleLocked: {
    color: COLORS.textTertiary,
  },
  pathCardMeta: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pathCurrentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '18',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
  },
  pathCurrentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pathScoreBig: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.success,
    flexShrink: 0,
  },
});
