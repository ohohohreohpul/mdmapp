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
            filteredCourses.map((course: any) => (
              <TouchableOpacity
                key={course._id}
                style={styles.courseCard}
                onPress={() => router.push(`/course-detail?id=${course._id}`)}
                activeOpacity={0.9}
              >
                <View style={[styles.courseThumbnail, { backgroundColor: COLORS.primary }]}>
                  <Ionicons name="school" size={28} color="#FFFFFF" />
                </View>

                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text style={styles.courseCareer}>{course.career_path}</Text>
                  <View style={styles.courseMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="book-outline" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.metaText}>{course.total_lessons || 0} บทเรียน</Text>
                    </View>
                    {course.has_final_exam && (
                      <View style={styles.metaItem}>
                        <Ionicons name="ribbon-outline" size={14} color={COLORS.success} />
                        <Text style={[styles.metaText, { color: COLORS.success }]}>มีใบประกาศ</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            ))
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
    marginBottom: 4,
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
