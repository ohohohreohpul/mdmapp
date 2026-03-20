import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { COLORS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// ── Section divider ────────────────────────────────────────────
function SectionDivider({ title }: { title: string }) {
  return (
    <View style={d.wrap}>
      <Text style={d.title}>{title}</Text>
      <View style={d.line} />
    </View>
  );
}
const d = StyleSheet.create({
  wrap: { marginTop: 20, marginBottom: 10 },
  title: { fontSize: 13, fontWeight: '800', color: '#374151', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  line: { height: 1.5, backgroundColor: '#E5E7EB' },
});

// ── Skill chip ─────────────────────────────────────────────────
function SkillChip({ label }: { label: string }) {
  return (
    <View style={sc.chip}>
      <Text style={sc.text}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  chip: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, margin: 3 },
  text: { fontSize: 12, fontWeight: '600', color: '#374151' },
});

// ── ATS badge ─────────────────────────────────────────────────
function AtsBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const label = score >= 70 ? 'ดีมาก' : score >= 40 ? 'พอใช้' : 'ควรปรับปรุง';
  return (
    <View style={[ab.wrap, { borderColor: color }]}>
      <Text style={[ab.score, { color }]}>{score}</Text>
      <Text style={[ab.label, { color }]}>{label}</Text>
    </View>
  );
}
const ab = StyleSheet.create({
  wrap: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  score: { fontSize: 18, fontWeight: '800', lineHeight: 20 },
  label: { fontSize: 9, fontWeight: '700' },
});

// ── Main screen ────────────────────────────────────────────────
export default function ResumePreview() {
  const router = useRouter();
  const { user } = useUser();
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!user?._id) return;
    setLoading(true);
    axios.get(`${API_URL}/api/resume/${user._id}`)
      .then(r => setResume(r.data || null))
      .catch(() => setResume(null))
      .finally(() => setLoading(false));
  }, [user?._id]));

  const handleExportPDF = async () => {
    if (!resume || !user?._id) return;
    setExporting(true);
    try {
      const url = `${API_URL}/api/resume/${user._id}/export-pdf`;

      if (Platform.OS === 'web') {
        // Web: trigger browser download directly
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setExporting(false);
        return;
      }

      // Native (iOS/Android): download then share
      const fileName = `resume_${Date.now()}.pdf`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      const result = await FileSystem.downloadAsync(url, filePath, {
        headers: { Accept: 'application/pdf' },
      });

      if (result.status !== 200) throw new Error(`Server error ${result.status}`);

      await Sharing.shareAsync(result.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'บันทึก Resume',
        UTI: 'com.adobe.pdf',
      });
    } catch (e: any) {
      Alert.alert('Export ไม่สำเร็จ', e?.message || 'ลองใหม่อีกครั้ง');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!resume || resume.resume_type !== 'created') {
    return (
      <SafeAreaView style={s.container} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Resume</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}>
          <Ionicons name="document-text-outline" size={52} color="#D1D5DB" />
          <Text style={s.emptyText}>ไม่พบ Resume</Text>
          <TouchableOpacity style={s.createBtn} onPress={() => router.push('/resume-setup' as any)}>
            <Text style={s.createBtnText}>สร้าง Resume</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const data = resume.resume_data || {};
  const skills: string[]       = data.skills || [];
  const workExp: any[]         = data.work_experience || [];
  const education: any[]       = data.education || [];
  const languages: any[]       = data.languages || [];
  const certifications: any[]  = data.certifications || [];

  return (
    <View style={s.container}>
      {/* Toolbar */}
      <SafeAreaView edges={['top']} style={s.toolbarSafe}>
        <View style={s.toolbar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Resume</Text>
          <TouchableOpacity
            style={s.exportBtn}
            onPress={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="download-outline" size={20} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Paper card ── */}
        <View style={s.paper}>

          {/* Header block */}
          <Text style={s.name}>{data.full_name || user?.display_name || user?.username}</Text>
          <View style={s.contactRow}>
            {data.email && (
              <View style={s.contactItem}>
                <Ionicons name="mail-outline" size={13} color="#6B7280" />
                <Text style={s.contactText}>{data.email}</Text>
              </View>
            )}
            {data.phone && (
              <View style={s.contactItem}>
                <Ionicons name="call-outline" size={13} color="#6B7280" />
                <Text style={s.contactText}>{data.phone}</Text>
              </View>
            )}
            {data.linkedin && (
              <TouchableOpacity
                style={s.contactItem}
                onPress={() => {
                  const url = data.linkedin.startsWith('http') ? data.linkedin : `https://${data.linkedin}`;
                  Linking.openURL(url);
                }}
              >
                <Ionicons name="logo-linkedin" size={13} color="#0A66C2" />
                <Text style={[s.contactText, { color: '#0A66C2' }]} numberOfLines={1}>LinkedIn</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Skills */}
          {skills.length > 0 && (
            <>
              <SectionDivider title="ทักษะ" />
              <View style={s.chipWrap}>
                {skills.map((sk, i) => <SkillChip key={i} label={sk} />)}
              </View>
            </>
          )}

          {/* Work Experience */}
          {workExp.length > 0 && (
            <>
              <SectionDivider title="ประสบการณ์ทำงาน" />
              {workExp.map((job: any, i: number) => (
                <View key={i} style={s.entry}>
                  <View style={s.entryTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.entryTitle}>{job.role}</Text>
                      <Text style={s.entryOrg}>{job.company}</Text>
                    </View>
                    <Text style={s.entryDate}>
                      {[job.start_date, job.end_date].filter(Boolean).join(' – ')}
                    </Text>
                  </View>
                  {Array.isArray(job.bullets) && job.bullets.map((b: string, bi: number) => (
                    <View key={bi} style={s.bullet}>
                      <Text style={s.bulletDot}>•</Text>
                      <Text style={s.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}

          {/* Education */}
          {education.length > 0 && (
            <>
              <SectionDivider title="การศึกษา" />
              {education.map((edu: any, i: number) => (
                <View key={i} style={s.entry}>
                  <View style={s.entryTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.entryTitle}>{edu.degree}{edu.field ? `, ${edu.field}` : ''}</Text>
                      <Text style={s.entryOrg}>{edu.institution}</Text>
                    </View>
                    {edu.graduation_year && (
                      <Text style={s.entryDate}>{edu.graduation_year}</Text>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <>
              <SectionDivider title="ภาษา" />
              <View style={s.langGrid}>
                {languages.map((lang: any, i: number) => (
                  <View key={i} style={s.langItem}>
                    <Text style={s.langName}>{lang.language}</Text>
                    <Text style={s.langLevel}>{lang.level}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <>
              <SectionDivider title="ใบประกาศนียบัตร" />
              {certifications.map((cert: any, i: number) => (
                <View key={i} style={s.certItem}>
                  <View style={s.certLeft}>
                    {cert.is_mydemy && (
                      <View style={s.mydemyBadge}>
                        <Ionicons name="ribbon" size={10} color={COLORS.primary} />
                        <Text style={s.mydemyBadgeText}>Mydemy</Text>
                      </View>
                    )}
                    <Text style={s.certName}>{cert.name}</Text>
                    <Text style={s.certIssuer}>
                      {cert.issuer}{cert.year ? ` · ${cert.year}` : ''}
                    </Text>
                  </View>
                  {cert.url ? (
                    <TouchableOpacity onPress={() => Linking.openURL(cert.url)}>
                      <Ionicons name="open-outline" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </>
          )}
        </View>

        {/* ATS tip */}
        {resume.ats_score != null && resume.ats_score < 60 && (
          <View style={s.tipBox}>
            <Ionicons name="bulb-outline" size={16} color="#F59E0B" />
            <Text style={s.tipText}>
              เพิ่มคะแนน ATS ด้วยการเพิ่มทักษะ, ประสบการณ์ทำงาน, ใบประกาศ หรือภาษา
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  toolbarSafe: { backgroundColor: '#FFF' },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#EBEBEB', backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#EBEBEB', backgroundColor: '#FFF',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
  },
  exportBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },

  scroll: { padding: 16 },

  // Paper card — mimics a real document
  paper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  // Header
  name: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8, letterSpacing: -0.3 },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contactText: { fontSize: 12, color: '#6B7280' },

  // Skills chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 },

  // Work / Edu entry
  entry: { marginBottom: 16 },
  entryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  entryTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  entryOrg: { fontSize: 13, color: '#6B7280', marginTop: 1 },
  entryDate: { fontSize: 12, color: '#9CA3AF', marginLeft: 8, flexShrink: 0 },
  bullet: { flexDirection: 'row', gap: 6, marginTop: 3 },
  bulletDot: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  bulletText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 20 },

  // Languages
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  langItem: {
    backgroundColor: '#F9FAFB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E5E7EB', minWidth: 140,
  },
  langName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  langLevel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Certifications
  certItem: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  certLeft: { flex: 1 },
  certName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  certIssuer: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  mydemyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    alignSelf: 'flex-start', backgroundColor: '#fce7f3',
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4,
  },
  mydemyBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },

  // Tips
  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  tipText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 20 },

  emptyText: { fontSize: 16, fontWeight: '600', color: '#9CA3AF' },
  createBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  createBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
