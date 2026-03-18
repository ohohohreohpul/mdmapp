"""
Seed Demo Data for Mydemy Learning App
Creates courses, modules, lessons, and learning materials for all career paths
Thai GenZ style content
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')

# Demo content for each career path
CAREER_PATH_CONTENT = {
    "UX Design": {
        "courses": [
            {
                "title": "UX Design Fundamentals",
                "description": "เรียนรู้พื้นฐาน UX Design ตั้งแต่เริ่มต้น 🎨 เข้าใจ User Research, Wireframing, Prototyping และหลักการออกแบบที่ดี",
                "modules": [
                    {
                        "title": "Module 1: รู้จัก UX Design",
                        "description": "ทำความเข้าใจ UX คืออะไร ทำไมถึงสำคัญ",
                        "lessons": [
                            {
                                "title": "UX Design คืออะไร?",
                                "description": "เข้าใจความหมายและความสำคัญของ User Experience Design",
                                "content": """# UX Design คืออะไร? 🤔

UX Design ย่อมาจาก User Experience Design คือการออกแบบประสบการณ์ผู้ใช้ ให้ผู้ใช้รู้สึกดีเมื่อใช้งานผลิตภัณฑ์หรือบริการของเรา

## หลักการสำคัญของ UX Design

1. **User-Centered Design** - ผู้ใช้เป็นศูนย์กลาง
2. **Usability** - ใช้งานง่าย เข้าใจง่าย
3. **Accessibility** - ทุกคนเข้าถึงได้
4. **Desirability** - น่าใช้ น่าดึงดูด

## ความแตกต่าง UX vs UI

- **UX (User Experience)** - ความรู้สึก ประสบการณ์โดยรวม
- **UI (User Interface)** - หน้าตา สีสัน ปุ่ม หน้าจอ

## ทำไม UX ถึงสำคัญ?

- ลด Bounce Rate
- เพิ่ม Conversion
- สร้าง Brand Loyalty
- ลดค่าใช้จ่าย Customer Support

## เครื่องมือยอดฮิตสำหรับ UX Designer

- Figma
- Adobe XD
- Sketch
- InVision
- Miro (สำหรับ Workshop)

💡 **Pro Tip**: UX ไม่ใช่แค่ทำให้สวย แต่ต้องทำให้ใช้งานได้จริง!
"""
                            },
                            {
                                "title": "Design Thinking Process",
                                "description": "5 ขั้นตอนของ Design Thinking ที่ต้องรู้",
                                "content": """# Design Thinking Process 💡

Design Thinking คือกระบวนการคิดเชิงออกแบบที่ใช้แก้ปัญหาอย่างสร้างสรรค์

## 5 ขั้นตอน Design Thinking

### 1. Empathize (เข้าใจผู้ใช้) 👂
- สัมภาษณ์ผู้ใช้
- สังเกตพฤติกรรม
- ทำ User Research

### 2. Define (นิยามปัญหา) 🎯
- สร้าง Problem Statement
- กำหนด User Needs
- ทำ Persona

### 3. Ideate (คิดไอเดีย) 💭
- Brainstorming
- Crazy 8's
- Mind Mapping

### 4. Prototype (สร้างต้นแบบ) 🔧
- Low-fidelity: Sketch, Wireframe
- High-fidelity: Interactive Prototype

### 5. Test (ทดสอบ) 🧪
- Usability Testing
- A/B Testing
- User Feedback

## Case Study: Airbnb

Airbnb ใช้ Design Thinking แก้ปัญหา:
- **ปัญหา**: ภาพที่พักไม่สวย ผู้ใช้ไม่จอง
- **แก้ไข**: ส่งช่างภาพถ่ายรูปให้ฟรี
- **ผลลัพธ์**: รายได้เพิ่ม 2-3 เท่า!

🔥 **Remember**: Design Thinking ไม่ใช่เส้นตรง วนกลับได้เสมอ!
"""
                            }
                        ]
                    },
                    {
                        "title": "Module 2: User Research",
                        "description": "เรียนรู้วิธี Research ผู้ใช้แบบมืออาชีพ",
                        "lessons": [
                            {
                                "title": "User Research Methods",
                                "description": "วิธีการ Research ผู้ใช้ที่นิยมใช้กัน",
                                "content": """# User Research Methods 🔍

การ Research ผู้ใช้เป็นพื้นฐานสำคัญของ UX Design ช่วยให้เราเข้าใจผู้ใช้จริงๆ

## ประเภทของ Research

### Qualitative Research (เชิงคุณภาพ)
- **User Interview** - สัมภาษณ์ 1:1
- **Focus Group** - สนทนากลุ่ม
- **Contextual Inquiry** - สังเกตในบริบทจริง
- **Diary Study** - ให้ผู้ใช้จดบันทึก

### Quantitative Research (เชิงปริมาณ)
- **Survey** - แบบสอบถาม
- **Analytics** - วิเคราะห์ข้อมูลการใช้งาน
- **A/B Testing** - ทดสอบเปรียบเทียบ
- **Heatmaps** - แผนที่ความร้อน

## เทคนิคการสัมภาษณ์

1. **เตรียมคำถามเปิด** - ไม่ใช่ Yes/No
2. **ฟังมากกว่าพูด** - 80% ฟัง 20% ถาม
3. **ถามว่าทำไม** - "Why?" 5 ครั้ง
4. **อย่านำคำตอบ** - เป็นกลาง

## เครื่องมือ Research

- Google Forms (Survey)
- Hotjar (Heatmaps)
- Maze (Usability Testing)
- UserTesting.com

📊 **Pro Tip**: ผสม Qualitative + Quantitative = Insights ที่แม่นยำ!
"""
                            },
                            {
                                "title": "Creating User Personas",
                                "description": "สร้าง Persona เพื่อเข้าใจกลุ่มเป้าหมาย",
                                "content": """# Creating User Personas 👤

Persona คือตัวละครสมมติที่สร้างจากข้อมูล Research เพื่อเป็นตัวแทนกลุ่มผู้ใช้

## องค์ประกอบของ Persona

### 1. Demographics (ข้อมูลพื้นฐาน)
- ชื่อ อายุ อาชีพ
- ที่อยู่ รายได้
- การศึกษา

### 2. Goals & Motivations
- เป้าหมายหลัก
- สิ่งที่ต้องการบรรลุ
- แรงจูงใจ

### 3. Pain Points
- ปัญหาที่พบ
- สิ่งที่ทำให้หงุดหงิด
- อุปสรรค

### 4. Behaviors
- พฤติกรรมการใช้เทคโนโลยี
- ช่องทางที่ใช้
- ความถี่

## ตัวอย่าง Persona

```
🧑‍💻 มิว - UX Designer มือใหม่
อายุ: 25 ปี | กรุงเทพฯ
อาชีพ: Junior Designer

Goals:
- พัฒนา skill UX
- หางานบริษัทใหญ่

Pain Points:
- ไม่รู้จะเริ่มจากตรงไหน
- หาคอร์สดีๆ ยาก

Quote: "อยากเก่ง UX แต่ไม่รู้จะเริ่มยังไง"
```

## Tips สร้าง Persona ที่ดี

1. ใช้ข้อมูลจริงจาก Research
2. อย่าสร้างเยอะเกิน (2-4 คน)
3. ทำให้ทีมเข้าถึงได้ง่าย
4. Update เมื่อมีข้อมูลใหม่

🎯 **Remember**: Persona ไม่ใช่ตัวเรา แต่คือตัวแทนผู้ใช้จริง!
"""
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "Data Analysis": {
        "courses": [
            {
                "title": "Data Analysis Essentials",
                "description": "เรียนรู้การวิเคราะห์ข้อมูลตั้งแต่พื้นฐาน 📊 ใช้ Excel, SQL และ Python ในการทำงานจริง",
                "modules": [
                    {
                        "title": "Module 1: Introduction to Data Analysis",
                        "description": "เข้าใจพื้นฐานการวิเคราะห์ข้อมูล",
                        "lessons": [
                            {
                                "title": "Data Analysis คืออะไร?",
                                "description": "ทำความรู้จักกับโลกของการวิเคราะห์ข้อมูล",
                                "content": """# Data Analysis คืออะไร? 📊

Data Analysis คือกระบวนการตรวจสอบ ทำความสะอาด แปลง และสร้างโมเดลข้อมูล เพื่อค้นหา insights ที่มีประโยชน์

## ประเภทของ Data Analysis

### 1. Descriptive Analytics
- "เกิดอะไรขึ้น?"
- สรุปข้อมูลในอดีต
- ตัวอย่าง: รายงานยอดขายรายเดือน

### 2. Diagnostic Analytics
- "ทำไมถึงเกิดขึ้น?"
- หาสาเหตุของปัญหา
- ตัวอย่าง: ทำไมยอดขายเดือนนี้ตก?

### 3. Predictive Analytics
- "จะเกิดอะไรขึ้น?"
- พยากรณ์อนาคต
- ตัวอย่าง: ยอดขายไตรมาสหน้าจะเป็นเท่าไหร่?

### 4. Prescriptive Analytics
- "ควรทำอะไร?"
- แนะนำการตัดสินใจ
- ตัวอย่าง: ควรลงทุนโปรโมทสินค้าไหน?

## เครื่องมือยอดฮิต

| เครื่องมือ | ใช้ทำอะไร |
|-----------|----------|
| Excel | วิเคราะห์เบื้องต้น |
| SQL | ดึงข้อมูลจาก Database |
| Python | วิเคราะห์ขั้นสูง |
| Tableau | สร้าง Dashboard |
| Power BI | Business Intelligence |

## Data Analysis Process

1. **Define** - กำหนดคำถาม
2. **Collect** - รวบรวมข้อมูล
3. **Clean** - ทำความสะอาดข้อมูล
4. **Analyze** - วิเคราะห์
5. **Visualize** - แสดงผล
6. **Communicate** - สื่อสาร insights

💡 **Pro Tip**: Data is the new oil แต่ต้อง refine ก่อนใช้!
"""
                            },
                            {
                                "title": "Types of Data",
                                "description": "ประเภทของข้อมูลที่ต้องรู้",
                                "content": """# Types of Data 📁

การเข้าใจประเภทข้อมูลช่วยให้เลือกวิธีวิเคราะห์ได้ถูกต้อง

## Structured vs Unstructured Data

### Structured Data (ข้อมูลมีโครงสร้าง)
- อยู่ในรูปแบบตาราง
- มี rows และ columns
- ตัวอย่าง: Excel, Database

### Unstructured Data (ข้อมูลไม่มีโครงสร้าง)
- ไม่มีรูปแบบตายตัว
- ตัวอย่าง: ข้อความ, รูปภาพ, วิดีโอ

### Semi-structured Data
- มีโครงสร้างบางส่วน
- ตัวอย่าง: JSON, XML

## Types of Variables

### Quantitative (ตัวเลข)

**Discrete (ไม่ต่อเนื่อง)**
- นับได้เป็นจำนวนเต็ม
- ตัวอย่าง: จำนวนลูกค้า, จำนวน order

**Continuous (ต่อเนื่อง)**
- มีค่าทศนิยมได้
- ตัวอย่าง: น้ำหนัก, ราคา, อุณหภูมิ

### Qualitative (หมวดหมู่)

**Nominal (ไม่มีลำดับ)**
- แค่แบ่งกลุ่ม
- ตัวอย่าง: เพศ, สี, ประเภทสินค้า

**Ordinal (มีลำดับ)**
- มีการจัดอันดับ
- ตัวอย่าง: ระดับการศึกษา, Rating 1-5

## ตัวอย่าง Data Types ในชีวิตจริง

```
Customer Data:
- customer_id: Integer (Discrete)
- name: String (Nominal)
- age: Integer (Discrete)
- income: Float (Continuous)
- satisfaction: 1-5 (Ordinal)
- gender: M/F (Nominal)
```

🎯 **Remember**: เลือกวิธีวิเคราะห์ตามประเภทข้อมูล!
"""
                            }
                        ]
                    },
                    {
                        "title": "Module 2: Excel for Analysis",
                        "description": "ใช้ Excel วิเคราะห์ข้อมูลแบบมืออาชีพ",
                        "lessons": [
                            {
                                "title": "Excel Functions ที่ต้องรู้",
                                "description": "สูตร Excel สำคัญสำหรับ Data Analyst",
                                "content": """# Excel Functions ที่ต้องรู้ 📈

Functions พื้นฐานที่ Data Analyst ใช้ทุกวัน

## Basic Functions

### SUM, AVERAGE, COUNT
```excel
=SUM(A1:A100)      // รวมทั้งหมด
=AVERAGE(A1:A100)  // ค่าเฉลี่ย
=COUNT(A1:A100)    // นับจำนวน
=COUNTA(A1:A100)   // นับที่ไม่ว่าง
```

### MIN, MAX, MEDIAN
```excel
=MIN(A1:A100)      // ค่าต่ำสุด
=MAX(A1:A100)      // ค่าสูงสุด
=MEDIAN(A1:A100)   // ค่ากลาง
```

## Lookup Functions

### VLOOKUP
```excel
=VLOOKUP(lookup_value, table, col_index, FALSE)

// ตัวอย่าง: หาชื่อจาก ID
=VLOOKUP(A2, Sheet2!A:C, 2, FALSE)
```

### INDEX MATCH (แนะนำ!)
```excel
=INDEX(return_range, MATCH(lookup_value, lookup_range, 0))

// ยืดหยุ่นกว่า VLOOKUP มาก
=INDEX(B:B, MATCH(A2, A:A, 0))
```

### XLOOKUP (Excel 365)
```excel
=XLOOKUP(lookup_value, lookup_array, return_array)
// ใช้ง่ายที่สุด!
```

## Conditional Functions

### IF, IFS
```excel
=IF(condition, true_value, false_value)
=IF(A1>100, "สูง", "ต่ำ")

=IFS(A1>=90, "A", A1>=80, "B", A1>=70, "C", TRUE, "F")
```

### SUMIF, COUNTIF, AVERAGEIF
```excel
=SUMIF(range, criteria, sum_range)
=SUMIF(B:B, "Sales", C:C)  // รวมยอดขายของ Sales

=COUNTIF(A:A, ">=100")     // นับที่ >= 100
```

## Text Functions

```excel
=LEFT(A1, 3)        // 3 ตัวแรก
=RIGHT(A1, 3)       // 3 ตัวท้าย
=MID(A1, 2, 4)      // เริ่มตัวที่ 2 เอา 4 ตัว
=TRIM(A1)           // ลบ space เกิน
=CONCATENATE(A1, " ", B1)  // รวมข้อความ
```

## Date Functions

```excel
=TODAY()            // วันนี้
=YEAR(A1)           // ปี
=MONTH(A1)          // เดือน
=DATEDIF(A1, B1, "D")  // จำนวนวันระหว่าง
```

🔥 **Pro Tip**: INDEX MATCH ดีกว่า VLOOKUP เพราะ lookup ซ้ายได้!
"""
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "Digital Marketing": {
        "courses": [
            {
                "title": "Digital Marketing 101",
                "description": "เรียนรู้การตลาดดิจิทัลครบวงจร 📱 Facebook Ads, Google Ads, SEO, Content Marketing",
                "modules": [
                    {
                        "title": "Module 1: Digital Marketing Overview",
                        "description": "ภาพรวมการตลาดดิจิทัลยุคใหม่",
                        "lessons": [
                            {
                                "title": "Digital Marketing คืออะไร?",
                                "description": "ทำความรู้จักการตลาดดิจิทัล",
                                "content": """# Digital Marketing คืออะไร? 📱

Digital Marketing คือการทำการตลาดผ่านช่องทางดิจิทัล เพื่อเข้าถึงลูกค้าในยุคที่ทุกคนออนไลน์

## ช่องทาง Digital Marketing

### 1. Search Engine Marketing (SEM)
- **SEO** - ติดอันดับ Google แบบธรรมชาติ
- **Google Ads** - โฆษณาบน Google

### 2. Social Media Marketing
- Facebook & Instagram
- TikTok
- LinkedIn
- Twitter/X

### 3. Content Marketing
- Blog
- Video
- Podcast
- Infographic

### 4. Email Marketing
- Newsletter
- Automation
- Drip Campaign

### 5. Affiliate Marketing
- Commission-based
- Influencer partnership

## Digital Marketing Funnel

```
TOFU (Top of Funnel)
├── Awareness - รู้จักแบรนด์
│
MOFU (Middle of Funnel)
├── Consideration - พิจารณา
│
BOFU (Bottom of Funnel)
├── Conversion - ซื้อ
│
└── Retention - ซื้อซ้ำ
```

## Metrics ที่ต้องรู้

| Metric | ความหมาย |
|--------|----------|
| Reach | จำนวนคนที่เห็น |
| Impression | จำนวนครั้งที่แสดง |
| CTR | Click-Through Rate |
| CPC | Cost Per Click |
| CPM | Cost Per 1000 Impressions |
| ROAS | Return on Ad Spend |
| LTV | Lifetime Value |

💡 **Pro Tip**: Digital Marketing ไม่ใช่แค่ยิง Ads แต่ต้องเข้าใจลูกค้า!
"""
                            },
                            {
                                "title": "Facebook & Instagram Ads",
                                "description": "เรียนรู้การยิงโฆษณา Meta",
                                "content": """# Facebook & Instagram Ads 📘

Meta Ads เป็นแพลตฟอร์มโฆษณาที่ทรงพลังที่สุดสำหรับ B2C

## Campaign Objectives

### Awareness
- Brand Awareness
- Reach

### Consideration
- Traffic
- Engagement
- App Installs
- Video Views
- Lead Generation
- Messages

### Conversion
- Conversions
- Catalog Sales
- Store Traffic

## Audience Targeting

### 1. Core Audiences
- Demographics (อายุ, เพศ, ที่อยู่)
- Interests (ความสนใจ)
- Behaviors (พฤติกรรม)

### 2. Custom Audiences
- Website Visitors
- Customer List
- App Users
- Video Viewers
- Page Engagement

### 3. Lookalike Audiences
- คนที่คล้ายกับลูกค้าเรา
- 1-10% similarity

## Ad Formats

📷 **Single Image**
- ง่าย ตรงไปตรงมา

🎠 **Carousel**
- หลายรูป/วิดีโอ
- เล่าเรื่องได้

📹 **Video**
- Engagement สูง
- แนะนำ 15-30 วินาที

📑 **Collection**
- สำหรับ E-commerce
- แสดงสินค้าหลายชิ้น

## Best Practices

1. **Creative สำคัญมาก** - 80% ของผลลัพธ์มาจาก Creative
2. **A/B Test** - ทดสอบ 3-5 versions
3. **Pixel** - ติดตั้งก่อนยิง Ads
4. **Budget** - เริ่มจาก 500-1000 บาท/วัน

## ตัวอย่าง Campaign Structure

```
Campaign: [Brand] - Q1 Sales
├── Ad Set 1: Interest - Fashion
│   ├── Ad 1: Image - Product A
│   ├── Ad 2: Video - Product A
│   └── Ad 3: Carousel - Collection
│
├── Ad Set 2: Lookalike 1%
│   └── ...
│
└── Ad Set 3: Retargeting
    └── ...
```

🔥 **Pro Tip**: อย่ายิง Broad audience เลย ยิง Warm audience ก่อน!
"""
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "Project Management": {
        "courses": [
            {
                "title": "Project Management Fundamentals",
                "description": "เรียนรู้การบริหารโปรเจกต์แบบมืออาชีพ 📋 Agile, Scrum, และเครื่องมือที่จำเป็น",
                "modules": [
                    {
                        "title": "Module 1: PM Basics",
                        "description": "พื้นฐานการบริหารโปรเจกต์",
                        "lessons": [
                            {
                                "title": "Project Management คืออะไร?",
                                "description": "ทำความเข้าใจการบริหารโปรเจกต์",
                                "content": """# Project Management คืออะไร? 📋

Project Management คือการวางแผน จัดการ และควบคุมโปรเจกต์ให้บรรลุเป้าหมายตาม Scope, Time, และ Budget

## Triple Constraint (Project Triangle)

```
        SCOPE
         /\
        /  \
       /    \
      /      \
     /________\
   TIME     COST
```

- เปลี่ยน 1 อย่าง กระทบอีก 2 อย่าง
- PM ต้อง Balance ให้ดี

## Project Life Cycle

### 1. Initiation (เริ่มต้น)
- กำหนด Project Charter
- ระบุ Stakeholders
- เป้าหมาย / Scope เบื้องต้น

### 2. Planning (วางแผน)
- WBS (Work Breakdown Structure)
- Timeline / Gantt Chart
- Budget
- Risk Assessment

### 3. Execution (ดำเนินการ)
- ทำงานตามแผน
- จัดการทีม
- สื่อสาร Stakeholders

### 4. Monitoring & Controlling
- Track Progress
- Manage Changes
- Quality Control

### 5. Closing (ปิดโปรเจกต์)
- Deliverables Handover
- Lessons Learned
- Celebration! 🎉

## Methodologies

### Waterfall (แบบเดิม)
- Sequential
- เหมาะกับงานที่ Scope ชัด
- Construction, Manufacturing

### Agile (แบบใหม่)
- Iterative
- ยืดหยุ่น เปลี่ยนแปลงได้
- Software, Digital Products

## PM Roles & Skills

| Hard Skills | Soft Skills |
|------------|-------------|
| Planning | Communication |
| Scheduling | Leadership |
| Budgeting | Problem Solving |
| Risk Management | Negotiation |
| Tools (Jira, Asana) | Conflict Resolution |

💡 **Pro Tip**: PM ที่ดีไม่ใช่แค่ทำตาม Plan แต่ต้องปรับตัวได้!
"""
                            },
                            {
                                "title": "Agile & Scrum",
                                "description": "ทำความรู้จัก Agile Methodology",
                                "content": """# Agile & Scrum 🏃‍♂️

Agile คือ Mindset, Scrum คือ Framework ที่นิยมที่สุด

## Agile Manifesto

1. **Individuals & Interactions** > Processes & Tools
2. **Working Software** > Comprehensive Documentation
3. **Customer Collaboration** > Contract Negotiation
4. **Responding to Change** > Following a Plan

## Scrum Framework

### Roles

👑 **Product Owner**
- กำหนด Vision
- จัดลำดับ Backlog
- ตัดสินใจ Features

🎯 **Scrum Master**
- ช่วยทีมทำ Scrum
- แก้ไข Blockers
- Facilitate Meetings

👥 **Development Team**
- ทำงานจริง
- Self-organizing
- Cross-functional

### Artifacts

📝 **Product Backlog**
- รายการงานทั้งหมด
- จัดลำดับตาม Priority

📋 **Sprint Backlog**
- งานที่จะทำใน Sprint นี้

📈 **Increment**
- ผลงานที่ส่งมอบได้

### Events

🗓️ **Sprint**
- 1-4 สัปดาห์
- Time-boxed

📅 **Sprint Planning**
- วางแผน Sprint
- 2-4 ชั่วโมง

🌅 **Daily Scrum (Standup)**
- 15 นาที ทุกวัน
- 3 คำถาม:
  - เมื่อวานทำอะไร?
  - วันนี้จะทำอะไร?
  - มี Blockers ไหม?

📊 **Sprint Review**
- Demo ผลงาน
- รับ Feedback

🔄 **Sprint Retrospective**
- ทบทวน Process
- What went well?
- What to improve?

## Story Points & Velocity

Story Points = หน่วยวัดความยาก
- Fibonacci: 1, 2, 3, 5, 8, 13, 21

Velocity = Story Points ที่ทำได้ต่อ Sprint

🔥 **Pro Tip**: Scrum ไม่ใช่แค่ทำ Meeting แต่ต้อง Inspect & Adapt!
"""
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "Learning Designer": {
        "courses": [
            {
                "title": "Learning Design Essentials",
                "description": "เรียนรู้การออกแบบการเรียนรู้ที่มีประสิทธิภาพ 🎓 Instructional Design, E-Learning Development",
                "modules": [
                    {
                        "title": "Module 1: Introduction to Learning Design",
                        "description": "พื้นฐาน Learning Design",
                        "lessons": [
                            {
                                "title": "Learning Design คืออะไร?",
                                "description": "ทำความรู้จัก Learning Design",
                                "content": """# Learning Design คืออะไร? 🎓

Learning Design คือการออกแบบประสบการณ์การเรียนรู้ที่มีประสิทธิภาพ ทำให้ผู้เรียนบรรลุเป้าหมายการเรียนรู้

## Instructional Design vs Learning Design

| Instructional Design | Learning Design |
|---------------------|-----------------|
| Focus on Content | Focus on Learner |
| Teacher-centered | Learner-centered |
| Linear | Flexible |
| Traditional | Modern |

## ADDIE Model

### A - Analysis (วิเคราะห์)
- ผู้เรียนคือใคร?
- ปัญหาคืออะไร?
- เป้าหมายคืออะไร?

### D - Design (ออกแบบ)
- Learning Objectives
- Content Structure
- Assessment Strategy

### D - Development (พัฒนา)
- สร้าง Content
- สร้าง Activities
- สร้าง Assessment

### I - Implementation (นำไปใช้)
- Launch
- Facilitate
- Support

### E - Evaluation (ประเมิน)
- Formative (ระหว่างทาง)
- Summative (สิ้นสุด)

## Bloom's Taxonomy

```
                CREATE
               /      \
          EVALUATE
         /          \
       ANALYZE
      /              \
     APPLY
    /                  \
  UNDERSTAND
 /                      \
REMEMBER (พื้นฐาน)
```

## Learning Objectives (SMART)

- **S**pecific - เฉพาะเจาะจง
- **M**easurable - วัดได้
- **A**chievable - ทำได้จริง
- **R**elevant - เกี่ยวข้อง
- **T**ime-bound - มีกรอบเวลา

ตัวอย่าง:
❌ "ผู้เรียนจะเข้าใจ Excel"
✅ "หลังจบบทเรียน ผู้เรียนสามารถใช้ VLOOKUP หาข้อมูลจากตารางได้ภายใน 2 นาที"

## Active Learning Strategies

1. **Microlearning** - เรียนสั้นๆ 5-10 นาที
2. **Gamification** - เกมมิฟิเคชั่น
3. **Scenario-based** - เรียนจากสถานการณ์
4. **Social Learning** - เรียนรู้จากกัน
5. **Spaced Repetition** - ทบทวนเป็นระยะ

💡 **Pro Tip**: Learning Designer ที่ดีต้องเข้าใจ "วิธีที่คนเรียนรู้" ไม่ใช่แค่ "เนื้อหาที่สอน"
"""
                            },
                            {
                                "title": "E-Learning Development",
                                "description": "การพัฒนา E-Learning ที่มีประสิทธิภาพ",
                                "content": """# E-Learning Development 💻

การสร้าง E-Learning ที่ผู้เรียนอยากเรียน และเรียนแล้วได้ผล

## Types of E-Learning

### 1. Self-paced (เรียนเอง)
- Video-based
- Interactive modules
- เรียนเมื่อไหร่ก็ได้

### 2. Instructor-led (มีครู)
- Live webinar
- Virtual classroom
- Real-time interaction

### 3. Blended (ผสม)
- Online + Offline
- Flipped Classroom

## E-Learning Tools

### Authoring Tools
- **Articulate Storyline** - Interactive
- **Adobe Captivate** - Professional
- **iSpring** - PowerPoint-based
- **Canva** - Simple

### LMS (Learning Management System)
- Moodle (Open source)
- Canvas
- Blackboard
- Teachable
- Thinkific

### Video Tools
- Camtasia
- Loom
- OBS Studio

## Interactive Elements

### 1. Quizzes
- Multiple Choice
- True/False
- Drag & Drop
- Fill in the Blank

### 2. Scenarios
- Branching scenarios
- Decision trees
- Role-play

### 3. Simulations
- Software simulation
- Process simulation

### 4. Gamification
- Points
- Badges
- Leaderboards
- Progress bars

## Best Practices

1. **Chunk Content** - แบ่งเนื้อหาเป็นส่วนย่อย
2. **Visual Design** - ใช้ภาพช่วยสื่อสาร
3. **Interactivity** - ให้ผู้เรียนมีส่วนร่วม
4. **Accessibility** - ทุกคนเข้าถึงได้
5. **Mobile-friendly** - เรียนบนมือถือได้

## Engagement Techniques

📱 **Mobile First** - ออกแบบสำหรับมือถือก่อน
🎮 **Gamification** - ใช้ Game mechanics
📊 **Progress Tracking** - แสดงความก้าวหน้า
🏆 **Certificates** - ให้รางวัล
💬 **Community** - สร้าง Community

🔥 **Pro Tip**: E-Learning ที่ดีไม่ใช่แค่ Video แต่ต้อง Interactive!
"""
                            }
                        ]
                    }
                ]
            }
        ]
    }
}


async def seed_database():
    """Seed the database with demo content"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("🌱 Starting database seeding...")
    
    # Clear existing data (optional - comment out to preserve)
    # await db.courses.delete_many({})
    # await db.modules.delete_many({})
    # await db.lessons.delete_many({})
    # await db.learning_materials.delete_many({})
    
    for career_path, data in CAREER_PATH_CONTENT.items():
        print(f"\n📚 Creating content for: {career_path}")
        
        for course_data in data["courses"]:
            # Check if course already exists
            existing = await db.courses.find_one({"title": course_data["title"]})
            if existing:
                print(f"  ⏭️  Course already exists: {course_data['title']}")
                continue
            
            # Create course
            course = {
                "title": course_data["title"],
                "description": course_data["description"],
                "career_path": career_path,
                "thumbnail": None,
                "modules": [],
                "total_lessons": 0,
                "is_published": True,
                "has_final_exam": True,
                "prerequisites": [],
                "created_at": datetime.utcnow()
            }
            
            course_result = await db.courses.insert_one(course)
            course_id = str(course_result.inserted_id)
            print(f"  ✅ Created course: {course_data['title']}")
            
            total_lessons = 0
            module_ids = []
            
            for mod_idx, module_data in enumerate(course_data["modules"]):
                # Create module
                module = {
                    "course_id": course_id,
                    "title": module_data["title"],
                    "description": module_data["description"],
                    "order": mod_idx + 1,
                    "lessons": [],
                    "unlock_after_days": 0,
                    "created_at": datetime.utcnow()
                }
                
                module_result = await db.modules.insert_one(module)
                module_id = str(module_result.inserted_id)
                module_ids.append(module_id)
                print(f"    📁 Created module: {module_data['title']}")
                
                lesson_ids = []
                
                for les_idx, lesson_data in enumerate(module_data["lessons"]):
                    # Create lesson
                    lesson = {
                        "module_id": module_id,
                        "title": lesson_data["title"],
                        "description": lesson_data["description"],
                        "order": les_idx + 1,
                        "content_type": "article",
                        "video_url": None,  # Placeholder for Bunny.net
                        "video_id": None,
                        "article_content": lesson_data["content"],
                        "audio_url": None,
                        "audio_generated": False,
                        "duration_minutes": 10,
                        "has_quiz": True,
                        "created_at": datetime.utcnow()
                    }
                    
                    lesson_result = await db.lessons.insert_one(lesson)
                    lesson_id = str(lesson_result.inserted_id)
                    lesson_ids.append(lesson_id)
                    total_lessons += 1
                    print(f"      📝 Created lesson: {lesson_data['title']}")
                    
                    # Create learning material
                    material = {
                        "course_id": course_id,
                        "lesson_id": lesson_id,
                        "title": lesson_data["title"],
                        "content": lesson_data["content"],
                        "file_type": "text",
                        "uploaded_at": datetime.utcnow()
                    }
                    
                    await db.learning_materials.insert_one(material)
                
                # Update module with lesson IDs
                await db.modules.update_one(
                    {"_id": module_result.inserted_id},
                    {"$set": {"lessons": lesson_ids}}
                )
            
            # Update course with module IDs and total lessons
            await db.courses.update_one(
                {"_id": course_result.inserted_id},
                {"$set": {"modules": module_ids, "total_lessons": total_lessons}}
            )
    
    print("\n✨ Database seeding complete!")
    
    # Print summary
    course_count = await db.courses.count_documents({})
    module_count = await db.modules.count_documents({})
    lesson_count = await db.lessons.count_documents({})
    
    print(f"\n📊 Summary:")
    print(f"  - Courses: {course_count}")
    print(f"  - Modules: {module_count}")
    print(f"  - Lessons: {lesson_count}")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
