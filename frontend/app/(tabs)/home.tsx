import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
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

interface Announcement {
  id: string;
  title: string;
  body: string;
  color: string;
  icon: string;
  link?: string;
}

interface Article {
  id: string;
  title: string;
  category: string;
  read_time: number;
  cover_emoji: string;
  cover_color: string;
  url?: string;
}

// ─── Placeholder data until backend endpoints exist ─────────────────────────
const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'ยินดีต้อนรับสู่ Mydemy! 🎉',
    body: 'เราพร้อมช่วยคุณพัฒนาทักษะด้วยคอร์สออนไลน์คุณภาพสูง',
    color: '#ef5ea8',
    icon: '📣',
  },
  {
    id: '2',
    title: 'คอร์สใหม่มาแล้ว!',
    body: 'เปิดตัวคอร์ส UX/UI Design ฉบับสมบูรณ์ สมัครได้เลยวันนี้',
    color: '#d94d94',
    icon: '🆕',
  },
];

const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: '5 เครื่องมือ UX ที่นักออกแบบมืออาชีพใช้ในปี 2024',
    category: 'UX/UI Design',
    read_time: 5,
    cover_emoji: '🎨',
    cover_color: '#E91E8C',
  },
  {
    id: '2',
    title: 'เริ่มต้น Data Analysis ด้วย Python ใน 30 วัน',
    category: 'Data Analysis',
    read_time: 8,
    cover_emoji: '📊',
    cover_color: '#2563EB',
  },
  {
    id: '3',
    title: 'วิธีเพิ่มยอดขายด้วย Digital Marketing ฟรี',
    category: 'Digital Marketing',
    read_time: 6,
    cover_emoji: '📱',
    cover_color: '#059669',
  },
  {
    id: '4',
    title: 'Project Management: วิธีส่งงานตรงเวลาทุกครั้ง',
    category: 'Project Management',
    read_time: 4,
    cover_emoji: '📋',
    cover_color: '#D97706',
  },
];

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [loading, setLoading] = useState(true);

  // Grid — 2 columns, no overflow
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

      // Future: load real announcements & articles
      // try {
      //   const annRes = await axios.get(`${API_URL}/api/announcements`);
      //   setAnnouncements(annRes.data);
      // } catch (_) {}
      // try {
      //   const artRes = await axios.get(`${API_URL}/api/articles`);
      //   setArticles(artRes.data);
      // } catch (_) {}
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch every time the tab is focused so XP/streak updates appear immediately
  useFocusEffect(useCallback(() => { fetchData(); }, [user?._id]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getPathColor = (path: string) => CAREER_PATHS.find(p => p.id === path)?.color || COLORS.primary;
  const getPathIcon = (path: string) => CAREER_PATHS.find(p => p.id === path)?.icon || '📚';
  const careerPathsToShow = CAREER_PATHS.filter(p => p.id !== 'all');

  // First name only to keep header compact, show full name in profile
  const firstName = (user?.display_name || user?.username || 'คุณ').split(' ')[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >

        {/* ─────────────────────────────── HEADER ─────────────────────────────── */}
        <View style={styles.header}>
          {/* Top row: avatar + greeting | stats */}
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              {/* Avatar circle */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.display_name || user?.username || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.greetingBlock}>
                <Text style={styles.greetingSmall}>สวัสดี 👋</Text>
                <Text style={styles.greetingName} numberOfLines={1} ellipsizeMode="tail">
                  {firstName}
                </Text>
                <Text style={styles.greetingSub}>มาเรียนรู้กันเถอะ</Text>
              </View>
            </View>

            {/* Stats — vertical stack so they never overflow */}
            <View style={styles.statsList}>
              <View style={styles.statChip}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statChipText}>{dashboard?.current_streak ?? 0} วัน</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statEmoji}>⚡</Text>
                <Text style={styles.statChipText}>{dashboard?.xp_total ?? 0} XP</Text>
              </View>
              <View style={[styles.statChip, styles.levelChip]}>
                <Text style={styles.statEmoji}>👑</Text>
                <Text style={[styles.statChipText, { color: '#FFD700' }]}>
                  Lv.{dashboard?.level_info?.level ?? 1}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Daily Goal — floating card below header ─── */}
        <View style={styles.dailyGoalCard}>
          <View style={styles.dailyGoalHeader}>
            <View style={styles.dailyGoalLeft}>
              <Text style={styles.dailyGoalLabel}>🎯 เป้าหมายวันนี้</Text>
              <Text style={styles.dailyGoalSub}>
                {(dashboard?.daily_progress_percent ?? 0) >= 100
                  ? '🎉 ทำได้แล้ว!'
                  : `เหลือ ${Math.max(0, (dashboard?.daily_goal ?? 30) - (dashboard?.today_xp ?? 0))} XP`}
              </Text>
            </View>
            <Text style={styles.dailyGoalXP}>
              {dashboard?.today_xp ?? 0}
              <Text style={styles.dailyGoalGoal}> / {dashboard?.daily_goal ?? 30} XP</Text>
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(dashboard?.daily_progress_percent ?? 0, 100)}%` as any },
              ]}
            />
          </View>

          {/* Week strip */}
          {dashboard?.week_activity && (
            <View style={styles.weekRow}>
              {dashboard.week_activity.map((day, i) => (
                <View key={i} style={styles.dayCol}>
                  <View style={[styles.dayDot, day.goal_met ? styles.dayDotOn : styles.dayDotOff]}>
                    {day.goal_met && <Ionicons name="checkmark" size={10} color="#fff" />}
                  </View>
                  <Text style={styles.dayLabel}>
                    {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][new Date(day.date).getDay()]}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─────────────────────── ANNOUNCEMENTS ─────────────────────── */}
        {announcements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📢 ประกาศ</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {announcements.map(ann => (
                <TouchableOpacity
                  key={ann.id}
                  activeOpacity={0.88}
                  onPress={ann.link ? () => {} : undefined}
                >
                  <View style={[styles.announcementCard, { backgroundColor: ann.color }]}>
                    <Text style={styles.annIcon}>{ann.icon}</Text>
                    <View style={styles.annBody}>
                      <Text style={styles.annTitle} numberOfLines={1}>{ann.title}</Text>
                      <Text style={styles.annText} numberOfLines={2}>{ann.body}</Text>
                    </View>
                    {ann.link && (
                      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─────────────────────── RECOMMENDED COURSES ─────────────────────── */}
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
                  style={styles.courseHCard}
                  onPress={() => router.push(`/course-detail?id=${course._id}`)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.courseHCover, { backgroundColor: getPathColor(course.career_path) }]}>
                    <Text style={styles.courseHIcon}>{getPathIcon(course.career_path)}</Text>
                  </View>
                  <View style={styles.courseHBody}>
                    <Text style={styles.courseHTitle} numberOfLines={2}>{course.title}</Text>
                    <View style={styles.courseHMeta}>
                      <Ionicons name="book-outline" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.courseHMetaText}>{course.total_lessons} บทเรียน</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─────────────────────── TIPS & ARTICLES ─────────────────────── */}
        {articles.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💡 รวมเคล็ดลับ</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>ดูทั้งหมด</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {articles.map(article => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.articleCard}
                  activeOpacity={0.85}
                  onPress={article.url ? () => {} : undefined}
                >
                  {/* Cover */}
                  <View style={[styles.articleCover, { backgroundColor: article.cover_color + '22' }]}>
                    <Text style={styles.articleEmoji}>{article.cover_emoji}</Text>
                    <View style={[styles.articleCategoryBadge, { backgroundColor: article.cover_color }]}>
                      <Text style={styles.articleCategoryText} numberOfLines={1}>
                        {article.category}
                      </Text>
                    </View>
                  </View>
                  {/* Body */}
                  <View style={styles.articleBody}>
                    <Text style={styles.articleTitle} numberOfLines={3}>{article.title}</Text>
                    <View style={styles.articleMeta}>
                      <Ionicons name="time-outline" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.articleMetaText}>{article.read_time} นาที</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─────────────────────── CAREER PATHS ─────────────────────── */}
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

        {/* ─────────────────────── POPULAR COURSES ─────────────────────── */}
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
                    style={[
                      styles.courseCard,
                      { width: cardWidth },
                      isLastOdd && { marginRight: cardWidth + gridGap },
                    ]}
                    onPress={() => router.push(`/course-detail?id=${course._id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.courseCardCover, { backgroundColor: getPathColor(course.career_path) }]}>
                      <Text style={styles.courseCardIcon}>{getPathIcon(course.career_path)}</Text>
                    </View>
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

        {/* ─────────────────────── BADGES ─────────────────────── */}
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

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl + 8,
    backgroundColor: '#ef5ea8',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    marginRight: SPACING.sm,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  greetingBlock: {
    flex: 1,
  },
  greetingSmall: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  greetingSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },

  // Stats — vertical stack on the right
  statsList: {
    gap: 5,
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
    minWidth: 72,
  },
  levelChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  statEmoji: { fontSize: 12 },
  statChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Daily Goal card (below header) ────────────────────────────────────────
  dailyGoalCard: {
    marginHorizontal: SPACING.lg,
    marginTop: -18,           // overlap the header slightly
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  dailyGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  dailyGoalLeft: { gap: 2 },
  dailyGoalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  dailyGoalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dailyGoalXP: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  dailyGoalGoal: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  // Week strip inside daily goal card
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayCol: { alignItems: 'center', gap: 3 },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayDotOn: { backgroundColor: COLORS.success },
  dayDotOff: { backgroundColor: '#F3F4F6' },
  dayLabel: { fontSize: 10, color: COLORS.textSecondary },

  // ── Sections ──────────────────────────────────────────────────────────────
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
    marginBottom: SPACING.md,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  hScrollContent: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },

  // ── Announcement cards ────────────────────────────────────────────────────
  announcementCard: {
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  annIcon: { fontSize: 28, flexShrink: 0 },
  annBody: { flex: 1 },
  annTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  annText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
  },

  // ── Course horizontal cards ───────────────────────────────────────────────
  courseHCard: {
    width: 170,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  courseHCover: {
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseHIcon: { fontSize: 34 },
  courseHBody: { padding: SPACING.sm },
  courseHTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    minHeight: 34,
  },
  courseHMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  courseHMetaText: { fontSize: 11, color: COLORS.textSecondary },

  // ── Article / Tips cards ──────────────────────────────────────────────────
  articleCard: {
    width: 190,
    backgroundColor: '#fff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  articleCover: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  articleEmoji: { fontSize: 40 },
  articleCategoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    maxWidth: 130,
  },
  articleCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  articleBody: { padding: SPACING.sm },
  articleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 17,
    marginBottom: 6,
    minHeight: 51,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  articleMetaText: { fontSize: 11, color: COLORS.textSecondary },

  // ── 2-col grid ────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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

  // Popular course cards (2-col)
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

  // Empty state
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
