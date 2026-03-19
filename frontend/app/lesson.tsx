import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import { useUser } from '../contexts/UserContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../constants/theme';
import { cleanWordPressContent, stripHtml } from '../utils/contentUtils';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

export default function LessonView() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lessonId = params.id as string;
  const courseId = params.courseId as string;
  const { user, updateProgress, getUserProgress } = useUser();

  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoStatus, setVideoStatus] = useState<any>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  useEffect(() => {
    // Check if lesson is already completed
    if (user && courseId) {
      const progress = getUserProgress(courseId);
      setIsCompleted(progress?.completed_lessons?.includes(lessonId) || false);
    }
  }, [user, courseId, lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/lessons/${lessonId}`);
      setLesson(response.data);
    } catch (err) {
      console.error('Error loading lesson:', err);
      setError('ไม่สามารถโหลดบทเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  const markAsComplete = async () => {
    if (!user) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบเพื่อบันทึกความคืบหน้า', [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'เข้าสู่ระบบ', onPress: () => router.push('/auth') }
      ]);
      return;
    }

    if (!courseId) {
      Alert.alert('สำเร็จ', 'ทำเครื่องหมายบทเรียนเสร็จแล้ว');
      setIsCompleted(true);
      return;
    }

    try {
      await updateProgress(courseId, lessonId);
      setIsCompleted(true);
      Alert.alert('🎉 เยี่ยมมาก!', 'คุณเรียนจบบทเรียนนี้แล้ว');
    } catch (error) {
      console.error('Error marking complete:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกความคืบหน้าได้');
    }
  };

  const goToQuiz = () => {
    if (lesson?.has_quiz) {
      // replace (not push) so quiz takes lesson's slot in stack —
      // then router.back() from quiz goes directly to course-detail (no double-back)
      router.replace(`/quiz?lessonId=${lessonId}&courseId=${courseId}`);
    } else {
      Alert.alert('แจ้งเตือน', 'บทเรียนนี้ยังไม่มีแบบทดสอบ');
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return 'play-circle';
      case 'audio': return 'headset';
      default: return 'document-text';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>กำลังโหลดบทเรียน...</Text>
        </View>
      </View>
    );
  }

  if (error || !lesson) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.errorContainer}>
          <TouchableOpacity style={styles.backButtonFloat} onPress={() => router.canGoBack() ? router.back() : router.replace(`/course-detail?id=${courseId}`)}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorText}>{error || 'ไม่พบบทเรียน'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLesson}>
            <Text style={styles.retryButtonText}>ลองอีกครั้ง</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {lesson.title}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {isCompleted && (
              <View style={styles.completedIcon}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Video Content */}
        {lesson.content_type === 'video' && (
          <View style={styles.videoContainer}>
            {lesson.video_url ? (
              <Video
                source={{ uri: lesson.video_url }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                onPlaybackStatusUpdate={(status) => setVideoStatus(status)}
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <View style={[styles.placeholderIcon, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="videocam" size={48} color="#FFFFFF" />
                </View>
                <Text style={styles.placeholderText}>วิดีโอจะพร้อมใช้งานเร็วๆ นี้</Text>
                <Text style={styles.placeholderSubtext}>กรุณาใส่ Bunny.net URL ใน Admin</Text>
              </View>
            )}
          </View>
        )}

        {/* Article Content */}
        {lesson.content_type === 'article' && (
          <View style={styles.articleContainer}>
            <View style={styles.articleHeader}>
              <View style={[styles.articleIcon, { backgroundColor: COLORS.primary }]}>
                <Ionicons name="document-text" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.articleTitleContainer}>
                <Text style={styles.articleTitle}>{lesson.title}</Text>
                {lesson.duration_minutes > 0 && (
                  <Text style={styles.articleDuration}>
                    <Ionicons name="time" size={14} color={COLORS.textSecondary} /> {lesson.duration_minutes} นาที
                  </Text>
                )}
              </View>
            </View>
            
            {lesson.audio_url && (
              <TouchableOpacity style={styles.podcastButton}>
                <View style={[styles.podcastGradient, { backgroundColor: '#6366F1' }]}>
                  <Ionicons name="headset" size={20} color="#FFFFFF" />
                  <Text style={styles.podcastButtonText}>ฟังเป็น Podcast</Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.articleContent}>
              {lesson.article_content ? (
                <RenderHtml
                  contentWidth={width - 64}
                  source={{ html: `<div>${cleanWordPressContent(lesson.article_content)}</div>` }}
                  tagsStyles={{
                    div: { color: COLORS.textPrimary, fontSize: 16, lineHeight: 28 },
                    p: { marginBottom: 16 },
                    h1: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, color: COLORS.textPrimary },
                    h2: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: COLORS.textPrimary },
                    h3: { fontSize: 18, fontWeight: '600', marginBottom: 8, color: COLORS.textPrimary },
                    li: { marginBottom: 8 },
                  }}
                />
              ) : (
                <Text style={styles.articleText}>{stripHtml(lesson.description)}</Text>
              )}
            </View>
          </View>
        )}

        {/* Audio/Podcast Content */}
        {lesson.content_type === 'audio' && (
          <View style={styles.audioContainer}>
            <View style={[styles.podcastHeader, { backgroundColor: COLORS.primary }]}>
              <View style={styles.podcastIconContainer}>
                <Ionicons name="headset" size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.podcastTitle}>{lesson.title}</Text>
              <View style={styles.podcastBadge}>
                <Text style={styles.podcastBadgeText}>Podcast Mode</Text>
              </View>
            </View>

            {lesson.audio_url ? (
              <View style={styles.audioPlayer}>
                <TouchableOpacity 
                  style={styles.playButton}
                  onPress={() => setIsPlaying(!isPlaying)}
                >
                  <View style={[styles.playGradient, { backgroundColor: COLORS.primary }]}>
                    <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <View style={styles.audioProgressContainer}>
                  <View style={styles.audioProgress}>
                    <View style={[styles.audioProgressBar, { width: '30%' }]} />
                  </View>
                  <View style={styles.audioTimeRow}>
                    <Text style={styles.audioTime}>0:00</Text>
                    <Text style={styles.audioTime}>{lesson.duration_minutes}:00</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.audioPlaceholder}>
                <Ionicons name="mic" size={48} color={COLORS.textTertiary} />
                <Text style={styles.placeholderText}>Audio กำลังสร้าง...</Text>
                <Text style={styles.placeholderSubtext}>ใช้ ElevenLabs สร้าง TTS</Text>
              </View>
            )}
          </View>
        )}

        {/* Lesson Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={22} color={COLORS.primary} />
            <Text style={styles.infoTitle}>เกี่ยวกับบทเรียนนี้</Text>
          </View>
          <Text style={styles.infoDescription}>{stripHtml(lesson.description)}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name={getContentIcon(lesson.content_type)} size={18} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>
                {lesson.content_type === 'video' ? 'วิดีโอ' : lesson.content_type === 'audio' ? 'เสียง' : 'บทความ'}
              </Text>
            </View>
            {lesson.duration_minutes > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="time" size={18} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{lesson.duration_minutes} นาที</Text>
              </View>
            )}
            {lesson.has_quiz && (
              <View style={styles.metaItem}>
                <Ionicons name="checkbox" size={18} color={COLORS.success} />
                <Text style={[styles.metaText, { color: COLORS.success }]}>มีแบบทดสอบ</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {!isCompleted ? (
            <TouchableOpacity style={styles.completeButton} onPress={markAsComplete}>
              <View style={[styles.completeGradient, { backgroundColor: COLORS.success }]}>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.completeButtonText}>ทำเครื่องหมายว่าเสร็จแล้ว</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.completedText}>🎉 เรียนจบแล้ว</Text>
            </View>
          )}

          {lesson.has_quiz && (
            <TouchableOpacity style={styles.quizButton} onPress={goToQuiz}>
              <Ionicons name="clipboard" size={22} color={COLORS.primary} />
              <Text style={styles.quizButtonText}>ทำแบบทดสอบ</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom padding */}
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
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
  },
  completedIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
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
  videoContainer: {
    backgroundColor: '#000000',
    aspectRatio: 16 / 9,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  placeholderText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  placeholderSubtext: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  articleContainer: {
    padding: SPACING.xl,
    backgroundColor: '#FFFFFF',
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  articleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleTitleContainer: {
    flex: 1,
  },
  articleTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
  },
  articleDuration: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  podcastButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  podcastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: SPACING.sm,
  },
  podcastButtonText: {
    ...TYPOGRAPHY.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  articleContent: {
    paddingTop: SPACING.md,
  },
  articleText: {
    ...TYPOGRAPHY.body,
    lineHeight: 28,
    color: COLORS.textPrimary,
  },
  audioContainer: {
    backgroundColor: '#FFFFFF',
  },
  podcastHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  podcastIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  podcastTitle: {
    ...TYPOGRAPHY.h4,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  podcastBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  podcastBadgeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  audioPlayer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  playButton: {
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  playGradient: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioProgressContainer: {
    width: '100%',
  },
  audioProgress: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
    overflow: 'hidden',
  },
  audioProgressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  audioTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  audioTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  audioPlaceholder: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  infoCard: {
    margin: SPACING.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  infoTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  infoDescription: {
    ...TYPOGRAPHY.body,
    lineHeight: 24,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  actionSection: {
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  completeButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  completeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: SPACING.sm,
  },
  completeButtonText: {
    ...TYPOGRAPHY.bodyLarge,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 18,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  completedText: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.success,
    fontWeight: '600',
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  quizButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
});
