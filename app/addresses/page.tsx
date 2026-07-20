'use client';

import React, { useState } from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/lib/apiClient';
import { Address } from '@/types';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import EmptyState from '@/components/ui/EmptyState';
import { MapPin, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';

export default function AddressesPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const savedAddresses = user?.addresses || [];

  // Modal control states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<(Address & { _id?: string; id?: string }) | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    isDefault: false
  });
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      isDefault: savedAddresses.length === 0 // Force first address to default
    });
    setIsFormOpen(true);
  };

  const openEditModal = (addr: Address & { _id?: string; id?: string }) => {
    setEditingAddress(addr);
    setFormData({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country || 'United States',
      isDefault: !!addr.isDefault
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAddress) {
        // Update existing address
        const addrId = editingAddress._id || editingAddress.id;
        const res = await apiClient.put(`/auth/addresses/${addrId}`, formData);
        if (res.data?.success) {
          toast.success('Address updated successfully.');
        }
      } else {
        // Add new address
        const res = await apiClient.post('/auth/addresses', formData);
        if (res.data?.success) {
          toast.success('New address added.');
        }
      }
      setIsFormOpen(false);
      await refreshUser();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAddressId) return;
    setSubmitting(true);
    try {
      const res = await apiClient.delete(`/auth/addresses/${deletingAddressId}`);
      if (res.data?.success) {
        toast.success('Address deleted successfully.');
        setIsDeleteOpen(false);
        setDeletingAddressId(null);
        await refreshUser();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete address.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountLayout activeTabName="/addresses">
      <div className="space-y-6">
        
        {/* Title */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold font-serif text-gray-900 dark:text-white uppercase tracking-wider">
              Saved Addresses
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Add or edit shipping addresses for faster checkout deliveries.
            </p>
          </div>
          <Button
            onClick={openAddModal}
            className="bg-[#8b6f47] hover:bg-[#725a38] text-white rounded-full font-bold px-5 py-2 border-0 shadow-md flex items-center gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Address
          </Button>
        </div>

        {/* Addresses List */}
        {savedAddresses.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No saved addresses"
            description="You don't have any saved shipping addresses yet. Add one to complete checkouts faster."
            actionText="Add New Address"
            onAction={openAddModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedAddresses.map((addr: any, idx: number) => (
              <div
                key={addr._id || addr.id || idx}
                className={`border rounded-[28px] p-5 sm:p-6 bg-white dark:bg-gray-900 transition-all duration-300 relative flex flex-col justify-between group ${
                  addr.isDefault
                    ? 'border-[#8b6f47] dark:border-[#c9a96b] shadow-xs'
                    : 'border-gray-150/40 dark:border-gray-850 hover:shadow-xs hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="font-serif font-bold text-sm text-gray-900 dark:text-white">
                      Address {idx + 1}
                    </span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-black uppercase tracking-wider">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                    {addr.street} <br />
                    {addr.city}, {addr.state} {addr.zipCode} <br />
                    {addr.country}
                  </p>
                </div>

                {/* Actions row */}
                <div className="mt-6 pt-3 border-t border-gray-100 dark:border-gray-850 flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(addr)}
                    className="rounded-full text-[10px] font-black px-3.5 flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-850"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  {!addr.isDefault && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setDeletingAddressId(addr._id || addr.id);
                        setIsDeleteOpen(true);
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-200/50 rounded-full text-[10px] font-black px-3.5 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal Form */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingAddress ? 'Modify Address' : 'New Shipping Address'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <Input
            label="Street Address"
            type="text"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            required
            disabled={submitting}
            className="rounded-xl text-xs"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              disabled={submitting}
              className="rounded-xl text-xs"
            />
            <Input
              label="State / Province"
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              required
              disabled={submitting}
              className="rounded-xl text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Zip / Postal Code"
              type="text"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              required
              disabled={submitting}
              className="rounded-xl text-xs"
            />
            <Input
              label="Country"
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              required
              disabled={submitting}
              className="rounded-xl text-xs"
            />
          </div>

          {/* Default address setting checkbox */}
          {(!editingAddress || !editingAddress.isDefault) && (
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                disabled={submitting}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Set as default shipping address</span>
            </label>
          )}

          <div className="flex gap-2 justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
              className="rounded-full px-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="bg-[#8b6f47] hover:bg-[#725a38] text-white border-0 rounded-full font-bold px-6 shadow-md text-xs"
            >
              {editingAddress ? 'Save Changes' : 'Add Address'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Saved Address"
        message="Are you sure you want to delete this address from your profile? This cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={submitting}
      />
    </AccountLayout>
  );
}
