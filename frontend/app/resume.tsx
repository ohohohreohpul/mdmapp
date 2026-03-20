import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { COLORS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ---------- Types ----------
interface ResumeData {
  _id: string;
  resume_type: 'uploaded' | 'created';
  file_name?: string;
  file_size?: number;
  file_url?: string;
  resume_data?: any;
  ats_score?: number;
  parsed_skills?: string[];
  parse_status: string;
  created_at: string;
}

interface CoverLetter {
  _id: string;
  title: string;
  company_name?: string;
  position?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// ---------- ATS Score Ring ----------
function AtsScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const label = score >= 70 ? 'ดีมาก' : score >= 40 ? 'พอใช้' : 'ควรปรับปรุง';
  return (
    <View style={[ring.wrap, { borderColor: color }]}>
      <Text style={[ring.score, { color }]}>{score}</Text>
      <Text style={[ring.label, { color }]}>{label}</Text>
    </View>
  );
}

const ring = StyleSheet.create({
  wrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  score: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});

// ---------- Cover Letter Modal ----------
interface CLModalProps {
  visible: boolean;
  initial?: CoverLetter | null;
  onClose: () => void;
  onSave: (data: { title: string; company_name: string; position: string; content: string }) => void;
  saving: boolean;
}

function CoverLetterModal({ visible, initial, onClose, onSave, saving }: CLModalProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [company, setCompany] = useState(initial?.company_name || '');
  const [position, setPosition] = useState(initial?.position || '');
  const [content, setContent] = useState(initial?.content || '');

  React.useEffect(() => {
    if (visible) {
      setTitle(initial?.title || '');
      setCompany(initial?.company_name || '');
      setPosition(initial?.position || '');
      setContent(initial?.content || '');
    }
  }, [visible, initial]);

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('กรุณาใส่ชื่อ Cover Letter'); return; }
    if (!content.trim()) { Alert.alert('กรุณาใส่เนื้อหา Cover Letter'); return; }
    onSave({ title: title.trim(), company_name: company.trim(), position: position.trim(), content: content.trim() });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={mod.header}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Text style={mod.cancel}>ยกเลิก</Text>
          </TouchableOpacity>
          <Text style={mod.title}>{initial ? 'แก้ไข Cover Letter' : 'สร้าง Cover Letter'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={mod.save}>บันทึก</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={mod.body} keyboardShouldPersistTaps="handled">
          <Text style={mod.label}>ชื่อ Cover Letter <Text style={{ color: '#EF4444' }}>*</Text></Text>
          <TextInput
            style={mod.input}
            placeholder="เช่น Cover Letter — UX Designer"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#AAA"
          />

          <Text style={mod.label}>บริษัท</Text>
          <TextInput
            style={mod.input}
            placeholder="ชื่อบริษัท"
            value={company}
            onChangeText={setCompany}
            placeholderTextColor="#AAA"
          />

          <Text style={mod.label}>ตำแหน่งที่สมัคร</Text>
          <TextInput
            style={mod.input}
            placeholder="เช่น UX Designer"
            value={position}
            onChangeText={setPosition}
            placeholderTextColor="#AAA"
          />

          <Text style={mod.label}>เนื้อหา <Text style={{ color: '#EF4444' }}>*</Text></Text>
          <TextInput
            style={[mod.input, mod.textarea]}
            placeholder="เขียน Cover Letter ที่นี่..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={12}
            textAlignVertical="top"
            placeholderTextColor="#AAA"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const mod = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  cancel: { fontSize: 16, color: '#6B7280' },
  save: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  body: { padding: 20, gap: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  textarea: { minHeight: 200, paddingTop: 12 },
});

// ---------- Main Screen ----------
export default function ResumeScreen() {
  const router = useRouter();
  const { user } = useUser();

  const [resume, setResume] = useState<ResumeData | null>(null);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [loadingResume, setLoadingResume] = useState(true);
  const [loadingCL, setLoadingCL] = useState(true);

  // Cover letter modal
  const [clModalVisible, setClModalVisible] = useState(false);
  const [editingCL, setEditingCL] = useState<CoverLetter | null>(null);
  const [savingCL, setSavingCL] = useState(false);

  // Delete confirmation state
  const [deletingResume, setDeletingResume] = useState(false);
  const [deletingCLId, setDeletingCLId] = useState<string | null>(null);

  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoadingResume(true);
      const r = await axios.get(`${API_URL}/api/resume/${user._id}`);
      setResume(r.data || null);
    } catch {
      setResume(null);
    } finally {
      setLoadingResume(false);
    }

    try {
      setLoadingCL(true);
      const r = await axios.get(`${API_URL}/api/cover-letters/${user._id}`);
      setCoverLetters(r.data || []);
    } catch {
      setCoverLetters([]);
    } finally {
      setLoadingCL(false);
    }
  }, [user?._id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleDeleteResume = async () => {
    if (!resume) return;
    const rid = resume._id || (resume as any).id;

    if (!deletingResume) {
      // First tap: show confirm state
      setDeletingResume(true);
      setTimeout(() => setDeletingResume(false), 3000);
      return;
    }

    // Second tap: actually delete
    try {
      await axios.delete(`${API_URL}/api/resume/${rid}`);
      setResume(null);
      setDeletingResume(false);
    } catch (e: any) {
      Alert.alert('เกิดข้อผิดพลาด', e?.response?.data?.detail || 'ลบไม่สำเร็จ กรุณาลองใหม่');
      setDeletingResume(false);
    }
  };

  const handleCopyCL = async (cl: CoverLetter) => {
    try {
      // Try expo-clipboard if available
      const Clipboard = require('expo-clipboard');
      await Clipboard.setStringAsync(cl.content);
      Alert.alert('คัดลอกแล้ว', 'เนื้อหา Cover Letter ถูกคัดลอกไปยัง Clipboard');
    } catch {
      // Fallback — just alert the content
      Alert.alert('เนื้อหา Cover Letter', cl.content.slice(0, 200) + (cl.content.length > 200 ? '…' : ''));
    }
  };

  const handleDeleteCL = async (cl: CoverLetter) => {
    const clId = cl._id || (cl as any).id;

    if (deletingCLId !== clId) {
      // First tap: show confirm state
      setDeletingCLId(clId);
      setTimeout(() => setDeletingCLId(null), 3000);
      return;
    }

    // Second tap: actually delete
    try {
      await axios.delete(`${API_URL}/api/cover-letters/${clId}`);
      setCoverLetters(prev => prev.filter(c => (c._id || (c as any).id) !== clId));
      setDeletingCLId(null);
    } catch (e: any) {
      Alert.alert('เกิดข้อผิดพลาด', e?.response?.data?.detail || 'ลบไม่สำเร็จ กรุณาลองใหม่');
      setDeletingCLId(null);
    }
  };

  const handleSaveCL = async (data: { title: string; company_name: string; position: string; content: string }) => {
    if (!user?._id) return;
    setSavingCL(true);
    try {
      if (editingCL) {
        const clId = editingCL._id || (editingCL as any).id;
        const r = await axios.put(`${API_URL}/api/cover-letters/${clId}`, data);
        setCoverLetters(prev => prev.map(c => (c._id || (c as any).id) === clId ? { ...r.data, _id: clId } : c));
      } else {
        const r = await axios.post(`${API_URL}/api/cover-letters`, { user_id: user._id, ...data });
        setCoverLetters(prev => [r.data, ...prev]);
      }
      setClModalVisible(false);
      setEditingCL(null);
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSavingCL(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear() + 543}`;
    } catch {
      return '-';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={s.headerSafe}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Resume & Career</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Resume Section ── */}
        <Text style={s.sectionTitle}>Resume</Text>

        {loadingResume ? (
          <View style={s.card}>
            <ActivityIndicator size="small" color={COLORS.primary} style={{ padding: 32 }} />
          </View>
        ) : resume ? (
          <View style={s.card}>
            {/* Type badge */}
            <View style={s.resumeTop}>
              <View style={[s.typeBadge, resume.resume_type === 'uploaded' ? s.badgeBlue : s.badgePink]}>
                <Ionicons
                  name={resume.resume_type === 'uploaded' ? 'cloud-upload' : 'create'}
                  size={14}
                  color="#FFF"
                />
                <Text style={s.typeBadgeText}>
                  {resume.resume_type === 'uploaded' ? 'อัปโหลด PDF' : 'สร้างจาก Template'}
                </Text>
              </View>

              {/* ATS score */}
              {resume.ats_score !== undefined && resume.ats_score !== null ? (
                <View style={s.atsWrap}>
                  <AtsScoreRing score={resume.ats_score} />
                  <TouchableOpacity style={s.infoBtn} onPress={() => setShowTooltip(v => !v)}>
                    <Ionicons name="information-circle-outline" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Tooltip */}
            {showTooltip && (
              <View style={s.tooltip}>
                <Text style={s.tooltipText}>
                  คะแนน ATS บอกว่า Resume ของคุณอ่านง่ายสำหรับระบบ Applicant Tracking System{' '}
                  ยิ่งสูงยิ่งมีโอกาสผ่านการคัดกรองเบื้องต้น
                </Text>
              </View>
            )}

            {/* Uploaded details */}
            {resume.resume_type === 'uploaded' ? (
              <View style={s.resumeBody}>
                <View style={s.fileRow}>
                  <Ionicons name="document-text" size={20} color="#3B82F6" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={s.fileName} numberOfLines={1}>{resume.file_name || 'resume.pdf'}</Text>
                    <Text style={s.fileMeta}>
                      {formatSize(resume.file_size)}  ·  อัปโหลด {formatDate(resume.created_at)}
                    </Text>
                  </View>
                </View>

                {resume.parsed_skills && resume.parsed_skills.length > 0 && (
                  <View style={s.skillsWrap}>
                    {resume.parsed_skills.slice(0, 8).map(sk => (
                      <View key={sk} style={s.skillChip}>
                        <Text style={s.skillChipText}>{sk}</Text>
                      </View>
                    ))}
                    {resume.parsed_skills.length > 8 && (
                      <View style={s.skillChip}>
                        <Text style={s.skillChipText}>+{resume.parsed_skills.length - 8}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={s.actionRow}>
                  {resume.file_url ? (
                    <TouchableOpacity style={s.actionBtnBlue} onPress={() => Linking.openURL(resume.file_url!)}>
                      <Ionicons name="eye" size={16} color="#FFF" />
                      <Text style={s.actionBtnText}>ดู PDF</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={s.actionBtnOutline} onPress={() => router.push('/resume-setup' as any)}>
                    <Ionicons name="refresh" size={16} color="#3B82F6" />
                    <Text style={s.actionBtnOutlineText}>อัปโหลดใหม่</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtnDanger, deletingResume && { backgroundColor: '#FECACA' }]} onPress={handleDeleteResume}>
                    {deletingResume ? (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>ยืนยัน?</Text>
                    ) : (
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Created template details */
              <View style={s.resumeBody}>
                <Text style={s.createdName}>
                  {resume.resume_data?.full_name || user?.display_name || user?.username}
                </Text>
                <Text style={s.createdEmail}>{resume.resume_data?.email || user?.email}</Text>

                {resume.resume_data?.skills?.length > 0 && (
                  <View style={s.skillsWrap}>
                    {resume.resume_data.skills.slice(0, 8).map((sk: string) => (
                      <View key={sk} style={s.skillChip}>
                        <Text style={s.skillChipText}>{sk}</Text>
                      </View>
                    ))}
                    {resume.resume_data.skills.length > 8 && (
                      <View style={s.skillChip}>
                        <Text style={s.skillChipText}>+{resume.resume_data.skills.length - 8}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={s.actionRow}>
                  <TouchableOpacity style={s.actionBtnPink} onPress={() => router.push('/resume-preview' as any)}>
                    <Ionicons name="eye" size={16} color="#FFF" />
                    <Text style={s.actionBtnText}>ดู Resume</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtnOutline} onPress={() => router.push('/resume-setup' as any)}>
                    <Ionicons name="pencil" size={16} color={COLORS.primary} />
                    <Text style={s.actionBtnOutlineText}>แก้ไข</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtnDanger, deletingResume && { backgroundColor: '#FECACA' }]} onPress={handleDeleteResume}>
                    {deletingResume ? (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>ยืนยัน?</Text>
                    ) : (
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ATS Tips */}
            {resume.ats_score !== undefined && resume.ats_score < 60 && (
              <View style={s.tipBox}>
                <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                <Text style={s.tipText}>
                  เพิ่มคะแนน ATS: ใส่หัวข้อชัดเจน (Experience, Education, Skills), เพิ่มทักษะที่เกี่ยวข้อง, ใส่เบอร์โทรและอีเมล
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Empty state */
          <View style={[s.card, s.emptyCard]}>
            <Ionicons name="document-text-outline" size={52} color="#D1D5DB" />
            <Text style={s.emptyTitle}>ยังไม่มี Resume</Text>
            <Text style={s.emptySubtitle}>สร้างหรืออัปโหลด Resume เพื่อเข้าร่วม Talent Pool</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/resume-setup' as any)}>
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={s.emptyBtnText}>สร้าง Resume</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Cover Letters Section ── */}
        <View style={s.clHeader}>
          <Text style={s.sectionTitle}>Cover Letters</Text>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => { setEditingCL(null); setClModalVisible(true); }}
          >
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={s.addBtnText}>สร้าง</Text>
          </TouchableOpacity>
        </View>

        {loadingCL ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 16 }} />
        ) : coverLetters.length === 0 ? (
          <View style={[s.card, s.emptyCard]}>
            <Ionicons name="mail-outline" size={44} color="#D1D5DB" />
            <Text style={s.emptyTitle}>ยังไม่มี Cover Letter</Text>
            <Text style={s.emptySubtitle}>สร้าง Cover Letter สำหรับแต่ละตำแหน่งงาน</Text>
          </View>
        ) : (
          coverLetters.map(cl => (
            <View key={cl._id} style={s.clCard}>
              <View style={s.clMain}>
                <Text style={s.clTitle} numberOfLines={1}>{cl.title}</Text>
                {(cl.company_name || cl.position) && (
                  <Text style={s.clMeta} numberOfLines={1}>
                    {[cl.company_name, cl.position].filter(Boolean).join(' · ')}
                  </Text>
                )}
                <Text style={s.clDate}>อัปเดต {formatDate(cl.updated_at)}</Text>
              </View>
              <View style={s.clActions}>
                <TouchableOpacity style={s.clBtn} onPress={() => handleCopyCL(cl)}>
                  <Ionicons name="copy-outline" size={18} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity style={s.clBtn} onPress={() => { setEditingCL(cl); setClModalVisible(true); }}>
                  <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.clBtn, deletingCLId === (cl._id || (cl as any).id) && { backgroundColor: '#FECACA' }]}
                  onPress={() => handleDeleteCL(cl)}
                >
                  {deletingCLId === (cl._id || (cl as any).id) ? (
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#DC2626' }}>ยืนยัน?</Text>
                  ) : (
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Cover Letter Modal */}
      <CoverLetterModal
        visible={clModalVisible}
        initial={editingCL}
        onClose={() => { setClModalVisible(false); setEditingCL(null); }}
        onSave={handleSaveCL}
        saving={savingCL}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  headerSafe: { backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    backgroundColor: '#FFF',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  scroll: { padding: 20 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#374151',
    marginBottom: 12, marginTop: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  resumeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeBlue: { backgroundColor: '#3B82F6' },
  badgePink: { backgroundColor: COLORS.primary },
  typeBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  atsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoBtn: { padding: 4 },
  tooltip: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  tooltipText: { fontSize: 13, color: '#FFF', lineHeight: 20 },
  resumeBody: { gap: 12 },
  fileRow: { flexDirection: 'row', alignItems: 'center' },
  fileName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  fileMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  skillChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  skillChipText: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  actionBtnBlue: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#3B82F6', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  actionBtnPink: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  actionBtnOutline: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  actionBtnOutlineText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  actionBtnDanger: {
    width: 44, height: 44,
    borderRadius: 10, backgroundColor: '#FEE2E2',
    justifyContent: 'center', alignItems: 'center',
  },
  createdName: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  createdEmail: { fontSize: 13, color: '#6B7280' },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 20 },
  emptyCard: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#6B7280', marginTop: 4 },
  emptySubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  clHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  clCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clMain: { flex: 1 },
  clTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  clMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  clDate: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  clActions: { flexDirection: 'row', gap: 4 },
  clBtn: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
});
