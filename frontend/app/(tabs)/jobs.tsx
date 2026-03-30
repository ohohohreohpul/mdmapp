import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <View style={[styles.headerSafeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Job Board</Text>
        </View>
      </View>

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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  headerSafeArea: { backgroundColor: '#FFF' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.4 },
  scroll: { padding: 20 },

  // Hero section
  heroBox: {
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  heroIcon: {
    marginBottom: 18,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239,94,168,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: 'rgba(255,149,0,0.12)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9B5400',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#636366',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Features section
  featuresBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: { flex: 1 },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Company section
  companyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  companyContent: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  companyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 14,
    marginBottom: 8,
  },
  companyDesc: {
    fontSize: 15,
    color: '#636366',
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 20,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 5,
  },
  contactBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
