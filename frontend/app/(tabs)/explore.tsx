import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../../constants/theme';
import { useUser } from '../../contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

const PATHS = [
  { id: 'ux-design',          name: 'UX Design',         api: 'UX Design',          icon: 'color-palette-outline', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'data-analysis',      name: 'Data Analysis',     api: 'Data Analysis',      icon: 'bar-chart-outline',     color: '#10B981', bg: '#ECFDF5' },
  { id: 'digital-marketing',  name: 'Digital Marketing', api: 'Digital Marketing',  icon: 'megaphone-outline',     color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'project-management', name: 'Project Management',api: 'Project Management', icon: 'briefcase-outline',     color: '#EF5EA8', bg: '#FDF2F8' },
  { id: 'learning-designer',  name: 'Learning Design',   api: 'Learning Designer',  icon: 'school-outline',        color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'qa-tester',          name: 'QA Tester',         api: 'QA Tester',          icon: 'bug-outline',           color: '#D946EF', bg: '#FDF4FF' },
];

export default function Explore() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { width: screenWidth } = useWindowDimensions();
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const cardWidth = Math.floor((screenWidth - 40 - 12) / 2);
  const pathCardWidth = Math.floor((screenWidth - 40 - 12) / 2);

  useEffect(() => { loadCourses(); }, [selectedPath]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params: any = { published_only: true };
      const path = PATHS.find(p => p.id === selectedPath);
      if (path) params.career_path = path.api;
      if (user?._id) params.user_id = user._id;
      const response = await axios.get(`${API_URL}/api/courses`, { params });
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter((c: any) =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePathData = PATHS.find(p => p.id === selectedPath);

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>สำรวจคอร์ส</Text>
          {isAdmin && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/admin')}>
              <Ionicons name="settings-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาคอร์ส..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Career Paths — shown first, big 2-column grid ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เลือกเส้นทางอาชีพ</Text>
          <View style={styles.pathGrid}>
            {PATHS.map(p => {
              const active = selectedPath === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.pathCard,
                    { width: pathCardWidth, backgroundColor: active ? p.color : p.bg },
                  ]}
                  onPress={() => setSelectedPath(active ? null : p.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.pathIconWrap, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#FFFFFF' }]}>
                    <Ionicons name={p.icon as any} size={24} color={active ? '#FFFFFF' : p.color} />
                  </View>
                  <Text style={[styles.pathName, active && styles.pathNameActive]}>
                    {p.name}
                  </Text>
                  {active && (
                    <View style={styles.pathCheckWrap}>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* All courses pill — shown below grid */}
          <TouchableOpacity
            style={[styles.allPill, !selectedPath && styles.allPillActive]}
            onPress={() => setSelectedPath(null)}
          >
            <Ionicons
              name="grid-outline"
              size={16}
              color={!selectedPath ? '#FFFFFF' : COLORS.textSecondary}
            />
            <Text style={[styles.allPillText, !selectedPath && styles.allPillTextActive]}>
              ดูทั้งหมด
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Courses ── */}
        <View style={styles.section}>
          <View style={styles.resultsRow}>
            <Text style={styles.sectionTitle}>
              {activePathData ? activePathData.name : 'คอร์สทั้งหมด'}
            </Text>
            <Text style={styles.resultCount}>{filtered.length} คอร์ส</Text>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color="#DDD" />
              <Text style={styles.emptyText}>ไม่พบคอร์ส</Text>
            </View>
          ) : (
            <View style={styles.courseGrid}>
              {filtered.map((course: any) => {
                const isLocked = course.is_locked === true;
                const isCompleted = course.is_completed === true;
                const pathData = PATHS.find(p => p.api === course.career_path);
                const pathColor = pathData?.color || COLORS.primary;
                const pathBg = pathData?.bg || COLORS.primary + '15';

                return (
                  <TouchableOpacity
                    key={course._id}
                    style={[styles.card, { width: cardWidth }, isLocked && styles.cardLocked]}
                    onPress={() => router.push(`/course-detail?id=${course._id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.thumb, { backgroundColor: isLocked ? '#F0F0F0' : pathBg }]}>
                      <Ionicons
                        name={isLocked ? 'lock-closed' : 'school'}
                        size={38}
                        color={isLocked ? '#BBBBBB' : pathColor}
                      />
                      {isCompleted && (
                        <View style={styles.badge}>
                          <Ionicons name="checkmark" size={11} color="#FFF" />
                        </View>
                      )}
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={[styles.cardTitle, isLocked && styles.cardTitleLocked]} numberOfLines={2}>
                        {course.title}
                      </Text>
                      <View style={styles.cardFooter}>
                        <View style={[styles.tag, { backgroundColor: pathColor + '15' }]}>
                          <Text style={[styles.tagText, { color: pathColor }]} numberOfLines={1}>
                            {course.career_path}
                          </Text>
                        </View>
                        {course.total_lessons > 0 && (
                          <Text style={styles.lessonCount}>{course.total_lessons} บท</Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A2E' },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },

  // Path cards — 2 columns, tall, colorful
  pathGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pathCard: {
    borderRadius: 16,
    padding: 16,
    minHeight: 90,
    justifyContent: 'center',
    position: 'relative',
  },
  pathIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  pathName: {
    fontSize: 13, fontWeight: '700',
    color: '#444', lineHeight: 18,
  },
  pathNameActive: { color: '#FFFFFF' },
  pathCheckWrap: {
    position: 'absolute', top: 10, right: 10,
  },

  // "All" pill below grid
  allPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  allPillActive: { backgroundColor: COLORS.primary },
  allPillText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  allPillTextActive: { color: '#FFFFFF' },

  // Results
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCount: { fontSize: 13, color: '#AAA' },

  // Course grid
  courseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  cardLocked: { opacity: 0.6 },
  thumb: { height: 120, justifyContent: 'center', alignItems: 'center' },
  badge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#10B981',
    borderRadius: 10, width: 22, height: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#1A1A2E', lineHeight: 18, marginBottom: 8 },
  cardTitleLocked: { color: '#AAAAAA' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  tag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 10, fontWeight: '700' },
  lessonCount: { fontSize: 10, color: '#AAA' },

  loader: { marginTop: 48 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#CCC', marginTop: 12 },
});
