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
  { id: 'ux-design',          name: 'UX Design',        api: 'UX Design',         icon: 'color-palette-outline', color: '#6366F1' },
  { id: 'data-analysis',      name: 'Data Analysis',    api: 'Data Analysis',     icon: 'bar-chart-outline',     color: '#10B981' },
  { id: 'digital-marketing',  name: 'Digital Mkt',      api: 'Digital Marketing', icon: 'megaphone-outline',     color: '#F59E0B' },
  { id: 'project-management', name: 'Project Mgmt',     api: 'Project Management',icon: 'briefcase-outline',     color: '#EF5EA8' },
  { id: 'learning-designer',  name: 'Learning Design',  api: 'Learning Designer', icon: 'school-outline',        color: '#8B5CF6' },
  { id: 'qa-tester',          name: 'QA Tester',        api: 'QA Tester',         icon: 'bug-outline',           color: '#D946EF' },
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

  // card width: 2 columns with 12px gap inside 20px page padding
  const cardWidth = Math.floor((screenWidth - 40 - 12) / 2);
  // path card: 3 columns with 10px gaps
  const pathCardWidth = Math.floor((screenWidth - 40 - 20) / 3);

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

      {/* ── Sticky Header ── */}
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

        {/* ── Career Path Grid ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เส้นทางอาชีพ</Text>
          <View style={styles.pathGrid}>

            {/* All */}
            <TouchableOpacity
              style={[styles.pathCard, { width: pathCardWidth }, !selectedPath && styles.pathCardActive]}
              onPress={() => setSelectedPath(null)}
            >
              <View style={[styles.pathIconWrap, { backgroundColor: !selectedPath ? COLORS.primary : '#F0F0F0' }]}>
                <Ionicons name="grid-outline" size={20} color={!selectedPath ? '#FFF' : '#999'} />
              </View>
              <Text style={[styles.pathLabel, !selectedPath && { color: COLORS.primary, fontWeight: '700' }]}>
                ทั้งหมด
              </Text>
            </TouchableOpacity>

            {PATHS.map(p => {
              const active = selectedPath === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.pathCard, { width: pathCardWidth }, active && { borderColor: p.color }]}
                  onPress={() => setSelectedPath(active ? null : p.id)}
                >
                  <View style={[styles.pathIconWrap, { backgroundColor: active ? p.color : p.color + '18' }]}>
                    <Ionicons name={p.icon as any} size={20} color={active ? '#FFF' : p.color} />
                  </View>
                  <Text
                    style={[styles.pathLabel, active && { color: p.color, fontWeight: '700' }]}
                    numberOfLines={2}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
                const pathColor = PATHS.find(p => p.api === course.career_path)?.color || COLORS.primary;

                return (
                  <TouchableOpacity
                    key={course._id}
                    style={[styles.card, { width: cardWidth }, isLocked && styles.cardLocked]}
                    onPress={() => router.push(`/course-detail?id=${course._id}`)}
                    activeOpacity={0.85}
                  >
                    {/* Thumbnail */}
                    <View style={[styles.thumb, { backgroundColor: isLocked ? '#F0F0F0' : pathColor + '18' }]}>
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
                      {isLocked && !isCompleted && (
                        <View style={[styles.badge, styles.badgeLocked]}>
                          <Ionicons name="lock-closed" size={10} color="#FFF" />
                        </View>
                      )}
                    </View>

                    {/* Info */}
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

  // Header
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

  // Sections
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },

  // Path Grid
  pathGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pathCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
  },
  pathCardActive: { borderColor: COLORS.primary },
  pathIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 7,
  },
  pathLabel: {
    fontSize: 11, fontWeight: '600',
    color: '#888', textAlign: 'center', lineHeight: 14,
  },

  // Results row
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCount: { fontSize: 13, color: '#AAA' },

  // Course Grid
  courseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  cardLocked: { opacity: 0.6 },
  thumb: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#10B981',
    borderRadius: 10, width: 22, height: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeLocked: { backgroundColor: '#BBBBBB' },
  cardBody: { padding: 12 },
  cardTitle: {
    fontSize: 13, fontWeight: '700',
    color: '#1A1A2E', lineHeight: 18, marginBottom: 8,
  },
  cardTitleLocked: { color: '#AAAAAA' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  tag: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 10, fontWeight: '700' },
  lessonCount: { fontSize: 10, color: '#AAA' },

  // States
  loader: { marginTop: 48 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#CCC', marginTop: 12 },
});
