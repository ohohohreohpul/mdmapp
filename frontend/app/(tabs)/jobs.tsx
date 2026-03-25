import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function JobsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Job Board</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Coming Soon Hero */}
        <View style={styles.heroBox}>
          <View style={styles.heroIcon}>
            <Ionicons name="briefcase" size={52} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Job Board</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>เร็ว ๆ นี้</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            เพลิดเพลินกับตัวเลือกงานที่คัดสรรมาสำหรับคุณ โดยอิงจากทักษะและประสบการณ์ของคุณ
          </Text>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresBox}>
          <Text style={styles.sectionTitle}>ฟีเจอร์ที่กำลังจะเปิดตัว</Text>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="search" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>ค้นหางานอัจฉริยะ</Text>
              <Text style={styles.featureDesc}>ค้นหาตำแหน่งงานที่ตรงกับทักษะของคุณ</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="bookmark" size={20} color="#A855F7" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>บันทึกงานที่ถูกใจ</Text>
              <Text style={styles.featureDesc}>เก็บตำแหน่งงานสำหรับภายหลัง</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="notifications" size={20} color="#F59E0B" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>แจ้งเตือนงานใหม่</Text>
              <Text style={styles.featureDesc}>รับการแจ้งเตือนเมื่อมีตำแหน่งงานใหม่</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="document-text" size={20} color="#10B981" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureName}>ส่งใบสมัครต่อบริษัท</Text>
              <Text style={styles.featureDesc}>ทำให้การสมัครงานง่ายขึ้น</Text>
            </View>
          </View>
        </View>

        {/* For Companies */}
        <View style={styles.companyBox}>
          <View style={styles.companyContent}>
            <Ionicons name="business" size={40} color={COLORS.primary} />
            <Text style={styles.companyTitle}>สำหรับบริษัท</Text>
            <Text style={styles.companyDesc}>
              คุณเป็นบริษัทที่ต้องการสอบหาบุคลากรหรือลงประกาศงาน?
            </Text>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Linking.openURL('mailto:hello@mydemy.co')}
            >
              <Ionicons name="mail" size={16} color="#FFF" />
              <Text style={styles.contactBtnText}>ติดต่อเรา</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  headerSafeArea: { backgroundColor: COLORS.primary },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  scroll: { padding: 20 },

  // Hero section
  heroBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  heroIcon: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Features section
  featuresBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: { flex: 1 },
  featureName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Company section
  companyBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  companyContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  companyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  companyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
