'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DriveFile  { id: string; name: string; modifiedTime: string; webViewLink: string; }
interface SheetTab   { title: string; sheetId: number; rowCount: number; columnCount: number; }
type Step = 'sheets' | 'tabs' | 'creating';

export function SheetConnector({ orgId }: { orgId?: string }) {
  const router = useRouter();
  const [step, setStep]                   = useState<Step>('sheets');
  const [files, setFiles]                 = useState<DriveFile[]>([]);
  const [loadingFiles, setLoadingFiles]   = useState(true);
  const [filesError, setFilesError]       = useState<string | null>(null);
  const [selected, setSelected]           = useState<DriveFile | null>(null);
  const [tabs, setTabs]                   = useState<SheetTab[]>([]);
  const [loadingTabs, setLoadingTabs]     = useState(false);
  const [selectedTab, setSelectedTab]     = useState<SheetTab | null>(null);
  const [projectName, setProjectName]     = useState('');
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/google/sheets')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setFilesError(data.error); setLoadingFiles(false); return; }
        setFiles(Array.isArray(data) ? data : []);
        setLoadingFiles(false);
      })
      .catch(e => { setFilesError(String(e)); setLoadingFiles(false); });
  }, []);

  const selectFile = useCallback(async (file: DriveFile) => {
    setSelected(file);
    setLoadingTabs(true);
    setTabs([]);
    setSelectedTab(null);
    setProjectName(file.name);
    try {
      const res  = await fetch(`/api/google/sheets/${file.id}/tabs`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTabs(data);
      if (data.length === 1) setSelectedTab(data[0]);
      setStep('tabs');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingTabs(false);
    }
  }, []);

  async function connect() {
    if (!selected || !selectedTab) return;
    setStep('creating');
    setError(null);
    try {
      const res = await fetch('/api/projects/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetId: selected.id,
          tabName:       selectedTab.title,
          projectName:   projectName || selected.name,
          orgId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to connect sheet');
      router.push(`/projects/${data.id}`);
    } catch (e) {
      setError(String(e));
      setStep('tabs');
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Steps */}
      <div className="flex items-center gap-2 mb-10 justify-center">
        {(['sheets', 'tabs', 'creating'] as Step[]).map((s, i) => {
          const labels = ['Select sheet', 'Select tab', 'Connecting'];
          const current = ['sheets', 'tabs', 'creating'].indexOf(step);
          const done   = current > i;
          const active = current === i;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={cn('flex items-center gap-2', active ? 'text-indigo-600' : done ? 'text-emerald-600' : 'text-slate-400')}>
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold border-2',
                  active ? 'border-indigo-600 bg-indigo-600 text-white' :
                  done   ? 'border-emerald-500 bg-emerald-500 text-white' :
                           'border-slate-200 text-slate-400')}>
                  {done ? '✓' : i + 1}
                </div>
                <span className="text-[13px] font-medium hidden sm:block">{labels[i]}</span>
              </div>
              {i < 2 && <div className={cn('h-px w-10', done ? 'bg-emerald-400' : 'bg-slate-200')} />}
            </div>
          );
        })}
      </div>

      {/* Step 1 — Pick spreadsheet */}
      {step === 'sheets' && (
        <div className="flex flex-col gap-4">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Select a Google Sheet</h1>
            <p className="text-[14px] text-slate-500">Choose from your Google Drive. Only spreadsheets are shown.</p>
          </div>

          {loadingFiles && (
            <div className="flex flex-col gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-black/[0.06] p-4 animate-pulse flex gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex-shrink-0"/>
                  <div className="flex-1"><div className="h-4 bg-slate-100 rounded w-1/2 mb-2"/><div className="h-3 bg-slate-100 rounded w-1/4"/></div>
                </div>
              ))}
            </div>
          )}

          {filesError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-xl px-4 py-3">
              {filesError}
            </div>
          )}

          {!loadingFiles && !filesError && files.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-[14px]">
              No spreadsheets found in your Google Drive.
            </div>
          )}

          {!loadingFiles && files.map(file => (
            <button key={file.id} onClick={() => selectFile(file)} disabled={loadingTabs}
              className="flex items-center gap-4 bg-white rounded-xl border border-black/[0.06] p-4 hover:border-indigo-300 hover:shadow-sm transition-all text-left disabled:opacity-60">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" fill="#34A853" opacity=".15"/>
                  <path d="M8 9h8M8 12h8M8 15h5" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-slate-900 truncate">{file.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Modified {new Date(file.modifiedTime).toLocaleDateString()}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-300 flex-shrink-0">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          ))}

          {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-xl px-4 py-3">{error}</div>}
        </div>
      )}

      {/* Step 2 — Pick tab + name */}
      {step === 'tabs' && selected && (
        <div className="flex flex-col gap-5">
          <div className="text-center mb-1">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Select a tab</h1>
            <p className="text-[14px] text-slate-500">Pick which tab to connect as your app.</p>
          </div>

          <div className="bg-white border border-black/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" fill="#34A853" opacity=".15"/>
                <path d="M8 9h8M8 12h8M8 15h5" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-slate-800 truncate">{selected.name}</div>
              <div className="text-[11px] text-slate-400">{tabs.length} tab{tabs.length !== 1 ? 's' : ''}</div>
            </div>
            <button onClick={() => setStep('sheets')} className="text-[12px] text-slate-400 hover:text-slate-600">Change</button>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[35vh] overflow-y-auto pr-1">
            {tabs.map(tab => {
              const sel = selectedTab?.title === tab.title;
              return (
                <button key={tab.title} onClick={() => setSelectedTab(tab)}
                  className={cn('flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all',
                    sel ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300')}>
                  <div className={cn('w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0',
                    sel ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300')}>
                    {sel && <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>}
                  </div>
                  <div>
                    <div className={cn('text-[14px] font-semibold', sel ? 'text-indigo-900' : 'text-slate-800')}>{tab.title}</div>
                    <div className="text-[12px] text-slate-400 mt-0.5">{tab.rowCount} rows · {tab.columnCount} columns</div>
                  </div>
                  {sel && <span className="ml-auto text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-semibold">Selected</span>}
                </button>
              );
            })}
          </div>

          <div>
            <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">Project name</label>
            <input value={projectName} onChange={e => setProjectName(e.target.value)}
              placeholder={selected.name}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[14px] text-slate-900 bg-white outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"/>
          </div>

          {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-xl px-4 py-3">{error}</div>}

          <div className="flex gap-3">
            <button onClick={() => setStep('sheets')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50">
              Back
            </button>
            <button onClick={connect} disabled={!selectedTab}
              className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2',
                selectedTab ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed')}>
              Connect sheet
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 6.5h9M7 2.5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Creating */}
      {step === 'creating' && (
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="w-16 h-16 relative">
            <svg className="w-16 h-16 text-indigo-100 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path d="M4 12a8 8 0 018-8" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Connecting your sheet…</h2>
            <p className="text-[14px] text-slate-500">Reading data, classifying columns, building your app</p>
          </div>
          <div className="flex flex-col gap-2 text-left w-56">
            {['Reading sheet data', 'Inferring column types', 'Classifying domain', 'Preparing views'].map((l, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[13px] text-slate-400">
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
