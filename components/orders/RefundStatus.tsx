'use client';

import React from 'react';
import { Check, Clock, X } from 'lucide-react';
import { Order } from '@/types';

type StepState = 'done' | 'current' | 'upcoming' | 'failed';
interface Step {
  label: string;
  detail?: string;
  date?: string;
  state: StepState;
}

const METHOD_TEXT: Record<string, string> = { card: 'card', bkash: 'bKash account', cod: 'chosen refund method (we will contact you)' };

// Return and refund progress for one order, as a small vertical timeline
export function refundSteps(order: Order): Step[] {
  const steps: Step[] = [];
  const rr = order.returnRequest;
  const method = METHOD_TEXT[order.paymentMethod] || 'original payment method';

  if (rr?.status) {
    steps.push({ label: 'Return requested', detail: `${rr.reason}${rr.details ? ` - "${rr.details}"` : ''}`, date: rr.requestedAt, state: 'done' });
    const offer = rr.proposal?.amount !== undefined ? `$${Number(rr.proposal.amount).toFixed(2)}` : '';
    if (rr.status === 'Requested') {
      steps.push({ label: 'Under review', detail: 'We usually reply within 2 business days.', state: 'current' });
      if (order.paymentStatus === 'Paid') steps.push({ label: 'Refund offer', detail: 'You accept the amount before anything is paid.', state: 'upcoming' });
    }
    if (rr.status === 'Proposed') {
      steps.push({ label: `Refund offered: ${offer}`, detail: rr.response || 'Accept or decline the offer above.', date: rr.proposal?.proposedAt, state: 'current' });
    }
    if (rr.status === 'Declined') {
      steps.push({ label: `You declined ${offer}`, detail: rr.proposal?.customerNote, date: rr.proposal?.respondedAt, state: 'done' });
      steps.push({ label: 'Back with our team', detail: 'We will send a new offer or get in touch.', state: 'current' });
    }
    if (rr.status === 'Accepted') {
      steps.push({ label: `Offer accepted: ${offer}`, date: rr.proposal?.respondedAt, state: 'done' });
      steps.push({ label: 'Refund being sent', detail: rr.response || 'Pack the items with their tags. Our courier will collect them.', state: 'current' });
    }
    if (rr.status === 'Rejected') steps.push({ label: 'Return not approved', detail: rr.response, date: rr.decidedAt, state: 'failed' });
    if (rr.status === 'Approved') {
      steps.push({ label: 'Return approved', detail: rr.response || 'Pack the items with their tags. Our courier will collect them.', date: rr.decidedAt, state: 'done' });
    }
  } else if (order.paymentStatus === 'Refund Needed' || order.paymentStatus === 'Refunded') {
    steps.push({ label: order.orderStatus === 'Returned' ? 'Order returned' : 'Order cancelled', state: 'done' });
  }

  if (order.paymentStatus === 'Refund Needed') {
    steps.push({ label: 'Refund in progress', detail: `$${order.total.toFixed(2)} will go back to your ${method}.`, state: 'current' });
  } else if (order.paymentStatus === 'Refunded') {
    const amount = Number(order.refund?.amount ?? order.total);
    steps.push({
      label: `Refunded $${amount.toFixed(2)}`,
      detail: order.paymentMethod === 'card' ? 'Card refunds can take 5-10 business days to show on your statement.' : `Sent to your ${method}.`,
      date: order.refund?.at,
      state: 'done',
    });
  }
  return steps;
}

const DOT: Record<StepState, string> = {
  done: 'bg-[#8b6f47] border-[#8b6f47] text-white',
  current: 'bg-amber-50 border-amber-400 text-amber-600 dark:bg-amber-950/30',
  upcoming: 'bg-white border-gray-200 text-gray-300 dark:bg-gray-900 dark:border-gray-700',
  failed: 'bg-red-50 border-red-400 text-red-600 dark:bg-red-950/30',
};

export default function RefundStatus({ order }: { order: Order }) {
  const steps = refundSteps(order);
  if (!steps.length) return null;
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/20 p-4">
      <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Return &amp; refund</h5>
      <ol className="space-y-0">
        {steps.map((step, i) => (
          <li key={`${step.label}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && <span className="absolute left-[11px] top-6 bottom-0 w-px bg-gray-200 dark:bg-gray-700" aria-hidden />}
            <span className={`relative z-10 mt-0.5 w-6 h-6 shrink-0 rounded-full border flex items-center justify-center ${DOT[step.state]}`}>
              {step.state === 'done' && <Check className="w-3.5 h-3.5" />}
              {step.state === 'current' && <Clock className="w-3.5 h-3.5" />}
              {step.state === 'failed' && <X className="w-3.5 h-3.5" />}
            </span>
            <div className="min-w-0 text-xs">
              <p className={`font-bold ${step.state === 'upcoming' ? 'text-gray-400' : step.state === 'failed' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {step.label}
                {step.date && <span className="ml-2 font-normal text-[10px] text-gray-400">{new Date(step.date).toLocaleDateString()}</span>}
              </p>
              {step.detail && <p className="text-gray-500 dark:text-gray-400 leading-snug mt-0.5 break-words">{step.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
