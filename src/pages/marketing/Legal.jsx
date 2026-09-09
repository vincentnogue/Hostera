import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/marketing/Reveal';
import { Shield, ArrowLeft } from 'lucide-react';

const DOCS = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'This policy explains how Hostera — developed by Liafrik — collects, uses and protects information when you use the platform.',
    sections: [
      { h: 'Information we collect', p: 'Account information (name, email), property configuration, reservation and guest data you enter, and technical logs (audit events, security events) required to operate the platform.' },
      { h: 'How we use information', p: 'To provide and maintain the service, authenticate users, process reservations and billing within the platform, communicate operational notifications, and improve the product. We do not sell personal data.' },
      { h: 'Data isolation', p: 'Hostera is a multi-tenant platform. Your organization\'s data — including guest profiles and financial records — is scoped to your organization and is never exposed to other organizations.' },
      { h: 'Guest data', p: 'Guest data entered by hotels belongs to the hotels that entered it. Hostera processes it solely to provide the service. Marketing consent and communication preferences are respected.' },
      { h: 'Retention & deletion', p: 'Data retention periods are configurable per property, considering regional and financial requirements. Organizations may request export or deletion of their data.' },
      { h: 'Your rights', p: 'Depending on your jurisdiction, you may have rights of access, correction, export and deletion. Requests can be made through your organization administrator or via liafrik.com.' },
      { h: 'Contact', p: 'For privacy questions, contact the Liafrik team through the official website: liafrik.com.' },
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro: 'These terms govern the use of the Hostera platform, developed and operated by Liafrik.',
    sections: [
      { h: 'The service', p: 'Hostera is a SaaS hospitality operating system. Hotels and property organizations subscribe to plans (Starter, Professional, Business, Enterprise). Guest-facing experiences are provided free of charge to guests.' },
      { h: 'Accounts & eligibility', p: 'You must provide accurate information when creating an account. You are responsible for the activity of users you invite and the roles you assign them.' },
      { h: 'Acceptable use', p: 'You agree not to misuse the platform, attempt to access other organizations\' data, reverse engineer the service, or use it in violation of applicable laws.' },
      { h: 'Subscriptions & billing', p: 'Subscriptions are billed monthly or annually at the published plan rates. Trials are provided without charge. Plan changes take effect as described on the pricing page. No hidden service fees apply.' },
      { h: 'Data & content', p: 'You retain ownership of the data you enter. You grant Hostera the limited right to process that data to provide the service.' },
      { h: 'Service availability', p: 'We aim for high availability and publish incidents on the status page. The service is provided without warranty of uninterrupted operation; scheduled maintenance is announced in advance.' },
      { h: 'Termination', p: 'You may cancel your subscription at any time. We may suspend accounts for non-payment, policy violations or security incidents, with notice where appropriate.' },
      { h: 'Contact', p: 'Questions about these terms can be directed to Liafrik via liafrik.com.' },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    intro: 'This policy explains how Hostera uses cookies and similar technologies.',
    sections: [
      { h: 'Essential cookies', p: 'Required for authentication, session security and core platform functionality. These cannot be disabled while using the product.' },
      { h: 'Preference cookies', p: 'Store choices such as selected property, language preferences and interface settings to improve your experience.' },
      { h: 'Analytics', p: 'We use aggregated, privacy-conscious analytics to understand feature usage and improve the product. Data is used in a de-identified form.' },
      { h: 'Managing cookies', p: 'You can clear or block cookies through your browser settings. Blocking essential cookies will prevent sign-in and core functionality.' },
      { h: 'Contact', p: 'For questions about this policy, contact Liafrik via liafrik.com.' },
    ],
  },
  'data-processing': {
    title: 'Data Processing Terms',
    intro: 'These terms describe how data is processed within the Hostera platform, developed by Liafrik.',
    sections: [
      { h: 'Roles', p: 'For hotel data (including guest records), the subscribing organization acts as the data controller and Liafrik acts as the processor, providing the Hostera platform.' },
      { h: 'Processing scope', p: 'Data is processed only to provide, maintain and secure the service: PMS operations, billing, notifications, analytics and support.' },
      { h: 'Security measures', p: 'Processing is protected by the security architecture described on our security page: tenant isolation, role-based access control, audit logging and secure session management.' },
      { h: 'Sub-processors', p: 'Infrastructure and service providers used to operate the platform are bound by confidentiality and security obligations. A current list is available on request via liafrik.com.' },
      { h: 'International transfers', p: 'The platform is designed for global use. Where data is transferred internationally, appropriate safeguards are applied in line with applicable frameworks.' },
      { h: 'Assistance', p: 'Liafrik assists organizations with data subject requests, exports and deletion through platform features and support channels.' },
    ],
  },
  accessibility: {
    title: 'Accessibility',
    intro: 'Hostera is committed to building a platform that hospitality teams of all abilities can use.',
    sections: [
      { h: 'Our approach', p: 'Hostera follows modern accessibility principles: keyboard navigation, visible focus states, semantic markup, sufficient color contrast and accessible forms, tables and dialogs.' },
      { h: 'RTL support', p: 'The platform supports right-to-left layouts, including full RTL for Arabic — one of our seven launch languages.' },
      { h: 'Responsive design', p: 'Interfaces are built desktop-first for staff dashboards and mobile-first for guest experiences, housekeeping and maintenance tools.' },
      { h: 'Continuous improvement', p: 'Accessibility is treated as an ongoing practice. If you encounter a barrier while using Hostera, report it to the Liafrik team via liafrik.com.' },
    ],
  },
};

export default function Legal({ doc = 'privacy' }) {
  const d = DOCS[doc] || DOCS.privacy;
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="bg-[#0A1E30] py-14">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-white/50" />
              <span className="text-xs text-white/40 uppercase tracking-widest font-semibold">Legal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{d.title}</h1>
            <p className="text-sm text-white/50 mt-3">Last updated: September 2026</p>
          </Reveal>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <p className="text-[15px] text-[#64748B] leading-relaxed mb-10">{d.intro}</p>
            <div className="space-y-8">
              {d.sections.map((s, i) => (
                <div key={s.h}>
                  <h2 className="text-lg font-bold text-[#17212B] mb-2.5">{i + 1}. {s.h}</h2>
                  <p className="text-sm text-[#64748B] leading-relaxed">{s.p}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 p-6 rounded-2xl bg-[#F6F8FB] border border-[#E2E8F0]">
              <p className="text-xs text-[#64748B] leading-relaxed">
                Hostera is developed by{' '}
                <a href="https://liafrik.com" target="_blank" rel="noopener noreferrer" className="text-[#123B63] font-semibold hover:underline">Liafrik</a>.
                These documents describe the platform&apos;s policies and practices; they are not legal advice, and
                compliance with your local regulations depends on your configuration and obligations.
              </p>
              <Link to="/" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[#123B63] hover:text-[#1F5A8A]">
                <ArrowLeft className="w-4 h-4" /> Back to home
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}