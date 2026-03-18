import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { COLORS, SPACING, RADIUS, CAREER_PATHS } from '../../constants/theme';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface DashboardData {
  xp_total: number;
  level_info: { level: number; progress_percent: number; xp_needed: number; xp_in_level: number };
  current_streak: number;
  daily_goal: number;
  today_xp: number;
  daily_progress_percent: number;
  week_activity: Array<{ date: string; xp: number; goal_met: boolean }>;
  badges: Array<{ id: string; name: string; icon: string }>;
  stats: { lessons_completed: number; courses_completed: number };
}

interface Course {
  _id: string;
  title: string;
  description: string;
  career_path: string;
  total_lessons: number;
}

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Grid calculations — 2 columns, percentage-based to avoid overflow
  const gridPadding = SPACING.lg * 2;
  const gridGap = SPACING.sm;
  const cardWidth = (width - gridPadding - gridGap) / 2;

  const fetchData = async () => {
    try {
      const coursesRes = await axios.get(`${API_URL}/api/courses?published_only=true`);
      setCourses(coursesRes.data);
      const shuffled = [...coursesRes.data].sort(() => 0.5 - Math.random());
      setRecommendedCourses(shuffled.slice(0, 6));
      if (user?._id) {
        try {
          const dashRes = await axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`);
          setDashboard(dashRes.data);
        } catch (_) {}
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [user]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getPathColor = (path: string) => CAREER_PATHS.find(p => p.id === path)?.color || COLORS.primary;
  const getPathIcon = (path: string) => CAREER_PATHS.find(p => p.id === path)?.icon || '📚';

  const careerPathsToShow = CAREER_PATHS.filter(p => p.id !== 'all');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Top row */}
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                {user ? `สวัสดี, ${user.display_name || user.username || 'คุณ'}! 👋` : 'สวัสดี! 👋'}
              </Text>
              <Text style={styles.subGreeting}>มาเรียนรู้กันเถอะ</Text>
            </View>
            <View style={styles.statsBadges}>
              <View style={styles.statBadge}>
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statValue}>{dashboard?.current_streak ?? 0}</Text>
              </View>
              <View style={styles.statBadge}>
                <Text style={styles.statIcon}>⚡</Text>
                <Text style={styles.statValue}>{dashboard?.xp_total ?? 0}</Text>
              </View>
              <View style={[styles.statBadge, styles.levelBadge]}>
                <Text style={styles.statIcon}>👑</Text>
                <Text style={[styles.statValue, { color: COLORS.level }]}>
                  {dashboard?.level_info?.level ?? 1}
                </Text>
              </View>
            </View>
          </View>

          {/* Daily goal */}
          <View style={styles.dailyCard}>
            <View style={styles.dailyCardHeader}>
              <Text style={styles.dailyCardTitle}>เป้าหมายวันนี้</Text>
              <Text style={styles.dailyCardXP}>
                {dashboard?.today_xp ?? 0} / {dashboard?.daily_goal ?? 30} XP
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(dashboard?.daily_progress_percent ?? 0, 100)}%` }]} />
            </View>
            {(dashboard?.daily_progress_percent ?? 0) >= 100 && (
              <Text style={styles.goalMet}>🎉 ยินดีด้วย! คุณทำถึงเป้าวันนี้แล้ว</Text>
            )}
          </View>

          {/* Week dots */}
          {dashboard?.week_activity && (
            <View style={styles.weekRow}>
              {dashboard.week_activity.map((day, i) => (
                <View key={i} style={styles.dayCol}>
                  <View style={[styles.dayDot, day.goal_met ? styles.dayDotOn : styles.dayDotOff]}>
                    {day.goal_met && <Ionicons name="checkmark" size={11} color="#fff" />}
                  </View>
                  <Text style={styles.dayLabel}>
                    {['อา','จ','อ','พ','พฤ','ศ','ส'][new Date(day.date).getDay()]}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>

        {/* ── Recommended ── */}
        {recommendedCourses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>เริ่มเรียนเลย</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.seeAll}>ดูทั้งหมด</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {recommendedCourses.map(course => (
                <TouchableOpacity
                  key={course._id}
                  style={styles.hCard}
                  onPress={() => router.push(`/course-detail?id=${course._id}`)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[getPathColor(course.career_path), getPathColor(course.career_path) + 'BB']}
                    style={styles.hCardCover}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.hCardIcon}>{getPathIcon(course.career_path)}</Text>
                  </LinearGradient>
                  <View style={styles.hCardBody}>
                    <Text style={styles.hCardTitle} numberOfLines={2}>{course.title}</Text>
                    <View style={styles.hCardMeta}>
                      <Ionicons name="book-outline" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.hCardMetaText}>{course.total_lessons} บทเรียน</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Career Paths ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>สาขาอาชีพ</Text>
          <View style={styles.grid}>
            {careerPathsToShow.map((path, i) => {
              const isLastOdd = careerPathsToShow.length % 2 !== 0 && i === careerPathsToShow.length - 1;
              return (
                <TouchableOpacity
                  key={path.id}
                  style={[
                    styles.pathCard,
                    { width: cardWidth, borderColor: path.color + '30' },
                    isLastOdd && { marginRight: cardWidth + gridGap },
                  ]}
                  onPress={() => router.push(`/(tabs)/explore?path=${path.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.pathIconWrap, { backgroundColor: path.color + '18' }]}>
                    <Text style={styles.pathEmoji}>{path.icon}</Text>
                  </View>
                  <Text style={styles.pathName} numberOfLines={2}>{path.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Popular Courses ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>คอร์สยอดนิยม</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.seeAll}>ดูทั้งหมด</Text>
            </TouchableOpacity>
          </View>

          {courses.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="school-outline" size={40} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>ยังไม่มีคอร์ส</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {courses.slice(0, 6).map((course, i) => {
                const isLastOdd = courses.slice(0, 6).length % 2 !== 0 && i === Math.min(courses.length, 6) - 1;
                return (
                  <TouchableOpacity
                    key={course._id}
                    style={[styles.courseCard, { width: cardWidth }, isLastOdd && { marginRight: cardWidth + gridGap }]}
                    onPress={() => router.push(`/course-detail?id=${course._id}`)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[getPathColor(course.career_path), getPathColor(course.career_path) + '88']}
                      style={styles.courseCardCover}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.courseCardIcon}>{getPathIcon(course.career_path)}</Text>
                    </LinearGradient>
                    <View style={styles.courseCardBody}>
                      <Text style={styles.courseCardTitle} numberOfLines={2}>{course.title}</Text>
                      <Text style={styles.courseCardMeta}>{course.total_lessons} บทเรียน</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Badges ── */}
        {dashboard?.badges && dashboard.badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>เหรียญรางวัล</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesRow}>
              {dashboard.badges.map((badge, i) => (
                <View key={i} style={styles.badge}>
                  <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                  <Text style={styles.badgeName} numberOfLines={1}>{badge.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  // ── Header
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomLeftRadius: RADIUS.xxl,
    borderBottomRightRadius: RADIUS.xxl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  statsBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 3,
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statIcon: { fontSize: 13 },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Daily card
  dailyCard: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  dailyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  dailyCardTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  dailyCardXP: { fontSize: 13, fontWeight: '700', color: '#fff' },
  progressTrack: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.xp,
    borderRadius: RADIUS.full,
  },
  goalMet: {
    marginTop: SPACING.sm,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Week dots
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayCol: { alignItems: 'center', gap: 3 },
  dayDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotOn: { backgroundColor: COLORS.success },
  dayDotOff: { backgroundColor: 'rgba(255,255,255,0.25)' },
  dayLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },

  // ── Sections
  section: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ── Horizontal scroll cards
  hScrollContent: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  hCard: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  hCardCover: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hCardIcon: { fontSize: 36 },
  hCardBody: { padding: SPACING.sm },
  hCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    minHeight: 34,
  },
  hCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hCardMetaText: { fontSize: 11, color: COLORS.textSecondary },

  // ── 2-col grid (shared by paths + courses)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },

  // Career path cards
  pathCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pathIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  pathEmoji: { fontSize: 22 },
  pathName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },

  // Course cards
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  courseCardCover: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseCardIcon: { fontSize: 30 },
  courseCardBody: { padding: SPACING.sm },
  courseCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
    minHeight: 30,
  },
  courseCardMeta: { fontSize: 11, color: COLORS.textSecondary },

  // Empty
  emptyBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },

  // Badges
  badgesRow: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  badge: {
    alignItems: 'center',
    width: 64,
  },
  badgeEmoji: { fontSize: 30 },
  badgeName: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
