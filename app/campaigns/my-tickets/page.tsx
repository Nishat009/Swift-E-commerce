'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, Ticket, Award, RefreshCw, ChevronLeft, Calendar, FileText, X, Printer } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import Button from '@/components/ui/Button';

interface Campaign {
  id: string;
  title: string;
  prizeName: string;
  productTitle?: string;
  productPrice?: number;
  status: 'active' | 'sold-out' | 'completed';
  winnerUser?: {
    id: string;
    name: string;
  };
}

interface TicketRecord {
  id: string;
  ticketNumber: string;
  campaign: Campaign;
  status: 'active' | 'won' | 'lost';
  createdAt: string;
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketInvoice, setSelectedTicketInvoice] = useState<TicketRecord | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/campaigns/my-tickets');
      if (res.data?.success) {
        setTickets(res.data.data);
      } else {
        setError('Failed to fetch ticket entries.');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Connection to backend failed or user unauthorized.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 gap-3">
        <RefreshCw className="w-10 h-10 animate-spin text-[#8b6f47]" />
        <span className="text-sm font-semibold tracking-wider font-serif">Loading Ticket Registers...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      <div className="flex items-center gap-4 mb-4">
        <Link href="/campaigns" className="p-2 bg-white dark:bg-gray-900 border rounded-full hover:bg-gray-55 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900 dark:text-[#f5f1eb]">My Draw Tickets</h1>
          <p className="text-xs text-gray-500 mt-1">Review all your lucky draw entries and active statuses.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-750 dark:text-red-400 rounded-2xl flex items-center gap-3 border border-red-200">
          <Gift className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold">{error}</span>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="p-16 text-center border border-dashed rounded-[32px] text-gray-500 bg-white dark:bg-gray-850 shadow-sm">
          <Ticket className="w-16 h-16 mx-auto text-gray-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">No Tickets Issued Yet</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
            You haven't participated in any active draw campaigns yet. Earn free entry tickets by checking out draw campaign items.
          </p>
          <Link href="/campaigns" className="block mt-6">
            <Button className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-6 py-2 border-0">
              Browse Active Drawings
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-850 rounded-[32px] border border-gray-150/40 dark:border-gray-900 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] border-b dark:border-gray-900">
                <tr>
                  <th className="p-4">Ticket Code</th>
                  <th className="p-4">Campaign Target</th>
                  <th className="p-4">Purchased Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-900">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-55/40 dark:hover:bg-gray-900/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-[#8b6f47] dark:text-[#c9a96b] text-xs">
                      {t.ticketNumber}
                    </td>
                    <td className="p-4">
                      <span className="block font-bold text-gray-800 dark:text-gray-200">{t.campaign?.prizeName || 'Unknown Campaign'}</span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">{t.campaign?.title}</span>
                    </td>
                    <td className="p-4 text-gray-550 flex items-center gap-1.5 mt-1.5 border-0">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        t.status === 'won' ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-750 dark:text-yellow-400 border border-yellow-300/30' :
                        t.status === 'lost' ? 'bg-gray-105 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border dark:border-gray-800' :
                        'bg-blue-50 dark:bg-blue-950/20 text-blue-750 dark:text-blue-400 border border-blue-300/30'
                      }`}>
                        {t.status === 'won' && <Award className="w-3 h-3" />}
                        {t.status === 'won' ? 'Winner 🏆' : t.status === 'lost' ? 'Unsuccessful' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedTicketInvoice(t)}
                        className="text-[10px] font-bold text-[#8b6f47] dark:text-[#c9a96b] hover:underline flex items-center gap-1 justify-end ml-auto"
                      >
                        <FileText className="w-3 h-3" /> View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DIGITAL INVOICE MODAL POPUP */}
      {selectedTicketInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-[28px] w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            
            <button
              onClick={() => setSelectedTicketInvoice(null)}
              className="absolute top-4 right-4 p-2 bg-gray-55 dark:bg-gray-950 text-gray-400 hover:text-gray-700 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6">
              {/* Receipt Header */}
              <div className="text-center pb-4 border-b dark:border-gray-800">
                <span className="text-xs font-serif font-black text-[#8b6f47] dark:text-[#c9a96b] tracking-widest uppercase">
                  SwiftCart Invoice
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">Transaction Receipt</h3>
                <span className="text-[9px] text-gray-400 font-mono block mt-1">Receipt ID: INV-{selectedTicketInvoice.ticketNumber.substring(10)}</span>
              </div>

              {/* Invoice Specs */}
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Campaign Prize:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-250">{selectedTicketInvoice.campaign?.prizeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Purchased Item:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-250">{selectedTicketInvoice.campaign?.productTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ticket Serial:</span>
                  <span className="font-mono font-bold text-[#8b6f47] dark:text-[#c9a96b]">{selectedTicketInvoice.ticketNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Purchase Date:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-250">
                    {new Date(selectedTicketInvoice.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Status:</span>
                  <span className="font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-200/20 uppercase tracking-widest text-[9px]">
                    Paid
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Method Code:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-250 uppercase font-mono">SIMULATED_WALLET</span>
                </div>

                <hr className="my-3 dark:border-gray-800" />

                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-800 dark:text-white">Amount Charged:</span>
                  <span className="font-serif font-black text-[#8b6f47] dark:text-[#c9a96b]">
                    ${(selectedTicketInvoice.campaign?.productPrice ?? 15).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t dark:border-gray-800">
                <Button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </Button>
                <button
                  onClick={() => setSelectedTicketInvoice(null)}
                  className="flex-1 text-xs font-bold py-2.5 rounded-full border border-gray-250 hover:bg-gray-55"
                >
                  Close Receipt
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
