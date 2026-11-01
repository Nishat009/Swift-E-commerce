'use client';

import React, { useState } from 'react';
import AccountLayout from '@/components/layout/AccountLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import apiClient from '@/lib/apiClient';
import { Address } from '@/types';
import { SITE } from '@/lib/siteConfig';
import { validateAddress, AddressErrors } from '@/lib/addressValidation';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import EmptyState from '@/components/ui/EmptyState';
import { MapPin } from 'lucide-react';
import StatusPill from '@/components/orders/StatusPill';

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
    country: SITE.defaultCountry,
    isDefault: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<AddressErrors>({});

  const openAddModal = () => {
    setEditingAddress(null);
    setFormData({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: SITE.defaultCountry,
      isDefault: savedAddresses.length === 0 // Force first address to default
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (addr: Address & { _id?: string; id?: string }) => {
    setEditingAddress(addr);
    setFormData({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country || SITE.defaultCountry,
      isDefault: !!addr.isDefault
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateAddress(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
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
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && typeof serverErrors === 'object') setFormErrors(serverErrors);
      toast.error(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (addr: Address & { _id?: string; id?: string }) => {
    try {
      const res = await apiClient.put('/auth/addresses/' + (addr._id || addr.id), { isDefault: true });
      if (res.data?.success) {
        toast.success('Default address updated.');
        await refreshUser();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update default address.');
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
      <div className="space-y-8">

        {/* Title */}
        <div className="flex items-start sm:items-center justify-between gap-4 border-b border-line pb-5">
          <div>
            <h2 className="text-2xl font-serif font-medium tracking-tight text-ink">
              Saved Addresses
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5">
              Add or edit shipping addresses for faster checkout deliveries.
            </p>
          </div>
          <Button onClick={openAddModal} size="sm" className="shrink-0">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {savedAddresses.map((addr: any, idx: number) => (
              <div
                key={addr._id || addr.id || idx}
                className={`border rounded-lg p-5 sm:p-6 transition-colors relative flex flex-col justify-between ${
                  addr.isDefault
                    ? 'border-ink'
                    : 'border-line hover:border-stone-400'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-serif text-lg font-medium text-ink">
                      Address {idx + 1}
                    </span>
                    {addr.isDefault && (
                      <StatusPill tone="neutral">Default</StatusPill>
                    )}
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {addr.street} <br />
                    {addr.city}, {addr.state} {addr.zipCode} <br />
                    {addr.country}
                  </p>
                </div>

                {/* Actions row */}
                <div className="mt-6 pt-4 border-t border-line flex flex-wrap gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(addr)}
                  >
                    Edit
                  </Button>
                  {!addr.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(addr)}
                    >
                      Make Default
                    </Button>
                  )}
                  {(
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDeletingAddressId(addr._id || addr.id);
                        setIsDeleteOpen(true);
                      }}
                      className="text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
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
            error={formErrors.street}
            required
            disabled={submitting}
            className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              error={formErrors.city}
              required
              disabled={submitting}
              className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
            />
            <Input
              label="State / Province"
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              error={formErrors.state}
              required
              disabled={submitting}
              className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Zip / Postal Code"
              type="text"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              error={formErrors.zipCode}
              required
              disabled={submitting}
              className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
            />
            <Input
              label="Country"
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              error={formErrors.country}
              required
              disabled={submitting}
              className="h-11 rounded-md bg-transparent focus:ring-0 focus:border-ink"
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
                className="w-4 h-4 accent-[var(--ink)]"
              />
              <span className="text-sm text-stone-600 dark:text-stone-300">Set as default shipping address</span>
            </label>
          )}

          <div className="flex gap-2 justify-end pt-5 border-t border-line">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
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
