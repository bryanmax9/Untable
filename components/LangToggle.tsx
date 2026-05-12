'use client';
import { useLang } from '@/lib/useLang';

export function LangToggle() {
  const [lang, toggle] = useLang();
  const isEn = lang === 'en';

  return (
    <button
      onClick={toggle}
      title={isEn ? 'Switch to Spanish / Cambiar a español' : 'Switch to English'}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 11px 6px 8px',
        borderRadius: 999,
        background: '#fff',
        border: '1px solid rgba(15,23,42,0.15)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
        color: '#334155',
        letterSpacing: '0.03em',
        transition: 'box-shadow 0.15s, transform 0.1s',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      {/* Current language flag + label */}
      <span style={{ fontSize: 15, lineHeight: 1 }}>{isEn ? '🇺🇸' : '🇪🇸'}</span>
      <span>{isEn ? 'EN' : 'ES'}</span>
      {/* Divider */}
      <span style={{ opacity: 0.2, fontSize: 13, margin: '0 1px' }}>|</span>
      {/* Other language (click to switch to this) */}
      <span style={{ opacity: 0.45, fontSize: 11 }}>{isEn ? 'ES' : 'EN'}</span>
    </button>
  );
}
