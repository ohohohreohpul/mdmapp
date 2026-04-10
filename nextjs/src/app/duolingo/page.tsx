'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, ChevronRight, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { ProgressBar } from '@/lib/ui';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const SESSION_SIZE = 60;

const C = {
  brand: '#ef5ea8', ink: '#1C1C1E', ink2: '#8E8E93', ink3: '#C7C7CC',
  bg: '#F2F2F7', surface: '#FFFFFF', sep: 'rgba(0,0,0,0.08)',
  green: '#10B981', red: '#EF4444', orange: '#F97316',
};

const cardShadow = '0px 1px 4px rgba(0,0,0,0.06), 0px 4px 20px rgba(0,0,0,0.05)';
const cardStyle: React.CSSProperties = {
  backgroundColor: C.surface, borderRadius: 16,
  boxShadow: cardShadow, border: '1px solid rgba(0,0,0,0.06)',
};

// ── Number formatter for chart axis labels ───────────────────────────────────

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(0)}K`
  : String(Math.round(n));

// ── Chart SVG renderer — bar and line, no external dependencies ───────────────

function ChartSvg({ config }: { config: any }) {
  if (!config?.data?.length) return null;
  const W = 320, H = 180;
  const pad = { l: 40, r: 10, t: 20, b: 32 };
  const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;

  const xKey   = config.xKey   || Object.keys(config.data[0])[0];
  const rawY   = config.yKey;
  const yKey   = typeof rawY === 'string' ? rawY
               : Array.isArray(rawY)      ? rawY[0]
               : Object.keys(config.data[0])[1];
  const isLine = (config.type || 'bar') === 'line';
  const data   = config.data as any[];
  const PAL    = ['#10b981', '#f573bd', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6'];

  const vals   = data.map(d => Number(d[yKey]) || 0);
  const maxY   = Math.max(...vals, 1);
  const minY   = isLine ? Math.min(...vals) : 0;
  const range  = maxY - minY || 1;

  return (
    <div style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: '8px 4px 4px', marginBottom: 12 }}>
      {config.title && (
        <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', textAlign: 'center', margin: '0 0 4px' }}>
          {config.title}
        </p>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = pad.t + ch * (1 - t);
          return (
            <g key={t}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
              <text x={pad.l - 4} y={y + 3} fontSize="8" fill="#9CA3AF" textAnchor="end">
                {fmtNum(minY + range * t)}
              </text>
            </g>
          );
        })}

        {isLine ? (() => {
          const pts = data.map((d, i) => ({
            x: pad.l + (data.length > 1 ? (i / (data.length - 1)) * cw : cw / 2),
            y: pad.t + ch - ((Number(d[yKey]) - minY) / range) * ch,
            lbl: String(d[xKey] || '').slice(0, 5),
          }));
          const line = pts.map(p => `${p.x},${p.y}`).join(' ');
          const fill = pts.length > 1
            ? `M${pts[0].x},${pad.t + ch} ${pts.map(p => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length - 1].x},${pad.t + ch} Z`
            : '';
          return (
            <>
              {fill && <path d={fill} fill="#f573bd" fillOpacity="0.12" />}
              <polyline points={line} fill="none" stroke="#f573bd" strokeWidth="2" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="3" fill="#f573bd" />
                  <text x={p.x} y={H - pad.b + 12} fontSize="8" fill="#6B7280" textAnchor="middle">{p.lbl}</text>
                </g>
              ))}
            </>
          );
        })() : (() => {
          const barW = cw / data.length;
          const gap  = barW * 0.25;
          return (
            <>
              {data.map((d, i) => {
                const val  = Number(d[yKey]) || 0;
                const barH = (val / maxY) * ch;
                const x    = pad.l + i * barW + gap / 2;
                const y    = pad.t + ch - barH;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={barW - gap} height={barH} fill={PAL[i % PAL.length]} rx="3" />
                    <text x={x + (barW - gap) / 2} y={H - pad.b + 12} fontSize="8" fill="#6B7280" textAnchor="middle">
                      {String(d[xKey] || '').slice(0, 5)}
                    </text>
                  </g>
                );
              })}
            </>
          );
        })()}
      </svg>
    </div>
  );
}

// ── Shared MC option button ───────────────────────────────────────────────────

function McButton({ optId, label, imageUrl, chosen, isCorrect, answered, onPress }: {
  optId?: string; label: string; imageUrl?: string; chosen: boolean; isCorrect: boolean; answered: boolean; onPress: () => void;
}) {
  const reveal = answered;
  const bg = reveal
    ? isCorrect ? 'rgba(16,185,129,0.10)' : chosen ? 'rgba(239,68,68,0.10)' : C.surface
    : chosen ? 'rgba(239,94,168,0.10)' : C.surface;
  const border = reveal
    ? isCorrect ? C.green : chosen ? C.red : C.sep
    : chosen ? C.brand : C.sep;
  const color = reveal
    ? isCorrect ? C.green : chosen ? C.red : C.ink
    : chosen ? C.brand : C.ink;
  return (
    <button onClick={() => !answered && onPress()}
      style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 16, display: 'flex',
               alignItems: imageUrl ? 'flex-start' : 'center', gap: 10,
               border: `2px solid ${border}`, backgroundColor: bg,
               cursor: answered ? 'default' : 'pointer',
               opacity: reveal && !isCorrect && !chosen ? 0.5 : 1, marginBottom: 8 }}>
      {optId && (
        <span style={{ fontSize: 12, fontWeight: 700, color: border, minWidth: 20, flexShrink: 0,
                       width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${border}`,
                       display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {optId.toUpperCase()}
        </span>
      )}
      <span style={{ flex: 1 }}>
        {imageUrl && (
          <img src={imageUrl} alt={label}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            style={{ width: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 8, marginBottom: 6, display: 'block' }} />
        )}
        <span style={{ fontSize: 15, fontWeight: 500, color }}>{label}</span>
      </span>
    </button>
  );
}

// ── Comparison renderer (separate component so it can own useState) ───────────

function mkHtmlDoc(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><script src="https://cdn.tailwindcss.com"><\/script><style>*{box-sizing:border-box}body{margin:0;padding:8px;font-family:sans-serif}img{max-width:100%;height:auto}</style><script>document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('img').forEach(function(img){img.onerror=function(){var ph=document.createElement('div');ph.style.cssText='background:#F3F4F6;border-radius:8px;padding:16px;text-align:center;font-size:20px;color:#9CA3AF;';ph.textContent='🖼️';this.parentNode&&this.parentNode.replaceChild(ph,this);};});});<\/script></head><body>${body}</body></html>`;
}

function ComparisonRenderer({ q, content, selected, answered, onSelect }: any) {
  const [expanded, setExpanded] = useState<{ html: string; label: string } | null>(null);
  const opts: any[] = content.options || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {expanded && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 200,
                   display: 'flex', flexDirection: 'column',
                   paddingTop: 'env(safe-area-inset-top, 44px)',
                   paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                   paddingLeft: 16, paddingRight: 16 }}
          onClick={() => setExpanded(null)}
        >
          {/* Close button — always visible above the modal card */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 10 }}
               onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <button onClick={() => setExpanded(null)}
              style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                       backgroundColor: 'rgba(255,255,255,0.20)', color: '#fff', fontSize: 20,
                       display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          <div style={{ backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 16 }}
               onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.sep}`, flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>{expanded.label}</span>
              <span style={{ fontSize: 12, color: C.ink2 }}>แตะภายนอกเพื่อปิด</span>
            </div>
            <iframe
              srcDoc={mkHtmlDoc(expanded.html)}
              style={{ width: '100%', flex: 1, border: 'none', display: 'block' }}
              sandbox="allow-scripts allow-same-origin"
              title={expanded.label}
            />
          </div>
        </div>
      )}

      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>{q.question || q.prompt}</p>
        <p style={{ fontSize: 12, color: C.ink2, margin: 0 }}>🔍 เปรียบเทียบและเลือกตัวเลือกที่ดีกว่า</p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {opts.map((opt: any) => {
          const chosen   = selected === opt.id;
          const isAnswer = opt.id === (q.answer || q.correct_answer);
          const reveal   = answered;
          const border   = reveal ? isAnswer ? C.green : chosen ? C.red : C.sep : chosen ? C.brand : C.sep;
          const headerBg = reveal ? isAnswer ? 'rgba(16,185,129,0.10)' : chosen ? 'rgba(239,68,68,0.10)' : '#F9FAFB' : chosen ? 'rgba(239,94,168,0.10)' : '#F9FAFB';
          return (
            <div key={opt.id} style={{ flex: 1, borderRadius: 16, border: `2px solid ${border}`, backgroundColor: C.surface, overflow: 'hidden', boxShadow: cardShadow }}>
              <div style={{ backgroundColor: headerBg, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {reveal && isAnswer && <span style={{ color: C.green }}>✅</span>}
                {reveal && chosen && !isAnswer && <span style={{ color: C.red }}>❌</span>}
                <span style={{ fontSize: 13, fontWeight: 700, color: reveal ? (isAnswer ? C.green : chosen ? C.red : C.ink2) : C.ink2 }}>
                  {opt.label}
                </span>
              </div>
              <div
                style={{ height: 170, overflow: 'hidden', position: 'relative', cursor: answered ? 'default' : 'pointer', backgroundColor: '#fff' }}
                onClick={() => !answered && onSelect(opt.id)}
              >
                <iframe
                  srcDoc={mkHtmlDoc(opt.content || `<div class="p-4 text-sm text-gray-600">${opt.label}</div>`)}
                  style={{ width: '100%', height: 170, border: 'none', display: 'block', pointerEvents: 'none' }}
                  sandbox="allow-scripts allow-same-origin"
                  scrolling="no"
                  title={opt.label}
                />
                <div
                  style={{ position: 'absolute', bottom: 6, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); setExpanded({ html: opt.content || '', label: opt.label }); }}
                >
                  <span style={{ fontSize: 11, backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff', padding: '3px 12px', borderRadius: 999, cursor: 'pointer' }}>
                    🔍 ขยาย
                  </span>
                </div>
              </div>
              <button
                onClick={() => !answered && onSelect(opt.id)}
                disabled={answered}
                style={{ width: '100%', padding: '10px 0', fontWeight: 700, fontSize: 14, border: 'none', cursor: answered ? 'default' : 'pointer',
                         backgroundColor: chosen ? (reveal ? (isAnswer ? C.green : C.red) : C.brand) : '#F3F4F6',
                         color: chosen ? '#fff' : C.ink2 }}>
                {reveal && isAnswer ? '✅ ถูก' : reveal && chosen && !isAnswer ? '❌ ผิด' : chosen ? '✓ เลือกแล้ว' : 'เลือก'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Fill-blank word-bank renderer — slot-based, matches Expo behavior ────────

function FillBlankWordBankRenderer({ q, visualConfig, answered, onSubmit }: any) {
  const code: string   = visualConfig?.code || '';
  const hasCode        = code.includes('___');
  const rawBlanks: any[] = (visualConfig?.blanks || []).filter((b: any) => typeof b === 'object');

  // Derive all options (supports Format 1 flat array and Format 2 per-blank pools)
  const allOpts: any[] = (() => {
    // Try content.options first (legacy/injected)
    const co = q.content?.options || [];
    if (co.length > 0) return co;
    if (rawBlanks.length === 0) return [];
    if (rawBlanks[0] && Array.isArray(rawBlanks[0].options)) {
      // Format 2: per-blank pools — flatten + dedupe
      const seen = new Set<string>();
      const flat: any[] = [];
      rawBlanks.forEach((b: any) => (b.options || []).forEach((o: any) => {
        if (o?.id && !seen.has(o.id)) { seen.add(o.id); flat.push(o); }
      }));
      return flat;
    }
    // Format 1: blanks IS the option pool
    return rawBlanks.map((b: any) => ({ id: b.id ?? b.answer, label: b.label ?? b.answer ?? b.id }));
  })();

  const correctIds = String(q.answer || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const numBlanks  = correctIds.length || rawBlanks.length || 1;

  const [slots, setSlots]     = useState<(string | null)[]>(Array(numBlanks).fill(null));
  const [submitted, setSubmit] = useState(false);

  const getLabel = (id: string | null) => {
    if (!id) return '';
    const opt = allOpts.find((o: any) => o.id === id);
    return opt?.label || opt?.content || id;
  };

  const placeOpt = (optId: string) => {
    if (submitted) return;
    const i = slots.findIndex(s => s === null);
    if (i === -1) return;
    setSlots(prev => { const n = [...prev]; n[i] = optId; return n; });
  };

  const removeSlot = (i: number) => {
    if (submitted) return;
    setSlots(prev => { const n = [...prev]; n[i] = null; return n; });
  };

  const handleSubmit = () => {
    if (slots.some(s => s === null)) return;
    setSubmit(true);
    const isCorrect = correctIds.length > 0 && correctIds.every((cid, i) => slots[i] === cid);
    onSubmit(isCorrect);
  };

  const placedIds = new Set(slots.filter(Boolean) as string[]);
  const bankOpts  = allOpts.filter((o: any) => !placedIds.has(o.id));

  // Render code with interactive inline blank slots
  const renderCode = () => {
    let bi = 0;
    return code.split('\n').map((line: string, li: number) => {
      const parts = line.split('___');
      return (
        <div key={li} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', minHeight: 22 }}>
          {parts.map((seg: string, si: number) => {
            const blankIdx = bi;
            if (si < parts.length - 1) bi++;
            const slotId    = blankIdx < slots.length ? slots[blankIdx] : null;
            const slotLabel = getLabel(slotId);
            const ok  = submitted && correctIds[blankIdx] === slotId;
            const bad = submitted && !!slotId && correctIds[blankIdx] !== slotId;
            return (
              <span key={si} style={{ display: 'contents' }}>
                {seg && <span style={{ whiteSpace: 'pre', fontFamily: 'monospace', fontSize: 13, color: '#cdd6f4' }}>{seg}</span>}
                {si < parts.length - 1 && (
                  <button onClick={() => slotId ? removeSlot(blankIdx) : undefined}
                    style={{ display: 'inline-flex', alignItems: 'center', margin: '0 2px', padding: '1px 8px',
                             borderRadius: 6, fontFamily: 'monospace', fontSize: 13,
                             border: `1.5px solid ${ok ? C.green : bad ? C.red : slotId ? C.brand : 'rgba(255,255,255,0.3)'}`,
                             backgroundColor: ok ? 'rgba(16,185,129,0.2)' : bad ? 'rgba(239,68,68,0.2)' : slotId ? 'rgba(239,94,168,0.2)' : 'rgba(255,255,255,0.08)',
                             color: ok ? C.green : bad ? C.red : slotId ? '#f9a8d4' : '#6B7280',
                             cursor: slotId && !submitted ? 'pointer' : 'default', minWidth: 40 }}>
                    {slotLabel || '___'}
                  </button>
                )}
              </span>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 12px' }}>{q.question || q.prompt}</p>
        {hasCode ? (
          <div style={{ backgroundColor: '#1e1e2e', borderRadius: 10, padding: 14, overflowX: 'auto' }}>
            {renderCode()}
          </div>
        ) : (
          /* No code template — numbered slots */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {slots.map((slotId, i) => {
              const ok  = submitted && correctIds[i] === slotId;
              const bad = submitted && !!slotId && correctIds[i] !== slotId;
              return (
                <button key={i} onClick={() => slotId ? removeSlot(i) : undefined}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, textAlign: 'left',
                           border: `2px solid ${ok ? C.green : bad ? C.red : slotId ? C.brand : C.sep}`,
                           backgroundColor: ok ? 'rgba(16,185,129,0.08)' : bad ? 'rgba(239,68,68,0.08)' : slotId ? 'rgba(239,94,168,0.08)' : C.bg,
                           cursor: slotId && !submitted ? 'pointer' : 'default' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink3, minWidth: 16 }}>{i + 1}</span>
                  <span style={{ fontSize: 14, color: slotId ? C.ink : C.ink3 }}>{getLabel(slotId) || '_ _ _'}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Word bank */}
      {!submitted && (
        <>
          <p style={{ fontSize: 12, color: C.ink2, margin: '4px 0', textAlign: 'center' }}>
            คลังคำ — แตะเพื่อเติมในช่องว่าง
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {bankOpts.map((o: any) => (
              <button key={o.id} onClick={() => placeOpt(o.id)}
                style={{ padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                         border: `2px solid ${C.sep}`, backgroundColor: C.surface, color: C.ink, cursor: 'pointer' }}>
                {o.label}
              </button>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={slots.some(s => s === null)}
            style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700,
                     padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
                     opacity: slots.some(s => s === null) ? 0.4 : 1 }}>
            ตรวจคำตอบ
          </button>
        </>
      )}
    </div>
  );
}


// ── Question renderer ─────────────────────────────────────────────────────────

function QuestionRenderer({ q, selected, fillValue, onFillChange, answered, correct,
  microIdx, onMicroNext, onSelect, onFillSubmit, onWordBankSubmit }: any) {
  if (!q) return null;

  const qType   = q.type || q.question_type || 'multiple-choice';
  const content = q.content || {};

  // ── Micro-lesson ──────────────────────────────────────────────────────────
  if (qType === 'micro-lesson') {
    const cards = q.micro_lesson?.cards || content.cards || [];
    const card  = cards[microIdx];
    if (!card) return null;
    return (
      <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 30 }}>{card.icon || '📖'}</span>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.brand, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{card.cardType}</p>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0 }}>{card.title}</h2>
        <p style={{ fontSize: 15, color: C.ink2, lineHeight: 1.6, margin: 0 }}>{card.body}</p>
        {microIdx < cards.length - 1 && (
          <button onClick={onMicroNext} style={{ alignSelf: 'flex-end', color: C.brand, fontWeight: 600, fontSize: 14, border: 'none', background: 'none', cursor: 'pointer' }}>ถัดไป →</button>
        )}
        <p style={{ fontSize: 11, color: C.ink3, textAlign: 'right', margin: 0 }}>{microIdx + 1}/{cards.length}</p>
      </div>
    );
  }

  // ── Concept-reveal ────────────────────────────────────────────────────────
  if (qType === 'concept-reveal') {
    const cr = q.concept_reveal || content.conceptReveal || {};
    return (
      <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.brand, margin: 0 }}>💡 Concept</p>
        <p style={{ fontSize: 15, color: C.ink, lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>{cr.content || q.question}</p>
        {cr.summary && (
          <div style={{ backgroundColor: 'rgba(239,94,168,0.10)', borderRadius: 12, padding: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.brand, margin: 0 }}>{cr.summary}</p>
          </div>
        )}
      </div>
    );
  }

  // ── Scenario ──────────────────────────────────────────────────────────────
  if (qType === 'scenario') {
    const nodes = q.scenario_nodes || content.scenarioNodes || [];
    const node  = nodes[0];
    if (!node) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <span style={{ fontSize: 30, display: 'block', marginBottom: 8 }}>{node.icon}</span>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: '0 0 4px' }}>{node.situation}</p>
          <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.6, margin: 0 }}>{node.context}</p>
        </div>
        {(node.choices || []).map((c: any) => {
          const chosen = selected === c.id;
          const reveal = answered && (chosen || c.isCorrect);
          const bg = reveal ? c.isCorrect ? 'rgba(16,185,129,0.10)' : chosen ? 'rgba(239,68,68,0.10)' : C.surface : chosen ? 'rgba(239,94,168,0.10)' : C.surface;
          const border = reveal ? c.isCorrect ? C.green : chosen ? C.red : C.sep : chosen ? C.brand : C.sep;
          return (
            <button key={c.id} onClick={() => !answered && onSelect(c.id)}
              style={{ width: '100%', textAlign: 'left', padding: 16, borderRadius: 16, border: `2px solid ${border}`, backgroundColor: bg, cursor: answered ? 'default' : 'pointer', opacity: reveal && !c.isCorrect && !chosen ? 0.5 : 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: C.ink, margin: 0 }}>{c.label}</p>
              {reveal && c.outcome && <p style={{ fontSize: 12, color: C.ink2, marginTop: 4, marginBottom: 0 }}>{c.outcome}</p>}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Comparison ────────────────────────────────────────────────────────────
  if (qType === 'comparison') {
    return <ComparisonRenderer key={q?.id || q?.prompt} q={q} content={content} selected={selected} answered={answered} onSelect={onSelect} />;
  }

  // ── Chart-reading / Chart-comparison ─────────────────────────────────────
  if (qType === 'chart-reading' || qType === 'chart-comparison') {
    const chartConfig = content.visual?.config;
    const opts: any[] = content.options || [];
    // Prefer content.options for display (has id/label/content); fall back to q.options strings
    const displayOpts = opts.length > 0 ? opts : (q.options || []).map((s: string, i: number) => ({ id: String(i), label: s, content: s }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 12px' }}>{q.question || q.prompt}</p>
          {chartConfig && <ChartSvg config={chartConfig} />}
        </div>
        {displayOpts.map((opt: any) => (
          <McButton key={opt.id}
            optId={String(opt.id)}
            label={opt.label || opt.content || String(opt.id)}
            chosen={selected === opt.id}
            isCorrect={opt.id === (q.answer || q.correct_answer)}
            answered={answered}
            onPress={() => onSelect(opt.id)} />
        ))}
      </div>
    );
  }

  // ── Fill-blank ────────────────────────────────────────────────────────────
  if (qType === 'fill-blank') {
    const visualConfig = content.visual?.config;
    const blanks: any[] = (visualConfig?.blanks || []).filter((b: any) => typeof b === 'object' && b !== null);
    const hasWordBank   = blanks.length > 0;

    if (hasWordBank) {
      return (
        <FillBlankWordBankRenderer
          key={q?.id || q?.prompt}
          q={q} visualConfig={visualConfig} answered={answered}
          onSubmit={onWordBankSubmit}
        />
      );
    }

    // Simple text-input fill-blank
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: '0 0 12px' }}>{q.question || q.prompt}</p>
          <input
            type="text" value={fillValue} onChange={e => onFillChange(e.target.value)} disabled={answered}
            placeholder="พิมพ์คำตอบ..."
            style={{ width: '100%', borderRadius: 16, padding: '12px 16px', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                     border: `2px solid ${answered ? (correct ? C.green : C.red) : C.sep}`,
                     color: answered ? (correct ? C.green : C.red) : C.ink, backgroundColor: C.surface }}
            onKeyDown={e => { if (e.key === 'Enter' && !answered) onFillSubmit(); }}
          />
        </div>
        {!answered && (
          <button onClick={onFillSubmit} disabled={!fillValue.trim()}
            style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700, padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer', opacity: !fillValue.trim() ? 0.4 : 1 }}>
            ตรวจคำตอบ
          </button>
        )}
      </div>
    );
  }

  // ── Multiple-choice (default) ─────────────────────────────────────────────
  const contentOpts: any[] = content.options || [];
  // Use content.options when available (has proper label + content fields)
  if (contentOpts.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>{q.question || q.prompt}</p>
        </div>
        {contentOpts.map((opt: any, i: number) => (
          <McButton key={opt.id ?? i}
            optId={String(opt.id)}
            label={opt.content || opt.label || String(opt.id)}
            imageUrl={opt.imageUrl}
            chosen={selected === opt.id}
            isCorrect={opt.id === (q.answer || q.correct_answer)}
            answered={answered}
            onPress={() => onSelect(opt.id)} />
        ))}
      </div>
    );
  }

  // Fallback: q.options flat string array
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>{q.question || q.prompt}</p>
      </div>
      {(q.options || []).map((opt: string, i: number) => (
        <McButton key={i} label={opt} chosen={selected === opt} isCorrect={q.correct_answer === opt} answered={answered} onPress={() => onSelect(opt)} />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function DuolingoPageInner() {
  const router   = useRouter();
  const params   = useSearchParams();
  const moduleId = params.get('moduleId') ?? '';
  const { user } = useUser();

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState<any>(null);
  const [fillValue, setFillValue] = useState('');
  const [answered, setAnswered]   = useState(false);
  const [correct, setCorrect]     = useState(false);
  const [lives]                    = useState(3); // kept for result screen compat
  const [xpEarned, setXpEarned]   = useState(0);
  const [done, setDone]           = useState(false);
  const [results, setResults]     = useState<any>(null);
  const [microIdx, setMicroIdx]   = useState(0);

  useEffect(() => { if (moduleId) loadQuestions(); }, [moduleId]);

  const loadQuestions = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/practice/module/${moduleId}`);
      const qs  = Array.isArray(res.data) ? res.data : (res.data?.questions ?? []);
      setQuestions(qs.slice(0, SESSION_SIZE));
    } catch { setQuestions([]); }
    finally   { setLoading(false); }
  };

  const q        = questions[current];
  const qt       = q ? (q.type || q.question_type || 'multiple-choice') : '';
  const progress = questions.length > 0 ? (current / questions.length) * 100 : 0;

  // Word-bank submit: component computes correctness internally, passes boolean
  const checkWordBank = (isCorrect: boolean) => {
    if (answered) return;
    setSelected('__wb__');
    setAnswered(true);
    setCorrect(isCorrect);
    if (isCorrect) setXpEarned(prev => prev + 10);
  };

  const checkAnswer = (answer: any) => {
    if (answered) return;
    setSelected(answer);
    setAnswered(true);

    let isCorrect = false;
    if (qt === 'fill-blank') {
      isCorrect = String(answer).trim().toLowerCase() === String(q.correct_answer || '').trim().toLowerCase();
    } else if (qt === 'micro-lesson' || qt === 'concept-reveal') {
      isCorrect = true;
    } else if (qt === 'scenario') {
      isCorrect = answer === q.answer || answer === q.correct_answer ||
        !!(q.content?.scenarioNodes?.[0]?.choices || []).find((c: any) => c.id === answer)?.isCorrect;
    } else {
      // Use original answer ID (q.answer) first; fall back to migrated content string (q.correct_answer)
      isCorrect = answer === q.answer || answer === q.correct_answer;
    }
    setCorrect(isCorrect);
    if (isCorrect) setXpEarned(prev => prev + 10);
  };

  const next = async () => {
    if (!answered && qt !== 'micro-lesson' && qt !== 'concept-reveal') return;
    if (qt === 'micro-lesson') {
      const cards = q?.micro_lesson?.cards || q?.content?.cards || [];
      if (microIdx < cards.length - 1) { setMicroIdx(i => i + 1); return; }
    }
    if (current + 1 >= questions.length) {
      try {
        const res = await axios.post(`${API_URL}/api/practice/module/${moduleId}/complete`, {
          user_id: user?._id || 'demo_user',
          xp_earned: xpEarned,
          questions_answered: current + 1,
          correct_answers: Math.round(xpEarned / 10),
        });
        setResults(res.data);
      } catch { setResults({ xp_earned: xpEarned }); }
      setDone(true);
      return;
    }
    setCurrent(prev => prev + 1);
    setSelected(null); setFillValue(''); setAnswered(false); setCorrect(false); setMicroIdx(0);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color={C.brand} className="animate-spin" />
    </div>
  );

  if (questions.length === 0) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: '0 24px' }}>
      <Zap size={48} color={C.ink3} />
      <p style={{ fontWeight: 700, color: C.ink }}>ไม่พบคำถาม</p>
      <button onClick={() => router.back()}
        style={{ backgroundColor: C.brand, color: '#fff', padding: '12px 24px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
        กลับ
      </button>
    </div>
  );

  if (done) {
    const total        = current + 1;
    const correctCount = Math.round(xpEarned / 10);
    const pct          = Math.round((correctCount / total) * 100);
    const pass         = pct >= 70;
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', gap: 20 }}>
        <div style={{ borderRadius: 24, padding: 32, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, backgroundColor: pass ? 'rgba(16,185,129,0.10)' : '#FFF7ED', boxShadow: cardShadow }}>
          {pass ? <CheckCircle size={80} color={C.green} /> : <span style={{ fontSize: 60 }}>💪</span>}
          <h2 style={{ fontSize: 22, fontWeight: 800, color: pass ? C.green : C.orange, margin: 0 }}>{pass ? 'ยอดเยี่ยม!' : 'ทำได้ดี!'}</h2>
          <p style={{ fontSize: 40, fontWeight: 800, color: C.ink, margin: 0 }}>{pct}%</p>
          <p style={{ color: C.ink2, margin: 0 }}>ตอบถูก {correctCount} จาก {total} ข้อ</p>
          <span style={{ backgroundColor: 'rgba(239,94,168,0.10)', color: C.brand, fontWeight: 700, padding: '6px 16px', borderRadius: 999, fontSize: 14 }}>⚡ +{xpEarned} XP</span>
        </div>
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 360 }}>
          <button onClick={() => router.back()}
            style={{ flex: 1, borderRadius: 16, padding: '14px 0', fontWeight: 600, color: C.ink, backgroundColor: C.surface, border: '1px solid rgba(0,0,0,0.06)', boxShadow: cardShadow, cursor: 'pointer' }}>
            กลับ
          </button>
          <button onClick={() => { setCurrent(0); setSelected(null); setFillValue(''); setAnswered(false); setCorrect(false); setXpEarned(0); setDone(false); setMicroIdx(0); }}
            style={{ flex: 1, backgroundColor: C.brand, color: '#fff', borderRadius: 16, padding: '14px 0', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            ฝึกอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  const microCards   = q?.micro_lesson?.cards || q?.content?.cards || [];
  const noAnswerType = qt === 'micro-lesson' || qt === 'concept-reveal';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>
      <header style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.sep}`, position: 'sticky', top: 0, zIndex: 10, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}>
            <X size={20} color={C.ink} />
          </button>
          <div style={{ flex: 1 }}><ProgressBar pct={progress} /></div>
          <div style={{ display: 'flex', gap: 2 }}>
          </div>
          <span style={{ color: C.brand, fontWeight: 700, fontSize: 14 }}>+{xpEarned} XP</span>
        </div>
      </header>

      <div style={{ flex: 1, maxWidth: 512, margin: '0 auto', width: '100%', padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <QuestionRenderer
          q={q} selected={selected} fillValue={fillValue}
          onFillChange={setFillValue} answered={answered} correct={correct}
          microIdx={microIdx} onMicroNext={() => setMicroIdx(i => i + 1)}
          onSelect={checkAnswer}
          onFillSubmit={() => checkAnswer(fillValue)}
          onWordBankSubmit={checkWordBank}
        />

        {answered && !noAnswerType && (
          <div style={{ borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12, backgroundColor: correct ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)' }}>
            {correct ? <CheckCircle size={24} color={C.green} style={{ flexShrink: 0 }} /> : <XCircle size={24} color={C.red} style={{ flexShrink: 0 }} />}
            <div>
              <p style={{ fontWeight: 700, color: correct ? C.green : C.red, margin: 0 }}>{correct ? 'ถูกต้อง!' : 'ไม่ถูกต้อง'}</p>
              {!correct && q?.explanation && (
                <p style={{ fontSize: 14, color: C.ink2, marginTop: 2, marginBottom: 0 }}>{q.explanation}</p>
              )}
            </div>
          </div>
        )}

        {(answered || noAnswerType) && (
          <button onClick={next}
            disabled={qt === 'micro-lesson' && microIdx < microCards.length - 1}
            style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700, padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 20px rgba(232,64,155,0.28)', opacity: (qt === 'micro-lesson' && microIdx < microCards.length - 1) ? 0.4 : 1, marginBottom: 24 }}>
            {current + 1 >= questions.length ? 'ดูผลลัพธ์' : 'ถัดไป'} <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function DuolingoPage() {
  return <Suspense><DuolingoPageInner /></Suspense>;
}
