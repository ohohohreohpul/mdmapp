import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

type Step = 'choice' | 'upload' | 'create' | 'done';

interface WorkEntry { company: string; role: string; start_date: string; end_date: string; bullets: string; }
interface EduEntry  { institution: string; degree: string; field: string; graduation_year: string; }
interface LangEntry { language: string; level: string; }
interface CertEntry { name: string; issuer: string; year: string; url: string; is_mydemy: boolean; }

const EMPTY_WORK: WorkEntry = { company: '', role: '', start_date: '', end_date: '', bullets: '' };
const EMPTY_EDU:  EduEntry  = { institution: '', degree: '', field: '', graduation_year: '' };
const EMPTY_LANG: LangEntry = { language: '', level: '' };
const EMPTY_CERT: CertEntry = { name: '', issuer: '', year: '', url: '', is_mydemy: false };

const LEVEL_OPTIONS = ['Native', 'Fluent / C1-C2', 'Upper-Intermediate / B2', 'Intermediate / B1', 'Basic / A1-A2'];

export default function ResumeSetup() {
  const router = useRouter();
  const { user, markResumeSetup } = useUser();

  const [step, setStep] = useState<Step>('choice');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Upload state
  const [pickedFile, setPickedFile] = useState<any>(null);
  const [parseFailed, setParseFailed] = useState(false);

  // Existing resume (for edit)
  const [existingResumeId, setExistingResumeId] = useState<string | null>(null);

  // Create form state
  const [formStep, setFormStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([{ ...EMPTY_WORK }]);
  const [eduEntries, setEduEntries] = useState<EduEntry[]>([{ ...EMPTY_EDU }]);
  const [langEntries, setLangEntries] = useState<LangEntry[]>([]);
  const [certEntries, setCertEntries] = useState<CertEntry[]>([]);
  const [importingCerts, setImportingCerts] = useState(false);

  // ── Pre-load existing created resume ──────────────────────────
  useEffect(() => {
    if (!user?._id) return;
    axios.get(`${API_URL}/api/resume/${user._id}`).then(r => {
      const existing = r.data;
      if (!existing || existing.resume_type !== 'created') return;
      const d = existing.resume_data || {};
      setExistingResumeId(existing._id || existing.id);
      setStep('create');
      setFullName(d.full_name || '');
      setEmail(d.email || user?.email || '');
      setPhone(d.phone || '');
      setLinkedin(d.linkedin || '');
      setSkillsText((d.skills || []).join(', '));
      setWorkEntries(
        (d.work_experience || []).length > 0
          ? d.work_experience.map((w: any) => ({
              company: w.company || '',
              role: w.role || '',
              start_date: w.start_date || '',
              end_date: w.end_date || '',
              bullets: Array.isArray(w.bullets) ? w.bullets.join('\n') : (w.bullets || ''),
            }))
          : [{ ...EMPTY_WORK }]
      );
      setEduEntries(
        (d.education || []).length > 0
          ? d.education.map((e: any) => ({
              institution: e.institution || '',
              degree: e.degree || '',
              field: e.field || '',
              graduation_year: e.graduation_year || '',
            }))
          : [{ ...EMPTY_EDU }]
      );
      setLangEntries((d.languages || []).map((l: any) => ({ language: l.language || '', level: l.level || '' })));
      setCertEntries((d.certifications || []).map((c: any) => ({
        name: c.name || '', issuer: c.issuer || '', year: c.year || '',
        url: c.url || '', is_mydemy: !!c.is_mydemy,
      })));
    }).catch(() => {/* no existing resume, stay at choice */});
  }, [user?._id]);

  // ── Skip ──────────────────────────────────────────────────────
  const handleSkip = async () => {
    if (user?._id) await markResumeSetup(user._id);
    router.replace('/(tabs)/home');
  };

  // ── File pick ────────────────────────────────────────────────
  const handlePickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      if (asset.size && asset.size > 2 * 1024 * 1024) {
        Alert.alert('ไฟล์ใหญ่เกินไป', 'กรุณาเลือกไฟล์ PDF ขนาดไม่เกิน 2MB');
        return;
      }
      setPickedFile(asset);
      setParseFailed(false);
    } catch { /* cancelled */ }
  };

  // ── Upload ───────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!pickedFile || !user?._id) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('user_id', user._id);
      formData.append('file', {
        uri: pickedFile.uri,
        name: pickedFile.name || 'resume.pdf',
        type: 'application/pdf',
      } as any);
      const res = await axios.post(`${API_URL}/api/resume/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.parse_status === 'failed') {
        setParseFailed(true);
        setPickedFile(null);
      } else {
        setResult(res.data);
        setStep('done');
      }
    } catch (e: any) {
      Alert.alert('อัปโหลดไม่สำเร็จ', e?.response?.data?.detail || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  // ── Import Mydemy certificates ───────────────────────────────
  const handleImportMydemy = async () => {
    if (!user?._id) return;
    setImportingCerts(true);
    try {
      const res = await axios.get(`${API_URL}/api/certificates/user/${user._id}`);
      const certs: any[] = res.data || [];
      if (!certs.length) {
        Alert.alert('ยังไม่มีใบประกาศ', 'คุณยังไม่มีใบประกาศนียบัตรจาก Mydemy');
        return;
      }
      const newCerts: CertEntry[] = certs.map(c => ({
        name: c.course_title || c.cert_type || 'Mydemy Certificate',
        issuer: 'Mydemy',
        year: c.issue_year ? String(c.issue_year) : new Date(c.issued_at).getFullYear().toString(),
        url: c.verification_code ? `${API_URL}/api/certificates/verify/${c.verification_code}` : '',
        is_mydemy: true,
      }));
      // Merge — skip duplicates
      const existing = certEntries.filter(e => !e.is_mydemy);
      setCertEntries([...existing, ...newCerts]);
      Alert.alert('นำเข้าสำเร็จ', `เพิ่ม ${newCerts.length} ใบประกาศจาก Mydemy`);
    } catch {
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดใบประกาศได้');
    } finally {
      setImportingCerts(false);
    }
  };

  // ── Create / Update resume ────────────────────────────────────
  const handleCreate = async () => {
    if (!user?._id) return;
    if (!fullName.trim()) { Alert.alert('', 'กรุณากรอกชื่อ'); return; }
    setLoading(true);
    try {
      const skills = skillsText.split(',').map(s => s.trim()).filter(Boolean);
      const work_experience = workEntries
        .filter(e => e.company || e.role)
        .map(e => ({
          company: e.company, role: e.role,
          start_date: e.start_date, end_date: e.end_date,
          bullets: e.bullets.split('\n').filter(Boolean),
        }));
      const education = eduEntries.filter(e => e.institution).map(e => ({ ...e }));
      const languages = langEntries.filter(e => e.language).map(e => ({ language: e.language, level: e.level }));
      const certifications = certEntries.filter(e => e.name).map(e => ({ ...e }));

      const payload = {
        user_id: user._id, full_name: fullName, email, phone, linkedin, skills,
        work_experience, education, languages, certifications,
      };

      let res;
      if (existingResumeId) {
        // Update existing resume in-place
        res = await axios.put(`${API_URL}/api/resume/created/${existingResumeId}`, payload);
      } else {
        res = await axios.post(`${API_URL}/api/resume/create`, payload);
      }
      setResult(res.data);
      setStep('done');
    } catch (e: any) {
      Alert.alert('บันทึกไม่สำเร็จ', e?.response?.data?.detail || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const atsColor = (score: number) =>
    score >= 70 ? COLORS.success : score >= 40 ? '#F59E0B' : COLORS.error;

  // ═══════════════════════════════ CHOICE ═══════════════════════
  if (step === 'choice') return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ตั้งค่าประวัติส่วนตัว</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>ข้าม</Text>
          <Ionicons name="arrow-forward" size={14} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.choiceContent}>
        <Text style={styles.choiceSubtitle}>
          Resume ของคุณช่วยให้เราแนะนำเส้นทางอาชีพที่เหมาะสมที่สุด
        </Text>

        <TouchableOpacity style={styles.optionCard} onPress={() => setStep('upload')} activeOpacity={0.8}>
          <View style={[styles.optionIcon, { backgroundColor: '#3B82F6' }]}>
            <Ionicons name="cloud-upload-outline" size={28} color="#FFF" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>อัปโหลด Resume</Text>
            <Text style={styles.optionSub}>PDF เท่านั้น, ขนาดไม่เกิน 2MB{'\n'}เราจะวิเคราะห์และให้คะแนน ATS</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={() => setStep('create')} activeOpacity={0.8}>
          <View style={[styles.optionIcon, { backgroundColor: COLORS.primary }]}>
            <Ionicons name="create-outline" size={28} color="#FFF" />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>สร้าง Resume กับเรา</Text>
            <Text style={styles.optionSub}>กรอกข้อมูลทีละขั้นตอน{'\n'}เก็บไว้ใช้งานได้ตลอดเวลา</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={COLORS.textTertiary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  // ═══════════════════════════════ UPLOAD ═══════════════════════
  if (step === 'upload') return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('choice')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>อัปโหลด Resume</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>ข้าม</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.uploadContent}>
        {parseFailed && (
          <View style={styles.warnBox}>
            <Ionicons name="warning-outline" size={20} color="#D97706" />
            <Text style={styles.warnText}>
              PDF นี้อ่านข้อความไม่ได้{'\n'}กรุณาอัปโหลดไฟล์ใหม่ที่สร้างจาก Word หรือ Google Docs
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.dropZone} onPress={handlePickFile} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={48} color="#3B82F6" />
          <Text style={styles.dropTitle}>แตะเพื่อเลือกไฟล์ PDF</Text>
          <Text style={styles.dropSub}>ขนาดไม่เกิน 2MB</Text>
        </TouchableOpacity>

        {pickedFile && (
          <View style={styles.filePill}>
            <Ionicons name="document" size={18} color={COLORS.primary} />
            <Text style={styles.filePillText} numberOfLines={1}>{pickedFile.name}</Text>
            <Text style={styles.filePillSize}>
              {pickedFile.size ? `${Math.round(pickedFile.size / 1024)} KB` : ''}
            </Text>
          </View>
        )}

        {pickedFile && (
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleUpload}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.primaryBtnText}>Upload & Analyze</Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  // ═══════════════════════════════ CREATE ═══════════════════════
  if (step === 'create') {
    const TOTAL_STEPS = 4;
    const dots = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(n => (
      <View key={n} style={[styles.dot, formStep >= n && styles.dotActive]} />
    ));

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => formStep > 1 ? setFormStep(f => f - 1) : setStep('choice')}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            สร้าง Resume ({formStep}/{TOTAL_STEPS})
          </Text>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>ข้าม</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dotsRow}>{dots}</View>

        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">

          {/* ── Step 1: Personal Info ── */}
          {formStep === 1 && (
            <>
              <Text style={styles.formSectionTitle}>ข้อมูลส่วนตัว</Text>
              {[
                { label: 'ชื่อ-สกุล *', value: fullName, set: setFullName, placeholder: 'Somchai Jaidee' },
                { label: 'อีเมล *', value: email, set: setEmail, placeholder: 'email@example.com' },
                { label: 'เบอร์โทร', value: phone, set: setPhone, placeholder: '081-234-5678' },
                { label: 'LinkedIn URL', value: linkedin, set: setLinkedin, placeholder: 'linkedin.com/in/...' },
              ].map(f => (
                <View key={f.label} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{f.label}</Text>
                  <TextInput style={styles.input} value={f.value} onChangeText={f.set}
                    placeholder={f.placeholder} placeholderTextColor={COLORS.textTertiary}
                    autoCapitalize="none" />
                </View>
              ))}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>ทักษะ (คั่นด้วยเครื่องหมายจุลภาค)</Text>
                <TextInput style={styles.input} value={skillsText} onChangeText={setSkillsText}
                  placeholder="Figma, UX Research, SQL..." placeholderTextColor={COLORS.textTertiary} />
                {skillsText.length > 0 && (
                  <View style={styles.chipRow}>
                    {skillsText.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => (
                      <View key={i} style={styles.chip}><Text style={styles.chipText}>{s}</Text></View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}

          {/* ── Step 2: Work Experience ── */}
          {formStep === 2 && (
            <>
              <Text style={styles.formSectionTitle}>ประสบการณ์ทำงาน</Text>
              {workEntries.map((entry, i) => (
                <View key={i} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryNum}>ที่ {i + 1}</Text>
                    {workEntries.length > 1 && (
                      <TouchableOpacity onPress={() => setWorkEntries(workEntries.filter((_, idx) => idx !== i))}>
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {[
                    { label: 'บริษัท', key: 'company', ph: 'บริษัท ABC จำกัด' },
                    { label: 'ตำแหน่ง', key: 'role', ph: 'UX Designer' },
                    { label: 'เริ่มงาน', key: 'start_date', ph: 'Jan 2022' },
                    { label: 'สิ้นสุด', key: 'end_date', ph: 'Dec 2023 หรือ ปัจจุบัน' },
                  ].map(f => (
                    <View key={f.key} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{f.label}</Text>
                      <TextInput style={styles.input} value={(entry as any)[f.key]}
                        onChangeText={v => {
                          const arr = [...workEntries]; (arr[i] as any)[f.key] = v; setWorkEntries(arr);
                        }}
                        placeholder={f.ph} placeholderTextColor={COLORS.textTertiary} />
                    </View>
                  ))}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>สิ่งที่ทำ (แต่ละบรรทัด = 1 bullet)</Text>
                    <TextInput style={[styles.input, styles.textArea]}
                      value={entry.bullets} multiline numberOfLines={3}
                      onChangeText={v => { const arr = [...workEntries]; arr[i].bullets = v; setWorkEntries(arr); }}
                      placeholder={"ออกแบบ UX ให้กับ product A\nเพิ่ม conversion rate 20%"}
                      placeholderTextColor={COLORS.textTertiary} />
                  </View>
                </View>
              ))}
              {workEntries.length < 5 && (
                <TouchableOpacity style={styles.addEntryBtn}
                  onPress={() => setWorkEntries([...workEntries, { ...EMPTY_WORK }])}>
                  <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.addEntryText}>เพิ่มประสบการณ์</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* ── Step 3: Education ── */}
          {formStep === 3 && (
            <>
              <Text style={styles.formSectionTitle}>การศึกษา</Text>
              {eduEntries.map((entry, i) => (
                <View key={i} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryNum}>ที่ {i + 1}</Text>
                    {eduEntries.length > 1 && (
                      <TouchableOpacity onPress={() => setEduEntries(eduEntries.filter((_, idx) => idx !== i))}>
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {[
                    { label: 'สถาบัน', key: 'institution', ph: 'มหาวิทยาลัยเกษตรศาสตร์' },
                    { label: 'ปริญญา', key: 'degree', ph: "Bachelor's" },
                    { label: 'สาขา', key: 'field', ph: 'Computer Science' },
                    { label: 'ปีจบ', key: 'graduation_year', ph: '2020' },
                  ].map(f => (
                    <View key={f.key} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{f.label}</Text>
                      <TextInput style={styles.input} value={(entry as any)[f.key]}
                        onChangeText={v => {
                          const arr = [...eduEntries]; (arr[i] as any)[f.key] = v; setEduEntries(arr);
                        }}
                        placeholder={f.ph} placeholderTextColor={COLORS.textTertiary} />
                    </View>
                  ))}
                </View>
              ))}
              {eduEntries.length < 3 && (
                <TouchableOpacity style={styles.addEntryBtn}
                  onPress={() => setEduEntries([...eduEntries, { ...EMPTY_EDU }])}>
                  <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.addEntryText}>เพิ่มการศึกษา</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* ── Step 4: Languages + Certifications ── */}
          {formStep === 4 && (
            <>
              {/* Languages */}
              <Text style={styles.formSectionTitle}>ภาษา</Text>
              <Text style={styles.formSectionHint}>เช่น ภาษาไทย (Native), English (TOEIC 850)</Text>

              {langEntries.map((entry, i) => (
                <View key={i} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryNum}>ภาษาที่ {i + 1}</Text>
                    <TouchableOpacity onPress={() => setLangEntries(langEntries.filter((_, idx) => idx !== i))}>
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>ภาษา</Text>
                    <TextInput style={styles.input}
                      value={entry.language}
                      onChangeText={v => { const arr = [...langEntries]; arr[i].language = v; setLangEntries(arr); }}
                      placeholder="ภาษาไทย / English / Japanese"
                      placeholderTextColor={COLORS.textTertiary} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>ระดับ / คะแนน</Text>
                    <TextInput style={styles.input}
                      value={entry.level}
                      onChangeText={v => { const arr = [...langEntries]; arr[i].level = v; setLangEntries(arr); }}
                      placeholder="Native / Fluent / TOEIC 850 / IELTS 7.0"
                      placeholderTextColor={COLORS.textTertiary} />
                  </View>
                  {/* Quick level chips */}
                  <View style={styles.chipRow}>
                    {LEVEL_OPTIONS.map(lvl => (
                      <TouchableOpacity key={lvl}
                        style={[styles.levelChip, entry.level === lvl && styles.levelChipActive]}
                        onPress={() => { const arr = [...langEntries]; arr[i].level = lvl; setLangEntries(arr); }}
                      >
                        <Text style={[styles.levelChipText, entry.level === lvl && styles.levelChipTextActive]}>
                          {lvl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.addEntryBtn}
                onPress={() => setLangEntries([...langEntries, { ...EMPTY_LANG }])}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.addEntryText}>เพิ่มภาษา</Text>
              </TouchableOpacity>

              {/* Certifications */}
              <View style={styles.certHeader}>
                <Text style={[styles.formSectionTitle, { marginBottom: 0 }]}>ใบประกาศนียบัตร</Text>
                <TouchableOpacity
                  style={styles.mydemyBtn}
                  onPress={handleImportMydemy}
                  disabled={importingCerts}
                >
                  {importingCerts
                    ? <ActivityIndicator size="small" color={COLORS.primary} />
                    : <>
                        <Ionicons name="ribbon" size={14} color={COLORS.primary} />
                        <Text style={styles.mydemyBtnText}>นำเข้าจาก Mydemy</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
              <Text style={styles.formSectionHint}>ใส่ใบ cert ที่มีทั้งจาก Mydemy และภายนอก</Text>

              {certEntries.map((entry, i) => (
                <View key={i} style={[styles.entryCard, entry.is_mydemy && styles.mydemyCard]}>
                  <View style={styles.entryHeader}>
                    {entry.is_mydemy && (
                      <View style={styles.mydemyBadge}>
                        <Ionicons name="ribbon" size={12} color={COLORS.primary} />
                        <Text style={styles.mydemyBadgeText}>Mydemy</Text>
                      </View>
                    )}
                    <Text style={styles.entryNum}>{entry.is_mydemy ? '' : `ที่ ${i + 1}`}</Text>
                    <TouchableOpacity onPress={() => setCertEntries(certEntries.filter((_, idx) => idx !== i))}>
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  {[
                    { label: 'ชื่อใบประกาศ', key: 'name', ph: 'Google UX Design Certificate' },
                    { label: 'ออกโดย', key: 'issuer', ph: 'Google / Coursera / Mydemy' },
                    { label: 'ปีที่ได้รับ', key: 'year', ph: '2024' },
                    { label: 'URL (ถ้ามี)', key: 'url', ph: 'https://...' },
                  ].map(f => (
                    <View key={f.key} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{f.label}</Text>
                      <TextInput
                        style={[styles.input, entry.is_mydemy && f.key !== 'url' ? styles.inputReadonly : null]}
                        value={(entry as any)[f.key]}
                        onChangeText={v => {
                          // Only allow editing url for Mydemy certs (name/issuer/year are locked)
                          if (entry.is_mydemy && f.key !== 'url') return;
                          const arr = [...certEntries]; (arr[i] as any)[f.key] = v; setCertEntries(arr);
                        }}
                        placeholder={f.ph}
                        placeholderTextColor={COLORS.textTertiary}
                        editable={!(entry.is_mydemy && f.key !== 'url')}
                      />
                    </View>
                  ))}
                </View>
              ))}

              <TouchableOpacity style={styles.addEntryBtn}
                onPress={() => setCertEntries([...certEntries, { ...EMPTY_CERT }])}>
                <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.addEntryText}>เพิ่มใบประกาศ</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Navigation buttons */}
          {formStep < TOTAL_STEPS ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setFormStep(f => f + 1)}>
              <Text style={styles.primaryBtnText}>ต่อไป</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleCreate} disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.primaryBtnText}>บันทึก Resume</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════ DONE ═════════════════════════
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.doneContent}>
        <View style={styles.doneIcon}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
        </View>
        <Text style={styles.doneTitle}>บันทึก Resume เรียบร้อยแล้ว!</Text>
        {result?.ats_score != null && (
          <View style={[styles.atsBadge, { borderColor: atsColor(result.ats_score) }]}>
            <Text style={[styles.atsScore, { color: atsColor(result.ats_score) }]}>
              {result.ats_score}
            </Text>
            <Text style={styles.atsLabel}>คะแนน ATS</Text>
          </View>
        )}
        {result?.ats_score != null && result.ats_score < 60 && (
          <Text style={styles.atsTip}>
            💡 ลองเพิ่มทักษะ, ประสบการณ์ หรือข้อมูลติดต่อ เพื่อเพิ่มคะแนน
          </Text>
        )}
        <TouchableOpacity style={styles.primaryBtn}
          onPress={() => router.replace('/(tabs)/home')}>
          <Text style={styles.primaryBtnText}>ไปหน้าหลัก</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn}
          onPress={() => router.replace('/resume' as any)}>
          <Text style={styles.secondaryBtnText}>ดู Resume ของฉัน</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  skipBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  skipText: { fontSize: 14, color: COLORS.textTertiary },
  // Choice
  choiceContent: { padding: SPACING.lg, paddingTop: SPACING.xl, gap: SPACING.md },
  choiceSubtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.sm },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: RADIUS.lg, padding: SPACING.md, gap: SPACING.md,
    borderWidth: 1.5, borderColor: '#E5E7EB', ...SHADOWS.small,
  },
  optionIcon: { width: 56, height: 56, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  optionSub: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  // Upload
  uploadContent: { padding: SPACING.lg, gap: SPACING.md, paddingTop: SPACING.xl },
  warnBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: '#FEF3C7', borderRadius: RADIUS.md, padding: SPACING.md,
  },
  warnText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 20 },
  dropZone: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#3B82F6',
    borderRadius: RADIUS.lg, padding: 40, alignItems: 'center', gap: SPACING.sm,
    backgroundColor: '#EFF6FF',
  },
  dropTitle: { fontSize: 16, fontWeight: '600', color: '#1D4ED8' },
  dropSub: { fontSize: 13, color: '#3B82F6' },
  filePill: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: '#fce7f3', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md,
    paddingVertical: 10, flexShrink: 1,
  },
  filePillText: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  filePillSize: { fontSize: 12, color: COLORS.textTertiary },
  // Form
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: COLORS.primary, width: 24 },
  formContent: { padding: SPACING.lg, gap: SPACING.sm, paddingBottom: 60 },
  formSectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  formSectionHint: { fontSize: 13, color: COLORS.textTertiary, marginBottom: SPACING.md },
  entryCard: {
    backgroundColor: '#F9FAFB', borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: '#E5E7EB', marginBottom: SPACING.sm,
  },
  mydemyCard: {
    borderColor: COLORS.primary, backgroundColor: '#fdf2f8',
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  entryNum: { fontSize: 12, fontWeight: '600', color: COLORS.textTertiary },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: RADIUS.sm,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: COLORS.textPrimary,
    backgroundColor: '#FFF',
  },
  inputReadonly: {
    backgroundColor: '#F3F4F6', color: '#6B7280',
  },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { backgroundColor: '#fce7f3', borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  levelChip: {
    backgroundColor: '#F3F4F6', borderRadius: RADIUS.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  levelChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  levelChipText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  levelChipTextActive: { color: '#FFF' },
  addEntryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, justifyContent: 'center',
  },
  addEntryText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  certHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: SPACING.lg, marginBottom: 2,
  },
  mydemyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fce7f3', borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#f9a8d4',
  },
  mydemyBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  mydemyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fce7f3', borderRadius: RADIUS.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  mydemyBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  // Buttons
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: SPACING.md,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  secondaryBtn: {
    borderRadius: RADIUS.md, paddingVertical: 14,
    alignItems: 'center', marginTop: SPACING.sm,
  },
  secondaryBtnText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  // Done
  doneContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  doneIcon: { marginBottom: SPACING.lg },
  doneTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.lg },
  atsBadge: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 4,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
  },
  atsScore: { fontSize: 40, fontWeight: '800' },
  atsLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  atsTip: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg, paddingHorizontal: SPACING.lg },
});
