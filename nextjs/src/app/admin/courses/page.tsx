'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, ChevronUp, ChevronDown, List, Pencil, Eye, EyeOff, Trash2, X, Loader2, Copy } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const CAREER_PATHS = ['UX Design', 'Data Analysis', 'Project Management', 'Learning Designer', 'Digital Marketing', 'General'];
const MIGRATION_SQL = `ALTER TABLE courses ADD COLUMN IF NOT EXISTS sequence_order INTEGER;\nALTER TABLE courses ADD COLUMN IF NOT EXISTS counts_for_certification BOOLEAN NOT NULL DEFAULT TRUE;`;

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePath, setActivePath] = useState('UX Design');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [careerPath, setCareerPath] = useState('UX Design');

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/courses`);
      const data = res.data;
      setCourses(data);
      const allNull = data.every((c: any) => c.sequence_order == null);
      setShowMigrationBanner(data.length > 0 && allNull);
    } catch { toast.error('ไม่สามารถโหลดคอร์สได้'); }
    finally { setLoading(false); }
  };

  const pathCourses = courses
    .filter(c => (c.career_path || 'General') === activePath)
    .sort((a, b) => {
      if (a.sequence_order == null && b.sequence_order == null) return 0;
      if (a.sequence_order == null) return 1;
      if (b.sequence_order == null) return -1;
      return a.sequence_order - b.sequence_order;
    });

  const openCreate = () => {
    setModalMode('create');
    setTitle(''); setDescription(''); setCareerPath(activePath);
    setSelectedCourse(null); setShowModal(true);
  };

  const openEdit = (course: any) => {
    setModalMode('edit');
    setTitle(course.title); setDescription(course.description); setCareerPath(course.career_path);
    setSelectedCourse(course); setShowModal(true);
  };

  const saveCourse = async () => {
    if (!title || !description) { toast.error('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
    try {
      if (modalMode === 'create') {
        await axios.post(`${API_URL}/api/courses`, { title, description, career_path: careerPath });
      } else {
        await axios.put(`${API_URL}/api/courses/${selectedCourse._id}`, { title, description });
      }
      setShowModal(false); loadCourses();
    } catch { toast.error('ไม่สามารถบันทึกคอร์สได้'); }
  };

  const togglePublish = async (course: any) => {
    try {
      await axios.put(`${API_URL}/api/courses/${course._id}`, { is_published: !course.is_published });
      loadCourses();
    } catch { toast.error('ไม่สามารถเปลี่ยนสถานะได้'); }
  };

  const toggleCert = async (course: any) => {
    try {
      await axios.put(`${API_URL}/api/courses/${course._id}`, { counts_for_certification: course.counts_for_certification === false });
      loadCourses();
    } catch { toast.error('ไม่สามารถเปลี่ยนสถานะ Cert ได้'); }
  };

  const moveSequence = async (course: any, dir: 'up' | 'down') => {
    const idx = pathCourses.findIndex(c => c._id === course._id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= pathCourses.length) return;

    const currentOrders = pathCourses.map((c, i) => c.sequence_order ?? (i + 1) * 10);
    const myNewOrder = currentOrders[swapIdx];
    const theirNewOrder = currentOrders[idx];
    const neighborId = pathCourses[swapIdx]._id;

    setCourses(prev => prev.map(c => {
      if (c._id === course._id) return { ...c, sequence_order: myNewOrder };
      if (c._id === neighborId) return { ...c, sequence_order: theirNewOrder };
      return c;
    }));

    try {
      await Promise.all([
        axios.put(`${API_URL}/api/courses/${course._id}`, { sequence_order: myNewOrder }),
        axios.put(`${API_URL}/api/courses/${neighborId}`, { sequence_order: theirNewOrder }),
      ]);
    } catch {
      toast.error('เรียงลำดับไม่สำเร็จ — กรุณา run migration SQL ก่อน');
      loadCourses();
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('ยืนยันการลบคอร์สนี้?')) return;
    try { await axios.delete(`${API_URL}/api/courses/${id}`); loadCourses(); }
    catch { toast.error('ไม่สามารถลบคอร์สได้'); }
  };

  const seedSequences = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/seed-sequences`);
      toast.success(res.data.message);
      loadCourses();
    } catch { toast.error('Seed ไม่สำเร็จ — อาจต้อง run migration SQL ก่อน'); }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(MIGRATION_SQL);
    toast.success('คัดลอก SQL แล้ว — วางใน Supabase SQL Editor');
  };

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator px-4 pt-safe py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <h1 className="text-[18px] font-bold text-text-primary">จัดการคอร์ส</h1>
          <button onClick={openCreate} className="w-9 h-9 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
            <Plus size={20} className="text-white" />
          </button>
        </div>
        {/* Path tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CAREER_PATHS.map(path => {
            const count = courses.filter(c => (c.career_path || 'General') === path).length;
            if (count === 0) return null;
            const active = activePath === path;
            return (
              <button
                key={path}
                onClick={() => setActivePath(path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold border-2 whitespace-nowrap transition-colors ${active ? 'bg-[#EEF2FF] border-[#6366F1] text-[#6366F1]' : 'bg-[#F3F4F6] border-transparent text-text-secondary'}`}
              >
                {path}
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-[#C7D2FE] text-[#4338CA]' : 'bg-[#E5E7EB] text-text-secondary'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 pb-10">
        {/* Migration banner */}
        {showMigrationBanner && (
          <div className="bg-[#FEF3C7] border border-[#FCD34D] rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span>⚠️</span>
              <p className="text-[13px] font-bold text-[#92400E]">ต้อง setup ก่อนจึงจะเรียงลำดับได้</p>
            </div>
            <p className="text-[12px] text-[#78350F] mb-3">Run SQL นี้ใน Supabase SQL Editor แล้วกด Seed</p>
            <div className="flex gap-2">
              <button onClick={copySQL} className="flex items-center gap-1.5 bg-[#FDE68A] text-[#92400E] px-3 py-2 rounded-lg text-[12px] font-bold">
                <Copy size={13} /> Copy SQL
              </button>
              <button onClick={seedSequences} className="flex items-center gap-1.5 bg-[#92400E] text-white px-3 py-2 rounded-lg text-[12px] font-bold">
                Seed ลำดับ
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : pathCourses.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="text-6xl">📚</span>
            <p className="font-semibold text-text-primary">ไม่มีคอร์สใน {activePath}</p>
            <button onClick={openCreate} className="bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">+ สร้างคอร์ส</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pathCourses.map((course, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === pathCourses.length - 1;
              const certOn = course.counts_for_certification !== false;
              return (
                <div key={course._id} className="bg-white rounded-2xl border border-separator p-3 flex items-center gap-2">
                  {/* Order controls */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button onClick={() => !isFirst && moveSequence(course, 'up')} disabled={isFirst} className="p-1 disabled:opacity-25">
                      <ChevronUp size={18} className={isFirst ? 'text-gray-300' : 'text-[#6366F1]'} />
                    </button>
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${course.sequence_order != null ? 'bg-[#EEF2FF] text-[#6366F1]' : 'bg-gray-100 text-gray-400'}`}>
                      {course.sequence_order != null ? `#${course.sequence_order}` : '–'}
                    </span>
                    <button onClick={() => !isLast && moveSequence(course, 'down')} disabled={isLast} className="p-1 disabled:opacity-25">
                      <ChevronDown size={18} className={isLast ? 'text-gray-300' : 'text-[#6366F1]'} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text-primary leading-snug mb-1.5 line-clamp-2">{course.title}</p>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${course.is_published ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-gray-100 text-gray-500'}`}>
                        {course.is_published ? 'เผยแพร่' : 'ซ่อน'}
                      </span>
                      <button onClick={() => toggleCert(course)} className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${certOn ? 'bg-[#FFFBEB] border-[#F59E0B] text-[#92400E]' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                        {certOn ? '🏆 นับ Cert' : '○ ไม่นับ'}
                      </button>
                    </div>
                    <p className="text-[11px] text-text-tertiary">{course.total_lessons ?? 0} บทเรียน</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {[
                      { icon: <List size={16} className="text-[#6366F1]" />, action: () => router.push(`/admin/course-modules?id=${course._id}&title=${encodeURIComponent(course.title)}`) },
                      { icon: <Pencil size={16} className="text-[#10B981]" />, action: () => openEdit(course) },
                      { icon: course.is_published ? <EyeOff size={16} className="text-[#F59E0B]" /> : <Eye size={16} className="text-[#F59E0B]" />, action: () => togglePublish(course) },
                      { icon: <Trash2 size={16} className="text-[#EF4444]" />, action: () => deleteCourse(course._id) },
                    ].map((btn, i) => (
                      <button key={i} onClick={btn.action} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-separator shrink-0">
              <h2 className="text-[18px] font-bold text-text-primary">{modalMode === 'create' ? 'สร้างคอร์สใหม่' : 'แก้ไขคอร์ส'}</h2>
              <button onClick={() => setShowModal(false)}><X size={24} className="text-text-secondary" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">ชื่อคอร์ส</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="เช่น: UX Design สำหรับมือใหม่" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-[15px] focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">คำอธิบาย</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="อธิบายเนื้อหาของคอร์ส..." rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-[15px] focus:outline-none focus:border-primary resize-none" />
              </div>
              {modalMode === 'create' && (
                <div>
                  <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">เส้นทางอาชีพ</label>
                  <div className="flex flex-col gap-2">
                    {CAREER_PATHS.map(p => (
                      <button key={p} onClick={() => setCareerPath(p)} className={`py-3 rounded-xl border-2 text-[14px] font-semibold transition-colors ${careerPath === p ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-text-secondary'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={saveCourse} className="bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity mt-2 mb-2">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
