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

// ── Chart renderer — all types, pure SVG/div, no external deps ───────────────

const PAL = ['#f573bd', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

function ChartSvg({ config }: { config: any }) {
  if (!config?.data?.length) return null;

  // Normalise type alias
  const rawType: string = (config.type || 'bar').toLowerCase();
  const type = rawType === 'pie' ? 'donut'
    : rawType === 'dots' ? 'scatter'
    : rawType;

  const wrap = (inner: React.ReactNode) => (
    <div style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: '8px 4px 4px', marginBottom: 12 }}>
      {config.title && (
        <p style={{ fontSize: 11, fontWeight: 600, color: '#374151', textAlign: 'center', margin: '0 0 6px' }}>
          {config.title}
        </p>
      )}
      {inner}
    </div>
  );

  // ── Histogram — bin raw values then fall through to bar ──────────────────────
  let data: any[] = config.data;
  let effectiveType = type;
  if (type === 'histogram') {
    const numKey = Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'number') || 'value';
    const values = data.map((d: any) => Number(d[numKey]));
    const binCount = config.bins || 5;
    const minV = Math.min(...values), maxV = Math.max(...values);
    const bw = (maxV - minV) / binCount || 1;
    const bins = Array.from({ length: binCount }, (_, i) => {
      const lo = minV + i * bw, hi = lo + bw;
      return {
        label: `${Math.round(lo)}-${Math.round(hi)}`,
        count: values.filter((v: number) => v >= lo && (i === binCount - 1 ? v <= hi : v < hi)).length,
      };
    });
    data = bins;
    // Override config keys so bar renderer picks them up correctly
    config = { ...config, data: bins, xKey: 'label', yKey: 'count' };
    effectiveType = 'bar';
  }

  // ── Bar ──────────────────────────────────────────────────────────────────────
  if (effectiveType === 'bar') {
    const W = 320, H = 180;
    const pad = { l: 40, r: 10, t: 16, b: 32 };
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    const xKey = config.xKey || Object.keys(data[0])[0];
    const yKey = (typeof config.yKey === 'string' ? config.yKey : null) || Object.keys(data[0])[1];
    const vals = data.map((d: any) => Number(d[yKey]) || 0);
    const maxY = Math.max(...vals, 1);
    const barW = cw / data.length, gap = barW * 0.22;
    return wrap(
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0, 0.5, 1].map(t => {
          const y = pad.t + ch * (1 - t);
          return <g key={t}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
            <text x={pad.l - 4} y={y + 3} fontSize="8" fill="#9CA3AF" textAnchor="end">{fmtNum(maxY * t)}</text>
          </g>;
        })}
        {data.map((d, i) => {
          const val = Number(d[yKey]) || 0;
          const bh = (val / maxY) * ch;
          const x = pad.l + i * barW + gap / 2;
          return <g key={i}>
            <rect x={x} y={pad.t + ch - bh} width={barW - gap} height={bh} fill={PAL[i % PAL.length]} rx="3" />
            <text x={x + (barW - gap) / 2} y={H - pad.b + 12} fontSize="8" fill="#6B7280" textAnchor="middle">
              {String(d[xKey] || '').slice(0, 5)}
            </text>
          </g>;
        })}
      </svg>
    );
  }

  // ── Line / Area ───────────────────────────────────────────────────────────────
  if (type === 'line' || type === 'area') {
    const W = 320, H = 180;
    const pad = { l: 40, r: 10, t: 16, b: 32 };
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    const xKey = config.xKey || Object.keys(data[0])[0];
    const yKey = (typeof config.yKey === 'string' ? config.yKey : null) || Object.keys(data[0])[1];
    const vals = data.map(d => Number(d[yKey]) || 0);
    const minY = Math.min(...vals), maxY = Math.max(...vals, minY + 1);
    const range = maxY - minY || 1;
    const ptX = (i: number) => pad.l + (data.length > 1 ? (i / (data.length - 1)) * cw : cw / 2);
    const ptY = (v: number) => pad.t + ch - ((v - minY) / range) * ch;
    const pts = data.map((d, i) => ({ x: ptX(i), y: ptY(Number(d[yKey]) || 0), lbl: String(d[xKey] || '').slice(0, 5) }));
    const line = pts.map(p => `${p.x},${p.y}`).join(' ');
    const fill = pts.length > 1
      ? `M${pts[0].x},${pad.t + ch} ${pts.map(p => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length - 1].x},${pad.t + ch} Z`
      : '';
    return wrap(
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0, 0.5, 1].map(t => {
          const y = pad.t + ch * (1 - t);
          return <g key={t}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
            <text x={pad.l - 4} y={y + 3} fontSize="8" fill="#9CA3AF" textAnchor="end">{fmtNum(minY + range * t)}</text>
          </g>;
        })}
        {fill && <path d={fill} fill="#f573bd" fillOpacity="0.12" />}
        <polyline points={line} fill="none" stroke="#f573bd" strokeWidth="2" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3" fill="#f573bd" />
            <text x={p.x} y={H - pad.b + 12} fontSize="8" fill="#6B7280" textAnchor="middle">{p.lbl}</text>
          </g>
        ))}
      </svg>
    );
  }

  // ── Multi-line ────────────────────────────────────────────────────────────────
  if (type === 'multi-line') {
    const W = 320, H = 180;
    const pad = { l: 40, r: 10, t: 16, b: 32 };
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    const xKey = config.xKey || Object.keys(data[0])[0];
    const series: string[] = [config.yKey as string, (config as any).yKey2 as string].filter(Boolean);
    const allVals = data.flatMap(d => series.map(k => Number(d[k] || 0)));
    const minY = Math.min(...allVals), maxY = Math.max(...allVals, minY + 1), range = maxY - minY || 1;
    const ptX = (i: number) => pad.l + (data.length > 1 ? (i / (data.length - 1)) * cw : cw / 2);
    const ptY = (v: number) => pad.t + ch - ((v - minY) / range) * ch;
    return wrap(
      <>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {[0, 0.5, 1].map(t => {
            const y = pad.t + ch * (1 - t);
            return <g key={t}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
              <text x={pad.l - 4} y={y + 3} fontSize="8" fill="#9CA3AF" textAnchor="end">{fmtNum(minY + range * t)}</text>
            </g>;
          })}
          {series.map((key, ki) => {
            const pts = data.map((d, i) => `${ptX(i)},${ptY(Number(d[key] || 0))}`).join(' ');
            return <g key={key}>
              <polyline points={pts} fill="none" stroke={PAL[ki]} strokeWidth="2" />
              {data.map((d, i) => <circle key={i} cx={ptX(i)} cy={ptY(Number(d[key] || 0))} r="3" fill={PAL[ki]} />)}
            </g>;
          })}
          {data.map((d, i) => (
            <text key={i} x={ptX(i)} y={H - pad.b + 12} fontSize="8" fill="#6B7280" textAnchor="middle">
              {String(d[xKey] || '').slice(0, 5)}
            </text>
          ))}
        </svg>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', padding: '2px 8px' }}>
          {series.map((k, i) => (
            <span key={k} style={{ fontSize: 10, color: PAL[i], display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: PAL[i], display: 'inline-block' }} />{k}
            </span>
          ))}
        </div>
      </>
    );
  }

  // ── Stacked-bar ───────────────────────────────────────────────────────────────
  if (type === 'stacked-bar') {
    const W = 320, H = 180;
    const pad = { l: 40, r: 10, t: 16, b: 32 };
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    const xKey = config.xKey || Object.keys(data[0])[0];
    const series: string[] = [config.yKey as string, (config as any).yKey2 as string].filter(Boolean);
    const totals = data.map(d => series.reduce((s, k) => s + Number(d[k] || 0), 0));
    const maxY = Math.max(...totals, 1);
    const barW = cw / data.length, gap = barW * 0.22;
    return wrap(
      <>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {[0, 0.5, 1].map(t => {
            const y = pad.t + ch * (1 - t);
            return <g key={t}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
              <text x={pad.l - 4} y={y + 3} fontSize="8" fill="#9CA3AF" textAnchor="end">{fmtNum(maxY * t)}</text>
            </g>;
          })}
          {data.map((d, i) => {
            const x = pad.l + i * barW + gap / 2;
            let bottom = pad.t + ch;
            return <g key={i}>
              {series.map((key, ki) => {
                const val = Number(d[key] || 0);
                const bh = (val / maxY) * ch;
                bottom -= bh;
                return <rect key={key} x={x} y={bottom} width={barW - gap} height={bh} fill={PAL[ki]} rx={ki === series.length - 1 ? 3 : 0} />;
              })}
              <text x={x + (barW - gap) / 2} y={H - pad.b + 12} fontSize="8" fill="#6B7280" textAnchor="middle">
                {String(d[xKey] || '').slice(0, 5)}
              </text>
            </g>;
          })}
        </svg>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', padding: '2px 8px' }}>
          {series.map((k, i) => (
            <span key={k} style={{ fontSize: 10, color: PAL[i], display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: PAL[i], display: 'inline-block' }} />{k}
            </span>
          ))}
        </div>
      </>
    );
  }

  // ── Dual-axis (bars + line) ───────────────────────────────────────────────────
  if (type === 'dual-axis') {
    const W = 320, H = 180;
    const pad = { l: 40, r: 36, t: 16, b: 32 };
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    const xKey = config.xKey || Object.keys(data[0])[0];
    const yKey = config.yKey as string;
    const yKey2 = (config as any).yKey2 as string;
    const barVals = data.map(d => Number(d[yKey] || 0));
    const lineVals = data.map(d => Number(d[yKey2] || 0));
    const maxBar = Math.max(...barVals, 1);
    const minLine = Math.min(...lineVals), maxLine = Math.max(...lineVals, minLine + 1), rangeL = maxLine - minLine || 1;
    const barW = cw / data.length, gap = barW * 0.25;
    const ptX = (i: number) => pad.l + i * barW + barW / 2;
    const ptY = (v: number) => pad.t + ch - ((v - minLine) / rangeL) * ch;
    const linePts = data.map((d, i) => `${ptX(i)},${ptY(Number(d[yKey2] || 0))}`).join(' ');
    return wrap(
      <>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {[0, 0.5, 1].map(t => {
            const y = pad.t + ch * (1 - t);
            return <g key={t}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
              <text x={pad.l - 4} y={y + 3} fontSize="8" fill="#9CA3AF" textAnchor="end">{fmtNum(maxBar * t)}</text>
              <text x={W - pad.r + 4} y={y + 3} fontSize="8" fill="#6366f1" textAnchor="start">{fmtNum(minLine + rangeL * t)}</text>
            </g>;
          })}
          {data.map((d, i) => {
            const bh = (Number(d[yKey] || 0) / maxBar) * ch;
            const x = pad.l + i * barW + gap / 2;
            return <g key={i}>
              <rect x={x} y={pad.t + ch - bh} width={barW - gap} height={bh} fill="#f573bd" fillOpacity="0.8" rx="3" />
              <text x={ptX(i)} y={H - pad.b + 12} fontSize="8" fill="#6B7280" textAnchor="middle">
                {String(d[xKey] || '').slice(0, 5)}
              </text>
            </g>;
          })}
          <polyline points={linePts} fill="none" stroke="#6366f1" strokeWidth="2" />
          {data.map((d, i) => <circle key={i} cx={ptX(i)} cy={ptY(Number(d[yKey2] || 0))} r="3" fill="#6366f1" />)}
        </svg>
        <div style={{ display: 'flex', gap: 10, padding: '2px 8px' }}>
          <span style={{ fontSize: 10, color: '#f573bd', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#f573bd', display: 'inline-block' }} />{yKey}
          </span>
          <span style={{ fontSize: 10, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 3, backgroundColor: '#6366f1', display: 'inline-block' }} />{yKey2}
          </span>
        </div>
      </>
    );
  }

  // ── Scatter / dots ────────────────────────────────────────────────────────────
  if (type === 'scatter') {
    const W = 320, H = 180;
    const pad = { l: 40, r: 10, t: 16, b: 32 };
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    const xKey = config.xKey || Object.keys(data[0])[0];
    const yKey = (typeof config.yKey === 'string' ? config.yKey : null) || Object.keys(data[0])[1];
    const xs = data.map(d => Number(d[xKey])), ys = data.map(d => Number(d[yKey]));
    const minX = Math.min(...xs), maxX = Math.max(...xs, minX + 1), rx = maxX - minX || 1;
    const minY = Math.min(...ys), maxY = Math.max(...ys, minY + 1), ry = maxY - minY || 1;
    return wrap(
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0, 0.5, 1].map(t => {
          const y = pad.t + ch * (1 - t);
          return <g key={t}>
            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#E5E7EB" strokeWidth="0.5" />
            <text x={pad.l - 4} y={y + 3} fontSize="8" fill="#9CA3AF" textAnchor="end">{fmtNum(minY + ry * t)}</text>
          </g>;
        })}
        {data.map((d, i) => (
          <circle key={i}
            cx={pad.l + ((Number(d[xKey]) - minX) / rx) * cw}
            cy={pad.t + ch - ((Number(d[yKey]) - minY) / ry) * ch}
            r="5" fill="#f573bd" fillOpacity="0.75"
          />
        ))}
        <text x={W / 2} y={H - 2} fontSize="8" fill="#6B7280" textAnchor="middle">{xKey}</text>
      </svg>
    );
  }

  // ── Pie / Donut ───────────────────────────────────────────────────────────────
  if (type === 'donut') {
    const size = 220;
    const cx = size / 2, cy = size / 2;
    const outerR = size / 2 - 20, innerR = outerR * 0.5;
    const keyField = config.key || config.nameKey || Object.keys(data[0])[0];
    const valueKey = config.valueKey || (typeof config.yKey === 'string' ? config.yKey : null) || Object.keys(data[0])[1];
    const total = data.reduce((s: number, d: any) => s + Number(d[valueKey] || 0), 0) || 1;
    let startAngle = -Math.PI / 2;
    const slices = data.map((d: any, i: number) => {
      const val = Number(d[valueKey] || 0);
      const angle = (val / total) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const slice = { label: String(d[keyField] ?? i), val, pct: Math.round((val / total) * 100), color: PAL[i % PAL.length], startAngle, endAngle };
      startAngle = endAngle;
      return slice;
    });
    const slicePath = (s: typeof slices[0]) => {
      const large = s.endAngle - s.startAngle > Math.PI ? 1 : 0;
      const ox1 = cx + outerR * Math.cos(s.startAngle), oy1 = cy + outerR * Math.sin(s.startAngle);
      const ox2 = cx + outerR * Math.cos(s.endAngle),   oy2 = cy + outerR * Math.sin(s.endAngle);
      const ix1 = cx + innerR * Math.cos(s.endAngle),   iy1 = cy + innerR * Math.sin(s.endAngle);
      const ix2 = cx + innerR * Math.cos(s.startAngle), iy2 = cy + innerR * Math.sin(s.startAngle);
      return `M${ox1},${oy1} A${outerR},${outerR},0,${large},1,${ox2},${oy2} L${ix1},${iy1} A${innerR},${innerR},0,${large},0,${ix2},${iy2} Z`;
    };
    return wrap(
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: Math.min(size, 180), height: 'auto', display: 'block' }}>
          {slices.map((s, i) => <path key={i} d={slicePath(s)} fill={s.color} />)}
        </svg>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'center', padding: '4px 0' }}>
          {slices.map(s => (
            <span key={s.label} style={{ fontSize: 10, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block', flexShrink: 0 }} />
              {s.label} {s.pct}%
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── Radar ─────────────────────────────────────────────────────────────────────
  if (type === 'radar') {
    const size = 220;
    const cx = size / 2, cy = size / 2, r = size / 2 - 44;
    const keyField = config.key || Object.keys(data[0])[0];
    const valueKeys: string[] = config.valueKeys || [Object.keys(data[0])[1]];
    const allVals = data.flatMap((d: any) => valueKeys.map(k => Number(d[k] || 0)));
    const maxVal = Math.max(...allVals, 1);
    const n = data.length;
    const angle = (i: number) => (2 * Math.PI * i) / n - Math.PI / 2;
    const pt = (i: number, ratio: number) =>
      `${cx + r * ratio * Math.cos(angle(i))},${cy + r * ratio * Math.sin(angle(i))}`;
    return wrap(
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: Math.min(size, 200), height: 'auto', display: 'block' }}>
          {[0.25, 0.5, 0.75, 1].map(lv => (
            <path key={lv} d={`M${Array.from({ length: n }, (_, i) => pt(i, lv)).join(' L')} Z`}
              fill="none" stroke="#E5E7EB" strokeWidth="1" />
          ))}
          {Array.from({ length: n }, (_, i) => (
            <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))}
              stroke="#E5E7EB" strokeWidth="1" />
          ))}
          {valueKeys.map((key, ki) => (
            <path key={key}
              d={`M${data.map((d: any, i: number) => pt(i, Number(d[key] || 0) / maxVal)).join(' L')} Z`}
              fill={PAL[ki]} fillOpacity="0.2" stroke={PAL[ki]} strokeWidth="2" />
          ))}
          {data.map((d: any, i: number) => {
            const lx = cx + (r + 22) * Math.cos(angle(i));
            const ly = cy + (r + 22) * Math.sin(angle(i));
            return <text key={i} x={lx} y={ly} fontSize="9" fill="#374151" textAnchor="middle" dominantBaseline="middle">
              {String(d[keyField]).slice(0, 8)}
            </text>;
          })}
        </svg>
        {valueKeys.length > 1 && (
          <div style={{ display: 'flex', gap: 10 }}>
            {valueKeys.map((k, i) => (
              <span key={k} style={{ fontSize: 10, color: PAL[i], display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: PAL[i], display: 'inline-block' }} />{k}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Heatmap ───────────────────────────────────────────────────────────────────
  if (type === 'heatmap') {
    const rowLabelKey = config.yKey as string || Object.keys(data[0]).find(k => k !== 'data') || 'id';
    const allVals: number[] = data.flatMap((row: any) =>
      Array.isArray(row.data) ? row.data.map((c: any) => Number(c.y ?? c.value ?? 0)) : []
    );
    const minV = Math.min(...allVals, 0), maxV = Math.max(...allVals, 1);
    const cols: string[] = data[0]?.data?.map((c: any) => String(c.x ?? '')) || [];
    return wrap(
      <div style={{ overflowX: 'auto' }}>
        {/* Column headers */}
        <div style={{ display: 'flex', paddingLeft: 52, marginBottom: 2 }}>
          {cols.map((c: string) => (
            <div key={c} style={{ flex: 1, minWidth: 28, fontSize: 9, color: '#9CA3AF', textAlign: 'center', overflow: 'hidden' }}>
              {c.slice(0, 6)}
            </div>
          ))}
        </div>
        {data.map((row: any, ri: number) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <div style={{ width: 52, fontSize: 9, color: '#6B7280', overflow: 'hidden', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {String(row[rowLabelKey] || row.id || ri).slice(0, 8)}
            </div>
            {(row.data || []).map((cell: any, ci: number) => {
              const val = Number(cell.y ?? cell.value ?? 0);
              const intensity = (val - minV) / (maxV - minV);
              const alpha = (0.15 + intensity * 0.85).toFixed(2);
              return (
                <div key={ci} style={{
                  flex: 1, minWidth: 28, height: 24,
                  backgroundColor: `rgba(245,115,189,${alpha})`,
                  borderRadius: 3, margin: '0 1px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 8, color: intensity > 0.55 ? '#fff' : '#374151', fontWeight: 600 }}>
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // ── Treemap ───────────────────────────────────────────────────────────────────
  if (type === 'treemap') {
    const nameKey = config.nameKey || config.xKey || Object.keys(data[0])[0];
    const valueKey = config.valueKey || (typeof config.yKey === 'string' ? config.yKey : null) || Object.keys(data[0])[1];
    const sorted = [...data].sort((a: any, b: any) => Number(b[valueKey]) - Number(a[valueKey]));
    const total = sorted.reduce((s: number, d: any) => s + Number(d[valueKey] || 0), 1);
    return wrap(
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {sorted.map((d: any, i: number) => {
          const pct = (Number(d[valueKey]) / total) * 100;
          return (
            <div key={i} style={{
              width: `${Math.max(pct, 8)}%`,
              minHeight: 40, backgroundColor: PAL[i % PAL.length],
              borderRadius: 6, padding: '4px 6px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
                {String(d[nameKey]).slice(0, 12)}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)' }}>{fmtNum(Number(d[valueKey]))}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Funnel ────────────────────────────────────────────────────────────────────
  if (type === 'funnel') {
    const nameKey = config.nameKey || config.xKey || Object.keys(data[0])[0];
    const valueKey = config.valueKey || (typeof config.yKey === 'string' ? config.yKey : null) || Object.keys(data[0])[1];
    const maxVal = Math.max(...data.map((d: any) => Number(d[valueKey] || 0)), 1);
    return wrap(
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        {data.map((d: any, i: number) => {
          const pct = Number(d[valueKey] || 0) / maxVal;
          return (
            <div key={i} style={{
              width: `${Math.max(pct * 100, 20)}%`, minHeight: 32,
              backgroundColor: PAL[i % PAL.length], borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{String(d[nameKey]).slice(0, 14)}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>{fmtNum(Number(d[valueKey]))}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Unsupported fallback ──────────────────────────────────────────────────────
  return wrap(
    <div style={{ padding: '16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
      📊 {config.title || `กราฟ (${type})`}
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


// ── Scenario renderer — full multi-node progression matching Expo ─────────────

function ScenarioRenderer({ q, content, onSubmit }: any) {
  const nodes = [...(q.scenario_nodes || content.scenarioNodes || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const [nodeIdx, setNodeIdx]     = useState(0);
  const [choice, setChoice]       = useState<string | null>(null);
  const [outcome, setOutcome]     = useState<string | null>(null);

  const node = nodes[nodeIdx];
  if (!node) return null;

  const choiceObj = node.choices?.find((c: any) => c.id === choice);
  const correct   = choiceObj?.isCorrect ?? false;

  const handleChoice = (c: any) => {
    if (outcome) return;
    setChoice(c.id);
    setOutcome(c.outcome || '');
  };

  const handleNext = () => {
    const nextIdx = nodeIdx + 1;
    if (nextIdx >= nodes.length) {
      onSubmit(true);
    } else {
      setNodeIdx(nextIdx);
      setChoice(null);
      setOutcome(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Node progress dots */}
      {nodes.length > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {nodes.map((_: any, i: number) => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: '50%',
              backgroundColor: i < nodeIdx ? C.green : i === nodeIdx ? C.brand : C.ink3 }} />
          ))}
        </div>
      )}

      {/* Situation card */}
      <div style={{ ...cardStyle, padding: 20 }}>
        {node.icon && <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>{node.icon}</span>}
        <p style={{ fontSize: 14, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>{node.situation}</p>
        {node.context && <p style={{ fontSize: 13, color: C.ink2, lineHeight: 1.6, margin: 0 }}>{node.context}</p>}
      </div>

      {/* Choices (hidden after selection) */}
      {!outcome && (node.choices || []).map((c: any) => (
        <button key={c.id} onClick={() => handleChoice(c)}
          style={{ width: '100%', textAlign: 'left', padding: 16, borderRadius: 16, cursor: 'pointer',
                   border: `2px solid ${C.sep}`, backgroundColor: C.surface, fontWeight: 600, fontSize: 14, color: C.ink }}>
          {c.label}
        </button>
      ))}

      {/* Outcome panel */}
      {outcome !== null && (
        <div style={{ borderRadius: 16, padding: 16,
                      backgroundColor: correct ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                      border: `2px solid ${correct ? C.green : C.red}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: outcome ? 8 : 0 }}>
            <span style={{ fontSize: 20 }}>{correct ? '✅' : '❌'}</span>
            <span style={{ fontWeight: 700, color: correct ? C.green : C.red, fontSize: 14 }}>
              {correct ? 'ถูกต้อง!' : 'ยังไม่ถูก'}
            </span>
          </div>
          {outcome && <p style={{ fontSize: 13, color: C.ink2, margin: 0, lineHeight: 1.6 }}>{outcome}</p>}
          {correct ? (
            <button onClick={handleNext}
              style={{ width: '100%', marginTop: 12, backgroundColor: C.green, color: '#fff',
                       fontWeight: 700, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
              {nodeIdx + 1 >= nodes.length ? 'เสร็จสิ้น ✓' : 'ต่อไป →'}
            </button>
          ) : (
            <button onClick={() => { setChoice(null); setOutcome(null); }}
              style={{ width: '100%', marginTop: 12, backgroundColor: C.red, color: '#fff',
                       fontWeight: 700, padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer' }}>
              ลองใหม่อีกครั้ง
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Fill-blank reveal (flashcard mode for questions without a word bank) ──────
// These questions have no options/blanks array — show a flashcard where the
// student reads the answer rather than typing it from scratch.

function FillBlankRevealRenderer({ q, answered, onSubmit }: any) {
  const [revealed, setRevealed] = useState(false);
  const answer = q.correct_answer || q.answer || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 14px' }}>{q.question || q.prompt}</p>

        {/* Answer area */}
        <div style={{ borderRadius: 14, overflow: 'hidden', border: `2px solid ${revealed ? C.green : C.sep}` }}>
          {revealed ? (
            <div style={{ padding: '14px 16px', backgroundColor: 'rgba(16,185,129,0.08)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.green, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>คำตอบ</p>
              <p style={{ fontSize: 15, color: C.ink, fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>{answer}</p>
            </div>
          ) : (
            <button onClick={() => setRevealed(true)}
              style={{ width: '100%', padding: '14px 16px', backgroundColor: C.bg, border: 'none', cursor: 'pointer',
                       display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>👁</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.ink2 }}>แตะเพื่อดูคำตอบ</span>
            </button>
          )}
        </div>
      </div>

      {revealed && !answered && (
        <button onClick={() => onSubmit(true)}
          style={{ width: '100%', backgroundColor: C.green, color: '#fff', fontWeight: 700, fontSize: 15,
                   padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer',
                   boxShadow: '0px 6px 14px rgba(16,185,129,0.28)',
                   display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          เข้าใจแล้ว ✓
        </button>
      )}
    </div>
  );
}

// ── Concept-reveal renderer (with hotspot annotations) ───────────────────────

function ConceptRevealRenderer({ cr, hotspots, q }: any) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const hs = hotspots.find((h: any) => h.id === activeHotspot);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: C.brand, margin: '0 0 8px' }}>💡 Concept</p>
        <p style={{ fontSize: 15, color: C.ink, lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>{cr.content || q.question || q.prompt}</p>
        {cr.summary && (
          <div style={{ backgroundColor: 'rgba(239,94,168,0.10)', borderRadius: 12, padding: 12, marginTop: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.brand, margin: 0 }}>{cr.summary}</p>
          </div>
        )}
      </div>

      {hotspots.length > 0 && (
        <>
          <p style={{ fontSize: 12, color: C.ink2, textAlign: 'center', margin: 0 }}>แตะหัวข้อเพื่อดูคำอธิบาย</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {hotspots.map((h: any) => (
              <button key={h.id} onClick={() => setActiveHotspot(activeHotspot === h.id ? null : h.id)}
                style={{ padding: '8px 14px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                         border: `2px solid ${activeHotspot === h.id ? C.brand : C.sep}`,
                         backgroundColor: activeHotspot === h.id ? 'rgba(239,94,168,0.10)' : C.surface,
                         color: activeHotspot === h.id ? C.brand : C.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{h.icon}</span><span>{h.label}</span>
              </button>
            ))}
          </div>
          {hs && (
            <div style={{ ...cardStyle, padding: 16, borderLeft: `4px solid ${C.brand}` }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.brand, margin: '0 0 6px' }}>{hs.icon} {hs.label}</p>
              <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.6, margin: 0 }}>{hs.annotation}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Drag-arrange renderer ────────────────────────────────────────────────────

function DragArrangeRenderer({ q, answered, onSubmit }: any) {
  const da = q.content?.dragArrange || q.content?.drag_arrange || {};
  const mode: 'categorize' | 'order' = da.mode || 'order';
  const categories: string[] = da.categories || [];
  const rawItems: any[] = da.items || [];

  // shuffle once on mount
  const [items] = useState<any[]>(() => [...rawItems].sort(() => Math.random() - 0.5));
  const [assign, setAssign]           = useState<Record<string, string>>({});  // categorize
  const [order, setOrder]             = useState<string[]>(() => items.map((i: any) => i.id)); // ordering
  const [selected, setSelected]       = useState<string | null>(null); // currently tapped item
  const [submitted, setSubmit]        = useState(false);

  const moveItem = (idx: number, dir: -1 | 1) => {
    if (submitted) return;
    const next = [...order];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setOrder(next);
  };

  const handleSubmitCat = () => {
    if (submitted) return;
    setSubmit(true);
    const correct = rawItems.every((item: any) => assign[item.id] === item.category);
    onSubmit(correct);
  };

  const handleSubmitOrder = () => {
    if (submitted) return;
    setSubmit(true);
    const correct = rawItems.every((item: any) => {
      const pos = order.indexOf(item.id);
      return pos === (item.correctPosition - 1);
    });
    onSubmit(correct);
  };

  if (mode === 'categorize') {
    const unassigned = items.filter((i: any) => !assign[i.id]);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>{q.question || q.prompt}</p>
          {da.instruction && <p style={{ fontSize: 13, color: C.ink2, margin: 0 }}>{da.instruction}</p>}
        </div>

        {/* Category buckets */}
        {categories.map((cat: string) => {
          const assigned = Object.entries(assign).filter(([, c]) => c === cat).map(([id]) => rawItems.find((i: any) => i.id === id)).filter(Boolean);
          return (
            <div key={cat}
              onClick={() => {
                if (!selected || submitted) return;
                setAssign(prev => ({ ...prev, [selected]: cat }));
                setSelected(null);
              }}
              style={{ ...cardStyle, padding: 14, cursor: selected && !submitted ? 'pointer' : 'default',
                       border: `2px solid ${selected && !submitted ? C.brand : 'rgba(0,0,0,0.06)'}`,
                       backgroundColor: selected && !submitted ? 'rgba(239,94,168,0.04)' : C.surface }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.brand, margin: '0 0 8px' }}>{cat}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 32 }}>
                {assigned.map((item: any) => {
                  const correct = submitted ? assign[item.id] === item.category : null;
                  return (
                    <span key={item.id}
                      onClick={(e) => { e.stopPropagation(); if (!submitted) { setAssign(prev => { const n = { ...prev }; delete n[item.id]; return n; }); } }}
                      style={{ padding: '6px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: submitted ? 'default' : 'pointer',
                               backgroundColor: correct === true ? 'rgba(16,185,129,0.15)' : correct === false ? 'rgba(239,68,68,0.15)' : 'rgba(239,94,168,0.12)',
                               color: correct === true ? C.green : correct === false ? C.red : C.brand,
                               border: `1.5px solid ${correct === true ? C.green : correct === false ? C.red : C.brand}` }}>
                      {item.label} {!submitted && '✕'}
                    </span>
                  );
                })}
                {assigned.length === 0 && <span style={{ fontSize: 12, color: C.ink3 }}>แตะรายการด้านล่าง แล้วแตะที่นี่</span>}
              </div>
            </div>
          );
        })}

        {/* Unassigned chips */}
        {unassigned.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {unassigned.map((item: any) => (
              <button key={item.id} onClick={() => setSelected(selected === item.id ? null : item.id)}
                style={{ padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                         border: `2px solid ${selected === item.id ? C.brand : C.sep}`,
                         backgroundColor: selected === item.id ? 'rgba(239,94,168,0.10)' : C.surface,
                         color: selected === item.id ? C.brand : C.ink }}>
                {item.label}
              </button>
            ))}
          </div>
        )}

        {!submitted && Object.keys(assign).length === rawItems.length && (
          <button onClick={handleSubmitCat}
            style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700,
                     padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer' }}>
            ตรวจคำตอบ
          </button>
        )}
      </div>
    );
  }

  // ── Order mode ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>{q.question || q.prompt}</p>
        {da.instruction && <p style={{ fontSize: 13, color: C.ink2, margin: 0 }}>{da.instruction}</p>}
      </div>
      <p style={{ fontSize: 12, color: C.ink2, textAlign: 'center', margin: 0 }}>ใช้ ↑ ↓ เพื่อเรียงลำดับ</p>
      {order.map((itemId: string, idx: number) => {
        const item = rawItems.find((i: any) => i.id === itemId);
        const correct = submitted ? order[idx] === rawItems.find((i: any) => i.correctPosition === idx + 1)?.id : null;
        return (
          <div key={itemId}
            style={{ ...cardStyle, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                     border: `2px solid ${correct === true ? C.green : correct === false ? C.red : 'rgba(0,0,0,0.06)'}`,
                     backgroundColor: correct === true ? 'rgba(16,185,129,0.06)' : correct === false ? 'rgba(239,68,68,0.06)' : C.surface }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.ink3, minWidth: 18 }}>{idx + 1}</span>
            <span style={{ flex: 1, fontSize: 14, color: C.ink, fontWeight: 500 }}>{item?.label}</span>
            {!submitted && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button onClick={() => moveItem(idx, -1)} disabled={idx === 0}
                  style={{ width: 28, height: 24, border: `1px solid ${C.sep}`, borderRadius: 6, cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1, backgroundColor: C.bg, fontSize: 12 }}>↑</button>
                <button onClick={() => moveItem(idx, 1)} disabled={idx === order.length - 1}
                  style={{ width: 28, height: 24, border: `1px solid ${C.sep}`, borderRadius: 6, cursor: idx === order.length - 1 ? 'default' : 'pointer', opacity: idx === order.length - 1 ? 0.3 : 1, backgroundColor: C.bg, fontSize: 12 }}>↓</button>
              </div>
            )}
          </div>
        );
      })}
      {!submitted && (
        <button onClick={handleSubmitOrder}
          style={{ width: '100%', backgroundColor: C.brand, color: '#fff', fontWeight: 700,
                   padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer' }}>
          ตรวจคำตอบ
        </button>
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
    const cards = [...(q.micro_lesson?.cards || content.cards || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const card  = cards[microIdx];
    if (!card) return null;
    const cardColors: Record<string, string> = { concept: '#6366f1', analogy: '#f59e0b', example: '#10b981', tip: C.brand, summary: '#3b82f6' };
    const accent = cardColors[card.cardType] || C.brand;
    return (
      <div style={{ ...cardStyle, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderTop: `4px solid ${accent}` }}>
        <span style={{ fontSize: 30 }}>{card.icon || '📖'}</span>
        <p style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{card.cardType}</p>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0 }}>{card.title}</h2>
        <p style={{ fontSize: 15, color: C.ink2, lineHeight: 1.6, margin: 0 }}>{card.body}</p>
        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {cards.map((_: any, i: number) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: i === microIdx ? accent : C.ink3 }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {microIdx > 0 ? (
            <button onClick={() => onMicroNext(-1)} style={{ color: C.ink2, fontWeight: 600, fontSize: 14, border: 'none', background: 'none', cursor: 'pointer' }}>← ก่อนหน้า</button>
          ) : <span />}
          {microIdx < cards.length - 1 ? (
            <button onClick={() => onMicroNext(1)} style={{ color: accent, fontWeight: 700, fontSize: 14, border: 'none', background: 'none', cursor: 'pointer' }}>ถัดไป →</button>
          ) : null}
        </div>
      </div>
    );
  }

  // ── Concept-reveal ────────────────────────────────────────────────────────
  if (qType === 'concept-reveal') {
    const cr = q.concept_reveal || content.conceptReveal || {};
    const hotspots: any[] = [...(cr.hotspots || [])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    return (
      <ConceptRevealRenderer cr={cr} hotspots={hotspots} q={q} key={q?.id} />
    );
  }

  // ── Scenario ──────────────────────────────────────────────────────────────
  if (qType === 'scenario') {
    return <ScenarioRenderer key={q?.id || q?.prompt} q={q} content={content} onSubmit={onWordBankSubmit} />;
  }

  // ── Comparison ────────────────────────────────────────────────────────────
  // Only use the rich ComparisonRenderer when there are actual HTML option cards;
  // otherwise fall through to standard MC so q.options strings still render.
  if (qType === 'comparison' && (content.options || []).length > 0) {
    return <ComparisonRenderer key={q?.id || q?.prompt} q={q} content={content} selected={selected} answered={answered} onSelect={onSelect} />;
  }

  // ── Drag-arrange ──────────────────────────────────────────────────────────
  if (qType === 'drag-arrange') {
    return <DragArrangeRenderer key={q?.id || q?.prompt} q={q} answered={answered} onSubmit={onWordBankSubmit} />;
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
          {qType === 'chart-comparison' && (
            <div style={{ backgroundColor: C.bg, borderRadius: 10, padding: 14, textAlign: 'center', marginTop: 8 }}>
              <p style={{ fontSize: 13, color: C.ink3, margin: 0 }}>📊 แผนภูมิที่ 2 (กำลังอัปเดตข้อมูล)</p>
            </div>
          )}
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
    // content.options is also a valid word-bank source (Format 3)
    const hasWordBank   = blanks.length > 0 || (content.options || []).length > 0;

    if (hasWordBank) {
      return (
        <FillBlankWordBankRenderer
          key={q?.id || q?.prompt}
          q={q} visualConfig={visualConfig} answered={answered}
          onSubmit={onWordBankSubmit}
        />
      );
    }

    // No word bank — flashcard reveal (no free-text typing)
    return <FillBlankRevealRenderer key={q?.id || q?.prompt} q={q} answered={answered} onSubmit={onWordBankSubmit} />;
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
  const qOpts: string[] = q.options || [];
  if (qOpts.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ ...cardStyle, padding: 20 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>{q.question || q.prompt}</p>
        </div>
        {qOpts.map((opt: string, i: number) => (
          <McButton key={i} label={opt} chosen={selected === opt} isCorrect={q.correct_answer === opt} answered={answered} onPress={() => onSelect(opt)} />
        ))}
      </div>
    );
  }

  // No options anywhere — question data is incomplete.
  // Auto-pass so the user isn't stuck on a blank screen.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...cardStyle, padding: 20 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: '0 0 10px' }}>{q.question || q.prompt}</p>
        <p style={{ fontSize: 13, color: C.ink3, margin: 0 }}>⚠️ ข้อมูลตัวเลือกไม่สมบูรณ์</p>
      </div>
      {!answered && (
        <button onClick={() => onWordBankSubmit(true)}
          style={{ width: '100%', backgroundColor: C.ink3, color: '#fff', fontWeight: 700,
                   padding: '16px 0', borderRadius: 16, border: 'none', cursor: 'pointer' }}>
          ข้ามคำถามนี้
        </button>
      )}
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
          microIdx={microIdx} onMicroNext={(dir: number = 1) => setMicroIdx(i => Math.max(0, i + dir))}
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
