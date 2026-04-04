'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, ChevronRight, CheckCircle2, Loader2, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const QUESTION_COUNTS = [5, 10, 15, 20];
const QUIZ_TYPES = [
  { key: 'lesson_quiz', label: 'แบบทดสอบบทเรียน' },
  { key: 'final_exam', label: 'ข้อสอบปลายภาค' },
];

export default function QuizGeneratorPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMats, setLoadingMats] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedMat, setSelectedMat] = useState<any>(null);
  const [numQ, setNumQ] = useState(10);
  const [quizType, setQuizType] = useState<'lesson_quiz' | 'final_exam'>('lesson_quiz');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/courses`);
      setCourses(res.data || []);
    } catch { toast.error('ไม่สามารถโหลดคอร์สได้'); }
    finally { setLoading(false); }
  };

  const selectCourse = async (course: any) => {
    setSelectedCourse(course);
    setSelectedMat(null);
    setResult(null);
    setLoadingMats(true);
    try {
      const res = await axios.get(`${API_URL}/api/materials/course/${course._id}`);
      setMaterials(res.data || []);
    } catch { setMaterials([]); }
    finally { setLoadingMats(false); }
  };

  const openModal = (mat: any) => {
    setSelectedMat(mat);
    setNumQ(10);
    setQuizType('lesson_quiz');
    setResult(null);
    setShowModal(true);
  };

  const generate = async () => {
    if (!selectedMat) return;
    try {
      setGenerating(true);
      setResult(null);
      const res = await axios.post(`${API_URL}/api/quizzes/generate`, {
        material_id: selectedMat._id,
        num_questions: numQ,
        quiz_type: quizType,
      });
      setResult(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'ไม่สามารถสร้างแบบทดสอบได้';
      toast.error(msg);
    } finally { setGenerating(false); }
  };

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator px-4 pt-safe py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0">
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <h1 className="flex-1 text-[18px] font-bold text-text-primary">สร้างแบบทดสอบด้วย AI</h1>
        <Sparkles size={20} className="text-primary shrink-0" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 pb-10">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Step 1: Course */}
            <p className="text-[13px] font-bold text-text-tertiary uppercase tracking-wider mb-2">1. เลือกคอร์ส</p>
            <div className="flex flex-col gap-2 mb-5">
              {courses.map(c => (
                <button
                  key={c._id}
                  onClick={() => selectCourse(c)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${selectedCourse?._id === c._id ? 'border-primary bg-primary/5' : 'border-separator bg-white hover:border-primary/30'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text-primary truncate">{c.title}</p>
                    {c.career_path && <p className="text-[12px] text-text-secondary">{c.career_path}</p>}
                  </div>
                  {selectedCourse?._id === c._id && <CheckCircle2 size={20} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>

            {/* Step 2: Material */}
            {selectedCourse && (
              <>
                <p className="text-[13px] font-bold text-text-tertiary uppercase tracking-wider mb-2">2. เลือกเนื้อหา</p>
                {loadingMats ? (
                  <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-primary" /></div>
                ) : materials.length === 0 ? (
                  <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 mb-5">
                    <p className="text-[13px] text-[#92400E]">ไม่มีเนื้อหาสำหรับคอร์สนี้ กรุณาอัปโหลดเนื้อหาใน Admin → เนื้อหาบทเรียน ก่อน</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 mb-5">
                    {materials.map(mat => (
                      <button
                        key={mat._id}
                        onClick={() => openModal(mat)}
                        className="bg-white rounded-2xl border border-separator p-4 flex items-center gap-3 text-left hover:border-primary/30 transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <Sparkles size={18} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-text-primary truncate">{mat.title}</p>
                          <p className="text-[12px] text-text-secondary">{mat.file_type}</p>
                        </div>
                        <ChevronRight size={18} className="text-text-tertiary shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Generation modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-separator shrink-0">
              <h2 className="text-[18px] font-bold text-text-primary">สร้างแบบทดสอบ</h2>
              <button onClick={() => setShowModal(false)}><X size={24} className="text-text-secondary" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <p className="text-[13px] text-text-secondary mb-1">เนื้อหา</p>
              <p className="text-[15px] font-semibold text-text-primary mb-4">{selectedMat?.title}</p>

              <p className="text-[13px] font-semibold text-[#374151] mb-2">จำนวนข้อ</p>
              <div className="flex gap-2 mb-4">
                {QUESTION_COUNTS.map(n => (
                  <button key={n} onClick={() => setNumQ(n)} className={`flex-1 py-2.5 rounded-xl border-2 text-[14px] font-bold transition-colors ${numQ === n ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-text-secondary'}`}>{n}</button>
                ))}
              </div>

              <p className="text-[13px] font-semibold text-[#374151] mb-2">ประเภท</p>
              <div className="flex flex-col gap-2 mb-5">
                {QUIZ_TYPES.map(qt => (
                  <button key={qt.key} onClick={() => setQuizType(qt.key as any)} className={`py-3 px-4 rounded-xl border-2 text-[14px] text-left transition-colors ${quizType === qt.key ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-gray-200 text-text-secondary'}`}>{qt.label}</button>
                ))}
              </div>

              {/* Result */}
              {result && (
                <div className="bg-[#D1FAE5] border border-[#6EE7B7] rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={18} className="text-[#065F46]" />
                    <p className="text-[14px] font-bold text-[#065F46]">สร้างสำเร็จ! {result.question_count ?? result.questions?.length ?? 0} ข้อ</p>
                  </div>
                  {result.quiz_id && <p className="text-[12px] text-[#065F46] font-mono">Quiz ID: {result.quiz_id}</p>}
                  {result.message && <p className="text-[12px] text-[#065F46] mt-1">{result.message}</p>}
                  {result.questions?.slice(0, 3).map((q: any, i: number) => (
                    <div key={i} className="mt-2 p-2 bg-white/70 rounded-lg">
                      <p className="text-[12px] font-medium text-[#111827]">{i + 1}. {q.question}</p>
                    </div>
                  ))}
                  {(result.questions?.length ?? 0) > 3 && (
                    <p className="text-[11px] text-[#065F46] mt-1">+ อีก {result.questions.length - 3} ข้อ</p>
                  )}
                </div>
              )}

              <button
                onClick={generate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 mb-2"
              >
                {generating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {generating ? 'กำลังสร้าง...' : `สร้าง ${numQ} ข้อด้วย AI`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
