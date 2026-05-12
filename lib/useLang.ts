'use client';
import { useEffect, useState, useCallback } from 'react';

export type Lang = 'en' | 'es';

const KEY = 'ss_lang';
const EVENT = 'ss-lang-change';

function getStored(): Lang {
  if (typeof window === 'undefined') return 'en';
  const v = localStorage.getItem(KEY);
  return v === 'es' ? 'es' : 'en';
}

export function useLang(): [Lang, () => void] {
  const [lang, setLang] = useState<Lang>('en');

  useEffect(() => {
    // Read on mount
    setLang(getStored());

    // Listen for changes from any other component on the same page
    const handler = () => setLang(getStored());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const toggle = useCallback(() => {
    const next = getStored() === 'en' ? 'es' : 'en';
    localStorage.setItem(KEY, next);
    // Notify all useLang consumers on this page
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [lang, toggle];
}

// ─── Shared translations ──────────────────────────────────────────────────────
export const T = {
  en: {
    login: 'Welcome back', loginSub: 'Sign in to your account',
    signup: 'Create account', signupSub: 'Free to start — no credit card needed',
    forgotPw: 'Recover password', forgotSub: "We'll send you a reset link",
    resetPw: 'New password', resetSub: 'Choose a secure password',
    email: 'Email address', password: 'Password', name: 'Full name',
    forgotLink: 'Forgot your password?',
    signIn: 'Sign in', signingIn: 'Signing in…',
    createAccount: 'Create account', creating: 'Creating account…',
    sendLink: 'Send reset link', sending: 'Sending…',
    save: 'Save new password', saving: 'Saving…',
    noAccount: "Don't have an account?", register: 'Sign up',
    hasAccount: 'Already have an account?', loginLink: 'Sign in',
    backToLogin: '← Back to sign in',
    checkEmail: 'Check your email',
    checkEmailSub: (email: string) => `We sent a reset link to ${email}`,
    minChars: 'Minimum 8 characters', confirmPw: 'Confirm password',
    pwMismatch: 'Passwords do not match.',
    pwShort: 'Password must be at least 8 characters.',
    orgsTitle: 'My organizations', orgsSub: "Each organization groups your team's projects.",
    newOrg: 'New organization',
    setupTitle: 'Set up your workspace',
    setupSub: "Organizations group your team's projects. Create one or join an existing one.",
    createOrg: 'Create new organization', createOrgSub: "I'm the admin and want to create a space for my team",
    joinOrg: 'Join an organization', joinOrgSub: 'I have an invite code from my team',
    orgNameLabel: 'Organization name', orgNamePlaceholder: 'My Company Inc.',
    creating2: 'Creating…', create: 'Create organization',
    inviteCode: 'Invite code',
    inviteCodeSub: 'Your org admin should have shared an 8-character code with you.',
    joining: 'Joining…', join: 'Join',
    signOut: 'Sign out',
    uploadExcel: 'Upload Excel', noProjects: 'No projects yet',
    noProjectsSub: 'Upload any Excel and Sheetshift turns it into a clean, organised internal app.',
    firstProject: 'Upload first Excel',
    inviteCodeLabel: 'Invite code:',
    back: '← My organizations',
  },
  es: {
    login: 'Bienvenido de vuelta', loginSub: 'Inicia sesión en tu cuenta',
    signup: 'Crear cuenta', signupSub: 'Empieza gratis — no necesitas tarjeta',
    forgotPw: 'Recuperar contraseña', forgotSub: 'Te enviaremos un enlace para restablecer tu contraseña',
    resetPw: 'Nueva contraseña', resetSub: 'Elige una contraseña segura para tu cuenta',
    email: 'Correo electrónico', password: 'Contraseña', name: 'Nombre completo',
    forgotLink: '¿Olvidaste tu contraseña?',
    signIn: 'Iniciar sesión', signingIn: 'Iniciando sesión…',
    createAccount: 'Crear cuenta', creating: 'Creando cuenta…',
    sendLink: 'Enviar enlace de recuperación', sending: 'Enviando…',
    save: 'Guardar nueva contraseña', saving: 'Guardando…',
    noAccount: '¿No tienes cuenta?', register: 'Regístrate',
    hasAccount: '¿Ya tienes cuenta?', loginLink: 'Iniciar sesión',
    backToLogin: '← Volver al inicio de sesión',
    checkEmail: 'Revisa tu correo',
    checkEmailSub: (email: string) => `Hemos enviado un enlace de recuperación a ${email}`,
    minChars: 'Mínimo 8 caracteres', confirmPw: 'Confirmar contraseña',
    pwMismatch: 'Las contraseñas no coinciden.',
    pwShort: 'La contraseña debe tener al menos 8 caracteres.',
    orgsTitle: 'Mis organizaciones', orgsSub: 'Cada organización agrupa los proyectos de tu equipo.',
    newOrg: 'Nueva organización',
    setupTitle: 'Configura tu espacio',
    setupSub: 'Las organizaciones agrupan los proyectos de tu equipo. Crea una nueva o únete a una existente.',
    createOrg: 'Crear nueva organización', createOrgSub: 'Soy el administrador y quiero crear un espacio para mi equipo',
    joinOrg: 'Unirme a una organización', joinOrgSub: 'Tengo un código de invitación de mi equipo',
    orgNameLabel: 'Nombre de la organización', orgNamePlaceholder: 'Mi empresa S.A.C.',
    creating2: 'Creando…', create: 'Crear organización',
    inviteCode: 'Código de invitación',
    inviteCodeSub: 'El administrador de tu organización debe haberte compartido un código de 8 caracteres.',
    joining: 'Uniéndome…', join: 'Unirme',
    signOut: 'Cerrar sesión',
    uploadExcel: 'Subir Excel', noProjects: 'Sin proyectos aún',
    noProjectsSub: 'Sube cualquier Excel y Sheetshift lo convierte en una app lista para usar por todo el equipo.',
    firstProject: 'Subir primer Excel',
    inviteCodeLabel: 'Código de invitación:',
    back: '← Mis organizaciones',
  },
} as const;
