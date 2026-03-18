import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

export default function Settings() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>การตั้งค่า</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account */}
        <Text style={styles.sectionTitle}>บัญชี</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="person-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>แก้ไขโปรไฟล์</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>เปลี่ยนรหัสผ่าน</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, styles.lastItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>ภาษา</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>ไทย</Text>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>การแจ้งเตือน</Text>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
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
              onValueChange={setEmailUpdates}
              trackColor={{ false: '#E5E5E5', true: COLORS.primaryLight }}
              thumbColor={emailUpdates ? COLORS.primary : '#FFF'}
            />
          </View>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>การตั้งค่าแอป</Text>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
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
              onValueChange={setAutoPlay}
              trackColor={{ false: '#E5E5E5', true: COLORS.primaryLight }}
              thumbColor={autoPlay ? COLORS.primary : '#FFF'}
            />
          </View>
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>เกี่ยวกับ</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={22} color="#6B7280" />
              <Text style={styles.settingText}>ข้อกำหนดการใช้งาน</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 8,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 15,
    color: '#1F2937',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
  },
});