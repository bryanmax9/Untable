'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SheetConnector } from '@/components/SheetConnector';

function ConnectContent() {
  const params  = useSearchParams();
  const orgId   = params.get('org') ?? undefined;
  const backHref = orgId ? `/org/${orgId}` : '/';

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <header className="bg-white border-b border-black/[0.06] px-6 py-4 flex items-center gap-4">
        <Link href={backHref} className="text-slate-400 hover:text-slate-700 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4">
              <path d="M5 4l-3 5 3 5M13 4l3 5-3 5M11 3l-4 12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[14px] font-semibold text-slate-900">Sheetshift</span>
        </div>
        <span className="text-slate-200">·</span>
        <span className="text-[14px] text-slate-500">Connect Google Sheet</span>
      </header>
      <SheetConnector orgId={orgId} />
    </div>
  );
}

export default function ConnectPage() {
  return <Suspense><ConnectContent /></Suspense>;
}
