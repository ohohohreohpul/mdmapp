-- ============================================================
-- Add Learning Designer career path courses
-- Run this in Supabase SQL Editor AFTER running certificate_schema.sql
-- ============================================================

INSERT INTO courses (title, description, career_path, is_published, has_final_exam, total_lessons)
VALUES
  (
    'Introduction to Learning Design & Experience',
    'อยากออกแบบการเรียนรู้ที่ทำให้คนอยากเรียนต่อ ไม่ใช่แค่นั่งหลับ? เริ่มต้นเข้าใจ Learning Experience Design แบบที่ใช้ได้จริงในโลก L&D ยุคนี้ 🎓',
    'Learning Designer',
    true,
    true,
    0
  ),
  (
    'Learning Design for Adult Learner',
    'ผู้ใหญ่ไม่ได้เรียนเหมือนเด็ก! รู้จัก Adult Learning Theory แล้วออกแบบคอร์สที่ตอบโจทย์ผู้ใหญ่จริงๆ ไม่ใช่แค่คัดลอกวิธีสอนในโรงเรียน 💡',
    'Learning Designer',
    true,
    true,
    0
  ),
  (
    'Learner-Centric Design for Educators',
    'เปลี่ยน mindset จาก "ฉันจะสอนอะไร" เป็น "ผู้เรียนจะได้อะไร" ออกแบบบทเรียนที่เอาผู้เรียนเป็นศูนย์กลาง สำหรับครูและนักออกแบบการเรียนรู้ 🧠',
    'Learning Designer',
    true,
    true,
    0
  ),
  (
    'Project Management for Learning Designers',
    'จะทำโปรเจกต์ eLearning ให้เสร็จตามกำหนด ไม่ delay ไม่ burn out ต้องมี PM skills ที่ออกแบบมาสำหรับสาย Learning Designer โดยเฉพาะ 📋',
    'Learning Designer',
    true,
    true,
    0
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- Update descriptions for existing UX Design courses (Thai GenZ style)
-- Adjust WHERE clauses if your course titles are slightly different
-- ============================================================

UPDATE courses
SET description = 'เคยสงสัยมั้ยว่าทำไมบางแอปถึงใช้ง่ายมาก แต่บางอันทำแล้วอยากโยนโทรศัพท์? นั่นคือพลังของ UX! มาเรียนรู้พื้นฐาน UX/UI แบบ beginner-friendly ตั้งแต่ zero จนเข้าใจจริง 🎨'
WHERE title ILIKE '%introduction to ux%' OR title ILIKE '%intro to ux%' OR title ILIKE '%ux design%เบื้อง%';

UPDATE courses
SET description = 'Research ไม่ใช่แค่นั่งถามคำถาม! เรียนรู้วิธีเข้าใจ user อย่างลึกซึ้ง ด้วย interview, usability test และ data ที่จะเปลี่ยนให้คุณ design ได้ตรงใจ user จริงๆ 🔍'
WHERE title ILIKE '%ux research%' OR title ILIKE '%user research%';

UPDATE courses
SET description = 'จาก wireframe สู่ prototype ที่คลิกได้จริง เรียน Figma แบบที่ใช้งานได้เลย ไม่ต้องรอให้มีพื้นฐาน art มาก่อน 🖥️'
WHERE title ILIKE '%figma%' OR title ILIKE '%prototype%' OR title ILIKE '%wireframe%';

UPDATE courses
SET description = 'ข้อมูลไม่ได้น่ากลัวอย่างที่คิด! เรียน Data Analysis ตั้งแต่พื้นฐาน อ่าน chart เป็น วิเคราะห์ data ได้ แล้วนำไปใช้ตัดสินใจในงานจริง 📊'
WHERE title ILIKE '%data analysis%เบื้อง%' OR title ILIKE '%introduction to data%';

UPDATE courses
SET description = 'อยากให้คนเห็นสินค้าคุณเยอะขึ้น แต่งบจำกัด? Digital Marketing คือคำตอบ! เรียนรู้ตั้งแต่ SEO, Social Media จนถึง paid ads แบบที่ทำผลได้จริง 📱'
WHERE title ILIKE '%digital marketing%เบื้อง%' OR title ILIKE '%introduction to digital%';

UPDATE courses
SET description = 'โปรเจกต์พังเพราะขาดการวางแผน ไม่ใช่เพราะขาดความสามารถ! เรียน Project Management frameworks ที่ทีมยุคใหม่ใช้จริง แบบกระชับ ได้ผล 📋'
WHERE title ILIKE '%project management%เบื้อง%' OR title ILIKE '%introduction to project%';
