import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

// ─── Shared article data (mirrors home.tsx MOCK_ARTICLES) ─────────────────────
const ARTICLES: Record<string, { title: string; category: string; read_time: number; cover_emoji: string; cover_color: string; content: string }> = {
  '1': {
    title: 'UX Writing คืออะไร? ทำไมทุกแบรนด์ถึงต้องการคนเขียน UX',
    category: 'UX Writing', read_time: 5, cover_emoji: '✍️', cover_color: '#E91E8C',
    content: `UX Writing คือการเขียนคำ ข้อความ และภาษาที่ปรากฏในผลิตภัณฑ์ดิจิทัล ไม่ว่าจะเป็นปุ่ม เมนู ข้อความแจ้งเตือน หรือคำแนะนำต่างๆ เป้าหมายคือช่วยให้ผู้ใช้เข้าใจและใช้งานผลิตภัณฑ์ได้ง่ายขึ้น

🔑 ทำไม UX Writing ถึงสำคัญ?

ลองนึกถึงปุ่มสองปุ่ม: "ส่ง" กับ "ยืนยันการสั่งซื้อ" แบบไหนชัดเจนกว่ากัน? คำตอบชัดเจน — UX Writing ที่ดีลดความสับสน เพิ่ม Conversion และสร้างความไว้วางใจ

📌 UX Writer ทำอะไรบ้าง?

• เขียน Microcopy: ปุ่ม, placeholder, error message
• สร้าง Tone of Voice ของแบรนด์ในดิจิทัล
• ทำงานร่วมกับ UX Designer และ Product Manager
• ทดสอบ A/B ข้อความเพื่อหาสิ่งที่ดีที่สุด

💡 ตัวอย่าง UX Writing ที่ดีในชีวิตประจำวัน

Grab: "คนขับกำลังมาหาคุณ" แทนที่จะเป็น "คำสั่งกำลังดำเนินการ"
Lazada: "เหลือ 2 ชิ้นเท่านั้น!" สร้าง Urgency ได้ทันที
LINE Pay: "ยืนยันการโอน ฿500 ให้ สมชาย?" ชัดเจน ไม่ต้องเดา

🚀 เริ่มต้นเป็น UX Writer ได้อย่างไร?

1. ศึกษาหลักการ UX เบื้องต้น
2. ฝึกเขียน Microcopy ให้กระชับและชัดเจน
3. สร้าง Portfolio จากโปรเจกต์สมมติ
4. เรียนรู้เครื่องมืออย่าง Figma เพื่อทำงานร่วมกับทีม

ในยุคที่ทุกบริษัทมีแอปหรือเว็บไซต์ UX Writer จึงเป็นที่ต้องการอย่างมาก โดยเฉพาะในไทยที่ตลาดยังเปิดกว้างสำหรับคนรุ่นใหม่`,
  },
  '2': {
    title: '7 หลักการ UX Design ที่ทำให้แอปติดใจผู้ใช้ตั้งแต่วินาทีแรก',
    category: 'UX Design', read_time: 6, cover_emoji: '🎨', cover_color: '#7C3AED',
    content: `ผลิตภัณฑ์ที่ดีไม่ได้แค่สวยงาม แต่ต้องใช้งานได้ง่ายและตอบสนองความต้องการของผู้ใช้จริงๆ นี่คือ 7 หลักการที่นักออกแบบ UX มืออาชีพยึดถือ

1️⃣ User-Centered Design

ออกแบบเพื่อผู้ใช้จริง ไม่ใช่เพื่อความชอบส่วนตัวของทีม ทำ User Research ก่อนเริ่มออกแบบเสมอ

2️⃣ ความเรียบง่าย (Simplicity)

"If in doubt, leave it out" — ยิ่งน้อยยิ่งดี ลบทุกอย่างที่ไม่จำเป็นออก เหลือแต่สิ่งที่ผู้ใช้ต้องการจริงๆ

3️⃣ ความสม่ำเสมอ (Consistency)

สีเดียว, Font เดียว, รูปแบบเดียวกันตลอด ผู้ใช้ไม่ต้องเรียนรู้ใหม่ทุกหน้า

4️⃣ Feedback ที่ชัดเจน

เมื่อผู้ใช้กดปุ่ม ต้องเห็นการตอบสนองทันที ไม่ว่าจะเป็น Loading indicator, Success message หรือ Error message

5️⃣ การนำทางที่ชัดเจน (Clear Navigation)

ผู้ใช้ต้องรู้ตลอดว่า "ตอนนี้อยู่ที่ไหน" และ "จะไปที่ไหนได้บ้าง" Breadcrumb และ Active state ช่วยได้มาก

6️⃣ Accessibility

ออกแบบให้ทุกคนใช้ได้ รวมถึงผู้พิการทางสายตา ใช้ขนาดตัวอักษรที่อ่านง่าย และ Contrast ที่เพียงพอ

7️⃣ ทดสอบกับผู้ใช้จริง (User Testing)

อย่าเดา — ทดสอบ! แม้แค่ 5 คน ก็สามารถเปิดเผยปัญหาสำคัญได้ถึง 85%

💬 สรุป

UX Design ที่ดีไม่ต้องซับซ้อน แค่เข้าใจผู้ใช้และแก้ปัญหาของเขาให้ได้ นั่นคือหัวใจของทุกอย่าง`,
  },
  '3': {
    title: 'เริ่มใช้ Figma ตั้งแต่ศูนย์: เส้นทางสู่นักออกแบบมืออาชีพ',
    category: 'Figma', read_time: 7, cover_emoji: '🖌️', cover_color: '#0EA5E9',
    content: `Figma คือเครื่องมือออกแบบ UI/UX ที่ได้รับความนิยมสูงสุดในโลกตอนนี้ ทีมออกแบบของ Google, Airbnb, Spotify ล้วนใช้ Figma ทั้งนั้น

🤔 ทำไม Figma ถึงเป็นที่นิยม?

• ใช้งานบน Browser ได้เลย ไม่ต้องติดตั้ง
• Real-time collaboration — ทีมหลายคนทำงานพร้อมกันได้
• Free plan ที่ใช้งานได้จริงสำหรับมือใหม่
• Community ไฟล์ให้ดาวน์โหลดฟรีนับหมื่นชิ้น

📚 ขั้นตอนการเริ่มต้น

สัปดาห์ที่ 1: เรียนรู้ Interface
ทำความรู้จักกับ Frame, Layer, Component และ Auto Layout เหล่านี้คือพื้นฐานที่ต้องแม่น

สัปดาห์ที่ 2: ออกแบบหน้าจอแรก
ลองออกแบบหน้า Login Screen โดยใช้สิ่งที่เรียนมา ไม่ต้องสมบูรณ์แบบ แค่ลงมือทำ

สัปดาห์ที่ 3: Component และ Design System
เรียนรู้วิธีสร้าง Reusable Component เพื่อให้งานสม่ำเสมอและเร็วขึ้น

สัปดาห์ที่ 4: Prototype
เชื่อม Frame เข้าด้วยกันเพื่อสร้าง Interactive Prototype ให้ลูกค้าหรือทีม Developer ดู

🎯 เคล็ดลับจากผู้ใช้มืออาชีพ

"เรียนรู้ Auto Layout ให้เชี่ยวชาญ นั่นคือสิ่งที่แยกมือใหม่กับมืออาชีพออกจากกัน"

💼 Figma ในตลาดงาน

ทักษะ Figma เป็นที่ต้องการสูงมากในตลาดงานไทย โดยเฉพาะตำแหน่ง UI Designer, UX Designer และ Product Designer เงินเดือนเริ่มต้นที่ 25,000-45,000 บาทสำหรับผู้มีประสบการณ์ 1-2 ปี`,
  },
  '4': {
    title: 'Prototype คืออะไร? ทดสอบงานก่อนโค้ดจริงประหยัดเวลาได้แค่ไหน',
    category: 'Prototype & Testing', read_time: 5, cover_emoji: '🧪', cover_color: '#059669',
    content: `Prototype คือการจำลองผลิตภัณฑ์ก่อนที่จะพัฒนาจริง เหมือนกับการสร้างบ้านจำลองก่อนสร้างบ้านจริง เพื่อให้เห็นปัญหาตั้งแต่ต้น

💡 ทำไม Prototype ถึงสำคัญ?

ค่าใช้จ่ายในการแก้ปัญหา:
• แก้ใน Prototype: 1 ชั่วโมง
• แก้ระหว่าง Development: 10 ชั่วโมง
• แก้หลัง Launch: 100 ชั่วโมง

ตัวเลขนี้คือเหตุผลว่าทำไมทุกทีมที่ดีต้องทำ Prototype ก่อนเสมอ

🔧 ประเภทของ Prototype

Lo-Fi Prototype (ต่ำ)
วาดด้วยมือหรือ Wireframe เรียบง่าย เร็ว ประหยัด เหมาะสำหรับทดสอบ Concept

Mid-Fi Prototype (กลาง)
ใช้ Figma สร้าง Grayscale Layout แสดง Structure โดยไม่สนใจสีสันหรือรูปภาพ

Hi-Fi Prototype (สูง)
เหมือนผลิตภัณฑ์จริงทุกอย่าง ใช้ทดสอบกับผู้ใช้จริงก่อน Launch

🧑‍🔬 วิธีทำ User Testing กับ Prototype

1. กำหนด Task ที่ต้องการทดสอบ เช่น "ลองสั่งซื้อสินค้าชิ้นนี้"
2. หาผู้ทดสอบ 5-8 คน ที่ตรงกับ Target User
3. สังเกตโดยไม่ช่วยเหลือ — บันทึกว่าพวกเขาสับสนตรงไหน
4. สรุปผลและแก้ไข Design

📊 ผลลัพธ์จริงจากบริษัทชั้นนำ

Airbnb รายงานว่าการทำ Prototype และ Testing ช่วยลด Development Cost ได้ถึง 40% เพราะพบปัญหาก่อนที่จะโค้ดจริง`,
  },
  '5': {
    title: 'Portfolio UX ที่ดีต้องมีอะไรบ้าง? เคล็ดลับจากนักออกแบบที่ได้งาน',
    category: 'UX Design', read_time: 8, cover_emoji: '💼', cover_color: '#D97706',
    content: `Portfolio คือสิ่งที่สำคัญที่สุดสำหรับนักออกแบบ UX มือใหม่ที่ต้องการหางาน แต่หลายคนทำ Portfolio ผิดวิธีจนทำให้พลาดโอกาสดีๆ

❌ สิ่งที่ Portfolio UX ไม่ควรมี

• แค่ Mockup สวยๆ โดยไม่บอก Process
• โปรเจกต์ที่ทำแค่เพราะ "น่าทำ" ไม่ได้แก้ปัญหาจริง
• ไม่มีเรื่องราว — แค่วางรูปเฉยๆ

✅ สิ่งที่ Portfolio UX ต้องมี

1. Case Study ที่บอก Story ครบวงจร
   Problem → Research → Design Process → Solution → Result

2. ตัวเลขและผลลัพธ์ที่วัดได้
   "หลังจาก Redesign Conversion Rate เพิ่มขึ้น 23%"

3. แสดงกระบวนการคิด ไม่ใช่แค่ Final Design
   ใส่ Sketch, Wireframe, Iteration ต่างๆ

4. โปรเจกต์ที่หลากหลาย 3-4 ชิ้น
   ไม่จำเป็นต้องเยอะ แต่ต้องดีและบอกเล่าได้ดี

🛠️ เครื่องมือสร้าง Portfolio

• Notion — ฟรี จัดหน้าได้สวย
• Figma Community — ใช้ Template สำเร็จรูป
• Behance — Platform ที่ HR ส่วนใหญ่เช็ค

💬 คำแนะนำจากนักออกแบบที่ได้งานจริง

"ฉันมีแค่ 2 Case Study แต่ทั้งคู่เขียนละเอียดมาก บอก Process ทุกขั้นตอน นั่นคือสิ่งที่ทำให้ได้รับเรียกสัมภาษณ์ 8 บริษัทใน 2 สัปดาห์"`,
  },
  '6': {
    title: 'Microcopy: คำเล็กๆ ที่เปลี่ยน Conversion Rate ของเว็บได้จริง',
    category: 'UX Writing', read_time: 4, cover_emoji: '💬', cover_color: '#E91E8C',
    content: `Microcopy คือข้อความสั้นๆ ในผลิตภัณฑ์ดิจิทัล เช่น ปุ่ม, Placeholder, Error Message, Tooltip — สิ่งเล็กๆ ที่มีผลกระทบใหญ่หลวงมากกว่าที่คิด

📊 ตัวเลขที่น่าตกใจ

Hubspot ทดสอบปุ่ม CTA สองแบบ:
• "เริ่มทดลองใช้ฟรี" → Conversion 6.2%
• "เริ่มทดลองใช้ฟรี ไม่ต้องใส่บัตรเครดิต" → Conversion 8.9%

เพิ่มขึ้น 44% จากการเพิ่มคำ 5 คำ!

✍️ หลักการเขียน Microcopy ที่ดี

1. พูดภาษาของผู้ใช้
   ❌ "Authentication Failed"
   ✅ "อีเมลหรือรหัสผ่านไม่ถูกต้อง ลองใหม่อีกครั้ง"

2. บอก Action ที่ต้องทำ ไม่ใช่แค่สถานะ
   ❌ "ไฟล์ใหญ่เกินไป"
   ✅ "ไฟล์ต้องไม่เกิน 5MB กรุณาบีบอัดก่อนอัปโหลด"

3. ลด Anxiety ในจุดที่ผู้ใช้กังวล
   ตรงปุ่ม Subscribe: "ยกเลิกได้ทุกเมื่อ ไม่มีค่าปรับ"

4. ใช้ Tone ที่สอดคล้องกับแบรนด์
   แอปเด็ก = สนุกสนาน | แอปการเงิน = น่าเชื่อถือ

🎯 จุดสำคัญที่ต้องใส่ใจ Microcopy

• หน้า Login/Register
• หน้า Checkout
• Empty State (เมื่อยังไม่มีข้อมูล)
• Error Messages
• Onboarding Steps`,
  },
  '7': {
    title: 'User Research ง่ายๆ ที่ทำได้เองโดยไม่ต้องมีทีมใหญ่',
    category: 'UX Design', read_time: 6, cover_emoji: '🔍', cover_color: '#DC2626',
    content: `หลายคนคิดว่า User Research ต้องมีงบประมาณมาก มีทีมใหญ่ และใช้เวลานาน แต่ความจริงคือคุณเริ่มทำได้ตอนนี้เลย ด้วยทรัพยากรที่มีอยู่

🔬 5 วิธี User Research ที่ทำได้เอง

1. User Interview (สัมภาษณ์ผู้ใช้)
แค่คุยกับ 5-8 คนในกลุ่มเป้าหมาย ถามว่าพวกเขาแก้ปัญหาปัจจุบันอย่างไร ไม่ต้องถามว่าอยากได้อะไร (เพราะคนมักตอบไม่ตรง)

2. Guerrilla Testing
เดินไปหาคนในร้านกาแฟ ขอเวลา 10 นาที ให้เขาลองใช้ Prototype แลกกับกาแฟหนึ่งแก้ว ได้ Insight จริงๆ โดยไม่เสียมาก

3. Survey (แบบสอบถาม)
ใช้ Google Form หรือ Typeform สร้างแบบสอบถาม แชร์ใน Facebook Group ที่เกี่ยวข้อง

4. Analytics (ถ้ามีผลิตภัณฑ์อยู่แล้ว)
Hotjar ฟรี Plan ให้ดู Heatmap และ Recording การใช้งานจริง เห็นได้ทันทีว่าผู้ใช้ติดอยู่ตรงไหน

5. Competitor Analysis
ลองใช้แอปคู่แข่งจริงๆ อ่าน Review ใน App Store อ่าน Comment ใน Facebook Page — Insight อยู่รอบตัวคุณ

📝 Template คำถาม Interview ที่ใช้ได้เลย

• "ปกติคุณแก้ปัญหา [X] ด้วยวิธีไหน?"
• "อะไรคือสิ่งที่ยากที่สุดในกระบวนการนั้น?"
• "ครั้งสุดท้ายที่คุณทำ [X] คือเมื่อไหร่ ช่วยเล่าให้ฟังได้ไหม?"

หลีกเลี่ยงคำถาม Yes/No และอย่าถามว่า "คุณอยากได้ Feature นี้ไหม?" เพราะคนมักตอบ "อยากได้" ทุกอย่าง`,
  },
  '8': {
    title: 'Design System คืออะไร? ทำไม Figma ถึงเป็นเครื่องมือที่ทีมเลือกใช้',
    category: 'Figma', read_time: 5, cover_emoji: '🧩', cover_color: '#0891B2',
    content: `Design System คือชุดของ "กฎ" และ "ชิ้นส่วน" ที่ทีมออกแบบและพัฒนาใช้ร่วมกัน เพื่อให้ผลิตภัณฑ์มีความสม่ำเสมอและสร้างได้เร็วขึ้น

🏗️ ส่วนประกอบของ Design System

Color Palette
สีหลัก สีรอง และ Neutral Colors พร้อม Token เช่น "primary-500" แทนที่จะเป็น "#E91E8C"

Typography Scale
ขนาดตัวอักษร H1-H6, Body, Caption พร้อม Font Weight และ Line Height

Components Library
ปุ่ม, Input, Card, Modal, Navigation — สร้างครั้งเดียว ใช้ได้ทั้งแอป

Spacing System
ระบบ Spacing ที่สม่ำเสมอ เช่น 4px, 8px, 16px, 24px, 32px

🔧 ทำไมต้อง Figma?

Figma มีระบบ Component และ Variable ที่ทรงพลัง:
• แก้ Component ครั้งเดียว → อัปเดตทั้งแอปอัตโนมัติ
• แชร์ Library ให้ทีม Developer ได้ทันที
• Auto Layout ช่วยให้ Component ยืดหยุ่นกับทุก Screen Size

🌟 ตัวอย่าง Design System ชั้นนำ

• Material Design (Google) — ฟรี ดูได้ที่ material.io
• Human Interface Guidelines (Apple)
• Fluent Design (Microsoft)

💡 เริ่มต้น Design System ของตัวเองได้อย่างไร?

ไม่ต้องเริ่มจากศูนย์ — ดาวน์โหลด UI Kit ฟรีจาก Figma Community แล้วปรับแต่งให้เป็นของตัวเอง นั่นคือวิธีที่เร็วที่สุด`,
  },
};

export default function BlogScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = ARTICLES[id ?? '1'];

  if (!article) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.notFound}>ไม่พบบทความ</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: article.cover_color + '18' }]}>
          <Text style={styles.heroEmoji}>{article.cover_emoji}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: article.cover_color }]}>
            <Text style={styles.categoryText}>{article.category}</Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{article.read_time} นาทีในการอ่าน</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{article.title}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        <Text style={styles.content}>{article.content}</Text>

        {/* Footer CTA */}
        <View style={[styles.cta, { backgroundColor: article.cover_color + '15' }]}>
          <Text style={styles.ctaTitle}>สนใจพัฒนาทักษะนี้?</Text>
          <Text style={styles.ctaBody}>Mydemy มีคอร์ส {article.category} ที่ออกแบบมาเพื่อให้คุณเริ่มต้นได้ทันที</Text>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: article.cover_color }]}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.ctaBtnText}>ดูคอร์สที่เกี่ยวข้อง</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { paddingBottom: 100 },
  hero: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  heroEmoji: { fontSize: 56 },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  categoryText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 32,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.lg,
  },
  content: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 28,
    paddingHorizontal: SPACING.lg,
  },
  cta: {
    margin: SPACING.lg,
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: 8,
  },
  ctaTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  ctaBody: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  ctaBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  ctaBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  notFound: { textAlign: 'center', marginTop: 40, color: COLORS.textSecondary },
});
