'use client';
import React, { useRef, useState, useCallback } from 'react';
import { processExcelFile } from '@/lib/pipeline';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

export function UploadPage() {
  const { setConfig, setProcessing, setError, isProcessing, error } = useAppStore();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xlsm|xls)$/i)) {
      setError('Sube un archivo .xlsx, .xlsm o .xls');
      return;
    }
    setProcessing(true);
    try {
      const config = await processExcelFile(file);
      setConfig(config, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar el archivo');
    }
  }, [setConfig, setProcessing, setError]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col">
      {/* Header */}
      <header className="px-8 py-5 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 18 18" fill="none" className="w-5 h-5">
            <path d="M5 4l-3 5 3 5M13 4l3 5-3 5M11 3l-4 12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-[15px] font-semibold text-slate-900">Sheetshift</span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="max-w-2xl w-full text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-[12px] font-medium px-3 py-1 rounded-full mb-5 border border-indigo-100">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Código-first · Sin IA en el proceso · 100% determinístico
          </div>
          <h1 className="text-4xl font-semibold text-slate-900 leading-tight mb-4">
            Tu Excel, convertido en<br />una app interna en segundos
          </h1>
          <p className="text-[16px] text-slate-500 leading-relaxed">
            Sube un archivo .xlsx y Sheetshift lo clasifica, infiere el esquema y genera<br />
            una interfaz profesional adaptada a tu flujo de trabajo.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => !isProcessing && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all',
            dragOver
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50',
            isProcessing && 'opacity-60 pointer-events-none'
          )}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xlsm,.xls" className="hidden" onChange={onInputChange} />

          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <svg className="w-10 h-10 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <div className="text-[14px] font-medium text-slate-700">Analizando tu archivo…</div>
              <div className="text-[12px] text-slate-400">Infiriendo esquema y clasificando dominio</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16V4M6 10l6-6 6 6M4 20h16"/>
              </svg>
              <div className="text-[15px] font-medium text-slate-800">Arrastra tu archivo Excel aquí</div>
              <div className="text-[13px] text-slate-400">o haz clic para seleccionarlo</div>
              <div className="text-[11px] text-slate-300 mt-1">.xlsx · .xlsm · .xls</div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 max-w-lg w-full bg-rose-50 border border-rose-200 text-rose-700 text-[13px] rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Features */}
        <div className="mt-14 grid grid-cols-3 gap-6 max-w-2xl w-full">
          {[
            { emoji: '⚡', title: 'Instantáneo', desc: 'Clasificación y renderizado en menos de 2 segundos' },
            { emoji: '🎯', title: 'Reconocimiento de dominio', desc: 'Detecta sprint backlogs, legales, inventario y más' },
            { emoji: '🔒', title: 'Sin IA en el proceso', desc: 'Lógica determinística — sin costos variables ni caja negra' },
          ].map(f => (
            <div key={f.title} className="text-center">
              <div className="text-2xl mb-2">{f.emoji}</div>
              <div className="text-[13px] font-semibold text-slate-800 mb-1">{f.title}</div>
              <div className="text-[12px] text-slate-500 leading-snug">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
