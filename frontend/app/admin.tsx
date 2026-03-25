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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../contexts/UserContext';
import axios from 'axios';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const ADMIN_EMAILS = ['jiranan@mydemy.co'];

export default function Admin() {
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = ADMIN_EMAILS.includes((user?.email || '').toLowerCase());
  const [loading, setLoading] = useState(false);
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);

  // Settings form states
  const [aiProvider, setAiProvider] = useState('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [elevenlabsKey, setElevenlabsKey] = useState('');
  const [bunnyApiKey, setBunnyApiKey] = useState('');
  const [bunnyLibraryId, setBunnyLibraryId] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/(tabs)/home');
      return;
    }
    loadSettings();
    loadStats();
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/courses`);
      setCourseCount(Array.isArray(response.data) ? response.data.length : 0);
    } catch {
      setCourseCount(0);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/settings`);
      setAiProvider(response.data.ai_provider || 'openai');
      setOpenaiKey(response.data.openai_key || '');
      setGeminiKey(response.data.gemini_key || '');
      setClaudeKey(response.data.claude_key || '');
      setElevenlabsKey(response.data.elevenlabs_key || '');
      setBunnyApiKey(response.data.bunny_api_key || '');
      setBunnyLibraryId(response.data.bunny_library_id || '');
    } catch {
      // silently fail — settings may not exist yet
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      await axios.put(`${API_URL}/api/admin/settings`, {
        ai_provider: aiProvider,
        openai_key: openaiKey || undefined,
        gemini_key: geminiKey || undefined,
        claude_key: claudeKey || undefined,
        elevenlabs_key: elevenlabsKey || undefined,
        bunny_api_key: bunnyApiKey || undefined,
        bunny_library_id: bunnyLibraryId || undefined,
      });
      Alert.alert('สำเร็จ', 'บันทึกการตั้งค่าเรียบร้อยแล้ว');
      setShowApiKeysModal(false);
      loadSettings();
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  const menuCards = [
    {
      id: 'courses',
      emoji: '📚',
      title: 'จัดการคอร์ส',
      description: 'เพิ่ม แก้ไข และจัดการคอร์สทั้งหมด',
      color: '#6366F1',
      bgColor: '#EEF2FF',
      onPress: () => router.push('/admin/courses' as any),
    },
    {
      id: 'materials',
      emoji: '📄',
      title: 'เนื้อหาบทเรียน',
      description: 'อัพโหลดและจัดการเนื้อหาบทเรียน',
      color: '#10B981',
      bgColor: '#D1FAE5',
      onPress: () => router.push('/admin/materials' as any),
    },
    {
      id: 'users',
      emoji: '👥',
      title: 'ผู้ใช้งาน',
      description: 'ดูรายชื่อและสถานะผู้เรียนทั้งหมด',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      onPress: () => router.push('/admin/users' as any),
    },
    {
      id: 'bunny',
      emoji: '🐰',
      title: 'Import from Bunny.net',
      description: 'สร้างบทเรียนจากวิดีโอใน Bunny Library อัตโนมัติ',
      color: '#F97316',
      bgColor: '#FFF7ED',
      onPress: () => router.push('/admin/bunny-import' as any),
    },
    {
      id: 'settings',
      emoji: '⚙️',
      title: 'ตั้งค่าระบบ',
      description: 'AI keys, ElevenLabs และการตั้งค่าอื่น ๆ',
      color: COLORS.primary,
      bgColor: '#fce7f3',
      onPress: () => setShowApiKeysModal(true),
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="settings" size={24} color={COLORS.primary} />
            <Text style={styles.headerTitle}>แผงควบคุม</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {courseCount === null ? '...' : String(courseCount)}
            </Text>
            <Text style={styles.statLabel}>คอร์สทั้งหมด</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="sparkles" size={28} color="#F59E0B" />
            <Text style={[styles.statLabel, { marginTop: 4 }]}>AI พร้อมใช้งาน</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="checkmark-circle" size={28} color="#10B981" />
            <Text style={[styles.statLabel, { marginTop: 4 }]}>ระบบปกติ</Text>
          </View>
        </View>

        {/* Menu Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เมนูจัดการ</Text>
          {menuCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.menuCard}
              onPress={card.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: card.bgColor }]}>
                <Text style={styles.menuEmoji}>{card.emoji}</Text>
              </View>
              <View style={styles.menuCardContent}>
                <Text style={styles.menuCardTitle}>{card.title}</Text>
                <Text style={styles.menuCardDesc}>{card.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* API Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>สถานะ API</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons
                name={openaiKey || geminiKey || claudeKey ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={openaiKey || geminiKey || claudeKey ? COLORS.success : COLORS.error}
              />
              <Text style={styles.statusLabel}>AI Provider ({aiProvider.toUpperCase()})</Text>
            </View>
            <View style={styles.statusRow}>
              <Ionicons
                name={elevenlabsKey ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={elevenlabsKey ? COLORS.success : COLORS.error}
              />
              <Text style={styles.statusLabel}>ElevenLabs TTS</Text>
            </View>
            <View style={styles.statusRow}>
              <Ionicons
                name={bunnyApiKey ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={bunnyApiKey ? COLORS.success : COLORS.error}
              />
              <Text style={styles.statusLabel}>Bunny.net CDN</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* API Keys Modal */}
      <Modal
        visible={showApiKeysModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApiKeysModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ตั้งค่า API Keys</Text>
              <TouchableOpacity onPress={() => setShowApiKeysModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>AI Provider</Text>
              <View style={styles.providerButtons}>
                {['openai', 'gemini', 'claude'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.providerButton, aiProvider === p && styles.providerButtonActive]}
                    onPress={() => setAiProvider(p)}
                  >
                    <Text
                      style={[
                        styles.providerButtonText,
                        aiProvider === p && styles.providerButtonTextActive,
                      ]}
                    >
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>OpenAI API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="sk-..."
                value={openaiKey}
                onChangeText={setOpenaiKey}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Google Gemini API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="AIza..."
                value={geminiKey}
                onChangeText={setGeminiKey}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Anthropic Claude API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="sk-ant-..."
                value={claudeKey}
                onChangeText={setClaudeKey}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>ElevenLabs API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="elevenlabs key"
                value={elevenlabsKey}
                onChangeText={setElevenlabsKey}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Bunny.net API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="bunny api key"
                value={bunnyApiKey}
                onChangeText={setBunnyApiKey}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Bunny.net Library ID</Text>
              <TextInput
                style={styles.input}
                placeholder="library id"
                value={bunnyLibraryId}
                onChangeText={setBunnyLibraryId}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={saveSettings}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>บันทึกการตั้งค่า</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  headerSafe: {
    backgroundColor: COLORS.background,
  },
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  menuCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  menuIconBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuEmoji: {
    fontSize: 26,
  },
  menuCardContent: {
    flex: 1,
  },
  menuCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  menuCardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  statusCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.small,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: RADIUS.sm,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  providerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  providerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  providerButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#fce7f3',
  },
  providerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  providerButtonTextActive: {
    color: COLORS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
