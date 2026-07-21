'use client';

import React, { useState, useEffect } from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/lib/apiClient';
import { Order } from '@/types';
import { OrderSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Button from '@/components/ui/Button';
import {
  Package,
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  Clock,
  ShieldCheck,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  
  // Modals / Cancel states
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Selected Order for Timeline
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/orders');
      if (response.data?.success) {
        setOrders(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load order history.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return;
    setIsCancelling(true);
    try {
      const response = await apiClient.put(`/orders/${cancellingOrderId}/cancel`);
      if (response.data?.success) {
        toast.success('Order cancelled successfully.');
        setOrders(orders.map((o) => (o.id === cancellingOrderId ? { ...o, orderStatus: 'Cancelled' } : o)));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
      setCancellingOrderId(null);
    }
  };

  // Generate a mock PDF download
  const handleDownloadInvoice = (order: Order) => {
    toast.info(`Generating invoice PDF for Order #${order.orderNumber || order.id.slice(-8).toUpperCase()}...`);
    setTimeout(() => {
      const number = order.orderNumber || order.id.slice(-8).toUpperCase();
      const docHtml = `
        SwiftCart E-commerce Platform Invoice
        Order Number: #${number}
        Date: ${new Date(order.createdAt).toLocaleDateString()}
        Total Paid: $${order.total.toFixed(2)}
        Payment Method: ${order.paymentMethod.toUpperCase()}
      `;
      const blob = new Blob([docHtml], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Invoice_${number}.txt`;
      link.click();
      toast.success('Invoice downloaded successfully!');
    }, 1500);
  };

  const statusStyles = {
    Delivered: 'bg-green-150 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400',
    Shipped: 'bg-blue-150 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400',
    Processing: 'bg-purple-150 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900/30 dark:text-purple-400',
    Cancelled: 'bg-red-150 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400',
    Pending: 'bg-yellow-150 border-yellow-200 text-yellow-700 dark:bg-yellow-950/20 dark:border-yellow-900/30 dark:text-yellow-400',
  };

  return (
    <AccountLayout activeTabName="/orders">
      <div className="space-y-6">
        
        {/* Title */}
        <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider">
            Order History
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Check the status of your orders, trace shipment timelines, or print invoices.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <OrderSkeleton />
            <OrderSkeleton />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders found"
            description="You have not placed any orders yet. Explore our products and place your first order!"
            actionText="Browse Products"
            actionLink="/products"
          />
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = order.orderStatus || 'Pending';
              const isExpanded = expandedOrderId === order.id;
              const formattedDate = new Date(order.createdAt).toLocaleDateString();
              const itemsCount = order.products ? order.products.reduce((acc, p) => acc + p.quantity, 0) : 0;
              const isCancellable = status === 'Pending' || status === 'Confirmed' || status === 'Processing';

              // Timeline milestones
              const steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
              const currentStepIndex = steps.indexOf(status);

              return (
                <div
                  key={order.id}
                  className="border border-gray-150/40 dark:border-gray-800/80 rounded-[32px] bg-white dark:bg-gray-900 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
                >
                  {/* Summary Bar */}
                  <div className="p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50 dark:bg-gray-850/30 border-b border-gray-100 dark:border-gray-800">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                          Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
                          {status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-text-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Placed on {formattedDate}</span>
                        </div>
                        <span>•</span>
                        <span>{itemsCount} item{itemsCount > 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span className="font-bold text-gray-900 dark:text-white">Total: ${order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="rounded-full text-[10px] font-black px-4 flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-850"
                      >
                        {isExpanded ? 'Hide Details' : 'Track Order'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(order)}
                        className="rounded-full text-[10px] font-black px-4 flex items-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-850"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Invoice
                      </Button>
                      {isCancellable && (
                        <Button
                          size="sm"
                          onClick={() => setCancellingOrderId(order.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 rounded-full text-[10px] font-black px-4 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Tracker & Products Details */}
                  {isExpanded && (
                    <div className="p-6 space-y-6 border-t border-gray-100 dark:border-gray-800 animate-slide-down">
                      {/* Live Tracking Timeline */}
                      {status !== 'Cancelled' && (
                        <div className="space-y-4 max-w-xl mx-auto py-2">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mb-6">Delivery Progress</h5>
                          <div className="flex items-center justify-between relative">
                            {/* Connector Bar */}
                            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 dark:bg-gray-800 z-0" />
                            <div
                              className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-[#8b6f47] to-[#c9a96b] z-0 transition-all duration-500"
                              style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                            />

                            {steps.map((step, idx) => {
                              const isCompleted = idx <= currentStepIndex;
                              const isActive = idx === currentStepIndex;
                              
                              return (
                                <div key={step} className="flex flex-col items-center z-10 relative">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center border text-[10px] font-bold transition-all ${
                                      isCompleted
                                        ? 'bg-[#8b6f47] border-[#8b6f47] text-white'
                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'
                                    } ${isActive ? 'ring-4 ring-[#8b6f47]/20 scale-115' : ''}`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <span className={`text-[9px] font-black uppercase tracking-wider mt-2.5 ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Products List */}
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-text-muted border-b pb-1">
                          Items In This Shipment
                        </h5>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                          {order.products?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4">
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 bg-gray-50 dark:bg-gray-950 rounded-xl overflow-hidden border">
                                  <img src={item.product?.thumbnail} alt={item.product?.title} className="object-cover w-full h-full" />
                                </div>
                                <div>
                                  <h6 className="text-xs font-bold text-gray-950 dark:text-white">
                                    {item.product?.title}
                                  </h6>
                                  <p className="text-[10px] text-text-muted mt-0.5">
                                    Qty: {item.quantity} × ${item.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-gray-950 dark:text-white">
                                ${(item.quantity * item.price).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Address / Cost Breakdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-[11px] leading-relaxed text-text-muted">
                        <div>
                          <h6 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">Shipping Destination</h6>
                          {order.shippingAddress ? (
                            <p>
                              {order.shippingAddress.street}<br />
                              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
                              {order.shippingAddress.country}
                            </p>
                          ) : (
                            <p>No address info.</p>
                          )}
                        </div>
                        <div className="bg-gray-50/50 dark:bg-gray-850/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/50 space-y-1.5">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">${(order.subtotal || (order.total * 0.9)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax (10%):</span>
                            <span className="font-semibold text-gray-900 dark:text-white">${(order.tax || (order.total * 0.09)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shipping fee:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">${(order.shipping || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pt-1.5 border-t border-gray-250/20 font-bold text-gray-950 dark:text-white text-xs">
                            <span>Grand Total:</span>
                            <span className="text-[#8b6f47] dark:text-[#c9a96b]">${order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={cancellingOrderId !== null}
        onClose={() => setCancellingOrderId(null)}
        onConfirm={handleCancelOrder}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This will release reserved stock back to the store and trigger a refund. This action is irreversible."
        confirmText="Cancel Order"
        variant="danger"
        isLoading={isCancelling}
      />
    </AccountLayout>
  );
}
