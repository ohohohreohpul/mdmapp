'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Trash2, X, Loader2, Video, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

interface Lesson { _id: string; title: string; order: number; content_type: 'video' | 'article'; duration_minutes?: number }
interface Module { _id: string; title: string; description?: string; order: number; lessons?: Lesson[]; expanded?: boolean; loadingLessons?: boolean }

function CourseModulesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const courseId = params.get('id') || '';
  const courseTitle = params.get('title') || 'คอร์ส';

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  // Module modal
  const [showMod, setShowMod] = useState(false);
  const [modTitle, setModTitle] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modOrder, setModOrder] = useState('1');
  const [savingMod, setSavingMod] = useState(false);

  // Lesson modal
  const [showLesson, setShowLesson] = useState(false);
  const [targetModId, setTargetModId] = useState('');
  const [lesTitle, setLesTitle] = useState('');
  const [lesDesc, setLesDesc] = useState('');
  const [lesOrder, setLesOrder] = useState('1');
  const [lesType, setLesType] = useState<'video' | 'article'>('video');
  const [lesVideo, setLesVideo] = useState('');
  const [lesArticle, setLesArticle] = useState('');
  const [lesDuration, setLesDuration] = useState('');
  const [savingLesson, setSavingLesson] = useState(false);

  useEffect(() => { if (courseId) loadModules(); }, [courseId]);

  const loadModules = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/modules/course/${courseId}`);
      setModules((res.data || []).map((m: any) => ({ ...m, expanded: false, lessons: undefined, loadingLessons: false })));
    } catch { toast.error('ไม่สามารถโหลดโมดูลได้'); }
    finally { setLoading(false); }
  };

  const toggleModule = async (mod: Module) => {
    if (!mod.expanded && !mod.lessons) {
      setModules(prev => prev.map(m => m._id === mod._id ? { ...m, loadingLessons: true } : m));
      try {
        const res = await axios.get(`${API_URL}/api/lessons/module/${mod._id}`);
        setModules(prev => prev.map(m => m._id === mod._id ? { ...m, lessons: res.data || [], loadingLessons: false, expanded: true } : m));
      } catch {
        setModules(prev => prev.map(m => m._id === mod._id ? { ...m, loadingLessons: false, lessons: [] } : m));
      }
    } else {
      setModules(prev => prev.map(m => m._id === mod._id ? { ...m, expanded: !m.expanded } : m));
    }
  };

  const saveModule = async () => {
    if (!modTitle.trim()) { toast.error('กรุณากรอกชื่อโมดูล'); return; }
    try {
      setSavingMod(true);
      await axios.post(`${API_URL}/api/modules`, { course_id: courseId, title: modTitle.trim(), description: modDesc.trim() || undefined, order: parseInt(modOrder) || modules.length + 1 });
      setShowMod(false);
      loadModules();
    } catch { toast.error('ไม่สามารถสร้างโมดูลได้'); }
    finally { setSavingMod(false); }
  };

  const deleteModule = async (id: string) => {
    if (!confirm('ลบโมดูลและบทเรียนทั้งหมดในโมดูล?')) return;
    try { await axios.delete(`${API_URL}/api/modules/${id}`); loadModules(); }
    catch { toast.error('ไม่สามารถลบโมดูลได้'); }
  };

  const openLessonModal = (modId: string, existingLessons: Lesson[] = []) => {
    setTargetModId(modId);
    setLesTitle(''); setLesDesc(''); setLesOrder(String(existingLessons.length + 1));
    setLesType('video'); setLesVideo(''); setLesArticle(''); setLesDuration('');
    setShowLesson(true);
  };

  const saveLesson = async () => {
    if (!lesTitle.trim()) { toast.error('กรุณากรอกชื่อบทเรียน'); return; }
    try {
      setSavingLesson(true);
      await axios.post(`${API_URL}/api/lessons`, {
        module_id: targetModId,
        title: lesTitle.trim(),
        description: lesDesc.trim() || undefined,
        order: parseInt(lesOrder) || 1,
        content_type: lesType,
        video_url: lesType === 'video' ? lesVideo.trim() || undefined : undefined,
        article_content: lesType === 'article' ? lesArticle.trim() || undefined : undefined,
        duration_minutes: lesDuration ? parseInt(lesDuration) : undefined,
      });
      setShowLesson(false);
      // Reload lessons for that module
      setModules(prev => prev.map(m => m._id === targetModId ? { ...m, lessons: undefined, expanded: false } : m));
    } catch { toast.error('ไม่สามารถสร้างบทเรียนได้'); }
    finally { setSavingLesson(false); }
  };

  const deleteLesson = async (lessonId: string, modId: string) => {
    if (!confirm('ลบบทเรียนนี้?')) return;
    try {
      await axios.delete(`${API_URL}/api/lessons/${lessonId}`);
      setModules(prev => prev.map(m => m._id === modId ? { ...m, lessons: (m.lessons || []).filter(l => l._id !== lessonId) } : m));
    } catch { toast.error('ไม่สามารถลบบทเรียนได้'); }
  };

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator px-4 pt-safe py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0">
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <div className="flex-1 min-w-0 mx-2">
          <p className="text-[17px] font-bold text-text-primary truncate">{courseTitle}</p>
          <p className="text-[12px] text-text-secondary">โมดูลและบทเรียน</p>
        </div>
        <button onClick={() => { setModTitle(''); setModDesc(''); setModOrder(String(modules.length + 1)); setShowMod(true); }} className="w-9 h-9 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
          <Plus size={20} className="text-white" />
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 pb-10">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : modules.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="text-5xl">📋</span>
            <p className="font-semibold text-text-primary">ยังไม่มีโมดูล</p>
            <button onClick={() => { setModTitle(''); setModDesc(''); setModOrder('1'); setShowMod(true); }} className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">+ เพิ่มโมดูล</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {modules.map(mod => (
              <div key={mod._id} className="bg-white rounded-2xl border border-separator overflow-hidden">
                {/* Module header */}
                <div className="flex items-center px-4 py-3 gap-3">
                  <button onClick={() => toggleModule(mod)} className="flex-1 flex items-center gap-2 min-w-0 text-left">
                    {mod.loadingLessons ? (
                      <Loader2 size={18} className="animate-spin text-primary shrink-0" />
                    ) : mod.expanded ? (
                      <ChevronDown size={18} className="text-primary shrink-0" />
                    ) : (
                      <ChevronRight size={18} className="text-text-secondary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-text-primary truncate">{mod.title}</p>
                      {mod.description && <p className="text-[12px] text-text-secondary truncate">{mod.description}</p>}
                    </div>
                  </button>
                  <button onClick={() => openLessonModal(mod._id, mod.lessons)} className="flex items-center gap-1 text-[12px] font-bold text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition-colors shrink-0">
                    <Plus size={14} /> บทเรียน
                  </button>
                  <button onClick={() => deleteModule(mod._id)} className="w-8 h-8 flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors shrink-0">
                    <Trash2 size={15} className="text-red-500" />
                  </button>
                </div>

                {/* Lessons */}
                {mod.expanded && (
                  <div className="border-t border-separator">
                    {(mod.lessons || []).length === 0 ? (
                      <p className="text-[13px] text-text-tertiary px-4 py-3">ยังไม่มีบทเรียน</p>
                    ) : (
                      (mod.lessons || []).map(lesson => (
                        <div key={lesson._id} className="flex items-center gap-3 px-4 py-2.5 border-b border-separator/50 last:border-0">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            {lesson.content_type === 'video' ? <Video size={14} className="text-[#6366F1]" /> : <FileText size={14} className="text-[#10B981]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-text-primary truncate">{lesson.title}</p>
                            {lesson.duration_minutes && <p className="text-[11px] text-text-tertiary">{lesson.duration_minutes} นาที</p>}
                          </div>
                          <button onClick={() => deleteLesson(lesson._id, mod._id)} className="w-7 h-7 flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors shrink-0">
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Module Modal */}
      {showMod && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-separator">
              <h2 className="text-[18px] font-bold text-text-primary">สร้างโมดูล</h2>
              <button onClick={() => setShowMod(false)}><X size={24} className="text-text-secondary" /></button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              {[
                { label: 'ชื่อโมดูล *', value: modTitle, set: setModTitle, placeholder: 'เช่น: บทที่ 1 – พื้นฐาน UX' },
                { label: 'คำอธิบาย', value: modDesc, set: setModDesc, placeholder: 'คำอธิบายโมดูล (ถ้ามี)' },
                { label: 'ลำดับ', value: modOrder, set: setModOrder, placeholder: '1', type: 'number' },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">{f.label}</label>
                  <input type={f.type || 'text'} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-[15px] focus:outline-none focus:border-primary" />
                </div>
              ))}
              <button onClick={saveModule} disabled={savingMod} className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 mb-2">
                {savingMod && <Loader2 size={18} className="animate-spin" />} สร้างโมดูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showLesson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-separator shrink-0">
              <h2 className="text-[18px] font-bold text-text-primary">เพิ่มบทเรียน</h2>
              <button onClick={() => setShowLesson(false)}><X size={24} className="text-text-secondary" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">ประเภทเนื้อหา</label>
                <div className="flex gap-2">
                  {(['video', 'article'] as const).map(t => (
                    <button key={t} onClick={() => setLesType(t)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-[14px] font-semibold transition-colors ${lesType === t ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-text-secondary'}`}>
                      {t === 'video' ? <Video size={16} /> : <FileText size={16} />} {t === 'video' ? 'วิดีโอ' : 'บทความ'}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { label: 'ชื่อบทเรียน *', value: lesTitle, set: setLesTitle, placeholder: 'ชื่อบทเรียน' },
                { label: 'คำอธิบาย', value: lesDesc, set: setLesDesc, placeholder: 'คำอธิบาย (ถ้ามี)' },
                { label: 'ลำดับ', value: lesOrder, set: setLesOrder, placeholder: '1', type: 'number' },
                { label: 'ระยะเวลา (นาที)', value: lesDuration, set: setLesDuration, placeholder: '5', type: 'number' },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">{f.label}</label>
                  <input type={f.type || 'text'} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-[15px] focus:outline-none focus:border-primary" />
                </div>
              ))}
              {lesType === 'video' ? (
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">URL วิดีโอ</label>
                  <input value={lesVideo} onChange={e => setLesVideo(e.target.value)} placeholder="https://iframe.mediadelivery.net/embed/..." className="w-full border border-gray-200 rounded-xl px-3 py-3 text-[15px] focus:outline-none focus:border-primary" />
                </div>
              ) : (
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">เนื้อหาบทความ</label>
                  <textarea value={lesArticle} onChange={e => setLesArticle(e.target.value)} placeholder="เนื้อหาบทเรียน..." rows={6} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-[15px] focus:outline-none focus:border-primary resize-none" />
                </div>
              )}
              <button onClick={saveLesson} disabled={savingLesson} className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 mb-2">
                {savingLesson && <Loader2 size={18} className="animate-spin" />} บันทึกบทเรียน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourseModulesPage() {
  return <Suspense><CourseModulesInner /></Suspense>;
}
