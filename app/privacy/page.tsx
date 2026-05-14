import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Sheetshift by Untable',
  description: 'Privacy Policy for Sheetshift, a product of Untable.',
};

const EFFECTIVE_DATE = 'May 13, 2026';
const CONTACT_EMAIL  = 'privacy@untable.com';
const COMPANY        = 'Untable';
const PRODUCT        = 'Sheetshift';
const SITE           = 'https://sheetshift.untable.com';

export default function PrivacyPage() {
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
          <Link href="/terms" className="hover:text-slate-800 transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-slate-800 transition-colors">← Back to app</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-10">
          <h1 className="text-[32px] font-bold text-slate-900 mb-3">Privacy Policy</h1>
          <p className="text-[14px] text-slate-500">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 mb-10">
          <p className="text-[13px] text-indigo-800 leading-relaxed">
            <strong>Google API Disclosure:</strong> {PRODUCT}&apos;s use and transfer of information received from Google APIs
            adheres to the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy"
               target="_blank" rel="noopener noreferrer"
               className="underline hover:text-indigo-900">
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-8 space-y-10 text-[14px] leading-relaxed text-slate-700">

          <Section title="1. Who We Are">
            <p>
              {PRODUCT} is a product developed and operated by <strong>{COMPANY}</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
              We provide a platform that allows users to connect their Google Sheets and interact
              with their data through a structured, collaborative web application.
            </p>
            <p className="mt-3">
              If you have questions about this policy, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <SubSection title="2.1 Google Account Information">
              <p>
                When you sign in with Google, we receive your name, email address, and profile picture
                from your Google account. We use this information solely to identify you within {PRODUCT}
                and to display your name and avatar to your organization members.
              </p>
            </SubSection>
            <SubSection title="2.2 Google Sheets Data">
              <p>
                If you are an organization owner, you may connect your Google Sheets to {PRODUCT}.
                When you do, we access the content of those sheets — including cell values, column
                headers, and sheet structure — solely to render your data inside the {PRODUCT}
                interface and to synchronize changes you or your team make through the app back to
                your spreadsheet.
              </p>
              <p className="mt-3">
                We access only the specific spreadsheets you explicitly select and connect. We do
                not scan, index, or access any other files in your Google Drive.
              </p>
            </SubSection>
            <SubSection title="2.3 Usage Data">
              <p>
                We collect standard server logs (IP address, browser type, pages visited, timestamps)
                to operate and secure the service. We do not use this data for advertising or sell
                it to third parties.
              </p>
            </SubSection>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect exclusively to:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-slate-600">
              <li>Authenticate you and manage your account</li>
              <li>Display your Google Sheets data inside the {PRODUCT} interface</li>
              <li>Synchronize changes made in the app back to your connected Google Sheets</li>
              <li>Synchronize changes made in your Google Sheets to the app in real time</li>
              <li>Manage your organization, members, and access controls</li>
              <li>Send transactional communications (e.g., account or sync error notifications)</li>
              <li>Improve the reliability and performance of the service</li>
            </ul>
            <p className="mt-4 font-medium text-slate-800">
              We do not use your Google account data or Google Sheets data for advertising,
              marketing profiling, or any purpose beyond operating the {PRODUCT} service you requested.
            </p>
          </Section>

          <Section title="4. Google API Limited Use Disclosure">
            <p>
              {PRODUCT}&apos;s access to Google user data is limited to the practices described in this
              policy. Specifically:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-slate-600">
              <li>We only request the Google API scopes necessary to provide the service</li>
              <li>We do not transfer Google user data to third parties except as necessary to provide the service</li>
              <li>We do not use Google user data for serving advertisements</li>
              <li>We do not allow humans to read your Google data unless you explicitly grant permission,
                  it is necessary for security purposes, or required by law</li>
            </ul>
            <p className="mt-4">
              The Google API scopes we request are:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600 font-mono text-[13px]">
              <li>email — to identify your account</li>
              <li>profile — to display your name and photo</li>
              <li>https://www.googleapis.com/auth/spreadsheets — to read and write connected sheets</li>
              <li>https://www.googleapis.com/auth/drive.readonly — to list and select sheets from your Drive</li>
            </ul>
          </Section>

          <Section title="5. Data Storage and Security">
            <p>
              Your data is stored in secure cloud infrastructure provided by Supabase (PostgreSQL
              database hosted on AWS). Google OAuth tokens are stored encrypted at rest using
              AES-256 encryption. We apply row-level security to ensure users can only access
              data belonging to their organization.
            </p>
            <p className="mt-3">
              Google Sheets content is cached in our database to provide fast rendering and
              offline resilience. This cached data is kept in sync with your live Google Sheet
              and is deleted when you disconnect the sheet or delete your account.
            </p>
          </Section>

          <Section title="6. Data Sharing">
            <p>We do not sell, rent, or trade your personal information. We share data only:</p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-slate-600">
              <li><strong>With your organization members</strong> — members of an organization you own or belong
                to can see the data in the sheets connected to that organization, as rendered by {PRODUCT}</li>
              <li><strong>With infrastructure providers</strong> — Supabase (database), Vercel (hosting),
                Google (authentication and Sheets API). Each provider has their own privacy policy and
                processes only the data necessary to deliver their service</li>
              <li><strong>When required by law</strong> — if compelled by valid legal process</li>
            </ul>
          </Section>

          <Section title="7. Data Retention and Deletion">
            <p>
              We retain your data for as long as your account is active. You can:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-slate-600">
              <li>Disconnect a Google Sheet at any time — removes the cached sheet data from our database</li>
              <li>Delete a project — removes all associated data including cached records</li>
              <li>Delete your account — permanently removes your account, all organizations you own,
                and all associated data within 30 days</li>
            </ul>
            <p className="mt-3">
              You may also revoke {PRODUCT}&apos;s access to your Google account at any time via
              your Google Account settings at{' '}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer"
                 className="text-indigo-600 hover:underline">
                myaccount.google.com/permissions
              </a>.
              Revoking access will disconnect all sheets linked to your organizations.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              {PRODUCT} is not directed at children under the age of 13. We do not knowingly collect
              personal information from children. If you believe a child has provided us with personal
              information, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 hover:underline">{CONTACT_EMAIL}</a>{' '}
              and we will delete it promptly.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this policy from time to time. We will notify users of material changes
              by posting the new policy at <a href={`${SITE}/privacy`} className="text-indigo-600 hover:underline">{SITE}/privacy</a> and,
              where appropriate, by email. Your continued use of {PRODUCT} after changes take effect
              constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or your
              personal data, please contact:
            </p>
            <div className="mt-4 bg-slate-50 rounded-xl p-4 text-[13px] space-y-1 text-slate-700">
              <p><strong>{COMPANY}</strong></p>
              <p>Product: {PRODUCT}</p>
              <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 hover:underline">{CONTACT_EMAIL}</a></p>
              <p>Website: <a href={SITE} className="text-indigo-600 hover:underline">{SITE}</a></p>
            </div>
          </Section>

        </div>

        <div className="mt-8 text-center text-[12px] text-slate-400">
          <Link href="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
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
