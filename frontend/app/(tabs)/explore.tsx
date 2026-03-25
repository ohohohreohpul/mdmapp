import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { useUser } from '../../contexts/UserContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

export default function Explore() {
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const careerPaths = [
    { id: 'ux-design', title: 'UX Design', icon: 'color-palette', color: '#6366F1' },
    { id: 'data-analysis', title: 'Data Analysis', icon: 'bar-chart', color: '#10B981' },
    { id: 'digital-marketing', title: 'Digital Marketing', icon: 'megaphone', color: '#F59E0B' },
    { id: 'project-management', title: 'Project Management', icon: 'briefcase', color: COLORS.primary },
    { id: 'learning-designer', title: 'Learning Designer', icon: 'school', color: '#EC4899' },
  ];

  useEffect(() => {
    loadCourses();
  }, [selectedPath]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params: any = { published_only: true };
      if (selectedPath) {
        const pathNames: any = {
          'ux-design': 'UX Design',
          'data-analysis': 'Data Analysis',
          'digital-marketing': 'Digital Marketing',
          'project-management': 'Project Management',
          'learning-designer': 'Learning Designer',
        };
        params.career_path = pathNames[selectedPath];
      }
      if (user?._id) {
        params.user_id = user._id;
      }

      const response = await axios.get(`${API_URL}/api/courses`, { params });
      setCourses(response.data);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course: any) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPathColor = (pathId: string) => {
    const path = careerPaths.find(p => p.id === pathId);
    return path?.color || COLORS.primary;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>สำรวจคอร์ส</Text>
          {isAdmin && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/admin')}
            >
              <Ionicons name="settings-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="ค้นหาคอร์ส..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textTertiary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Career Paths Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>เลือกเส้นทางอาชีพ</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                !selectedPath && styles.filterChipActive,
              ]}
              onPress={() => setSelectedPath(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !selectedPath && styles.filterChipTextActive,
                ]}
              >
                ทั้งหมด
              </Text>
            </TouchableOpacity>
            {careerPaths.map((path) => (
              <TouchableOpacity
                key={path.id}
                style={[
                  styles.filterChip,
                  selectedPath === path.id && { backgroundColor: path.color, borderColor: path.color },
                ]}
                onPress={() => setSelectedPath(path.id)}
              >
                <Ionicons
                  name={path.icon as any}
                  size={16}
                  color={selectedPath === path.id ? '#FFFFFF' : path.color}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedPath === path.id ? '#FFFFFF' : COLORS.textPrimary },
                  ]}
                >
                  {path.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Courses List */}
        <View style={styles.coursesSection}>
          <Text style={styles.resultCount}>
            พบ {filteredCourses.length} คอร์ส
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : filteredCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={64} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>ไม่พบคอร์สที่ค้นหา</Text>
              <Text style={styles.emptySubtext}>ลองค้นหาด้วยคำอื่น</Text>
            </View>
          ) : (
            filteredCourses.map((course: any) => {
            const lessonCount = course.total_lessons || 0;
            const pmCount = course.practice_module_count || 0;
            const isLocked = course.is_locked === true;
            const isCompleted = course.is_completed === true;
            const seqOrder = course.sequence_order;
            return (
              <TouchableOpacity
                key={course._id}
                style={[
                  styles.courseCard,
                  isLocked && styles.courseCardLocked,
                  isCompleted && styles.courseCardCompleted,
                ]}
                onPress={() => router.push(`/course-detail?id=${course._id}`)}
                activeOpacity={0.9}
              >
                <View style={[styles.courseThumbnail, {
                  backgroundColor: isLocked ? '#E5E5E5' : COLORS.primary,
                }]}>
                  <Ionicons
                    name={isLocked ? 'lock-closed' : 'school'}
                    size={28}
                    color={isLocked ? '#AAAAAA' : '#FFFFFF'}
                  />
                </View>

                <View style={styles.courseInfo}>
                  <View style={styles.courseTitleRow}>
                    {seqOrder && (
                      <Text style={[styles.seqBadge, isLocked && styles.seqBadgeLocked]}>#{seqOrder}</Text>
                    )}
                    <Text style={[styles.courseTitle, isLocked && styles.courseTitleLocked]} numberOfLines={2}>
                      {course.title}
                    </Text>
                    {isCompleted && (
                      <View style={styles.completedPill}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.courseCareer, isLocked && { color: COLORS.textTertiary }]}>{course.career_path}</Text>
                  {isLocked ? (
                    <View style={styles.lockedRow}>
                      <Ionicons name="lock-closed-outline" size={13} color={COLORS.textTertiary} />
                      <Text style={styles.lockedText}>ต้องผ่านคอร์สก่อนหน้าก่อน</Text>
                    </View>
                  ) : (
                    <View style={styles.courseMeta}>
                      {lessonCount > 0 && (
                        <View style={styles.metaItem}>
                          <Ionicons name="book-outline" size={14} color={COLORS.textSecondary} />
                          <Text style={styles.metaText}>{lessonCount} บทเรียน</Text>
                        </View>
                      )}
                      {pmCount > 0 && (
                        <View style={styles.metaItem}>
                          <Ionicons name="flash-outline" size={14} color={COLORS.primary} />
                          <Text style={[styles.metaText, { color: COLORS.primary }]}>{pmCount} โมดูลฝึกหัด</Text>
                        </View>
                      )}
                      {course.has_final_exam && (
                        <View style={styles.metaItem}>
                          <Ionicons name="ribbon-outline" size={14} color={COLORS.success} />
                          <Text style={[styles.metaText, { color: COLORS.success }]}>มีใบประกาศ</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                <Ionicons
                  name={isLocked ? 'lock-closed-outline' : 'chevron-forward'}
                  size={20}
                  color={isLocked ? '#CCCCCC' : COLORS.textTertiary}
                />
              </TouchableOpacity>
            );
          })
          )}
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  adminButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  filterSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  filtersScroll: {
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  coursesSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  resultCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: 8,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  courseCardInteractive: {
    borderColor: COLORS.primary + '40',
    backgroundColor: '#FFFAFD',
  },
  courseCardLocked: {
    borderColor: '#E5E5E5',
    backgroundColor: '#FAFAFA',
    opacity: 0.8,
  },
  courseCardCompleted: {
    borderColor: '#10B98140',
    backgroundColor: '#F0FDF9',
  },
  courseTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  seqBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  seqBadgeLocked: {
    color: COLORS.textTertiary,
    backgroundColor: '#F0F0F0',
  },
  completedPill: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  courseTitleLocked: {
    color: COLORS.textTertiary,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lockedText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  interactivePill: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  interactivePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  courseThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  courseCareer: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 8,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
