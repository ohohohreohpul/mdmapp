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
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Admin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);

  // Form states
  const [aiProvider, setAiProvider] = useState('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [elevenlabsKey, setElevenlabsKey] = useState('');
  const [bunnyApiKey, setBunnyApiKey] = useState('');
  const [bunnyLibraryId, setBunnyLibraryId] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/settings`);
      setSettings(response.data);
      
      setAiProvider(response.data.ai_provider || 'openai');
      setOpenaiKey(response.data.openai_key || '');
      setGeminiKey(response.data.gemini_key || '');
      setClaudeKey(response.data.claude_key || '');
      setElevenlabsKey(response.data.elevenlabs_key || '');
      setBunnyApiKey(response.data.bunny_api_key || '');
      setBunnyLibraryId(response.data.bunny_library_id || '');
    } catch (error) {
      console.error('Error loading settings:', error);
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
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('ผิดพลาด', 'ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  const adminMenuItems = [
    {
      id: 'courses',
      title: 'จัดการคอร์ส',
      subtitle: 'สร้างและแก้ไขคอร์สเรียน',
      icon: 'school',
      color: '#6366F1',
      route: '/admin/courses',
    },
    {
      id: 'materials',
      title: 'อัพโหลดเนื้อหา',
      subtitle: 'เพิ่มเนื้อหาสำหรับสร้างแบบทดสอบ',
      icon: 'cloud-upload',
      color: '#10B981',
      route: '/admin/materials',
    },
    {
      id: 'quizzes',
      title: 'สร้างแบบทดสอบด้วย AI',
      subtitle: 'ใช้ AI สร้างข้อสอบจากเนื้อหา',
      icon: 'sparkles',
      color: '#F59E0B',
      route: '/admin/quiz-generator',
    },
    {
      id: 'users',
      title: 'จัดการผู้ใช้',
      subtitle: 'ดูข้อมูลและความคืบหน้าผู้เรียน',
      icon: 'people',
      color: '#EC4899',
      route: '/admin/users',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Settings Overview */}
        <View style={styles.section}>
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <View>
                <Text style={styles.settingsTitle}>การตั้งค่าระบบ</Text>
                <Text style={styles.settingsSubtitle}>
                  AI Provider: {aiProvider.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.configButton}
                onPress={() => setShowApiKeysModal(true)}
              >
                <Ionicons name="settings" size={20} color="#FFFFFF" />
                <Text style={styles.configButtonText}>ตั้งค่า</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Ionicons 
                  name={openaiKey || geminiKey || claudeKey ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={openaiKey || geminiKey || claudeKey ? "#10B981" : "#EF4444"} 
                />
                <Text style={styles.statusText}>AI API</Text>
              </View>
              
              <View style={styles.statusItem}>
                <Ionicons 
                  name={elevenlabsKey ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={elevenlabsKey ? "#10B981" : "#EF4444"} 
                />
                <Text style={styles.statusText}>ElevenLabs</Text>
              </View>
              
              <View style={styles.statusItem}>
                <Ionicons 
                  name={bunnyApiKey ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={bunnyApiKey ? "#10B981" : "#EF4444"} 
                />
                <Text style={styles.statusText}>Bunny.net</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Admin Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เมนูจัดการ</Text>
          
          {adminMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuCard, { borderLeftColor: item.color }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
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
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* AI Provider Selection */}
              <Text style={styles.inputLabel}>AI Provider</Text>
              <View style={styles.providerButtons}>
                {['openai', 'gemini', 'claude'].map((provider) => (
                  <TouchableOpacity
                    key={provider}
                    style={[
                      styles.providerButton,
                      aiProvider === provider && styles.providerButtonActive,
                    ]}
                    onPress={() => setAiProvider(provider)}
                  >
                    <Text
                      style={[
                        styles.providerButtonText,
                        aiProvider === provider && styles.providerButtonTextActive,
                      ]}
                    >
                      {provider.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* OpenAI Key */}
              <Text style={styles.inputLabel}>OpenAI API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="sk-..."
                value={openaiKey}
                onChangeText={setOpenaiKey}
                secureTextEntry
                autoCapitalize="none"
              />

              {/* Gemini Key */}
              <Text style={styles.inputLabel}>Google Gemini API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="AIza..."
                value={geminiKey}
                onChangeText={setGeminiKey}
                secureTextEntry
                autoCapitalize="none"
              />

              {/* Claude Key */}
              <Text style={styles.inputLabel}>Anthropic Claude API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="sk-ant-..."
                value={claudeKey}
                onChangeText={setClaudeKey}
                secureTextEntry
                autoCapitalize="none"
              />

              {/* ElevenLabs Key */}
              <Text style={styles.inputLabel}>ElevenLabs API Key</Text>
              <TextInput
                style={styles.input}
                placeholder="elevenlabs key"
                value={elevenlabsKey}
                onChangeText={setElevenlabsKey}
                secureTextEntry
                autoCapitalize="none"
              />

              {/* Bunny.net */}
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  configButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusItem: {
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#6B7280',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  providerButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  providerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  providerButtonActive: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  providerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  providerButtonTextActive: {
    color: '#6366F1',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
