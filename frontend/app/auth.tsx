import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import { COLORS } from '../constants/theme';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type Screen = 'login' | 'register' | 'reset-password' | 'first-login';

export default function Auth() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { login, register, changePassword, user } = useUser();

  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // ── Login ──────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setLoading(true);
    try {
      const { mustResetPassword } = await login(email.trim(), password);
      if (mustResetPassword) {
        setScreen('reset-password');
      } else {
        router.replace('/home');
      }
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      // If no password set, guide to first-login flow
      if (detail?.includes('ยังไม่ได้ตั้งรหัสผ่าน')) {
        Alert.alert(
          'บัญชีจาก Mydemy เดิม',
          'บัญชีของคุณถูกโอนมาจากระบบเดิม กรุณาตั้งรหัสผ่านใหม่',
          [
            { text: 'ยกเลิก', style: 'cancel' },
            { text: 'ตั้งรหัสผ่าน', onPress: () => { setScreen('first-login'); setPassword(''); } },
          ]
        );
      } else {
        Alert.alert('เข้าสู่ระบบไม่สำเร็จ', detail || error.message || 'เกิดข้อผิดพลาด');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Register ───────────────────────────────────────────────
  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    if (password.length < 8) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    setLoading(true);
    try {
      await register(username, email.trim(), password);
      router.replace('/home');
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด';
      Alert.alert('สมัครสมาชิกไม่สำเร็จ', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── First-time password setup (WP migrants) ────────────────
  const handleFirstLogin = async () => {
    if (!email) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมล');
      return;
    }
    if (!newPassword || !confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกรหัสผ่านใหม่');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/setup-password`, {
        email: email.trim(),
        new_password: newPassword,
      });
      // setup-password logs the user in — store and proceed
      const userData = response.data;
      // Manually trigger login to store the session
      await login(email.trim(), newPassword);
      Alert.alert('สำเร็จ!', 'ตั้งรหัสผ่านเรียบร้อยแล้ว ยินดีต้อนรับสู่ Mydemy!', [
        { text: 'เริ่มเรียน', onPress: () => router.replace('/home') },
      ]);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด';
      Alert.alert('ข้อผิดพลาด', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Post-login password reset (must_reset_password=true) ───
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกรหัสผ่านใหม่');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (!user?._id) {
      setScreen('login');
      return;
    }
    setLoading(true);
    try {
      await changePassword(user._id, newPassword);
      Alert.alert('สำเร็จ!', 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว', [
        { text: 'ตกลง', onPress: () => router.replace('/home') },
      ]);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error.message || 'เกิดข้อผิดพลาด';
      Alert.alert('ข้อผิดพลาด', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => router.replace('/home');

  // ── Shared header ──────────────────────────────────────────
  const Header = ({ subtitle }: { subtitle: string }) => (
    <View style={styles.header}>
      <Image source={require('../assets/images/logo.png')} style={[styles.logo, { width: width * 0.5 }]} resizeMode="contain" />
      <Text style={styles.headerSubtitle}>{subtitle}</Text>
    </View>
  );

  // ── First-login screen (WP users with no password) ─────────
  if (screen === 'first-login') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Header subtitle="ตั้งรหัสผ่านสำหรับบัญชีของคุณ" />
            <View style={styles.formContainer}>
              <View style={styles.infoBox}>
                <Ionicons name="person-circle-outline" size={22} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  บัญชีของคุณถูกโอนมาจากระบบ Mydemy เดิม{'\n'}กรุณากรอกอีเมลและตั้งรหัสผ่านใหม่
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>อีเมล</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="อีเมลที่ลงทะเบียนไว้"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>รหัสผ่านใหม่</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>ยืนยันรหัสผ่าน</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showNewPassword}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleFirstLogin}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านและเข้าสู่ระบบ'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButton} onPress={() => setScreen('login')}>
                <Ionicons name="arrow-back-outline" size={16} color="#6B7280" />
                <Text style={styles.backText}>กลับหน้าเข้าสู่ระบบ</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Reset-password screen (after login, must_reset_password=true) ──
  if (screen === 'reset-password') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Header subtitle="ตั้งรหัสผ่านใหม่" />
            <View style={styles.formContainer}>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชีคุณ
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>รหัสผ่านใหม่</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons name={showNewPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>ยืนยันรหัสผ่านใหม่</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showNewPassword}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Login / Register ───────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Header subtitle={screen === 'login' ? 'ยินดีต้อนรับกลับมา!' : 'สร้างบัญชีใหม่'} />

          <View style={styles.formContainer}>
            {/* Username (register only) */}
            {screen === 'register' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>ชื่อผู้ใช้</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="ชื่อที่ต้องการแสดง"
                    value={username}
                    onChangeText={setUsername}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>อีเมล</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>รหัสผ่าน</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder={screen === 'register' ? 'อย่างน้อย 8 ตัวอักษร' : '••••••••'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* First time / Forgot password */}
            {screen === 'login' && (
              <View style={styles.loginHelpRow}>
                <TouchableOpacity onPress={() => { setNewPassword(''); setConfirmPassword(''); setScreen('first-login'); }}>
                  <Text style={styles.firstLoginText}>เข้าสู่ระบบครั้งแรก?</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={screen === 'login' ? handleLogin : handleRegister}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'กำลังดำเนินการ...' : screen === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </Text>
            </TouchableOpacity>

            {/* Toggle login ↔ register */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {screen === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}
              </Text>
              <TouchableOpacity onPress={() => setScreen(screen === 'login' ? 'register' : 'login')}>
                <Text style={styles.toggleLink}>
                  {screen === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Skip */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>ข้ามไปก่อน</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logo: { height: 80 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 12 },
  formContainer: { padding: 24 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 14, color: '#4338CA', lineHeight: 22 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: { flex: 1, fontSize: 16, color: '#1F2937' },
  loginHelpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  firstLoginText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  forgotText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  toggleContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 4 },
  toggleText: { fontSize: 14, color: '#6B7280' },
  toggleLink: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  skipButton: { alignItems: 'center', marginTop: 16, paddingVertical: 12 },
  skipText: { fontSize: 14, color: '#9CA3AF' },
  backButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 6 },
  backText: { fontSize: 14, color: '#6B7280' },
});
