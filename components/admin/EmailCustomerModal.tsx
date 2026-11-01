'use client';

import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { X, Mail, CheckCircle2, AlertTriangle, ExternalLink, Loader2, ChevronDown } from 'lucide-react';
import { errMsg } from './adminUtils';
import { AdminButton, Pill } from './AdminUI';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface SentEmail {
  id: string;
  subject: string;
  message: string;
  sentByName?: string;
  delivered: boolean;
  inApp: boolean;
  createdAt: string;
}

interface Template {
  id: string;
  label: string;
  subject: string;
  message: string;
}

interface Props {
  customer: Customer;
  /** When set, the email is about this order (templates, order summary and history use it) */
  order?: any;
  onClose: () => void;
}

const SIGN_OFF = '\n\nBest regards,\nThe SwiftCart team';
const labelClass = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const inputClass = 'w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100 dark:[color-scheme:dark]';
const money = (n: unknown) => `$${Number(n || 0).toFixed(2)}`;

// Ready-made messages; the email itself already starts with "Hi <name>,"
const buildTemplates = (order?: any): Template[] => {
  const list: Template[] = [{ id: 'custom', label: 'Write my own', subject: '', message: '' }];
  if (order) {
    const num = order.orderNumber || order.id;
    const status = String(order.orderStatus || 'Pending').toLowerCase();
    list.push({
      id: 'update',
      label: 'Order update',
      subject: `An update on your order ${num}`,
      message: `We wanted to give you a quick update: your order ${num} is currently ${status}.\n\nWe will let you know as soon as anything changes.${SIGN_OFF}`,
    });
    if (!['Delivered', 'Cancelled', 'Returned'].includes(order.orderStatus)) {
      list.push({
        id: 'delay',
        label: 'Delivery delay',
        subject: `Your order ${num} is running a little late`,
        message: `We're sorry, your order ${num} is taking longer than expected. Our courier now expects to deliver it within the next 2-3 business days.\n\nThank you for your patience.${SIGN_OFF}`,
      });
    }
    if (['bkash', 'card'].includes(order.paymentMethod) && ['Pending', 'Failed'].includes(order.paymentStatus) && !['Cancelled', 'Returned'].includes(order.orderStatus)) {
      list.push({
        id: 'payment',
        label: 'Payment reminder',
        subject: `Complete the payment for order ${num}`,
        message: `Your order ${num} is reserved, but the payment has not gone through yet. You can finish it from your Orders page with "Pay now". Unpaid online orders are released after a short time.${SIGN_OFF}`,
      });
    }
    if (order.returnRequest?.status === 'Approved') {
      list.push({
        id: 'pickup',
        label: 'Return pickup',
        subject: `Return pickup for order ${num}`,
        message: `Your return for order ${num} is approved. Please pack the items with their tags in the original packaging. Our courier will contact you to arrange the pickup.${SIGN_OFF}`,
      });
    }
    if (order.paymentStatus === 'Refunded') {
      list.push({
        id: 'refund',
        label: 'Refund sent',
        subject: `Your refund for order ${num}`,
        message: `We have sent your refund of ${money(order.refund?.amount ?? order.total)} for order ${num} to your original payment method. Card refunds can take 5-10 business days to appear on your statement.${SIGN_OFF}`,
      });
    }
  }
  list.push({
    id: 'thanks',
    label: 'Thank you',
    subject: 'Thank you for shopping with SwiftCart',
    message: `Thank you for being a SwiftCart customer. If there is anything we can help with, just reply to this email.${SIGN_OFF}`,
  });
  return list;
};

export default function EmailCustomerModal({ customer, order, onClose }: Props) {
  const toast = useToast();
  const templates = useMemo(() => buildTemplates(order), [order]);
  const [templateId, setTemplateId] = useState(order ? 'update' : 'custom');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeOrder, setIncludeOrder] = useState(Boolean(order));
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentEmail[]>([]);
  const [canEmail, setCanEmail] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const t = templates.find((x) => x.id === templateId);
    if (t) {
      setSubject(t.subject);
      setMessage(t.message);
    }
  }, [templateId, templates]);

  useEffect(() => {
    apiClient
      .get(`/admin/users/${customer.id}/emails`, { params: order ? { order: order.id } : {} })
      .then((res) => {
        setHistory(Array.isArray(res.data?.data) ? res.data.data : []);
        if (typeof res.data?.canEmailCustomers === 'boolean') setCanEmail(res.data.canEmailCustomers);
      })
      .catch(() => {});
  }, [customer.id, order]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3) return toast.error('Add a subject (at least 3 characters).');
    if (message.trim().length < 10) return toast.error('Write a message (at least 10 characters).');
    setSending(true);
    setPreviewUrl('');
    try {
      const res = await apiClient.post(`/admin/users/${customer.id}/email`, {
        subject,
        message,
        orderId: order?.id,
        includeOrder: Boolean(order) && includeOrder,
        notifyInApp,
      });
      const data = res.data?.data || {};
      if (data.delivered) toast.success(`Email sent to ${customer.email}.`);
      else toast.info(res.data?.message || 'The email was not delivered.');
      if (data.previewUrl) setPreviewUrl(data.previewUrl);
      if (data.email) setHistory((prev) => [data.email, ...prev]);
      setTemplateId('custom');
      setSubject('');
      setMessage('');
    } catch (err) {
      toast.error(errMsg(err, 'Could not send the email.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-customer-title"
        className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/[0.06] dark:hover:text-stone-200 cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <h3 id="email-customer-title" className="pr-8 text-base font-semibold text-stone-900 dark:text-white">Email customer</h3>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          To <span className="font-medium text-stone-800 dark:text-stone-200">{customer.name}</span> &lt;{customer.email}&gt;
          {order && <> &middot; about order <span className="font-mono text-xs">{order.orderNumber || order.id}</span></>}
        </p>

        {!canEmail && (
          <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>The shared demo admin cannot email real customers. Sign in with your own admin account to send emails.</span>
          </div>
        )}

        <form onSubmit={send} className="mt-5 space-y-4">
          <div>
            <label htmlFor="email-template" className={labelClass}>Template</label>
            <div className="relative">
              <select
                id="email-template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className={`${inputClass} h-9 cursor-pointer appearance-none pr-9`}
              >
                {templates.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            </div>
          </div>
          <div>
            <label htmlFor="email-subject" className={labelClass}>Subject</label>
            <input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={150}
              className={`${inputClass} h-9`}
              placeholder="What is this email about?"
            />
          </div>
          <div>
            <label htmlFor="email-message" className={labelClass}>Message</label>
            <textarea
              id="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              rows={7}
              className={`${inputClass} py-2 leading-relaxed`}
              placeholder="Write your message. A blank line starts a new paragraph."
            />
            <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">The email starts with &ldquo;Hi {customer.name.split(' ')[0] || customer.name},&rdquo; and uses the store&apos;s branded layout. Replies come back to the store inbox.</p>
          </div>

          <div className="flex flex-col gap-2 text-sm text-stone-700 dark:text-stone-300">
            {order && (
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={includeOrder} onChange={(e) => setIncludeOrder(e.target.checked)} className="size-4 accent-[#8b6f47]" />
                Include the order summary (items, totals, address)
              </label>
            )}
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={notifyInApp} onChange={(e) => setNotifyInApp(e.target.checked)} className="size-4 accent-[#8b6f47]" />
              Also show it in the customer&apos;s notifications
            </label>
          </div>

          {previewUrl && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
              <span>Sent to the free test inbox (no mail server is set up yet).</span>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 font-medium underline">
                Open the email <ExternalLink className="size-3.5" />
              </a>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <AdminButton onClick={onClose}>Close</AdminButton>
            <AdminButton type="submit" variant="primary" disabled={!canEmail || sending}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />} Send email
            </AdminButton>
          </div>
        </form>

        <div className="mt-6 border-t border-line pt-4">
          <h4 className="mb-3 text-sm font-semibold text-stone-900 dark:text-stone-100">
            {order ? 'Already sent about this order' : 'Already sent to this customer'}
          </h4>
          {history.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">Nothing yet.</p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {history.map((h) => (
                <li key={h.id} className="rounded-lg border border-line p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-stone-900 dark:text-stone-100">{h.subject}</span>
                    <Pill tone={h.delivered ? 'success' : 'warning'} className="shrink-0">
                      {h.delivered ? <CheckCircle2 className="size-3" /> : <AlertTriangle className="size-3" />}
                      {h.delivered ? 'Emailed' : h.inApp ? 'In-app only' : 'Not delivered'}
                    </Pill>
                  </div>
                  <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-stone-500 dark:text-stone-400">{h.message}</p>
                  <p className="mt-1 text-xs text-stone-400">{new Date(h.createdAt).toLocaleString()}{h.sentByName ? ` by ${h.sentByName}` : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
