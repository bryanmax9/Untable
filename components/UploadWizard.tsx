'use client';
import React, { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SheetInfo } from '@/lib/types';
import { cn } from '@/lib/utils';

type Step = 'drop' | 'sheets' | 'creating';

export function UploadWizard({ orgId }: { orgId?: string } = {}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('drop');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set());
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.match(/\.(xlsx|xlsm|xls)$/i)) {
      setError('Please upload an .xlsx, .xlsm, or .xls file.');
      return;
    }
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append('file', f);
    try {
      const res = await fetch('/api/parse-sheets', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to read file');
      setFile(f);
      setSheets(data.sheets);
      setSelectedSheets(new Set(data.sheets.map((s: SheetInfo) => s.name)));
      setProjectName(f.name.replace(/\.[^.]+$/, ''));
      setStep('sheets');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setUploading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  function toggleSheet(name: string) {
    setSelectedSheets(prev => {
      const next = new Set(prev);
      if (next.has(name)) { if (next.size > 1) next.delete(name); }
      else next.add(name);
      return next;
    });
  }

  async function createProject() {
    if (!file || selectedSheets.size === 0) return;
    setStep('creating');
    setError(null);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('sheets', [...selectedSheets].join(','));
    fd.append('name', projectName || file.name.replace(/\.[^.]+$/, ''));
    if (orgId) fd.append('orgId', orgId);
    try {
      const res = await fetch('/api/projects', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create project');
      router.push(`/projects/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
      setStep('sheets');
    }
  }

  const STEPS = [
    { key: 'drop', label: 'Upload' },
    { key: 'sheets', label: 'Select sheets' },
    { key: 'creating', label: 'Generating' },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-10 justify-center">
        {STEPS.map((s, i) => {
          const current = STEPS.findIndex(x => x.key === step);
          const done = current > i;
          const active = current === i;
          return (
            <React.Fragment key={s.key}>
              <div className={cn('flex items-center gap-2', active ? 'text-indigo-600' : done ? 'text-emerald-600' : 'text-slate-500')}>
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold border-2',
                  active ? 'border-indigo-600 bg-indigo-600 text-white' :
                  done ? 'border-emerald-500 bg-emerald-500 text-white' :
                  'border-slate-200 text-slate-400')}>
                  {done ? '✓' : i + 1}
                </div>
                <span className="text-[13px] font-medium hidden sm:block">{s.label}</span>
              </div>
              {i < 2 && <div className={cn('h-px w-10', done ? 'bg-emerald-400' : 'bg-slate-200')} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step 1 — Drop */}
      {step === 'drop' && (
        <div className="flex flex-col gap-4">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Upload your Excel file</h1>
            <p className="text-[14px] text-slate-500">We'll scan its sheets so you can choose which ones to include in your app.</p>
          </div>
          <div
            onClick={() => !uploading && inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              'border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all',
              dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50',
              uploading && 'opacity-60 pointer-events-none'
            )}>
            <input ref={inputRef} type="file" accept=".xlsx,.xlsm,.xls" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <svg className="w-10 h-10 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-[14px] text-slate-600 font-medium">Reading sheets…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-1">
                  <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                </div>
                <p className="text-[15px] font-medium text-slate-800">Drop your Excel file here</p>
                <p className="text-[13px] text-slate-400">or click to browse</p>
                <p className="text-[11px] text-slate-500 mt-1">.xlsx · .xlsm · .xls · up to 20 MB</p>
              </div>
            )}
          </div>
          {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-xl px-4 py-3">{error}</div>}
        </div>
      )}

      {/* Step 2 — Sheet selection */}
      {step === 'sheets' && (
        <div className="flex flex-col gap-5">
          <div className="text-center mb-1">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Which sheets to include?</h1>
            <p className="text-[14px] text-slate-500">
              All selected sheets become <strong className="text-slate-700">one unified app</strong> —
              navigate between them from the sidebar. Select all or just the ones you need.
            </p>
          </div>

          <div className="bg-white border border-black/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-slate-800 truncate">{file?.name}</div>
              <div className="text-[11px] text-slate-400">{sheets.length} sheet{sheets.length !== 1 ? 's' : ''} found</div>
            </div>
            <button onClick={() => { setStep('drop'); setFile(null); setSheets([]); }}
              className="text-[12px] text-slate-400 hover:text-slate-600">Change</button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-700">Available sheets</span>
            <div className="flex gap-3">
              <button onClick={() => setSelectedSheets(new Set(sheets.map(s => s.name)))}
                className="text-[12px] text-indigo-600 hover:underline">Select all</button>
              <button onClick={() => sheets.length > 0 && setSelectedSheets(new Set([sheets[0].name]))}
                className="text-[12px] text-slate-400 hover:underline">None</button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[40vh] overflow-y-auto pr-1">
            {sheets.map(sheet => {
              const selected = selectedSheets.has(sheet.name);
              return (
                <button key={sheet.name} onClick={() => toggleSheet(sheet.name)}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all',
                    selected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  )}>
                  <div className={cn('w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0',
                    selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300')}>
                    {selected && <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>}
                  </div>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    selected ? 'bg-indigo-100' : 'bg-slate-100')}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="12" height="12" rx="1.5" stroke={selected ? '#4F46E5' : '#94a3b8'} strokeWidth="1.3"/>
                      <path d="M1 5h12M1 9h12M5 5v7" stroke={selected ? '#4F46E5' : '#94a3b8'} strokeWidth="1.2"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[14px] font-semibold', selected ? 'text-indigo-900' : 'text-slate-800')}>{sheet.name}</div>
                    <div className="text-[12px] text-slate-400 mt-0.5">{sheet.rowCount} rows · {sheet.headers.length} columns</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {sheet.headers.slice(0, 5).join(' · ')}{sheet.headers.length > 5 && ` · +${sheet.headers.length - 5} more`}
                    </div>
                  </div>
                  {selected && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold">Included</span>}
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">Project name</label>
            <input value={projectName} onChange={e => setProjectName(e.target.value)}
              placeholder="e.g. Q2 Sprint Backlog"
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[14px] text-slate-900 bg-white outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"/>
          </div>

          {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-xl px-4 py-3">{error}</div>}

          <div className="flex gap-3">
            <button onClick={() => setStep('drop')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
              Back
            </button>
            <button onClick={createProject} disabled={selectedSheets.size === 0}
              className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2',
                selectedSheets.size > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>
              Create app with {selectedSheets.size} sheet{selectedSheets.size !== 1 ? 's' : ''}
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5h9M7 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Generating */}
      {step === 'creating' && (
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="w-16 h-16 relative">
            <svg className="w-16 h-16 text-indigo-100 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path d="M4 12a8 8 0 018-8" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Building your app…</h2>
            <p className="text-[14px] text-slate-500">Analysing columns, classifying domain, wiring up views</p>
          </div>
          <div className="flex flex-col gap-2 text-left w-56">
            {['Parsing selected sheets', 'Inferring column types', 'Classifying domain', 'Preparing views'].map((l, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[13px] text-slate-400">
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {l}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
