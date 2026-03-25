/**
 * Bunny Import  –  Collection → Videos → Create Lessons
 *
 * Routes through the backend (PWA-safe, no CORS issues).
 * Backend reads Bunny credentials from admin_settings table.
 *
 * Flow:
 *   1. Load Collections  →  each collection ≈ one course
 *   2. Tap a collection  →  load its videos
 *   3. Multi-select videos  →  auto-parse titles from filenames
 *   4. Edit titles inline, pick target module, create lessons
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BunnyCollection { guid: string; name: string; video_count: number }
interface BunnyVideo      { guid: string; title: string; length: number; embed_url: string }

interface ImportRow {
  guid: string; embedUrl: string; rawTitle: string
  cleanTitle: string; order: number; durationMin: number; selected: boolean
}

interface Course  { _id: string; title: string }
interface Module  { _id: string; title: string; order: number }

type Phase = 'idle' | 'loadingCollections' | 'collections'
           | 'loadingVideos' | 'select' | 'configure' | 'creating'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseTitle(raw: string): { cleanTitle: string; order: number } {
  let t = raw.replace(/\.[^.]+$/, '').trim();

  // Leading numeric order: "01_", "16 ", "16."
  let order = 0;
  const m = t.match(/^(\d+)[_.\s]/);
  if (m) { order = parseInt(m[1], 10); t = t.slice(m[0].length); }

  // _wk / _WK suffix = workshop
  const isWk = /_wk$/i.test(t);
  if (isWk) t = t.replace(/_wk$/i, '');

  // CamelCase → spaced
  t = t.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  // Underscores / dashes → spaces
  t = t.replace(/[_-]+/g, ' ').trim();

  // Title-case (keep small words lowercase unless first)
  const small = new Set(['in','on','of','and','or','to','the','a','an','for','with']);
  t = t.split(/\s+/)
       .map((w, i) => (!i || !small.has(w.toLowerCase()))
         ? w.charAt(0).toUpperCase() + w.slice(1)
         : w.toLowerCase())
       .join(' ');

  if (isWk) t += ' (Workshop)';
  return { cleanTitle: t || raw, order };
}

function secToMin(s: number) { return Math.round(s / 60); }

// ─── Component ────────────────────────────────────────────────────────────────
export default function BunnyImport() {
  const router = useRouter();

  const [phase, setPhase]       = useState<Phase>('idle');
  const [collections, setCollections] = useState<BunnyCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<BunnyCollection | null>(null);
  const [rows, setRows]         = useState<ImportRow[]>([]);
  const [sortByNum, setSortByNum] = useState(true);

  // Phase 2 – target
  const [courses, setCourses]           = useState<Course[]>([]);
  const [selectedCourseId, setSelCourse] = useState('');
  const [modules, setModules]           = useState<Module[]>([]);
  const [selectedModuleId, setSelModule] = useState('');
  const [loadingMods, setLoadingMods]   = useState(false);

  const selectedRows = useMemo(() => rows.filter(r => r.selected), [rows]);
  const sortedRows   = useMemo(() => [...rows].sort((a, b) =>
    sortByNum ? (a.order - b.order || a.rawTitle.localeCompare(b.rawTitle))
              : a.rawTitle.localeCompare(b.rawTitle)
  ), [rows, sortByNum]);

  // ── 1. Load Collections ───────────────────────────────────────────────────
  const loadCollections = useCallback(async () => {
    try {
      setPhase('loadingCollections');
      const res = await axios.get(`${API_URL}/api/bunny/collections`);
      const items: BunnyCollection[] = res.data?.collections ?? [];
      setCollections(items);
      setPhase('collections');
    } catch (e: any) {
      Alert.alert('ผิดพลาด', e?.response?.data?.detail ?? e?.message ?? 'โหลด Collections ไม่สำเร็จ\nตรวจสอบ Bunny API Key ใน Admin → ตั้งค่าระบบ');
      setPhase('idle');
    }
  }, []);

  // ── 2. Load Videos in Collection ─────────────────────────────────────────
  const loadVideos = useCallback(async (col: BunnyCollection) => {
    try {
      setActiveCollection(col);
      setPhase('loadingVideos');

      const [videosRes, coursesRes] = await Promise.all([
        axios.get(`${API_URL}/api/bunny/videos?collection_id=${col.guid}`),
        axios.get(`${API_URL}/api/courses`),
      ]);

      const videos: BunnyVideo[] = videosRes.data?.videos ?? [];
      if (!videos.length) {
        Alert.alert('ไม่พบวิดีโอ', 'Collection นี้ว่างเปล่า');
        setPhase('collections');
        return;
      }

      setRows(videos.map(v => {
        const { cleanTitle, order } = parseTitle(v.title);
        return {
          guid: v.guid, embedUrl: v.embed_url,
          rawTitle: v.title, cleanTitle, order,
          durationMin: secToMin(v.length), selected: false,
        };
      }));

      setCourses(coursesRes.data ?? []);
      setPhase('select');
    } catch (e: any) {
      Alert.alert('ผิดพลาด', e?.response?.data?.Message ?? e?.message ?? 'โหลดวิดีโอไม่สำเร็จ');
      setPhase('collections');
    }
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggle    = (guid: string) => setRows(p => p.map(r => r.guid === guid ? {...r, selected: !r.selected} : r));
  const selectAll = () => setRows(p => p.map(r => ({...r, selected: true})));
  const clearAll  = () => setRows(p => p.map(r => ({...r, selected: false})));
  const editTitle = (guid: string, v: string) => setRows(p => p.map(r => r.guid === guid ? {...r, cleanTitle: v} : r));

  const onSelectCourse = async (id: string) => {
    setSelCourse(id); setSelModule(''); setModules([]);
    if (!id) return;
    try {
      setLoadingMods(true);
      const res = await axios.get(`${API_URL}/api/modules/course/${id}`);
      setModules(res.data ?? []);
    } catch { Alert.alert('ผิดพลาด', 'โหลดโมดูลไม่สำเร็จ'); }
    finally { setLoadingMods(false); }
  };

  // ── Create Lessons ────────────────────────────────────────────────────────
  const createLessons = useCallback(async () => {
    if (!selectedModuleId) { Alert.alert('เลือกโมดูล', 'กรุณาเลือก Module ก่อน'); return; }
    const toCreate = [...selectedRows].sort((a, b) => a.order - b.order || a.rawTitle.localeCompare(b.rawTitle));

    Alert.alert('ยืนยัน', `สร้าง ${toCreate.length} บทเรียน?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'สร้าง', onPress: async () => {
        setPhase('creating');
        let ok = 0, fail = 0, base = 1;
        try {
          const ex = await axios.get(`${API_URL}/api/lessons/module/${selectedModuleId}`);
          base = (ex.data ?? []).length + 1;
        } catch {}

        for (let i = 0; i < toCreate.length; i++) {
          const r = toCreate[i];
          try {
            await axios.post(`${API_URL}/api/lessons`, {
              module_id: selectedModuleId,
              title: r.cleanTitle.trim() || r.rawTitle,
              description: '', order: base + i,
              content_type: 'video',
              video_url: r.embedUrl,
              video_id: r.guid,
              duration_minutes: r.durationMin || undefined,
            });
            ok++;
          } catch { fail++; }
        }

        Alert.alert('เสร็จ! 🎉',
          `สร้างสำเร็จ ${ok} บทเรียน${fail ? `\nล้มเหลว ${fail}` : ''}`,
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }},
    ]);
  }, [selectedRows, selectedModuleId]);

  // ─── Render ───────────────────────────────────────────────────────────────
  const back = () => {
    if (phase === 'configure')    setPhase('select');
    else if (phase === 'select')  setPhase('collections');
    else if (phase === 'collections') setPhase('idle');
    else router.back();
  };

  const stepLabel: Partial<Record<Phase, string>> = {
    collections: 'เลือก Collection',
    select: 'เลือกวิดีโอ',
    configure: 'ตั้งค่าบทเรียน',
  };

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={s.headerSafe}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={back}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{flex:1}}>
            <Text style={s.headerTitle}>🐰 Import from Bunny.net</Text>
            {stepLabel[phase] ? <Text style={s.headerSub}>{stepLabel[phase]}</Text> : null}
          </View>
          {['collections','select','configure'].includes(phase) && (
            <View style={s.dots}>
              {(['collections','select','configure'] as Phase[]).map(p => (
                <View key={p} style={[s.dot, phase === p && s.dotActive]} />
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* ── IDLE ── */}
      {phase === 'idle' && (
        <View style={s.center}>
          <Text style={{fontSize:56}}>🎬</Text>
          <Text style={s.heroTitle}>สร้างบทเรียนจากวิดีโอ</Text>
          <Text style={s.heroDesc}>
            ดึง Collections จาก Bunny.net ตรงๆ เลือกวิดีโอ แก้ชื่อ แล้วสร้างบทเรียนในคลิกเดียว
          </Text>
          <TouchableOpacity style={s.primaryBtn} onPress={loadCollections}>
            <Ionicons name="cloud-download-outline" size={20} color="#fff" />
            <Text style={s.primaryBtnTxt}>ดู Collections ใน Bunny</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── LOADING ── */}
      {(phase === 'loadingCollections' || phase === 'loadingVideos' || phase === 'creating') && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadTxt}>
            {phase === 'creating' ? 'กำลังสร้างบทเรียน…'
              : phase === 'loadingVideos' ? 'กำลังโหลดวิดีโอ…'
              : 'กำลังโหลด Collections…'}
          </Text>
        </View>
      )}

      {/* ── COLLECTIONS ── */}
      {phase === 'collections' && (
        <FlatList
          data={collections}
          keyExtractor={c => c.guid}
          contentContainerStyle={s.listPad}
          ListEmptyComponent={<Text style={s.emptyTxt}>ไม่พบ Collection ใน Library นี้</Text>}
          renderItem={({ item: c }) => (
            <TouchableOpacity style={s.colCard} onPress={() => loadVideos(c)} activeOpacity={0.75}>
              <View style={s.colIcon}>
                <Ionicons name="folder-open" size={28} color={COLORS.primary} />
              </View>
              <View style={{flex:1}}>
                <Text style={s.colName}>{c.name}</Text>
                <Text style={s.colCount}>{c.video_count} วิดีโอ</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* ── SELECT ── */}
      {phase === 'select' && (
        <>
          <View style={s.toolbar}>
            <TouchableOpacity style={s.tbBtn} onPress={selectAll}>
              <Text style={s.tbTxt}>เลือกทั้งหมด</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.tbBtn} onPress={clearAll}>
              <Text style={s.tbTxt}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tbBtn, s.tbSort]} onPress={() => setSortByNum(v => !v)}>
              <Ionicons name="swap-vertical" size={14} color={COLORS.primary} />
              <Text style={[s.tbTxt, {color: COLORS.primary}]}>
                {sortByNum ? 'เรียงตามเลข' : 'A–Z'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={sortedRows}
            keyExtractor={r => r.guid}
            contentContainerStyle={s.listPad}
            renderItem={({ item: r }) => (
              <TouchableOpacity
                style={[s.vidRow, r.selected && s.vidRowSel]}
                onPress={() => toggle(r.guid)} activeOpacity={0.7}
              >
                <View style={[s.check, r.selected && s.checkOn]}>
                  {r.selected && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
                <View style={{flex:1}}>
                  <Text style={s.vidClean}>{r.cleanTitle}</Text>
                  <Text style={s.vidRaw} numberOfLines={1}>{r.rawTitle}</Text>
                </View>
                <View style={{alignItems:'flex-end', gap:4}}>
                  {r.order > 0 && (
                    <View style={s.badge}>
                      <Text style={s.badgeTxt}>#{r.order}</Text>
                    </View>
                  )}
                  {r.durationMin > 0 && <Text style={s.dur}>{r.durationMin}m</Text>}
                </View>
              </TouchableOpacity>
            )}
          />

          <View style={s.footer}>
            <TouchableOpacity
              style={[s.primaryBtn, !selectedRows.length && s.btnDisabled]}
              onPress={() => selectedRows.length ? setPhase('configure') : Alert.alert('เลือกวิดีโอก่อน','')}
              disabled={!selectedRows.length}
            >
              <Text style={s.primaryBtnTxt}>ต่อไป — {selectedRows.length} วิดีโอ</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── CONFIGURE ── */}
      {phase === 'configure' && (
        <ScrollView style={{flex:1}} contentContainerStyle={s.configPad}>

          {/* Course picker */}
          <View style={s.card}>
            <Text style={s.cardTitle}>📁 เลือก Course และ Module</Text>
            <Text style={s.cardHint}>Collection: {activeCollection?.name}</Text>
            <Text style={s.pickerLbl}>Course</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {courses.map(c => (
                <TouchableOpacity
                  key={c._id}
                  style={[s.chip, selectedCourseId === c._id && s.chipOn]}
                  onPress={() => onSelectCourse(c._id)}
                >
                  <Text style={[s.chipTxt, selectedCourseId === c._id && s.chipTxtOn]}>
                    {c.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedCourseId ? (
              <>
                <Text style={[s.pickerLbl, {marginTop: SPACING.md}]}>Module</Text>
                {loadingMods
                  ? <ActivityIndicator size="small" color={COLORS.primary} style={{margin: SPACING.sm}} />
                  : modules.length === 0
                    ? <Text style={s.noMod}>ยังไม่มีโมดูล — กรุณาสร้างโมดูลก่อน</Text>
                    : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {modules.map(m => (
                          <TouchableOpacity
                            key={m._id}
                            style={[s.chip, selectedModuleId === m._id && s.chipOn]}
                            onPress={() => setSelModule(m._id)}
                          >
                            <Text style={[s.chipTxt, selectedModuleId === m._id && s.chipTxtOn]}>
                              {m.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )
                }
              </>
            ) : null}
          </View>

          {/* Title editor */}
          <View style={s.card}>
            <Text style={s.cardTitle}>✏️ ชื่อบทเรียน (แก้ไขได้)</Text>
            <Text style={s.cardHint}>ชื่อแปลงจากชื่อไฟล์อัตโนมัติ — แตะเพื่อแก้ไข</Text>
            {[...selectedRows]
              .sort((a,b) => a.order - b.order || a.rawTitle.localeCompare(b.rawTitle))
              .map(r => (
                <View key={r.guid} style={s.cfgRow}>
                  <View style={s.cfgNum}>
                    <Text style={s.cfgNumTxt}>{r.order > 0 ? `#${r.order}` : '—'}</Text>
                  </View>
                  <View style={{flex:1}}>
                    <TextInput
                      style={s.cfgInput}
                      value={r.cleanTitle}
                      onChangeText={v => editTitle(r.guid, v)}
                      returnKeyType="done"
                    />
                    <Text style={s.cfgRaw} numberOfLines={1}>{r.rawTitle}</Text>
                  </View>
                  {r.durationMin > 0 && <Text style={s.dur}>{r.durationMin}m</Text>}
                </View>
              ))
            }
          </View>

          <TouchableOpacity
            style={[s.createBtn, !selectedModuleId && s.btnDisabled]}
            onPress={createLessons}
            disabled={!selectedModuleId}
          >
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={s.createBtnTxt}>สร้าง {selectedRows.length} บทเรียน</Text>
          </TouchableOpacity>

          <View style={{height:32}} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex:1, backgroundColor: COLORS.surface },
  headerSafe: { backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    flexDirection:'row', alignItems:'center', gap: SPACING.sm,
    borderBottomWidth:1, borderBottomColor:'#E5E7EB',
  },
  backBtn: { width:36, height:36, borderRadius:18, justifyContent:'center', alignItems:'center' },
  headerTitle: { fontSize:16, fontWeight:'700', color: COLORS.textPrimary },
  headerSub:   { fontSize:12, color: COLORS.textSecondary, marginTop:1 },
  dots: { flexDirection:'row', alignItems:'center', gap:5 },
  dot:  { width:8, height:8, borderRadius:4, backgroundColor:'#D1D5DB' },
  dotActive: { backgroundColor: COLORS.primary },

  center: { flex:1, alignItems:'center', justifyContent:'center', paddingHorizontal: SPACING.xl, gap: SPACING.md },
  heroTitle: { fontSize:22, fontWeight:'700', color: COLORS.textPrimary, textAlign:'center' },
  heroDesc:  { fontSize:14, color: COLORS.textSecondary, textAlign:'center', lineHeight:22 },
  loadTxt:   { marginTop: SPACING.md, fontSize:15, color: COLORS.textSecondary },
  emptyTxt:  { textAlign:'center', color: COLORS.textTertiary, marginTop: SPACING.xl },

  listPad: { padding: SPACING.sm },

  // Collections
  colCard: {
    flexDirection:'row', alignItems:'center', gap: SPACING.md,
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.small,
  },
  colIcon: {
    width:52, height:52, borderRadius: RADIUS.md,
    backgroundColor:'#EEF2FF', justifyContent:'center', alignItems:'center',
  },
  colName:  { fontSize:15, fontWeight:'600', color: COLORS.textPrimary },
  colCount: { fontSize:12, color: COLORS.textSecondary, marginTop:2 },

  // Toolbar
  toolbar: {
    flexDirection:'row', alignItems:'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth:1, borderBottomColor:'#E5E7EB', gap: SPACING.sm,
  },
  tbBtn:  { paddingHorizontal: SPACING.sm, paddingVertical:6, borderRadius: RADIUS.sm, backgroundColor:'#F3F4F6' },
  tbSort: { marginLeft:'auto', flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#EEF2FF' },
  tbTxt:  { fontSize:12, color: COLORS.textSecondary, fontWeight:'500' },

  // Video rows
  vidRow: {
    flexDirection:'row', alignItems:'center', gap: SPACING.sm,
    backgroundColor: COLORS.background, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md, paddingVertical:10, marginBottom:4, ...SHADOWS.small,
  },
  vidRowSel: { backgroundColor:'#EEF2FF', borderWidth:1.5, borderColor: COLORS.primary },
  check:  { width:22, height:22, borderRadius:6, borderWidth:1.5, borderColor:'#D1D5DB', justifyContent:'center', alignItems:'center' },
  checkOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  vidClean: { fontSize:14, fontWeight:'500', color: COLORS.textPrimary },
  vidRaw:   { fontSize:11, color: COLORS.textTertiary, marginTop:1 },
  badge:    { backgroundColor:'#E0E7FF', borderRadius:99, paddingHorizontal:7, paddingVertical:2 },
  badgeTxt: { fontSize:11, fontWeight:'700', color:'#4F46E5' },
  dur:      { fontSize:11, color: COLORS.textTertiary },

  // Footer
  footer: { backgroundColor: COLORS.background, padding: SPACING.md, borderTopWidth:1, borderTopColor:'#E5E7EB' },

  // Buttons
  primaryBtn: {
    flexDirection:'row', alignItems:'center', justifyContent:'center',
    backgroundColor: COLORS.primary, paddingVertical:14, borderRadius: RADIUS.md, gap: SPACING.sm,
  },
  primaryBtnTxt: { color:'#fff', fontSize:15, fontWeight:'600' },
  createBtn: {
    flexDirection:'row', alignItems:'center', justifyContent:'center',
    backgroundColor: COLORS.primary, paddingVertical:16, borderRadius: RADIUS.md,
    gap: SPACING.sm, marginTop: SPACING.sm,
  },
  createBtnTxt: { color:'#fff', fontSize:16, fontWeight:'700' },
  btnDisabled:  { backgroundColor:'#D1D5DB' },

  // Configure
  configPad: { padding: SPACING.md, gap: SPACING.md },
  card: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, ...SHADOWS.small },
  cardTitle: { fontSize:15, fontWeight:'700', color: COLORS.textPrimary, marginBottom:2 },
  cardHint:  { fontSize:12, color: COLORS.textTertiary, marginBottom: SPACING.sm },
  pickerLbl: { fontSize:13, fontWeight:'600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  chip:    { paddingHorizontal: SPACING.md, paddingVertical:8, borderRadius:99, borderWidth:1.5, borderColor:'#D1D5DB', marginRight: SPACING.sm, backgroundColor: COLORS.background },
  chipOn:  { borderColor: COLORS.primary, backgroundColor:'#EEF2FF' },
  chipTxt: { fontSize:13, color: COLORS.textSecondary, fontWeight:'500' },
  chipTxtOn: { color: COLORS.primary, fontWeight:'700' },
  noMod:   { fontSize:13, color: COLORS.textTertiary, fontStyle:'italic', paddingVertical: SPACING.sm },
  cfgRow:  { flexDirection:'row', alignItems:'center', gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth:1, borderBottomColor:'#F3F4F6' },
  cfgNum:  { width:34, height:34, borderRadius:17, backgroundColor:'#EEF2FF', justifyContent:'center', alignItems:'center' },
  cfgNumTxt: { fontSize:11, fontWeight:'700', color:'#4F46E5' },
  cfgInput: { fontSize:14, fontWeight:'500', color: COLORS.textPrimary, borderBottomWidth:1, borderBottomColor:'#E5E7EB', paddingVertical:4 },
  cfgRaw:   { fontSize:10, color: COLORS.textTertiary, marginTop:2 },
});
