import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

export default function Help() {
  const router = useRouter();

  const faqs = [
    { id: '1', question: 'วิธีเริ่มเรียนคอร์ส?', answer: 'ไปที่หน้า "สำรวจ" เลือกคอร์สที่สนใจ แล้วกด "เริ่มเรียน"' },
    { id: '2', question: 'ฉันจะได้รับใบประกาศเมื่อไหร่?', answer: 'เมื่อคุณเรียนจบทุกบทเรียนและสอบผ่านข้อสอบปลายภาค' },
    { id: '3', question: 'สามารถเรียนออฟไลน์ได้ไหม?', answer: 'ในตอนนี้ยังต้องใช้อินเทอร์เน็ตในการเรียน' },
    { id: '4', question: 'วิธีแก้ปัญหาวิดีโอไม่เล่น?', answer: 'ลองเช็คการเชื่อมต่ออินเทอร์เน็ต หรือรีสตาร์ทแอป' },
    { id: '5', question: 'จะยกเลิกบัญชีได้อย่างไร?', answer: 'ติดต่อทีมซัพพอร์ตผ่านอีเมล support@mydemy.co' },
  ];

  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ช่วยเหลือ</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact */}
        <View style={styles.contactCard}>
          <Ionicons name="headset" size={40} color={COLORS.primary} />
          <Text style={styles.contactTitle}>ต้องการความช่วยเหลือ?</Text>
          <Text style={styles.contactText}>ทีมของเราพร้อมช่วยเหลือคุณ</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => Linking.openURL('mailto:support@mydemy.co')}
            >
              <Ionicons name="mail" size={20} color="#FFF" />
              <Text style={styles.contactButtonText}>อีเมล</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.contactButton, styles.contactButtonOutline]}
              onPress={() => Linking.openURL('https://line.me/mydemy')}
            >
              <Ionicons name="chatbubble" size={20} color={COLORS.primary} />
              <Text style={[styles.contactButtonText, styles.contactButtonTextOutline]}>Line</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>คำถามที่พบบ่อย</Text>
        {faqs.map((faq) => (
          <TouchableOpacity 
            key={faq.id} 
            style={styles.faqItem}
            onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Ionicons 
                name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#6B7280" 
              />
            </View>
            {expandedFaq === faq.id && (
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Social */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>ติดตามเรา</Text>
        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-instagram" size={24} color="#E4405F" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-youtube" size={24} color="#FF0000" />
          </TouchableOpacity>
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
  contactCard: {
    backgroundColor: '#FDF2F8',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonOutline: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  contactButtonTextOutline: {
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  faqItem: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    lineHeight: 22,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
});