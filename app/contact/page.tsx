'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, Facebook, Instagram } from 'lucide-react';
import InfoPage, { InfoCard } from '@/components/layout/InfoPage';
import apiClient from '@/lib/apiClient';
import { SITE } from '@/lib/siteConfig';

const field =
  'w-full text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/30 focus:border-[#8b6f47]';
const label = 'block text-[10px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Please enter a valid email address.';
    if (form.subject.trim().length < 3) e.subject = 'Please add a short subject.';
    if (form.message.trim().length < 10) e.message = 'Message should be at least 10 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await apiClient.post('/contact', form);
      setDone(true);
      setForm({ name: '', email: '', subject: '', message: '', website: '' });
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Could not send your message. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const details = [
    { icon: Mail, label: 'Email', value: SITE.supportEmail, href: `mailto:${SITE.supportEmail}` },
    { icon: Phone, label: 'Phone', value: SITE.phone, href: `tel:${SITE.phone.replace(/[^+\d]/g, '')}` },
    { icon: MapPin, label: 'Address', value: SITE.address },
    { icon: Clock, label: 'Support hours', value: SITE.hours },
  ];

  return (
    <InfoPage
      eyebrow="We are here to help"
      title="Contact Us"
      intro="Order question, sizing advice or feedback? Send us a message and we will reply within one to two business days."
    >
      <div className="grid xl:grid-cols-5 gap-6">
        <InfoCard className="xl:col-span-3">
          {done ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-xl font-serif font-bold text-gray-900 dark:text-white">Message sent</h2>
              <p className="text-sm text-text-muted mt-2">Thank you for reaching out. We will get back to you by email soon.</p>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="mt-6 text-xs font-bold uppercase tracking-wider text-[#8b6f47] dark:text-[#c9a96b] hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-name" className={label}>Your name</label>
                  <input id="c-name" className={field} value={form.name} onChange={set('name')} maxLength={100} autoComplete="name" />
                  {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="c-email" className={label}>Email</label>
                  <input id="c-email" type="email" className={field} value={form.email} onChange={set('email')} maxLength={200} autoComplete="email" />
                  {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="c-subject" className={label}>Subject</label>
                <input id="c-subject" className={field} value={form.subject} onChange={set('subject')} maxLength={200} />
                {errors.subject && <p className="text-[11px] text-red-500 mt-1">{errors.subject}</p>}
              </div>
              <div>
                <label htmlFor="c-message" className={label}>Message</label>
                <textarea id="c-message" rows={6} className={field + ' resize-y'} value={form.message} onChange={set('message')} maxLength={5000} />
                {errors.message && <p className="text-[11px] text-red-500 mt-1">{errors.message}</p>}
              </div>
              {/* Honeypot: hidden from people, bots tend to fill it */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Website
                  <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
                </label>
              </div>
              {serverError && <p className="text-xs text-red-500 font-medium">{serverError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-[#8b6f47] dark:bg-[#c9a96b] text-white dark:text-gray-950 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#725a38] transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {submitting ? 'Sending...' : 'Send message'}
              </button>
            </form>
          )}
        </InfoCard>

        <InfoCard title="Reach us directly" className="xl:col-span-2 h-fit">
          <ul className="space-y-4">
            {details.map((d) => {
              const Icon = d.icon;
              return (
                <li key={d.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#8b6f47]/10 dark:bg-[#c9a96b]/10 text-[#8b6f47] dark:text-[#c9a96b] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{d.label}</p>
                    {d.href ? (
                      <a href={d.href} className="text-sm break-words hover:text-[#8b6f47] dark:hover:text-[#c9a96b]">{d.value}</a>
                    ) : (
                      <p className="text-sm break-words">{d.value}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-3 pt-2">
            <a href={SITE.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:text-[#8b6f47] dark:hover:text-[#c9a96b]">
              <Facebook className="w-4 h-4" />
            </a>
            <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:text-[#8b6f47] dark:hover:text-[#c9a96b]">
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </InfoCard>
      </div>
    </InfoPage>
  );
}
