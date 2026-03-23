import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const CAREER_PATHS = ['UX Design', 'Data Analysis', 'Project Management', 'Learning Designer', 'Digital Marketing', 'General'];

const MIGRATION_SQL = `ALTER TABLE courses ADD COLUMN IF NOT EXISTS sequence_order INTEGER;\nALTER TABLE courses ADD COLUMN IF NOT EXISTS counts_for_certification BOOLEAN NOT NULL DEFAULT TRUE;`;

export default function AdminCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePath, setActivePath] = useState<string>('UX Design');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [careerPath, setCareerPath] = useState('UX Design');

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/courses`);
      const data = response.data;
      setCourses(data);
      // Show migration banner if sequence_order is missing from all courses
      const allNull = data.every((c: any) => c.sequence_order == null);
      setShowMigrationBanner(data.length > 0 && allNull);
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถโหลดคอร์สได้');
    } finally {
      setLoading(false);
    }
  };

  // Courses for the active career path, sorted by sequence_order
  const pathCourses = courses
    .filter((c) => (c.career_path || 'General') === activePath)
    .sort((a, b) => {
      if (a.sequence_order == null && b.sequence_order == null) return 0;
      if (a.sequence_order == null) return 1;
      if (b.sequence_order == null) return -1;
      return a.sequence_order - b.sequence_order;
    });

  // Count per path for the tab badges
  const countFor = (path: string) => courses.filter((c) => (c.career_path || 'General') === path).length;

  const openCreateModal = () => {
    setModalMode('create');
    setTitle('');
    setDescription('');
    setCareerPath(activePath);
    setSelectedCourse(null);
    setShowModal(true);
  };

  const openEditModal = (course: any) => {
    setModalMode('edit');
    setTitle(course.title);
    setDescription(course.description);
    setCareerPath(course.career_path);
    setSelectedCourse(course);
    setShowModal(true);
  };

  const saveCourse = async () => {
    if (!title || !description) {
      Alert.alert('ผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    try {
      if (modalMode === 'create') {
        await axios.post(`${API_URL}/api/courses`, { title, description, career_path: careerPath });
      } else {
        await axios.put(`${API_URL}/api/courses/${selectedCourse._id}`, { title, description });
      }
      setShowModal(false);
      loadCourses();
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกคอร์สได้');
    }
  };

  const togglePublish = async (course: any) => {
    try {
      await axios.put(`${API_URL}/api/courses/${course._id}`, { is_published: !course.is_published });
      loadCourses();
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้');
    }
  };

  const toggleCertification = async (course: any) => {
    try {
      await axios.put(`${API_URL}/api/courses/${course._id}`, {
        counts_for_certification: course.counts_for_certification === false ? true : false,
      });
      loadCourses();
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะ Cert ได้');
    }
  };

  const moveSequence = async (course: any, direction: 'up' | 'down') => {
    const idx = pathCourses.findIndex((c) => c._id === course._id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= pathCourses.length) return;

    // Use existing sequence_order or fall back to index-based value
    const currentOrders = pathCourses.map((c, i) => c.sequence_order ?? (i + 1) * 10);
    const myNewOrder = currentOrders[swapIdx];
    const theirNewOrder = currentOrders[idx];
    const neighborId = pathCourses[swapIdx]._id;

    // Optimistic local update
    setCourses(prev => prev.map(c => {
      if (c._id === course._id) return { ...c, sequence_order: myNewOrder };
      if (c._id === neighborId) return { ...c, sequence_order: theirNewOrder };
      return c;
    }));

    try {
      await Promise.all([
        axios.put(`${API_URL}/api/courses/${course._id}`, { sequence_order: myNewOrder }),
        axios.put(`${API_URL}/api/courses/${neighborId}`, { sequence_order: theirNewOrder }),
      ]);
    } catch {
      Alert.alert('ผิดพลาด', 'เรียงลำดับไม่สำเร็จ — กรุณา run migration SQL ใน Supabase ก่อน');
      loadCourses(); // revert
    }
  };

  const deleteCourse = (courseId: string) => {
    Alert.alert('ยืนยันการลบ', 'คุณแน่ใจหรือไม่ที่จะลบคอร์สนี้?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/courses/${courseId}`);
            loadCourses();
          } catch {
            Alert.alert('ผิดพลาด', 'ไม่สามารถลบคอร์สได้');
          }
        },
      },
    ]);
  };

  const seedSequences = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/seed-sequences`);
      Alert.alert('สำเร็จ', res.data.message);
      loadCourses();
    } catch {
      Alert.alert('ผิดพลาด', 'Seed ไม่สำเร็จ — อาจต้อง run migration SQL ก่อน');
    }
  };

  const copyMigrationSQL = () => {
    Clipboard.setString(MIGRATION_SQL);
    Alert.alert('คัดลอกแล้ว', 'วางใน Supabase Dashboard → SQL Editor แล้วกด Run');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>จัดการคอร์ส</Text>
          <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Career path tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarContent}
        >
          {CAREER_PATHS.map((path) => {
            const count = countFor(path);
            if (count === 0) return null;
            const active = activePath === path;
            return (
              <TouchableOpacity
                key={path}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActivePath(path)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{path}</Text>
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Migration banner */}
        {showMigrationBanner && (
          <View style={styles.migrationBanner}>
            <View style={styles.migrationTop}>
              <Ionicons name="warning" size={18} color="#92400E" />
              <Text style={styles.migrationTitle}>ต้อง setup ก่อนจึงจะเรียงลำดับได้</Text>
            </View>
            <Text style={styles.migrationBody}>
              Run SQL นี้ใน Supabase Dashboard → SQL Editor แล้วกดปุ่ม "Seed" เพื่อตั้งลำดับเริ่มต้น
            </Text>
            <View style={styles.migrationActions}>
              <TouchableOpacity style={styles.copyBtn} onPress={copyMigrationSQL}>
                <Ionicons name="copy-outline" size={14} color="#92400E" />
                <Text style={styles.copyBtnText}>Copy SQL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.seedBtn} onPress={seedSequences}>
                <Ionicons name="git-merge-outline" size={14} color="#FFFFFF" />
                <Text style={styles.seedBtnText}>Seed ลำดับ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : pathCourses.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="school" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>ไม่มีคอร์สใน {activePath}</Text>
            <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
              <Text style={styles.createBtnText}>+ สร้างคอร์ส</Text>
            </TouchableOpacity>
          </View>
        ) : (
          pathCourses.map((course: any, idx: number) => {
            const isFirst = idx === 0;
            const isLast = idx === pathCourses.length - 1;
            const certOn = course.counts_for_certification !== false;

            return (
              <View key={course._id} style={styles.courseCard}>
                {/* Sequence + order controls */}
                <View style={styles.seqCol}>
                  <TouchableOpacity
                    style={[styles.arrowBtn, isFirst && styles.arrowBtnDisabled]}
                    onPress={() => !isFirst && moveSequence(course, 'up')}
                    disabled={isFirst}
                  >
                    <Ionicons name="chevron-up" size={18} color={isFirst ? '#D1D5DB' : '#6366F1'} />
                  </TouchableOpacity>
                  <View style={[styles.seqBadge, course.sequence_order == null && styles.seqBadgeNull]}>
                    <Text style={[styles.seqText, course.sequence_order == null && styles.seqTextNull]}>
                      {course.sequence_order != null ? `#${course.sequence_order}` : '–'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.arrowBtn, isLast && styles.arrowBtnDisabled]}
                    onPress={() => !isLast && moveSequence(course, 'down')}
                    disabled={isLast}
                  >
                    <Ionicons name="chevron-down" size={18} color={isLast ? '#D1D5DB' : '#6366F1'} />
                  </TouchableOpacity>
                </View>

                {/* Course info */}
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                  <View style={styles.badgeRow}>
                    {course.is_published ? (
                      <View style={styles.publishedBadge}>
                        <Text style={styles.publishedText}>เผยแพร่</Text>
                      </View>
                    ) : (
                      <View style={styles.draftBadge}>
                        <Text style={styles.draftText}>ซ่อน</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.certBadge, certOn ? styles.certBadgeOn : styles.certBadgeOff]}
                      onPress={() => toggleCertification(course)}
                    >
                      <Text style={[styles.certBadgeText, certOn ? styles.certTextOn : styles.certTextOff]}>
                        {certOn ? '🏆 นับ Cert' : '○ ไม่นับ'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.lessonCount}>{course.total_lessons ?? 0} บทเรียน</Text>
                </View>

                {/* Action buttons */}
                <View style={styles.actionsCol}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/admin/course-modules' as any,
                        params: { id: course._id, title: course.title },
                      })
                    }
                  >
                    <Ionicons name="list" size={17} color="#6366F1" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(course)}>
                    <Ionicons name="create" size={17} color={COLORS.success} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => togglePublish(course)}>
                    <Ionicons
                      name={course.is_published ? 'eye-off' : 'eye'}
                      size={17}
                      color={COLORS.warning}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => deleteCourse(course._id)}>
                    <Ionicons name="trash" size={17} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'สร้างคอร์สใหม่' : 'แก้ไขคอร์ส'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>ชื่อคอร์ส</Text>
              <TextInput
                style={styles.input}
                placeholder="เช่น: UX Design สำหรับมือใหม่"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>คำอธิบาย</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="อธิบายเนื้อหาของคอร์ส..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              {modalMode === 'create' && (
                <>
                  <Text style={styles.inputLabel}>เส้นทางอาชีพ</Text>
                  <View style={styles.pathButtons}>
                    {CAREER_PATHS.map((path) => (
                      <TouchableOpacity
                        key={path}
                        style={[styles.pathButton, careerPath === path && styles.pathButtonActive]}
                        onPress={() => setCareerPath(path)}
                      >
                        <Text style={[styles.pathButtonText, careerPath === path && styles.pathButtonTextActive]}>
                          {path}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <TouchableOpacity style={styles.saveButton} onPress={saveCourse}>
                <Text style={styles.saveButtonText}>บันทึก</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  headerSafe: { backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  addButton: {
    width: 36, height: 36, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },

  // Tab bar
  tabBar: { backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabBarContent: { paddingHorizontal: SPACING.md, paddingVertical: 10, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  tabActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#6366F1' },
  tabBadge: {
    backgroundColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: '#C7D2FE' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  tabBadgeTextActive: { color: '#4338CA' },

  // Migration banner
  migrationBanner: {
    margin: SPACING.md,
    backgroundColor: '#FEF3C7',
    borderWidth: 1, borderColor: '#FCD34D',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  migrationTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  migrationTitle: { fontSize: 13, fontWeight: '700', color: '#92400E' },
  migrationBody: { fontSize: 12, color: '#78350F', lineHeight: 18, marginBottom: 10 },
  migrationActions: { flexDirection: 'row', gap: 8 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#FDE68A', borderRadius: RADIUS.sm,
  },
  copyBtnText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  seedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#92400E', borderRadius: RADIUS.sm,
  },
  seedBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  content: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginTop: SPACING.md },
  createBtn: {
    marginTop: SPACING.lg, paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
  },
  createBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  courseCard: {
    backgroundColor: COLORS.background,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    marginTop: 4,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    ...SHADOWS.small,
  },

  seqCol: { alignItems: 'center', width: 38, marginRight: SPACING.sm },
  arrowBtn: { padding: 4 },
  arrowBtnDisabled: { opacity: 0.25 },
  seqBadge: {
    backgroundColor: '#EEF2FF', borderRadius: RADIUS.xs,
    paddingHorizontal: 6, paddingVertical: 2,
    minWidth: 30, alignItems: 'center', marginVertical: 2,
  },
  seqBadgeNull: { backgroundColor: '#F3F4F6' },
  seqText: { fontSize: 11, fontWeight: '700', color: '#6366F1' },
  seqTextNull: { color: '#9CA3AF' },

  courseInfo: { flex: 1, paddingRight: SPACING.sm },
  courseTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 4 },
  publishedBadge: {
    backgroundColor: '#D1FAE5', paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.xs,
  },
  publishedText: { fontSize: 11, color: COLORS.success, fontWeight: '600' },
  draftBadge: {
    backgroundColor: '#F3F4F6', paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.xs,
  },
  draftText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  certBadge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: RADIUS.xs, borderWidth: 1,
  },
  certBadgeOn: { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' },
  certBadgeOff: { backgroundColor: '#F9FAFB', borderColor: '#D1D5DB' },
  certBadgeText: { fontSize: 11, fontWeight: '600' },
  certTextOn: { color: '#92400E' },
  certTextOff: { color: COLORS.textSecondary },
  lessonCount: { fontSize: 12, color: COLORS.textSecondary },

  actionsCol: { gap: 5 },
  iconBtn: {
    width: 32, height: 32, borderRadius: RADIUS.xs,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },

  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  modalBody: { padding: SPACING.lg },
  inputLabel: {
    fontSize: 14, fontWeight: '600', color: '#374151',
    marginBottom: SPACING.sm, marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: RADIUS.sm,
    padding: 12, fontSize: 15, color: COLORS.textPrimary,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pathButtons: { gap: SPACING.sm },
  pathButton: {
    paddingVertical: 12, borderRadius: RADIUS.sm,
    borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center',
  },
  pathButtonActive: { borderColor: COLORS.primary, backgroundColor: '#fce7f3' },
  pathButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  pathButtonTextActive: { color: COLORS.primary },
  saveButton: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: RADIUS.md, alignItems: 'center',
    marginTop: SPACING.lg, marginBottom: SPACING.sm,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
