'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, X, CloudUpload, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const FILE_TYPES = [
  { key: 'text', label: 'ข้อความ', emoji: '📝' },
  { key: 'transcript', label: 'Transcript', emoji: '🎙️' },
  { key: 'pdf_extracted', label: 'PDF Extract', emoji: '📄' },
];

const TYPE_COLORS: Record<string, string> = { text: '#3B82F6', transcript: '#8B5CF6', pdf_extracted: '#F59E0B' };

export default function AdminMaterialsPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMats, setLoadingMats] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form
  const [fCourseId, setFCourseId] = useState('');
  const [fTitle, setFTitle] = useState('');
  const [fContent, setFContent] = useState('');
  const [fType, setFType] = useState('text');

  useEffect(() => { loadCourses(); }, []);
  useEffect(() => { if (selectedCourseId) loadMaterials(selectedCourseId); else setMaterials([]); }, [selectedCourseId]);

  const loadCourses = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/courses`);
      const data = res.data || [];
      setCourses(data);
      if (data.length > 0) setSelectedCourseId(data[0]._id);
    } catch { toast.error('ไม่สามารถโหลดคอร์สได้'); }
    finally { setLoading(false); }
  };

  const loadMaterials = async (courseId: string) => {
    setLoadingMats(true);
    try { const res = await axios.get(`${API_URL}/api/materials/course/${courseId}`); setMaterials(res.data || []); }
    catch { setMaterials([]); }
    finally { setLoadingMats(false); }
  };

  const openModal = () => {
    setFCourseId(selectedCourseId || courses[0]?._id || '');
    setFTitle(''); setFContent(''); setFType('text');
    setShowModal(true);
  };

  const upload = async () => {
    if (!fCourseId || !fTitle.trim() || !fContent.trim()) { toast.error('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
    try {
      setUploading(true);
      await axios.post(`${API_URL}/api/materials`, { course_id: fCourseId, title: fTitle.trim(), content: fContent.trim(), file_type: fType });
      toast.success('อัปโหลดเนื้อหาเรียบร้อยแล้ว');
      setShowModal(false);
      if (fCourseId === selectedCourseId) loadMaterials(selectedCourseId);
    } catch { toast.error('ไม่สามารถอัปโหลดเนื้อหาได้'); }
    finally { setUploading(false); }
  };

  const remove = (id: string) => {
    if (!confirm('ลบเนื้อหานี้?')) return;
    setMaterials(prev => prev.filter(m => m._id !== id));
  };

  return (
    <div className="min-h-screen bg-ios-bg">
      <header className="bg-white border-b border-separator px-4 pt-safe py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors shrink-0">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <h1 className="flex-1 text-[18px] font-bold text-text-primary">เนื้อหาบทเรียน</h1>
          <button onClick={openModal} className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-xl text-[13px] font-bold hover:opacity-90 transition-opacity">
            <Plus size={16} /> อัปโหลด
          </button>
        </div>
        {!loading && courses.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {courses.map(c => (
              <button
                key={c._id}
                onClick={() => setSelectedCourseId(c._id)}
                className={`shrink-0 max-w-[160px] truncate px-3 py-1.5 rounded-full text-[13px] font-medium border-2 transition-colors ${selectedCourseId === c._id ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-gray-200 text-text-secondary'}`}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 pb-10">
        {loading || loadingMats ? (
          <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <span className="text-5xl">📚</span>
            <p className="text-text-secondary">สร้างคอร์สก่อนเพื่ออัปโหลดเนื้อหา</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="text-5xl">📄</span>
            <p className="text-text-secondary">ยังไม่มีเนื้อหาสำหรับคอร์สนี้</p>
            <button onClick={openModal} className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
              <CloudUpload size={18} /> อัปโหลดเนื้อหาแรก
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {materials.map(mat => {
              const course = courses.find(c => c._id === mat.course_id);
              const color = TYPE_COLORS[mat.file_type] || '#6B7280';
              const ft = FILE_TYPES.find(f => f.key === mat.file_type);
              return (
                <div key={mat._id} className="bg-white rounded-2xl border border-separator p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
                        {ft ? `${ft.emoji} ${ft.label}` : mat.file_type}
                      </span>
                      {course && <p className="text-[12px] text-text-secondary truncate max-w-[140px]">{course.title}</p>}
                    </div>
                    <button onClick={() => remove(mat._id)} className="w-8 h-8 flex items-center justify-center hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                  <p className="text-[15px] font-semibold text-text-primary mb-1">{mat.title}</p>
                  {mat.content && <p className="text-[13px] text-text-secondary leading-5 line-clamp-3">{mat.content}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-separator shrink-0">
              <h2 className="text-[18px] font-bold text-text-primary">อัปโหลดเนื้อหา</h2>
              <button onClick={() => setShowModal(false)}><X size={24} className="text-text-secondary" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">เลือกคอร์ส *</label>
                <div className="flex flex-col gap-2">
                  {courses.map(c => (
                    <button key={c._id} onClick={() => setFCourseId(c._id)} className={`py-3 px-4 rounded-xl border-2 text-[14px] text-left transition-colors ${fCourseId === c._id ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-gray-200 text-text-secondary'}`}>{c.title}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">ชื่อเรื่อง *</label>
                <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="เช่น: บทที่ 1 – แนะนำ UX Design" className="w-full border border-gray-200 rounded-xl px-3 py-3 text-[15px] focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">เนื้อหา *</label>
                <textarea value={fContent} onChange={e => setFContent(e.target.value)} placeholder="วางเนื้อหาของบทเรียน..." rows={8} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-[15px] focus:outline-none focus:border-primary resize-none" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">ประเภทไฟล์</label>
                <div className="flex gap-2">
                  {FILE_TYPES.map(ft => (
                    <button key={ft.key} onClick={() => setFType(ft.key)} className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-colors ${fType === ft.key ? 'border-primary bg-primary/10' : 'border-gray-200'}`}>
                      <span className="text-xl">{ft.emoji}</span>
                      <span className={`text-[12px] font-semibold ${fType === ft.key ? 'text-primary' : 'text-text-secondary'}`}>{ft.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={upload} disabled={uploading} className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 mb-2">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <CloudUpload size={18} />}
                อัปโหลดเนื้อหา
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
