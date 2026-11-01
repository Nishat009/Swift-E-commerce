'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Order, User } from '@/types';
import { Eye, Mail, Trash2, X, Users, Loader2, ShoppingBag, Heart, Clock } from 'lucide-react';
import EmailCustomerModal from './EmailCustomerModal';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { AdminButton, AdminEmpty, Pill, SearchField, StatusPill, table } from './AdminUI';

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
        <SearchField
          value={userSearch}
          onChange={setUserSearch}
          placeholder="Search by name or email"
          className="w-full sm:w-80"
        />

        <div className={`${table.wrap} max-h-[640px] overflow-y-auto`}>
          <table className={table.table}>
            <thead className={`${table.thead} sticky top-0 z-10`}>
              <tr>
                <th className={table.th}>Name</th>
                <th className={table.th}>Email</th>
                <th className={table.th}>Role</th>
                <th className={table.th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className={table.tbody}>
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <AdminEmpty icon={Users} title="No accounts found" description={userSearch ? 'Try a different search.' : 'New sign-ups will appear here.'} />
                  </td>
                </tr>
              )}
              {filteredUsers.map((u) => (
                <tr key={u.id} className={table.tr}>
                  <td className={`${table.td} font-medium text-stone-900 dark:text-stone-100`}>{u.name}</td>
                  <td className={`${table.td} text-stone-600 dark:text-stone-300`}>{u.email}</td>
                  <td className={table.td}>
                    <Pill tone={u.role === 'admin' ? 'accent' : 'neutral'}>{u.role === 'admin' ? 'Admin' : 'Customer'}</Pill>
                  </td>
                  <td className={table.td}>
                    <div className="flex items-center gap-1.5">
                      <AdminButton size="sm" onClick={() => handleInspectUserSession(u)} title="See their cart, wishlist and orders">
                        <Eye className="size-3.5" /> Inspect
                      </AdminButton>
                      <AdminButton size="sm" onClick={() => setEmailingUser(u)}>
                        <Mail className="size-3.5" /> Email
                      </AdminButton>
                      {u.id !== user?.id ? (
                        <>
                          <AdminButton size="sm" onClick={() => handleToggleUserRole(u)}>
                            {u.role === 'admin' ? 'Revoke admin' : 'Grant admin'}
                          </AdminButton>
                          {u.role !== 'admin' && (
                            <AdminButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(u.id!)}
                              className="w-8 px-0 text-stone-500 hover:bg-red-50 hover:text-red-600 dark:text-stone-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                              title="Delete user account"
                              aria-label={`Delete ${u.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </AdminButton>
                          )}
                        </>
                      ) : (
                        <span className="px-1 text-xs text-stone-400">Your account</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-stone-500">Showing {filteredUsers.length} of {allUsers.length} accounts</p>
      </div>

      {emailingUser && (
        <EmailCustomerModal
          customer={{ id: emailingUser.id, name: emailingUser.name, email: emailingUser.email }}
          onClose={() => setEmailingUser(null)}
        />
      )}

      {showInspectModal && selectedInspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="inspect-title" className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowInspectModal(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/[0.06] dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="size-4" />
            </button>

            <h3 id="inspect-title" className="pr-8 text-base font-semibold text-stone-900 dark:text-white">{selectedInspectUser.name}</h3>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">{selectedInspectUser.email} · cart, wishlist and orders</p>

            {loadingInspect ? (
              <div className="flex items-center justify-center gap-2 py-20 text-sm text-stone-500 dark:text-stone-400">
                <Loader2 className="size-4 animate-spin" /> Loading session data...
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <section className="rounded-lg border border-line p-4">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                      <ShoppingBag className="size-4 text-stone-400" /> Cart
                    </h4>
                    {!inspectCart || inspectCart.products.length === 0 ? (
                      <p className="text-sm text-stone-500 dark:text-stone-400">The cart is empty.</p>
                    ) : (
                      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                        {inspectCart.products.map((item: any) => (
                          <div key={item._id || item.id} className="flex items-center justify-between gap-3 rounded-md bg-stone-50 px-3 py-2 dark:bg-white/[0.04]">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-200">{item.product?.title}</p>
                              <p className="text-xs text-stone-400">{item.product?.brand}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-medium tabular-nums text-stone-900 dark:text-white">${item.product?.price}</p>
                              <p className="text-xs tabular-nums text-stone-400">Qty {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        <div className="mt-2 flex justify-between border-t border-line pt-2 text-sm font-semibold text-stone-900 dark:text-white">
                          <span>Total value</span>
                          <span className="tabular-nums">${inspectCart.subtotal || 0}</span>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="rounded-lg border border-line p-4">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                      <Heart className="size-4 text-stone-400" /> Wishlist
                    </h4>
                    {!inspectWishlist || inspectWishlist.products.length === 0 ? (
                      <p className="text-sm text-stone-500 dark:text-stone-400">The wishlist is empty.</p>
                    ) : (
                      <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1">
                        {inspectWishlist.products.map((item: any) => (
                          <div key={item._id || item.id} className="rounded-md bg-stone-50 px-3 py-2 dark:bg-white/[0.04]">
                            <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-200" title={item.title}>{item.title}</p>
                            <p className="mt-0.5 text-xs tabular-nums text-stone-500 dark:text-stone-400">${item.price}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <section className="rounded-lg border border-line p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                    <Clock className="size-4 text-stone-400" /> Orders
                    {inspectOrders.length > 0 && <span className="text-xs font-normal tabular-nums text-stone-400">{inspectOrders.length}</span>}
                  </h4>
                  {inspectOrders.length === 0 ? (
                    <p className="text-sm text-stone-500 dark:text-stone-400">No orders placed yet.</p>
                  ) : (
                    <ul className="max-h-[400px] divide-y divide-line overflow-y-auto pr-1">
                      {inspectOrders.map((o) => (
                        <li key={o.id} className="py-2.5 first:pt-0 last:pb-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate font-mono text-xs font-medium text-stone-800 dark:text-stone-200">{o.orderNumber || o.id}</span>
                            <span className="shrink-0 text-sm font-medium tabular-nums text-stone-900 dark:text-white">${o.total.toFixed(2)}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <span className="text-xs text-stone-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                            <StatusPill status={o.orderStatus} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
