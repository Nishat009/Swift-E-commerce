'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Facebook, Instagram } from 'lucide-react';
import Button from '@/components/ui/Button';
import InfoPage, { InfoCard } from '@/components/layout/InfoPage';
import apiClient from '@/lib/apiClient';
import { SITE } from '@/lib/siteConfig';

const field =
  'h-11 w-full rounded-md border border-line bg-transparent px-3.5 text-sm text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none';
const label = 'block text-xs font-medium text-stone-600 dark:text-stone-300 mb-1.5';

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
  ].filter((d) => d.value); // only details the shop owner has configured
  const socials = [
    { href: SITE.social.facebook, label: 'Facebook', icon: Facebook },
    { href: SITE.social.instagram, label: 'Instagram', icon: Instagram },
  ].filter((s) => s.href);

  return (
    <InfoPage
      eyebrow="We are here to help"
      title="Contact Us"
      intro="Order question, sizing advice or feedback? Send us a message and we will reply within one to two business days."
    >
      <div className="grid xl:grid-cols-5 gap-x-12 gap-y-4">
        <InfoCard className="xl:col-span-3 border-b-0 xl:pt-0">
          {done ? (
            <div className="py-8">
              <h2 className="text-2xl font-serif font-medium tracking-tight text-ink">Message sent</h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">Thank you for reaching out. We will get back to you by email soon.</p>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="mt-6 text-sm text-ink underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600 hover:decoration-ink"
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
                  {errors.name && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="c-email" className={label}>Email</label>
                  <input id="c-email" type="email" className={field} value={form.email} onChange={set('email')} maxLength={200} autoComplete="email" />
                  {errors.email && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="c-subject" className={label}>Subject</label>
                <input id="c-subject" className={field} value={form.subject} onChange={set('subject')} maxLength={200} />
                {errors.subject && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.subject}</p>}
              </div>
              <div>
                <label htmlFor="c-message" className={label}>Message</label>
                <textarea id="c-message" rows={6} className={field + ' h-auto py-3 resize-y'} value={form.message} onChange={set('message')} maxLength={5000} />
                {errors.message && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.message}</p>}
              </div>
              {/* Honeypot: hidden from people, bots tend to fill it */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Website
                  <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
                </label>
              </div>
              {serverError && <p className="text-xs text-red-600 dark:text-red-400">{serverError}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send message'}
              </Button>
            </form>
          )}
        </InfoCard>

        <InfoCard title="Reach us directly" className="xl:col-span-2 h-fit border-b-0 xl:pt-0">
          <ul className="space-y-4">
            {details.map((d) => {
              const Icon = d.icon;
              return (
                <li key={d.label} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 mt-1 text-stone-400 flex-shrink-0" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500 dark:text-stone-400">{d.label}</p>
                    {d.href ? (
                      <a href={d.href} className="text-sm break-words hover:underline underline-offset-4">{d.value}</a>
                    ) : (
                      <p className="text-sm break-words">{d.value}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {socials.length > 0 && (
            <div className="flex items-center gap-3 pt-2">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="p-2 rounded-full border border-line hover:border-ink transition-colors">
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          )}
        </InfoCard>
      </div>
    </InfoPage>
  );
}
