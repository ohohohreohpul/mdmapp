import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../contexts/UserContext';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

const PREFS_KEY = 'app_preferences';

// ─── Small inline modal ───────────────────────────────────────────────────────
function InlineModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Settings() {
  const router = useRouter();
  const { user, changePassword, updateProfile } = useUser();

  // ── Preferences (persisted) ──────────────────────────────────────────────
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  // ── Edit profile modal ───────────────────────────────────────────────────
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Change password modal ────────────────────────────────────────────────
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // ── Load saved preferences ───────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then(raw => {
      if (raw) {
        const p = JSON.parse(raw);
        if (p.notifications !== undefined) setNotifications(p.notifications);
        if (p.emailUpdates !== undefined) setEmailUpdates(p.emailUpdates);
        if (p.darkMode !== undefined) setDarkMode(p.darkMode);
        if (p.autoPlay !== undefined) setAutoPlay(p.autoPlay);
      }
    });
    if (user) setDisplayName(user.username || '');
  }, [user]);

  const savePrefs = async (patch: object) => {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    const current = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...patch }));
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('กรุณากรอกชื่อ');
      return;
    }
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateProfile(user._id, { username: displayName.trim(), display_name: displayName.trim() });
      setEditProfileOpen(false);
      Alert.alert('✅ บันทึกแล้ว', 'อัปเดตชื่อสำเร็จ');
    } catch (err: any) {
      Alert.alert('เกิดข้อผิดพลาด', err?.response?.data?.detail || 'ลองใหม่อีกครั้ง');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPass || !confirmPass) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    if (newPass.length < 6) {
      Alert.alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (!user) return;
    setSavingPass(true);
    try {
      await changePassword(user._id, newPass, currentPass || undefined);
      setChangePassOpen(false);
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
      Alert.alert('✅ เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'ลองใหม่อีกครั้ง';
      Alert.alert('เกิดข้อผิดพลาด', msg);
    } finally {
      setSavingPass(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('ไม่สามารถเปิดลิงก์ได้'));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>การตั้งค่า</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Account ── */}
        <Text style={styles.sectionTitle}>บัญชี</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              if (!user) { Alert.alert('กรุณาเข้าสู่ระบบก่อน'); return; }
              setDisplayName(user.username || '');
              setEditProfileOpen(true);
            }}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="person-outline" size={22} color="#6B7280" />
              <View>
                <Text style={styles.settingText}>แก้ไขโปรไฟล์</Text>
                {user && <Text style={styles.settingSubtext}>{user.username}</Text>}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              if (!user) { Alert.alert('กรุณาเข้าสู่ระบบก่อน'); return; }
              setCurrentPass(''); setNewPass(''); setConfirmPass('');
              setChangePassOpen(true);
            }}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>เปลี่ยนรหัสผ่าน</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <View style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>ภาษา</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>ไทย</Text>
            </View>
          </View>
        </View>

        {/* ── Notifications ── */}
        <Text style={styles.sectionTitle}>การแจ้งเตือน</Text>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={v => { setNotifications(v); savePrefs({ notifications: v }); }}
              trackColor={{ false: '#E5E5E5', true: COLORS.primaryLight }}
              thumbColor={notifications ? COLORS.primary : '#FFF'}
            />
          </View>
          <View style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>Email Updates</Text>
            </View>
            <Switch
              value={emailUpdates}
              onValueChange={v => { setEmailUpdates(v); savePrefs({ emailUpdates: v }); }}
              trackColor={{ false: '#E5E5E5', true: COLORS.primaryLight }}
              thumbColor={emailUpdates ? COLORS.primary : '#FFF'}
            />
          </View>
        </View>

        {/* ── App Preferences ── */}
        <Text style={styles.sectionTitle}>การตั้งค่าแอป</Text>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={v => { setDarkMode(v); savePrefs({ darkMode: v }); }}
              trackColor={{ false: '#E5E5E5', true: COLORS.primaryLight }}
              thumbColor={darkMode ? COLORS.primary : '#FFF'}
            />
          </View>
          <View style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="play-circle-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>Auto-play วิดีโอ</Text>
            </View>
            <Switch
              value={autoPlay}
              onValueChange={v => { setAutoPlay(v); savePrefs({ autoPlay: v }); }}
              trackColor={{ false: '#E5E5E5', true: COLORS.primaryLight }}
              thumbColor={autoPlay ? COLORS.primary : '#FFF'}
            />
          </View>
        </View>

        {/* ── About ── */}
        <Text style={styles.sectionTitle}>เกี่ยวกับ</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => openLink('https://app.mydemy.co/terms')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>ข้อกำหนดการใช้งาน</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => openLink('https://app.mydemy.co/privacy')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>นโยบายความเป็นส่วนตัว</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
          <View style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>เวอร์ชัน</Text>
            </View>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <InlineModal
        visible={editProfileOpen}
        title="แก้ไขโปรไฟล์"
        onClose={() => setEditProfileOpen(false)}
      >
        <View style={styles.modalBody}>
          <Text style={styles.inputLabel}>ชื่อที่แสดง</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="ชื่อของคุณ"
            autoFocus
            returnKeyType="done"
          />
          <Text style={styles.inputHint}>ชื่อนี้จะแสดงบนใบประกาศนียบัตรของคุณ</Text>
          <TouchableOpacity
            style={[styles.saveBtn, savingProfile && styles.saveBtnDisabled]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>บันทึก</Text>
            }
          </TouchableOpacity>
        </View>
      </InlineModal>

      {/* ── Change Password Modal ── */}
      <InlineModal
        visible={changePassOpen}
        title="เปลี่ยนรหัสผ่าน"
        onClose={() => setChangePassOpen(false)}
      >
        <View style={styles.modalBody}>
          <Text style={styles.inputLabel}>รหัสผ่านปัจจุบัน</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={currentPass}
              onChangeText={setCurrentPass}
              placeholder="รหัสผ่านปัจจุบัน"
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>รหัสผ่านใหม่</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newPass}
              onChangeText={setNewPass}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>ยืนยันรหัสผ่านใหม่</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={confirmPass}
              onChangeText={setConfirmPass}
              placeholder="ยืนยันรหัสผ่านใหม่"
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, savingPass && styles.saveBtnDisabled, { marginTop: 20 }]}
            onPress={handleChangePassword}
            disabled={savingPass}
          >
            {savingPass
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>เปลี่ยนรหัสผ่าน</Text>
            }
          </TouchableOpacity>
        </View>
      </InlineModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  safeArea: { backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },

  content: { flex: 1, padding: 20 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#6B7280',
    marginBottom: 8, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#FFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E5E5', marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
  },
  lastItem: { borderBottomWidth: 0 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingText: { fontSize: 15, color: '#1F2937' },
  settingSubtext: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14, color: '#6B7280' },

  // ── Modal ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  modalClose: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: 20 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputHint: { fontSize: 12, color: '#9CA3AF', marginTop: 6, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: '#1F2937', backgroundColor: '#FAFAFA',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 10 },

  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
