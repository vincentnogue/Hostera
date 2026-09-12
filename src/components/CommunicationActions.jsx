import React from 'react';
import { Mail, MessageCircle, MessageSquareText, Phone } from 'lucide-react';

// Real, functional one-click communication — no fake "Send" buttons, no
// backend needed. Each button opens the actual channel pre-filled:
// mailto: opens the staff member's own email client (Gmail, Outlook,
// Apple Mail — whatever they have set as default), wa.me opens WhatsApp
// (app on mobile, WhatsApp Web on desktop) with the message drafted,
// sms: opens the default SMS app, tel: starts a call. These are standard
// URI schemes every OS/browser supports — genuinely functional today,
// with zero setup required, unlike the SMTP/WhatsApp Business API
// integrations in the Integration Hub (which enable Hostera to send
// automatically, server-side, once configured).
function digitsOnly(phone) {
  return (phone || '').replace(/[^\d+]/g, '').replace(/^00/, '+');
}

export default function CommunicationActions({ email, phone, guestName, propertyName, className = '' }) {
  const greeting = guestName ? `Hi ${guestName.split(' ')[0]},\n\n` : 'Hi,\n\n';
  const sign = propertyName ? `\n\nBest regards,\n${propertyName}` : '';
  const defaultMessage = `${greeting}${sign}`;
  const waNumber = digitsOnly(phone).replace('+', '');

  const actions = [
    email && {
      key: 'email',
      icon: Mail,
      label: 'Email',
      href: `mailto:${email}?subject=${encodeURIComponent(propertyName ? `Message from ${propertyName}` : 'Message')}&body=${encodeURIComponent(defaultMessage)}`,
      title: `Email ${email}`,
    },
    phone && {
      key: 'whatsapp',
      icon: MessageCircle,
      label: 'WhatsApp',
      href: `https://wa.me/${waNumber}?text=${encodeURIComponent(defaultMessage)}`,
      title: `WhatsApp ${phone}`,
    },
    phone && {
      key: 'sms',
      icon: MessageSquareText,
      label: 'SMS',
      href: `sms:${phone}${/iPhone|iPad|iPod/.test(navigator.userAgent) ? '&' : '?'}body=${encodeURIComponent(defaultMessage)}`,
      title: `Text ${phone}`,
    },
    phone && {
      key: 'call',
      icon: Phone,
      label: 'Call',
      href: `tel:${phone}`,
      title: `Call ${phone}`,
    },
  ].filter(Boolean);

  if (actions.length === 0) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {actions.map(a => (
        <a
          key={a.key}
          href={a.href}
          target={a.key === 'whatsapp' ? '_blank' : undefined}
          rel={a.key === 'whatsapp' ? 'noopener noreferrer' : undefined}
          title={a.title}
          onClick={e => e.stopPropagation()}
          className="w-8 h-8 rounded-full border border-brand-border flex items-center justify-center text-brand-slate hover:border-brand-navy hover:text-brand-navy hover:bg-brand-bg transition-colors"
        >
          <a.icon className="w-3.5 h-3.5" />
        </a>
      ))}
    </div>
  );
}
