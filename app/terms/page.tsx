import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Sheetshift by Untable',
  description: 'Terms of Service for Sheetshift, a product of Untable.',
};

const EFFECTIVE_DATE = 'May 13, 2026';
const CONTACT_EMAIL  = 'legal@untable.com';
const COMPANY        = 'Untable';
const PRODUCT        = 'Sheetshift';
const SITE           = 'https://sheetshift.untable.com';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <header className="bg-white border-b border-black/[0.06] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 18 18" fill="none" className="w-5 h-5">
              <path d="M5 4l-3 5 3 5M13 4l3 5-3 5M11 3l-4 12" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-slate-900">{PRODUCT}</span>
        </Link>
        <div className="flex items-center gap-4 text-[13px] text-slate-500">
          <Link href="/privacy" className="hover:text-slate-800 transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-slate-800 transition-colors">← Back to app</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="text-[32px] font-bold text-slate-900 mb-3">Terms of Service</h1>
          <p className="text-[14px] text-slate-500">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-8 space-y-10 text-[14px] leading-relaxed text-slate-700">

          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using {PRODUCT} (&quot;the Service&quot;), a product of <strong>{COMPANY}</strong>,
              you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these
              Terms, do not use the Service.
            </p>
            <p className="mt-3">
              These Terms apply to all users, including organization owners and organization members.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              {PRODUCT} is a web-based platform that allows users to connect their Google Sheets
              and interact with their spreadsheet data through a structured, collaborative application
              interface. The Service enables:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-slate-600">
              <li>Viewing and editing Google Sheets data through a purpose-built UI</li>
              <li>Real-time bidirectional synchronization between {PRODUCT} and connected Google Sheets</li>
              <li>Collaborative access to sheet data within an organization</li>
              <li>Organization management with role-based access control</li>
            </ul>
          </Section>

          <Section title="3. Accounts and Authentication">
            <p>
              Access to {PRODUCT} requires signing in with a Google account. By signing in with
              Google, you authorize {PRODUCT} to access your Google account information (name, email,
              profile picture) as described in our{' '}
              <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>.
            </p>
            <p className="mt-3">
              You are responsible for all activity that occurs under your account. Notify us
              immediately at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 hover:underline">{CONTACT_EMAIL}</a>{' '}
              if you suspect unauthorized use of your account.
            </p>
          </Section>

          <Section title="4. Organizations and Google Sheets Access">
            <SubSection title="4.1 Organization Owners">
              <p>
                As an organization owner, you may connect Google Sheets from your Google account
                to your organization. By doing so, you grant {PRODUCT} permission to read and write
                to those specific sheets on your behalf, and to share the rendered data with members
                of your organization.
              </p>
              <p className="mt-3">
                You represent and warrant that you have the right to connect any Google Sheet you
                link to {PRODUCT}, and that sharing its data with your organization members does not
                violate any agreement, law, or third-party rights.
              </p>
            </SubSection>
            <SubSection title="4.2 Organization Members">
              <p>
                As an organization member, you may view and edit data in sheets connected by your
                organization owner. Your edits are written to the owner&apos;s Google Sheet using the
                owner&apos;s credentials. You agree to use this access responsibly and only for
                legitimate business purposes within your organization.
              </p>
            </SubSection>
            <SubSection title="4.3 Revoking Access">
              <p>
                You may revoke {PRODUCT}&apos;s access to your Google account at any time via your
                Google Account settings. Revoking access will disconnect all sheets and may disrupt
                service for members of your organizations.
              </p>
            </SubSection>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-slate-600">
              <li>Use the Service to access or share data you do not have rights to</li>
              <li>Attempt to reverse engineer, scrape, or extract data from the Service beyond normal use</li>
              <li>Use the Service in any way that violates applicable laws or regulations</li>
              <li>Introduce malware, viruses, or harmful code through the Service</li>
              <li>Impersonate another person or organization</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Attempt to circumvent or disable any security or access control features</li>
            </ul>
          </Section>

          <Section title="6. Data Ownership">
            <p>
              <strong>You own your data.</strong> {PRODUCT} does not claim any ownership over the content
              of your Google Sheets or any data you input through the Service. Your data remains
              yours and is governed by Google&apos;s Terms of Service with respect to Google Sheets.
            </p>
            <p className="mt-3">
              By using the Service, you grant {COMPANY} a limited, non-exclusive license to access,
              cache, and process your data solely for the purpose of providing and improving the Service.
            </p>
          </Section>

          <Section title="7. Service Availability">
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted access to
              the Service. We may perform maintenance, updates, or experience outages. We are not
              liable for any loss or damage caused by service unavailability.
            </p>
            <p className="mt-3">
              Real-time synchronization with Google Sheets depends on Google&apos;s APIs and infrastructure.
              {PRODUCT} is not responsible for sync failures or data discrepancies caused by
              Google API outages, rate limiting, or changes to Google&apos;s services.
            </p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              The {PRODUCT} platform, including its design, code, and branding, is the property
              of {COMPANY} and protected by applicable intellectual property laws. These Terms do
              not grant you any rights to use {COMPANY}&apos;s trademarks, logos, or branding.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              Either party may terminate use of the Service at any time. You may delete your account
              at any time from within the application. We may suspend or terminate your account if
              you violate these Terms.
            </p>
            <p className="mt-3">
              Upon termination, your right to use the Service ceases immediately. We will delete
              your data in accordance with our{' '}
              <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>.
            </p>
          </Section>

          <Section title="10. Disclaimer of Warranties">
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
              PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE,
              SECURE, OR UNINTERRUPTED.
            </p>
          </Section>

          <Section title="11. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY.toUpperCase()} SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
              LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE
              THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID
              US IN THE 12 MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
            </p>
          </Section>

          <Section title="12. Changes to These Terms">
            <p>
              We may update these Terms from time to time. We will notify you of material changes
              by posting the updated Terms at{' '}
              <a href={`${SITE}/terms`} className="text-indigo-600 hover:underline">{SITE}/terms</a>{' '}
              and, where appropriate, by email. Your continued use of the Service after changes
              take effect constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="13. Governing Law">
            <p>
              These Terms are governed by and construed in accordance with applicable law.
              Any disputes arising from these Terms or your use of the Service shall be resolved
              through good-faith negotiation. If negotiation fails, disputes shall be submitted
              to binding arbitration.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>Questions about these Terms should be sent to:</p>
            <div className="mt-4 bg-slate-50 rounded-xl p-4 text-[13px] space-y-1 text-slate-700">
              <p><strong>{COMPANY}</strong></p>
              <p>Product: {PRODUCT}</p>
              <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 hover:underline">{CONTACT_EMAIL}</a></p>
              <p>Website: <a href={SITE} className="text-indigo-600 hover:underline">{SITE}</a></p>
            </div>
          </Section>

        </div>

        <div className="mt-8 text-center text-[12px] text-slate-400">
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
          <span className="mx-3">·</span>
          <Link href="/" className="hover:text-slate-600 transition-colors">Back to {PRODUCT}</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[17px] font-semibold text-slate-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-[14px] font-semibold text-slate-800 mb-2">{title}</h3>
      {children}
    </div>
  );
}
