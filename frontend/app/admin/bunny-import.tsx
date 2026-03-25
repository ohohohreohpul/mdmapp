/**
 * Bunny Import — Collection-first flow
 * ─────────────────────────────────────────────────────────
 * Step 1 – Pick a Collection  (Collection = Course)
 * Step 2 – Browse & select videos from that collection
 * Step 3 – Edit titles + pick target module → Create lessons
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BunnyCollection {
  guid: string;
  name: string;
  video_count: number;
  thumbnail_url?: string;
}

interface BunnyVideo {
  guid: string;
  title: string;
  length: number;
  embed_url: string;
}

interface ImportRow {
  guid: string;
  embed_url: string;
  rawTitle: string;
  cleanTitle: string;
  order: number;
  durationMinutes: number;
  selected: boolean;
}

interface Course {
  _id: string;
  title: string;
}

interface Module {
  _id: string;
  title: string;
}

type Phase = 'idle' | 'loadingCollections' | 'pickCollection' | 'loadingVideos' | 'pickVideos' | 'configure' | 'creating';

// ─── Title parser ─────────────────────────────────────────────────────────────

function parseVideoTitle(raw: string): { cleanTitle: string; order: number } {
  let t = raw.replace(/\.[^.]+$/, '').trim();

  let order = 0;
  const orderMatch = t.match(/^(\d+)[_.\s]/);
  if (orderMatch) {
    order = parseInt(orderMatch[1], 10);
    t = t.slice(orderMatch[0].length);
  }

  const isWorkshop = /_wk$/i.test(t);
  if (isWorkshop) t = t.replace(/_wk$/i, '');

  // Split CamelCase
  t = t.replace(/([a-z])([A-Z])/g, '$1 $2');
  t = t.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // Replace underscores/dashes
  t = t.replace(/[_-]+/g, ' ').trim();

  // Title case, preserve small words after first
  const small = new Set(['in', 'on', 'of', 'and', 'or', 'to', 'the', 'a', 'an', 'for', 'with']);
  t = t
    .split(/\s+/)
    .map((w, i) =>
      i === 0 || !small.has(w.toLowerCase())
        ? w.charAt(0).toUpperCase() + w.slice(1)
        : w.toLowerCase(),
    )
    .join(' ');

  if (isWorkshop) t += ' (Workshop)';

  return { cleanTitle: t || raw, order };
}

function secToMinutes(sec: number): number {
  return Math.round(sec / 60);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BunnyImport() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('idle');
  const [collections, setCollections] = useState<BunnyCollection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<BunnyCollection | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [sortByNumber, setSortByNumber] = useState(true);

  // Phase 3 – target
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [loadingModules, setLoadingModules] = useState(false);

  // ── Derived ───────────────────────────────────────────────────────────────

  const selectedRows = useMemo(() => rows.filter((r) => r.selected), [rows]);
  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) =>
      sortByNumber
        ? a.order - b.order || a.rawTitle.localeCompare(b.rawTitle)
        : a.rawTitle.localeCompare(b.rawTitle),
    );
    return copy;
  }, [rows, sortByNumber]);

  // ── Step 1: Load collections ──────────────────────────────────────────────

  const loadCollections = useCallback(async () => {
    try {
      setPhase('loadingCollections');
      const [colRes, coursesRes] = await Promise.all([
        axios.get(`${API_URL}/api/bunny/collections`),
        axios.get(`${API_URL}/api/courses`),
      ]);
      const cols: BunnyCollection[] = colRes.data.collections || [];
      if (cols.length === 0) {
        Alert.alert('ไม่พบ Collection', 'ยังไม่มี Collection ใน Bunny Library หรือ API Key ไม่ถูกต้อง');
        setPhase('idle');
        return;
      }
      setCollections(cols);
      setCourses(coursesRes.data || []);
      setPhase('pickCollection');
    } catch (err: any) {
      Alert.alert('ผิดพลาด', err?.response?.data?.detail || err?.message || 'เกิดข้อผิดพลาด');
      setPhase('idle');
    }
  }, []);

  // ── Step 2: Load videos for selected collection ───────────────────────────

  const loadVideos = useCallback(async (collection: BunnyCollection) => {
    try {
      setSelectedCollection(collection);
      setPhase('loadingVideos');
      const res = await axios.get(`${API_URL}/api/bunny/videos`, {
        params: { collection_id: collection.guid },
      });
      const videos: BunnyVideo[] = res.data.videos || [];
      if (videos.length === 0) {
        Alert.alert('ไม่มีวิดีโอ', `Collection "${collection.name}" ยังไม่มีวิดีโอ`);
        setPhase('pickCollection');
        return;
      }
      const parsed: ImportRow[] = videos.map((v) => {
        const { cleanTitle, order } = parseVideoTitle(v.title);
        return {
          guid: v.guid,
          embed_url: v.embed_url,
          rawTitle: v.title,
          cleanTitle,
          order,
          durationMinutes: secToMinutes(v.length),
          selected: false,
        };
      });
      setRows(parsed);
      setPhase('pickVideos');
    } catch (err: any) {
      Alert.alert('ผิดพลาด', err?.response?.data?.detail || err?.message || 'เกิดข้อผิดพลาด');
      setPhase('pickCollection');
    }
  }, []);

  // ── Select helpers ────────────────────────────────────────────────────────

  const toggleRow = (guid: string) =>
    setRows((prev) => prev.map((r) => (r.guid === guid ? { ...r, selected: !r.selected } : r)));
  const selectAll = () => setRows((prev) => prev.map((r) => ({ ...r, selected: true })));
  const deselectAll = () => setRows((prev) => prev.map((r) => ({ ...r, selected: false })));

  const goToConfigure = () => {
    if (selectedRows.length === 0) {
      Alert.alert('ยังไม่ได้เลือก', 'เลือกวิดีโออย่างน้อย 1 รายการ');
      return;
    }
    setSelectedCourseId('');
    setSelectedModuleId('');
    setModules([]);
    setPhase('configure');
  };

  // ── Course / Module selection ─────────────────────────────────────────────

  const onSelectCourse = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedModuleId('');
    setModules([]);
    if (!courseId) return;
    try {
      setLoadingModules(true);
      const res = await axios.get(`${API_URL}/api/modules/course/${courseId}`);
      setModules(res.data || []);
    } catch {
      Alert.alert('ผิดพลาด', 'โหลดโมดูลไม่สำเร็จ');
    } finally {
      setLoadingModules(false);
    }
  };

  const updateTitle = (guid: string, value: string) =>
    setRows((prev) => prev.map((r) => (r.guid === guid ? { ...r, cleanTitle: value } : r)));

  // ── Create lessons ────────────────────────────────────────────────────────

  const createLessons = useCallback(async () => {
    if (!selectedModuleId) {
      Alert.alert('เลือกโมดูล', 'กรุณาเลือก Course และ Module ก่อน');
      return;
    }
    const toCreate = selectedRows
      .slice()
      .sort((a, b) => a.order - b.order || a.rawTitle.localeCompare(b.rawTitle));

    Alert.alert(
      'ยืนยันสร้างบทเรียน',
      `สร้าง ${toCreate.length} บทเรียนใน Module นี้?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'สร้าง',
          onPress: async () => {
            setPhase('creating');
            let baseOrder = 1;
            try {
              const existing = await axios.get(`${API_URL}/api/lessons/module/${selectedModuleId}`);
              baseOrder = (existing.data || []).length + 1;
            } catch { /* use 1 */ }

            let success = 0;
            let fail = 0;
            for (let i = 0; i < toCreate.length; i++) {
              const row = toCreate[i];
              try {
                await axios.post(`${API_URL}/api/lessons`, {
                  module_id: selectedModuleId,
                  title: row.cleanTitle.trim() || row.rawTitle,
                  description: '',
                  order: baseOrder + i,
                  content_type: 'video',
                  video_url: row.embed_url,
                  video_id: row.guid,
                  duration_minutes: row.durationMinutes || undefined,
                });
                success++;
              } catch { fail++; }
            }
            setPhase('configure');
            Alert.alert(
              'เสร็จสิ้น! 🎉',
              `สร้างบทเรียนสำเร็จ ${success} รายการ${fail > 0 ? `\nล้มเหลว ${fail} รายการ` : ''}`,
              [{ text: 'OK', onPress: () => router.back() }],
            );
          },
        },
      ],
    );
  }, [selectedRows, selectedModuleId, router]);

  // ── Back button logic ─────────────────────────────────────────────────────

  const handleBack = () => {
    if (phase === 'pickVideos') { setPhase('pickCollection'); setRows([]); }
    else if (phase === 'configure') setPhase('pickVideos');
    else if (phase === 'pickCollection') setPhase('idle');
    else router.back();
  };

  // ── Step labels ───────────────────────────────────────────────────────────

  const stepLabel: Record<Phase, string> = {
    idle: '',
    loadingCollections: 'กำลังโหลด…',
    pickCollection: 'เลือก Collection',
    loadingVideos: 'กำลังโหลดวิดีโอ…',
    pickVideos: `เลือกวิดีโอ — ${selectedCollection?.name ?? ''}`,
    configure: `ตั้งค่าและสร้าง — ${selectedRows.length} วิดีโอ`,
    creating: 'กำลังสร้างบทเรียน…',
  };

  // ── Step dots (3 steps: collection → videos → configure) ─────────────────

  const stepIndex = { pickCollection: 0, loadingVideos: 0, pickVideos: 1, configure: 2, creating: 2 } as Record<Phase, number>;

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderCollection = ({ item }: { item: BunnyCollection }) => (
    <TouchableOpacity style={styles.collectionCard} onPress={() => loadVideos(item)} activeOpacity={0.75}>
      {item.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} style={styles.collectionThumb} />
      ) : (
        <View style={[styles.collectionThumb, styles.collectionThumbPlaceholder]}>
          <Text style={styles.collectionThumbEmoji}>🎬</Text>
        </View>
      )}
      <View style={styles.collectionInfo}>
        <Text style={styles.collectionName}>{item.name}</Text>
        <Text style={styles.collectionCount}>{item.video_count} วิดีโอ</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );

  const renderVideoRow = ({ item }: { item: ImportRow }) => (
    <TouchableOpacity
      style={[styles.videoRow, item.selected && styles.videoRowSelected]}
      onPress={() => toggleRow(item.guid)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, item.selected && styles.checkboxChecked]}>
        {item.selected && <Ionicons name="checkmark" size={14} color="#FFF" />}
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoCleanTitle}>{item.cleanTitle}</Text>
        <Text style={styles.videoRawTitle} numberOfLines={1}>{item.rawTitle}</Text>
      </View>
      <View style={styles.videoMeta}>
        {item.order > 0 && (
          <View style={styles.orderBubble}>
            <Text style={styles.orderBubbleText}>#{item.order}</Text>
          </View>
        )}
        {item.durationMinutes > 0 && (
          <Text style={styles.durationText}>{item.durationMinutes}m</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderConfigRow = (item: ImportRow) => (
    <View key={item.guid} style={styles.configRow}>
      <View style={styles.configOrder}>
        <Text style={styles.configOrderText}>{item.order > 0 ? `#${item.order}` : '—'}</Text>
      </View>
      <View style={styles.configTitleWrap}>
        <TextInput
          style={styles.configTitleInput}
          value={item.cleanTitle}
          onChangeText={(v) => updateTitle(item.guid, v)}
          placeholder="ชื่อบทเรียน"
          returnKeyType="done"
        />
        <Text style={styles.configRaw} numberOfLines={1}>{item.rawTitle}</Text>
      </View>
      {item.durationMinutes > 0 && (
        <Text style={styles.configDuration}>{item.durationMinutes}m</Text>
      )}
    </View>
  );

  // ─── Shared header ────────────────────────────────────────────────────────

  const showHeader = phase !== 'idle';
  const showSteps = ['pickCollection', 'loadingVideos', 'pickVideos', 'configure', 'creating'].includes(phase);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🐰 Import from Bunny.net</Text>
            {showHeader && (
              <Text style={styles.headerSub} numberOfLines={1}>{stepLabel[phase]}</Text>
            )}
          </View>
          {/* 3-step dots */}
          {showSteps && (
            <View style={styles.stepRow}>
              {[0, 1, 2].map((i) => (
                <React.Fragment key={i}>
                  <View style={[styles.stepDot, stepIndex[phase] === i && styles.stepDotActive, stepIndex[phase] > i && styles.stepDotDone]} />
                  {i < 2 && <View style={styles.stepLine} />}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ── IDLE ── */}
      {phase === 'idle' && (
        <View style={styles.centered}>
          <Text style={styles.heroEmoji}>🎬</Text>
          <Text style={styles.heroTitle}>สร้างบทเรียนจากวิดีโอ</Text>
          <Text style={styles.heroDesc}>
            ดึง Collections จาก Bunny.net — แต่ละ Collection คือ 1 คอร์ส
            เลือกวิดีโอ แก้ชื่อ เลือกโมดูล แล้วสร้างบทเรียนทีเดียวทั้งหมด
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={loadCollections}>
            <Ionicons name="cloud-download-outline" size={20} color="#FFF" />
            <Text style={styles.primaryBtnText}>ดู Collections ใน Bunny</Text>
          </TouchableOpacity>
          <Text style={styles.prereqNote}>
            ⚙️ ต้องตั้งค่า API Key + Library ID ใน Admin → ตั้งค่าระบบ ก่อน
          </Text>
        </View>
      )}

      {/* ── LOADING ── */}
      {(phase === 'loadingCollections' || phase === 'loadingVideos' || phase === 'creating') && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingMsg}>
            {phase === 'loadingCollections' && 'กำลังโหลด Collections…'}
            {phase === 'loadingVideos' && `กำลังโหลดวิดีโอใน "${selectedCollection?.name}"…`}
            {phase === 'creating' && 'กำลังสร้างบทเรียน…'}
          </Text>
        </View>
      )}

      {/* ── STEP 1: PICK COLLECTION ── */}
      {phase === 'pickCollection' && (
        <FlatList
          data={collections}
          keyExtractor={(c) => c.guid}
          renderItem={renderCollection}
          contentContainerStyle={styles.collectionList}
          ListHeaderComponent={
            <Text style={styles.listHint}>
              แต่ละ Collection = 1 คอร์ส — แตะเพื่อดูวิดีโอภายใน
            </Text>
          }
        />
      )}

      {/* ── STEP 2: PICK VIDEOS ── */}
      {phase === 'pickVideos' && (
        <>
          {/* Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={selectAll}>
              <Text style={styles.toolbarBtnText}>เลือกทั้งหมด</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolbarBtn} onPress={deselectAll}>
              <Text style={styles.toolbarBtnText}>ล้างทั้งหมด</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toolbarBtn, styles.toolbarBtnSort]}
              onPress={() => setSortByNumber((v) => !v)}
            >
              <Ionicons name="swap-vertical" size={13} color={COLORS.primary} />
              <Text style={[styles.toolbarBtnText, { color: COLORS.primary }]}>
                {sortByNumber ? 'เลข' : 'A–Z'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={sortedRows}
            keyExtractor={(r) => r.guid}
            renderItem={renderVideoRow}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryBtn, selectedRows.length === 0 && styles.primaryBtnDisabled]}
              onPress={goToConfigure}
              disabled={selectedRows.length === 0}
            >
              <Text style={styles.primaryBtnText}>
                ต่อไป — เลือก {selectedRows.length} วิดีโอ
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── STEP 3: CONFIGURE ── */}
      {phase === 'configure' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.configContainer}>

          {/* Course + Module */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>📁 เลือก Course และ Module</Text>
            <Text style={styles.sectionHint}>
              Collection: <Text style={{ fontWeight: '700' }}>{selectedCollection?.name}</Text>
            </Text>

            <Text style={styles.pickerLabel}>Course</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {courses.map((c) => (
                <TouchableOpacity
                  key={c._id}
                  style={[styles.chip, selectedCourseId === c._id && styles.chipActive]}
                  onPress={() => onSelectCourse(c._id)}
                >
                  <Text style={[styles.chipText, selectedCourseId === c._id && styles.chipTextActive]}>
                    {c.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedCourseId ? (
              <>
                <Text style={[styles.pickerLabel, { marginTop: SPACING.md }]}>Module</Text>
                {loadingModules ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: SPACING.sm }} />
                ) : modules.length === 0 ? (
                  <Text style={styles.noModulesText}>ไม่มีโมดูลในคอร์สนี้ กรุณาสร้างโมดูลก่อน</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {modules.map((m) => (
                      <TouchableOpacity
                        key={m._id}
                        style={[styles.chip, selectedModuleId === m._id && styles.chipActive]}
                        onPress={() => setSelectedModuleId(m._id)}
                      >
                        <Text style={[styles.chipText, selectedModuleId === m._id && styles.chipTextActive]}>
                          {m.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </>
            ) : null}
          </View>

          {/* Title editor */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>✏️ ชื่อบทเรียน (แก้ไขได้)</Text>
            <Text style={styles.sectionHint}>ชื่อถูกแปลงจากชื่อไฟล์ — แตะเพื่อแก้ไขก่อนสร้าง</Text>
            {selectedRows
              .slice()
              .sort((a, b) => a.order - b.order || a.rawTitle.localeCompare(b.rawTitle))
              .map(renderConfigRow)}
          </View>

          {/* Create button */}
          <TouchableOpacity
            style={[styles.createBtn, !selectedModuleId && styles.createBtnDisabled]}
            onPress={createLessons}
            disabled={!selectedModuleId}
          >
            <Ionicons name="add-circle-outline" size={22} color="#FFF" />
            <Text style={styles.createBtnText}>สร้าง {selectedRows.length} บทเรียน</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  headerSafe: { backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: SPACING.sm,
  },
  backButton: {
    width: 36, height: 36,
    borderRadius: RADIUS.full,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepDotDone: { backgroundColor: COLORS.primary, opacity: 0.4 },
  stepLine: { width: 10, height: 2, backgroundColor: '#D1D5DB', marginHorizontal: 2 },

  // Idle
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl, gap: SPACING.md },
  heroEmoji: { fontSize: 56 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  heroDesc: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  prereqNote: { fontSize: 12, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 18 },
  loadingMsg: { marginTop: SPACING.md, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' },

  // Collection list
  collectionList: { padding: SPACING.md },
  listHint: { fontSize: 13, color: COLORS.textTertiary, marginBottom: SPACING.sm },
  collectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    ...SHADOWS.small,
  },
  collectionThumb: { width: 52, height: 52, borderRadius: RADIUS.sm, backgroundColor: '#F3F4F6' },
  collectionThumbPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  collectionThumbEmoji: { fontSize: 24 },
  collectionInfo: { flex: 1 },
  collectionName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  collectionCount: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: SPACING.sm,
  },
  toolbarBtn: {
    paddingHorizontal: SPACING.sm, paddingVertical: 6,
    borderRadius: RADIUS.sm, backgroundColor: '#F3F4F6',
  },
  toolbarBtnSort: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EEF2FF' },
  toolbarBtnText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },

  // Video list
  listContent: { padding: SPACING.sm },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    marginBottom: 4,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  videoRowSelected: { backgroundColor: '#EEF2FF', borderWidth: 1.5, borderColor: COLORS.primary },
  checkbox: {
    width: 22, height: 22,
    borderRadius: 6,
    borderWidth: 1.5, borderColor: '#D1D5DB',
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  videoInfo: { flex: 1 },
  videoCleanTitle: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  videoRawTitle: { fontSize: 11, color: COLORS.textTertiary, marginTop: 1 },
  videoMeta: { alignItems: 'flex-end', gap: 4 },
  orderBubble: { backgroundColor: '#E0E7FF', borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2 },
  orderBubbleText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  durationText: { fontSize: 11, color: COLORS.textTertiary },

  // Footer
  footer: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary, paddingVertical: 14,
    borderRadius: RADIUS.md, gap: SPACING.sm,
  },
  primaryBtnDisabled: { backgroundColor: '#D1D5DB' },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },

  // Configure
  configContainer: { padding: SPACING.md, gap: SPACING.md },
  sectionCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: COLORS.textTertiary, marginBottom: SPACING.sm },
  pickerLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: '#D1D5DB',
    marginRight: SPACING.sm,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: '#EEF2FF' },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },
  noModulesText: { fontSize: 13, color: COLORS.textTertiary, fontStyle: 'italic', paddingVertical: SPACING.sm },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  configOrder: {
    width: 34, height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center',
  },
  configOrderText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  configTitleWrap: { flex: 1 },
  configTitleInput: {
    fontSize: 14, fontWeight: '500',
    color: COLORS.textPrimary,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    paddingVertical: 4,
  },
  configRaw: { fontSize: 10, color: COLORS.textTertiary, marginTop: 2 },
  configDuration: { fontSize: 12, color: COLORS.textTertiary, minWidth: 28, textAlign: 'right' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  createBtnDisabled: { backgroundColor: '#D1D5DB' },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
