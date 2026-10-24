'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Order, User } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Search, Mail, Trash2, X, Users, RefreshCw, ShoppingBag, Heart, Clock } from 'lucide-react';
import EmailCustomerModal from './EmailCustomerModal';
import { SectionLoading, useSectionLoad } from './AdminSection';

/** Registered accounts: roles, delete, email a customer and inspect their cart, wishlist and orders. */
export default function UsersAdmin() {
  const { user } = useAuth();
  const toast = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [emailingUser, setEmailingUser] = useState<User | null>(null);

  // User Session Inspection states
  const [selectedInspectUser, setSelectedInspectUser] = useState<User | null>(null);
  const [inspectCart, setInspectCart] = useState<any | null>(null);
  const [inspectWishlist, setInspectWishlist] = useState<any | null>(null);
  const [inspectOrders, setInspectOrders] = useState<Order[]>([]);
  const [loadingInspect, setLoadingInspect] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);

  const loading = useSectionLoad(async () => {
    const res = await apiClient.get('/admin/users');
    if (res.data?.success) setAllUsers(res.data.data);
  });

  const handleInspectUserSession = async (targetUser: User) => {
    setSelectedInspectUser(targetUser);
    setLoadingInspect(true);
    setShowInspectModal(true);
    setInspectCart(null);
    setInspectWishlist(null);
    setInspectOrders([]);
    try {
      const [cartRes, wishlistRes, ordersRes] = await Promise.all([
        apiClient.get(`/admin/users/${targetUser.id}/cart`),
        apiClient.get(`/admin/users/${targetUser.id}/wishlist`),
        apiClient.get('/orders/admin/all?limit=500')
      ]);

      if (cartRes.data?.success) {
        setInspectCart(cartRes.data.data);
      }
      if (wishlistRes.data?.success) {
        setInspectWishlist(wishlistRes.data.data);
      }

      const userOrders = ((ordersRes.data?.data || []) as Order[]).filter((o) => {
        const oUser = o.user as any;
        return oUser && (oUser._id === targetUser.id || oUser.id === targetUser.id);
      });
      setInspectOrders(userOrders);
    } catch (err) {
      console.error('Error inspecting user session:', err);
      toast.error('Failed to load user session data.');
    } finally {
      setLoadingInspect(false);
    }
  };

  // --- USER ROLE ACTIONS ---
  const handleToggleUserRole = async (targetUser: User) => {
    const newRole = targetUser.role === 'admin' ? 'customer' : 'admin';
    if (targetUser.id === user?.id) {
      toast.error('You cannot change your own role.');
      return;
    }
    if (!confirm(`${newRole === 'admin' ? 'Grant admin access to' : 'Remove admin access from'} ${targetUser.email}?`)) return;
    try {
      const res = await apiClient.put(`/admin/users/${targetUser.id}/role`, { role: newRole });
      if (res.data?.success) {
        setAllUsers(allUsers.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)));
        toast.success(`User role updated to "${newRole}".`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user account? Their cart, wishlist, notifications and stock alerts are removed; past orders stay in the records. This cannot be undone.')) return;
    try {
      const res = await apiClient.delete(`/admin/users/${userId}`);
      if (res.data?.success) {
        setAllUsers(allUsers.filter((u) => u.id !== userId));
        toast.success('User account deleted.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  if (loading) return <SectionLoading />;

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <>
      <div className="space-y-4">
        <div className="border-b pb-3.5 mb-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Registered Accounts</h2>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search accounts by name or email address..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full text-sm pl-8"
          />
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto border rounded-2xl max-h-[500px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px] sticky top-0 z-10">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Access Level</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="p-3 font-bold text-gray-800 dark:text-gray-200">{u.name}</td>
                  <td className="p-3 font-mono">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-right flex justify-end gap-2 items-center">
                    <Button
                      onClick={() => handleInspectUserSession(u)}
                      variant="outline"
                      size="sm"
                      className="text-[9px] py-1 px-2 font-bold rounded-lg border-gray-200 hover:bg-gray-55 flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" /> Inspect Session
                    </Button>
                    <Button
                      onClick={() => setEmailingUser(u)}
                      variant="outline"
                      size="sm"
                      className="text-[9px] py-1 px-2 font-bold rounded-lg border-gray-200 hover:bg-gray-55 flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" /> Email
                    </Button>
                    {u.id !== user?.id ? (
                      <>
                        <Button
                          onClick={() => handleToggleUserRole(u)}
                          variant="outline"
                          size="sm"
                          className="text-[9px] py-1 px-2 font-bold rounded-lg border-gray-200 hover:bg-gray-55"
                        >
                          {u.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}
                        </Button>
                        {u.role !== 'admin' && (
                          <button onClick={() => handleDeleteUser(u.id!)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete User Account">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-[9px] font-bold text-gray-400 px-2">You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {emailingUser && (
        <EmailCustomerModal
          customer={{ id: emailingUser.id, name: emailingUser.name, email: emailingUser.email }}
          onClose={() => setEmailingUser(null)}
        />
      )}

      {showInspectModal && selectedInspectUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-3xl overflow-y-auto max-h-[85vh] shadow-2xl p-6 relative">
            <button onClick={() => setShowInspectModal(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 border-b pb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#8b6f47] dark:text-[#c9a96b]" /> Inspect Session: {selectedInspectUser.name}
            </h3>

            {loadingInspect ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#8b6f47]" />
                <span className="text-sm font-semibold text-gray-400">Loading user session data...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Active Cart & Wishlist */}
                <div className="space-y-6">
                  {/* 1. Active Cart Card */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-[#8b6f47]" /> Active Shopping Cart
                    </h4>
                    {!inspectCart || inspectCart.products.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">No items currently in cart.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {inspectCart.products.map((item: any) => (
                          <div key={item._id || item.id} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 font-medium">
                            <div className="truncate max-w-[150px] text-left">
                              <p className="font-bold text-gray-800 dark:text-gray-250 truncate">{item.product?.title}</p>
                              <p className="text-[10px] text-gray-400">{item.product?.brand}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#8b6f47]">${item.product?.price}</p>
                              <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2 flex justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                          <span>Total Value:</span>
                          <span className="text-[#8b6f47]">${inspectCart.subtotal || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Wishlist Card */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-red-500" /> Current Wishlist Choice
                    </h4>
                    {!inspectWishlist || inspectWishlist.products.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">No items currently in wishlist.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {inspectWishlist.products.map((item: any) => (
                          <div key={item._id || item.id} className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-[10px] text-left font-medium">
                            <p className="font-bold text-gray-800 dark:text-gray-250 truncate" title={item.title}>{item.title}</p>
                            <p className="font-bold text-[#8b6f47] mt-0.5">${item.price}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Customer Orders history */}
                <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-500" /> Placed Orders History
                  </h4>
                  {inspectOrders.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">No order placements recorded.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                      {inspectOrders.map((o) => (
                        <div key={o.id} className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px] space-y-1">
                          <div className="flex justify-between font-mono text-[9px] text-gray-400 border-b pb-1 dark:border-gray-800">
                            <span>#{o.id}</span>
                            <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold pt-1">
                            <span className="text-[#8b6f47] dark:text-[#c9a96b]">${o.total.toFixed(0)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] ${
                              o.orderStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                              o.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>{o.orderStatus}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
