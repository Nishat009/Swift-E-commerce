'use client';

import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import { X, Mail, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { errMsg } from './adminUtils';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-customer-title"
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-xl overflow-y-auto max-h-[92vh] shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
          <X className="w-4 h-4" />
        </button>

        <h3 id="email-customer-title" className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#8b6f47]" /> Email customer
        </h3>
        <p className="text-xs text-gray-500 mt-1 mb-4 border-b pb-3">
          To <strong className="text-gray-800 dark:text-gray-200">{customer.name}</strong> &lt;{customer.email}&gt;
          {order && <> &middot; about order <span className="font-mono">{order.orderNumber || order.id}</span></>}
        </p>

        {!canEmail && (
          <div className="mb-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 p-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>The shared demo admin cannot email real customers. Sign in with your own admin account to send emails.</span>
          </div>
        )}

        <form onSubmit={send} className="space-y-4">
          <div>
            <label htmlFor="email-template" className="block text-[10px] font-black text-gray-400 uppercase mb-1">Template</label>
            <select
              id="email-template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2.5"
            >
              {templates.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="email-subject" className="block text-[10px] font-black text-gray-400 uppercase mb-1">Subject</label>
            <input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={150}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2.5"
              placeholder="What is this email about?"
            />
          </div>
          <div>
            <label htmlFor="email-message" className="block text-[10px] font-black text-gray-400 uppercase mb-1">Message</label>
            <textarea
              id="email-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              rows={7}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg p-2.5 leading-relaxed"
              placeholder="Write your message. A blank line starts a new paragraph."
            />
            <p className="text-[10px] text-gray-400 mt-1">The email starts with &ldquo;Hi {customer.name.split(' ')[0] || customer.name},&rdquo; and uses the store&apos;s branded layout. Replies come back to the store inbox.</p>
          </div>

          <div className="flex flex-col gap-2 text-xs text-gray-700 dark:text-gray-300">
            {order && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={includeOrder} onChange={(e) => setIncludeOrder(e.target.checked)} className="accent-[#8b6f47]" />
                Include the order summary (items, totals, address)
              </label>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={notifyInApp} onChange={(e) => setNotifyInApp(e.target.checked)} className="accent-[#8b6f47]" />
              Also show it in the customer&apos;s notifications
            </label>
          </div>

          {previewUrl && (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900/40 p-3 text-xs text-green-800 dark:text-green-300">
              <span>Sent to the free test inbox (no mail server is set up yet).</span>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline flex items-center gap-1 shrink-0">
                Open the email <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-sm py-2 px-5 font-bold rounded-xl">Close</Button>
            <Button type="submit" loading={sending} disabled={!canEmail} className="text-sm py-2 px-5 font-bold rounded-xl bg-[#8b6f47] text-white flex items-center gap-1.5">
              <Mail className="w-4 h-4" /> Send email
            </Button>
          </div>
        </form>

        <div className="mt-6 border-t pt-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
            {order ? 'Already sent about this order' : 'Already sent to this customer'}
          </h4>
          {history.length === 0 ? (
            <p className="text-xs text-gray-400">Nothing yet.</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {history.map((h) => (
                <li key={h.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{h.subject}</span>
                    <span className={`shrink-0 flex items-center gap-1 text-[10px] font-bold ${h.delivered ? 'text-green-600' : 'text-amber-600'}`}>
                      {h.delivered ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {h.delivered ? 'Emailed' : h.inApp ? 'In-app only' : 'Not delivered'}
                    </span>
                  </div>
                  <p className="text-gray-500 line-clamp-2 mt-0.5 whitespace-pre-line">{h.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(h.createdAt).toLocaleString()}{h.sentByName ? ` by ${h.sentByName}` : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
