import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { COLORS, SPACING, RADIUS, CAREER_PATHS } from '../../constants/theme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface DashboardData {
  xp_total: number;
  level_info: { level: number; progress_percent: number; xp_needed: number; xp_in_level: number };
  current_streak: number;
  daily_goal: number;
  today_xp: number;
  daily_progress_percent: number;
  week_activity: Array<{ date: string; xp: number; goal_met: boolean }>;
  badges: Array<{ id: string; name: string; icon: string }>;
  stats: { lessons_completed: number; courses_completed: number };
}

interface Course {
  _id: string;
  title: string;
  description: string;
  career_path: string;
  total_lessons: number;
  practice_module_count?: number;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  color: string;
  icon: string;
  link?: string;
}

interface Article {
  id: string;
  title: string;
  category: string;
  read_time: number;
  cover_emoji: string;
  cover_color: string;
  content: string;
  url?: string;
}

// ─── Placeholder data until backend endpoints exist ─────────────────────────
const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'ยินดีต้อนรับสู่ Mydemy! 🎉',
    body: 'เราพร้อมช่วยคุณพัฒนาทักษะด้วยคอร์สออนไลน์คุณภาพสูง',
    color: '#ef5ea8',
    icon: '📣',
  },
  {
    id: '2',
    title: 'คอร์สใหม่มาแล้ว!',
    body: 'เปิดตัวคอร์ส UX/UI Design ฉบับสมบูรณ์ สมัครได้เลยวันนี้',
    color: '#d94d94',
    icon: '🆕',
  },
];

const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'UX Writing คืออะไร? ทำไมทุกแบรนด์ถึงต้องการคนเขียน UX',
    category: 'UX Writing',
    read_time: 5,
    cover_emoji: '✍️',
    cover_color: '#E91E8C',
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
  {
    id: '2',
    title: '7 หลักการ UX Design ที่ทำให้แอปติดใจผู้ใช้ตั้งแต่วินาทีแรก',
    category: 'UX Design',
    read_time: 6,
    cover_emoji: '🎨',
    cover_color: '#7C3AED',
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
  {
    id: '3',
    title: 'เริ่มใช้ Figma ตั้งแต่ศูนย์: เส้นทางสู่นักออกแบบมืออาชีพ',
    category: 'Figma',
    read_time: 7,
    cover_emoji: '🖌️',
    cover_color: '#0EA5E9',
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
  {
    id: '4',
    title: 'Prototype คืออะไร? ทดสอบงานก่อนโค้ดจริงประหยัดเวลาได้แค่ไหน',
    category: 'Prototype & Testing',
    read_time: 5,
    cover_emoji: '🧪',
    cover_color: '#059669',
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
  {
    id: '5',
    title: 'Portfolio UX ที่ดีต้องมีอะไรบ้าง? เคล็ดลับจากนักออกแบบที่ได้งาน',
    category: 'UX Design',
    read_time: 8,
    cover_emoji: '💼',
    cover_color: '#D97706',
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
  {
    id: '6',
    title: 'Microcopy: คำเล็กๆ ที่เปลี่ยน Conversion Rate ของเว็บได้จริง',
    category: 'UX Writing',
    read_time: 4,
    cover_emoji: '💬',
    cover_color: '#E91E8C',
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
  {
    id: '7',
    title: 'User Research ง่ายๆ ที่ทำได้เองโดยไม่ต้องมีทีมใหญ่',
    category: 'UX Design',
    read_time: 6,
    cover_emoji: '🔍',
    cover_color: '#DC2626',
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
  {
    id: '8',
    title: 'Design System คืออะไร? ทำไม Figma ถึงเป็นเครื่องมือที่ทีมเลือกใช้',
    category: 'Figma',
    read_time: 5,
    cover_emoji: '🧩',
    cover_color: '#0891B2',
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
];

// ─── Streak milestone labels ─────────────────────────────────────────────────
function streakMilestoneMsg(streak: number): string {
  if (streak >= 30) return `🌟 ${streak} วันติดต่อกัน! สุดยอดมาก!`;
  if (streak >= 14) return `💎 ${streak} วัน กำลังไปได้ดีมาก!`;
  if (streak >= 7) return `🔥 ${streak} วัน! ครบสัปดาห์แรกแล้ว!`;
  if (streak >= 3) return `⚡ ${streak} วันติดต่อกัน ไปต่อเลย!`;
  if (streak === 2) return `✨ 2 วันติดต่อกัน! รักษาไว้นะ`;
  if (streak === 1) return `🌱 วันแรก เริ่มต้นที่ดี!`;
  return `🎯 เช็คอินวันนี้เพื่อเริ่ม streak`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [loading, setLoading] = useState(true);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInXp, setCheckInXp] = useState(0);
  const [showXpPop, setShowXpPop] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Animations ──────────────────────────────────────────────────────────────
  const checkInScale = useRef(new Animated.Value(1)).current;
  const xpPopOpacity = useRef(new Animated.Value(0)).current;
  const xpPopY = useRef(new Animated.Value(0)).current;
  const checkInPulse = useRef(new Animated.Value(1)).current;

  const todayKey = `checkin_${new Date().toISOString().slice(0, 10)}`;

  // Grid — 2 columns
  const gridPadding = SPACING.lg * 2;
  const gridGap = SPACING.sm;
  const cardWidth = (width - gridPadding - gridGap) / 2;

  const fetchData = async () => {
    try {
      const coursesRes = await axios.get(`${API_URL}/api/courses?published_only=true`);
      setCourses(coursesRes.data);
      const shuffled = [...coursesRes.data].sort(() => 0.5 - Math.random());
      setRecommendedCourses(shuffled.slice(0, 6));

      if (user?._id) {
        try {
          const dashRes = await axios.get(`${API_URL}/api/gamification/dashboard/${user._id}`);
          setDashboard(dashRes.data);
        } catch (_) {}
      }

      try {
        const done = await AsyncStorage.getItem(todayKey);
        setCheckedInToday(done === 'true');
      } catch (_) {}
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchData();
    // Check unread notifications
    const checkUnread = async () => {
      try {
        const lastSeenKey = `notif_last_seen_${user?._id || 'guest'}`;
        const lastSeen = await AsyncStorage.getItem(lastSeenKey);
        const res = await axios.get(`${API_URL}/api/notifications`, {
          params: user?._id ? { user_id: user._id } : {},
        });
        const notifs: any[] = res.data || [];
        if (!lastSeen) {
          setUnreadCount(notifs.length);
        } else {
          setUnreadCount(notifs.filter((n: any) => new Date(n.created_at) > new Date(lastSeen)).length);
        }
      } catch { setUnreadCount(0); }
    };
    checkUnread();
  }, [user?._id]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const animateCheckInPress = () => {
    xpPopOpacity.setValue(0);
    xpPopY.setValue(0);
    Animated.sequence([
      Animated.spring(checkInScale, {
        toValue: 0.88,
        useNativeDriver: true,
        friction: 8,
        tension: 200,
      }),
      Animated.spring(checkInScale, {
        toValue: 1.12,
        useNativeDriver: true,
        friction: 4,
        tension: 200,
      }),
      Animated.spring(checkInScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 200,
      }),
    ]).start();
  };

  const animateXpPop = () => {
    xpPopOpacity.setValue(1);
    xpPopY.setValue(0);
    Animated.parallel([
      Animated.timing(xpPopY, {
        toValue: -40,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(xpPopOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => setShowXpPop(false));
  };

  const handleCheckIn = async () => {
    if (!user || checkingIn || checkedInToday) return;
    animateCheckInPress();
    setCheckingIn(true);
    // Pulse the button while waiting for API
    checkInPulse.setValue(1);
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(checkInPulse, { toValue: 0.65, duration: 500, useNativeDriver: true }),
        Animated.timing(checkInPulse, { toValue: 1,    duration: 500, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();
    try {
      const res = await axios.post(`${API_URL}/api/gamification/daily-checkin`, { user_id: user._id });
      setCheckedInToday(true);
      await AsyncStorage.setItem(todayKey, 'true');
      if (!res.data.already_checked_in) {
        const awarded = res.data.xp_awarded ?? 20;
        setCheckInXp(awarded);
        setShowXpPop(true);
        animateXpPop();
        // Optimistically bump today_xp so the goal bar updates immediately
        setDashboard(prev => prev ? {
          ...prev,
          today_xp: (prev.today_xp ?? 0) + awarded,
          daily_progress_percent: Math.min(100, Math.round(((prev.today_xp ?? 0) + awarded) / (prev.daily_goal || 30) * 100)),
          current_streak: res.data.streak ?? prev.current_streak,
        } : prev);
      }
      // Always re-fetch to get authoritative dashboard data
      fetchData();
    } catch (_) {
      // silently fail
    } finally {
      pulseLoop.stop();
      checkInPulse.setValue(1);
      setCheckingIn(false);
    }
  };

  const getPathColor = (path: string) => CAREER_PATHS.find(p => p.id === path)?.color || COLORS.primary;
  const getPathIcon = (path: string) => CAREER_PATHS.find(p => p.id === path)?.icon || '📚';
  const careerPathsToShow = CAREER_PATHS.filter(p => p.id !== 'all');

  const firstName = (user?.display_name || user?.username || 'คุณ').split(' ')[0];
  const streak = dashboard?.current_streak ?? 0;
  const levelPct = dashboard?.level_info?.progress_percent ?? 0;
  const level = dashboard?.level_info?.level ?? 1;
  const goalPct = Math.min(dashboard?.daily_progress_percent ?? 0, 100);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >

        {/* ─────────────────────────────── HEADER ─────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          {/* Top: avatar + greeting */}
          <View style={styles.headerTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.display_name || user?.username || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.greetingBlock}>
              <Text style={styles.greetingSmall}>สวัสดี 👋</Text>
              <Text style={styles.greetingName} numberOfLines={1}>{firstName}</Text>
            </View>
            <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.85)" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Stats pills row */}
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillEmoji}>🔥</Text>
              <Text style={styles.statPillNum}>{streak}</Text>
              <Text style={styles.statPillLabel}> วัน</Text>
            </View>
            <View style={[styles.statPill, styles.statPillXp]}>
              <Text style={styles.statPillEmoji}>⚡</Text>
              <Text style={styles.statPillNum}>{dashboard?.xp_total ?? 0}</Text>
              <Text style={styles.statPillLabel}> XP</Text>
            </View>
            <View style={[styles.statPill, styles.statPillLevel]}>
              <Text style={styles.statPillEmoji}>👑</Text>
              <Text style={[styles.statPillNum, { color: '#FFD700' }]}>Lv.{level}</Text>
            </View>
          </View>

          {/* Level progress bar */}
          <View style={styles.levelBarWrap}>
            <View style={styles.levelBarTrack}>
              <View style={[styles.levelBarFill, { width: `${levelPct}%` as any }]} />
            </View>
            <Text style={styles.levelBarLabel}>{levelPct}% → Lv.{level + 1}</Text>
          </View>
        </View>

        {/* ─────────────────── TODAY CARD (goal + check-in) ─────────────────── */}
        <View style={styles.todayCard}>
          {/* Daily goal row */}
          <View style={styles.todayGoalRow}>
            <View>
              <Text style={styles.todayGoalTitle}>🎯 เป้าหมายวันนี้</Text>
              <Text style={styles.todayGoalSub}>
                {goalPct >= 100
                  ? '🎉 บรรลุเป้าหมายแล้ว!'
                  : `เหลืออีก ${Math.max(0, (dashboard?.daily_goal ?? 30) - (dashboard?.today_xp ?? 0))} XP`}
              </Text>
            </View>
            <Text style={styles.todayXpNum}>
              {dashboard?.today_xp ?? 0}
              <Text style={styles.todayXpGoal}> /{dashboard?.daily_goal ?? 30}</Text>
            </Text>
          </View>
          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, { width: `${goalPct}%` as any }]} />
          </View>

          {/* Divider */}
          <View style={styles.todayDivider} />

          {/* Check-in section */}
          {user && (
            <View style={styles.checkInSection}>
              {/* Left: streak big display */}
              <View style={styles.streakBig}>
                <Text style={styles.streakFireEmoji}>{checkedInToday ? '🔥' : '💤'}</Text>
                <Text style={styles.streakBigNum}>{streak}</Text>
                <Text style={styles.streakBigLabel}>วัน</Text>
              </View>

              {/* Center: milestone text + week dots */}
              <View style={styles.checkInCenter}>
                <Text style={styles.streakMilestone}>{streakMilestoneMsg(streak)}</Text>
                <View style={styles.weekRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map(day => (
                    <View key={day} style={styles.dayCol}>
                      <View style={[styles.dayDot, day <= streak ? styles.dayDotOn : styles.dayDotOff]}>
                        {day <= streak
                          ? <Text style={styles.dayDotEmoji}>🔥</Text>
                          : <View style={styles.dayDotEmpty} />}
                      </View>
                      <Text style={styles.dayLabel}>{day}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Right: check-in button */}
              <View style={styles.checkInRight}>
                {!checkedInToday ? (
                  <View>
                    <Animated.View style={{ transform: [{ scale: checkInScale }], opacity: checkingIn ? checkInPulse : 1 }}>
                      <TouchableOpacity
                        style={[styles.checkInBtn, checkingIn && styles.checkInBtnDisabled]}
                        onPress={handleCheckIn}
                        disabled={checkingIn}
                        activeOpacity={0.85}
                      >
                        {checkingIn
                          ? <><ActivityIndicator size="small" color="#fff" /><Text style={[styles.checkInBtnText, { marginLeft: 6 }]}>กำลังบันทึก...</Text></>
                          : (
                            <>
                              <Text style={styles.checkInBtnEmoji}>✅</Text>
                              <Text style={styles.checkInBtnText}>เช็คอิน</Text>
                              <Text style={styles.checkInBtnXp}>+20 XP</Text>
                            </>
                          )}
                      </TouchableOpacity>
                    </Animated.View>
                    {/* XP pop */}
                    {showXpPop && (
                      <Animated.Text
                        style={[
                          styles.xpPop,
                          { opacity: xpPopOpacity, transform: [{ translateY: xpPopY }] },
                        ]}
                      >
                        +{checkInXp} XP 🎉
                      </Animated.Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.checkInDone}>
                    <Ionicons name="checkmark-circle" size={36} color="#10B981" />
                    <Text style={styles.checkInDoneLabel}>เช็คอินแล้ว</Text>
                    {checkInXp > 0 && (
                      <Text style={styles.checkInDoneXp}>+{checkInXp} XP</Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* ─────────────────────── ANNOUNCEMENTS ─────────────────────── */}
        {announcements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📢 ประกาศ</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {announcements.map(ann => (
                <TouchableOpacity
                  key={ann.id}
                  activeOpacity={0.88}
                  onPress={ann.link ? () => {} : undefined}
                >
                  <View style={[styles.announcementCard, { backgroundColor: ann.color }]}>
                    <Text style={styles.annIcon}>{ann.icon}</Text>
                    <View style={styles.annBody}>
                      <Text style={styles.annTitle} numberOfLines={1}>{ann.title}</Text>
                      <Text style={styles.annText} numberOfLines={2}>{ann.body}</Text>
                    </View>
                    {ann.link && (
                      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─────────────────────── RECOMMENDED COURSES ─────────────────────── */}
        {recommendedCourses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📚 เริ่มเรียนเลย</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.seeAll}>ดูทั้งหมด →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {recommendedCourses.map(course => {
                const pmCount = course.practice_module_count || 0;
                const lessonCount = course.total_lessons || 0;
                const isInteractive = pmCount > 0 && lessonCount === 0;
                return (
                  <TouchableOpacity
                    key={course._id}
                    style={styles.courseHCard}
                    onPress={() => router.push(`/course-detail?id=${course._id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.courseHCover, { backgroundColor: getPathColor(course.career_path) + (isInteractive ? '22' : '') }]}>
                      <Text style={styles.courseHIcon}>{isInteractive ? '⚡' : getPathIcon(course.career_path)}</Text>
                      {isInteractive && (
                        <View style={styles.interactiveTag}>
                          <Text style={styles.interactiveTagText}>Interactive</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.courseHBody}>
                      <Text style={styles.courseHTitle} numberOfLines={2}>{course.title}</Text>
                      <View style={styles.courseHMeta}>
                        <Ionicons
                          name={isInteractive ? 'flash-outline' : 'book-outline'}
                          size={11}
                          color={isInteractive ? COLORS.primary : COLORS.textSecondary}
                        />
                        <Text style={[styles.courseHMetaText, isInteractive && { color: COLORS.primary }]}>
                          {isInteractive ? `${pmCount} โมดูล` : `${lessonCount} บทเรียน`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ─────────────────────── CAREER PATHS ─────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎓 สาขาอาชีพ</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.seeAll}>เลือกเส้นทาง →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {careerPathsToShow.map((path, i) => {
              const isLastOdd = careerPathsToShow.length % 2 !== 0 && i === careerPathsToShow.length - 1;
              return (
                <TouchableOpacity
                  key={path.id}
                  style={[
                    styles.pathCard,
                    { width: cardWidth, borderColor: path.color + '30' },
                    isLastOdd && { marginRight: cardWidth + gridGap },
                  ]}
                  onPress={() => router.push(`/(tabs)/explore?path=${path.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.pathIconWrap, { backgroundColor: path.color + '18' }]}>
                    <Text style={styles.pathEmoji}>{path.icon}</Text>
                  </View>
                  <Text style={styles.pathName} numberOfLines={2}>{path.name}</Text>
                  <Text style={[styles.pathCta, { color: path.color }]}>ดูคอร์ส →</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─────────────────────── TIPS & ARTICLES ─────────────────────── */}
        {articles.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💡 รวมเคล็ดลับ</Text>
              <TouchableOpacity onPress={() => router.push('/articles')}>
                <Text style={styles.seeAll}>ดูทั้งหมด →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hScrollContent}
            >
              {articles.map(article => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.articleCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/blog?id=${article.id}`)}
                >
                  <View style={[styles.articleCover, { backgroundColor: article.cover_color + '22' }]}>
                    <Text style={styles.articleEmoji}>{article.cover_emoji}</Text>
                    <View style={[styles.articleCategoryBadge, { backgroundColor: article.cover_color }]}>
                      <Text style={styles.articleCategoryText} numberOfLines={1}>{article.category}</Text>
                    </View>
                  </View>
                  <View style={styles.articleBody}>
                    <Text style={styles.articleTitle} numberOfLines={3}>{article.title}</Text>
                    <View style={styles.articleMeta}>
                      <Ionicons name="time-outline" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.articleMetaText}>{article.read_time} นาที</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─────────────────────── BADGES ─────────────────────── */}
        {dashboard?.badges && dashboard.badges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏅 เหรียญรางวัล</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesRow}>
              {dashboard.badges.map((badge, i) => (
                <View key={i} style={styles.badge}>
                  <View style={styles.badgeCircle}>
                    <Text style={styles.badgeEmoji}>{badge.icon}</Text>
                  </View>
                  <Text style={styles.badgeName} numberOfLines={2}>{badge.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Ko-fi support nudge */}
        <TouchableOpacity
          style={styles.kofiNudge}
          onPress={() => Linking.openURL('https://ko-fi.com/J3J11WBY0S')}
          activeOpacity={0.75}
        >
          <Text style={styles.kofiNudgeText}>☕ ชอบ mydemy? ช่วยซัพพอร์ตทีมสักแก้วกาแฟ →</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl + 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.50)',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  greetingBlock: {
    flex: 1,
  },
  greetingSmall: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  greetingName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.4,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Stats pills — horizontal row
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.md,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statPillXp: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  statPillLevel: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statPillEmoji: { fontSize: 12 },
  statPillNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  statPillLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.82)',
  },

  // Level progress bar
  levelBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  levelBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: RADIUS.full,
  },
  levelBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
    flexShrink: 0,
  },

  // ── Today Card ────────────────────────────────────────────────────────────
  todayCard: {
    marginHorizontal: SPACING.lg,
    marginTop: -24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#ef5ea8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.90)',
  },
  todayGoalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  todayGoalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  todayGoalSub: {
    fontSize: 12,
    color: '#636366',
  },
  todayXpNum: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  todayXpGoal: {
    fontSize: 13,
    fontWeight: '500',
    color: '#AEAEB2',
  },
  goalTrack: {
    height: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  goalFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  todayDivider: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginVertical: SPACING.sm,
  },

  // Check-in inside today card
  checkInSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  streakBig: {
    alignItems: 'center',
    minWidth: 48,
    flexShrink: 0,
  },
  streakFireEmoji: {
    fontSize: 22,
  },
  streakBigNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1C1C1E',
    lineHeight: 26,
  },
  streakBigLabel: {
    fontSize: 10,
    color: '#636366',
    fontWeight: '500',
  },
  checkInCenter: {
    flex: 1,
  },
  streakMilestone: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 6,
    lineHeight: 16,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dayCol: {
    alignItems: 'center',
    gap: 2,
  },
  dayDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dayDotOn: { backgroundColor: 'rgba(239,94,168,0.12)' },
  dayDotOff: { backgroundColor: '#F2F2F7' },
  dayDotEmoji: { fontSize: 13 },
  dayDotEmpty: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C7C7CC' },
  dayLabel: {
    fontSize: 9,
    color: '#AEAEB2',
    fontWeight: '500',
  },
  checkInRight: {
    flexShrink: 0,
    alignItems: 'center',
  },
  checkInBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 78,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 5,
  },
  checkInBtnDisabled: { opacity: 0.6 },
  checkInBtnEmoji: { fontSize: 18, marginBottom: 1 },
  checkInBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  checkInBtnXp: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  xpPop: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#34C759',
  },
  checkInDone: {
    alignItems: 'center',
    gap: 2,
  },
  checkInDoneLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#34C759',
  },
  checkInDoneXp: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  hScrollContent: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },

  // ── Announcement cards ────────────────────────────────────────────────────
  announcementCard: {
    width: 300,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 20,
    gap: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  annIcon: { fontSize: 28, flexShrink: 0 },
  annBody: { flex: 1 },
  annTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  annText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 17,
  },

  // ── Course horizontal cards ───────────────────────────────────────────────
  courseHCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  courseHCover: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  courseHIcon: { fontSize: 36 },
  interactiveTag: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  interactiveTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
  },
  courseHBody: { padding: 12 },
  courseHTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
    minHeight: 34,
    lineHeight: 17,
  },
  courseHMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  courseHMetaText: { fontSize: 11, color: '#636366' },

  // ── Career path cards ─────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pathCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  pathIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pathEmoji: { fontSize: 24 },
  pathName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 4,
  },
  pathCta: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Article cards ─────────────────────────────────────────────────────────
  articleCard: {
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  articleCover: {
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  articleEmoji: { fontSize: 40 },
  articleCategoryBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    maxWidth: 130,
  },
  articleCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  articleBody: { padding: 12 },
  articleTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 17,
    marginBottom: 6,
    minHeight: 51,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  articleMetaText: { fontSize: 11, color: '#636366' },

  // ── Badges ────────────────────────────────────────────────────────────────
  badgesRow: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  badge: {
    alignItems: 'center',
    width: 64,
    gap: 4,
  },
  badgeCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,215,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,215,0,0.40)',
  },
  badgeEmoji: { fontSize: 26 },
  badgeName: {
    fontSize: 10,
    color: '#636366',
    textAlign: 'center',
    lineHeight: 13,
  },

  // Ko-fi nudge
  kofiNudge: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(239,94,168,0.15)',
    alignItems: 'center',
    shadowColor: '#ef5ea8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  kofiNudgeText: {
    fontSize: 13,
    color: '#BE185D',
    fontWeight: '500',
    textAlign: 'center',
  },
});
