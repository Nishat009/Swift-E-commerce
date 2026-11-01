'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { Plus, Edit2, Trash2, X, Loader2, FolderTree, Upload, Star } from 'lucide-react';
import { errMsg, uploadImage } from './adminUtils';
import PreviewImage from '@/components/ui/PreviewImage';
import { AdminButton, AdminEmpty, Pill, table } from './AdminUI';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  featured: boolean;
}

const emptyForm = { name: '', image: '', featured: false };

const labelClass = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const inputClass = 'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 dark:text-stone-100';
const iconButton = 'w-8 px-0 text-stone-500 dark:text-stone-400';

export default function CategoriesAdmin() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await apiClient.get('/categories', { params: { all: true } });
      setCategories(res.data?.data || []);
      // product counts per category (active, published products only)
      try {
        const prodRes = await apiClient.get('/products', { params: { limit: 500 } });
        const tally: Record<string, number> = {};
        (prodRes.data?.products || []).forEach((p: any) => {
          const key = String(p.category || '').toLowerCase();
          tally[key] = (tally[key] || 0) + 1;
        });
        setCounts(tally);
      } catch {
        setCounts({});
      }
    } catch (err) {
      setLoadError(errMsg(err, 'Failed to load categories.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, image: c.image, featured: !!c.featured });
    setModalOpen(true);
  };

  const handleUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, image: url }));
      toast.success('Image uploaded.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Category name is required.');
    if (!form.image.trim()) return toast.error('Add an image (upload or paste a URL).');
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), image: form.image.trim(), featured: form.featured };
      if (editing) {
        await apiClient.put(`/categories/${editing.id}`, payload);
        toast.success('Category updated.');
      } else {
        await apiClient.post('/categories', payload);
        toast.success('Category created.');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Failed to save category.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await apiClient.delete(`/categories/${c.id}`);
      setCategories((prev) => prev.filter((x) => x.id !== c.id));
      toast.success('Category deleted.');
    } catch (err) {
      toast.error(errMsg(err, 'Failed to delete category.'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-stone-500 dark:text-stone-400">
          Categories appear in the storefront menu and in the product form. Renaming a category moves its products with it.
          A category that still has active products cannot be deleted.
        </p>
        <AdminButton variant="primary" onClick={openCreate} className="self-start sm:self-auto">
          <Plus className="size-4" /> New category
        </AdminButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-line py-16 text-sm text-stone-500 dark:text-stone-400">
          <Loader2 className="size-4 animate-spin" /> Loading categories...
        </div>
      ) : loadError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <span>{loadError}</span>
          <AdminButton size="sm" onClick={load}>Retry</AdminButton>
        </div>
      ) : (
        <div className={table.wrap}>
          <table className={table.table}>
            <thead className={table.thead}>
              <tr>
                <th className={table.th}>Category</th>
                <th className={table.th}>Slug</th>
                <th className={`${table.th} text-right`}>Products</th>
                <th className={table.th}>Featured</th>
                <th className={table.th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className={table.tbody}>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <AdminEmpty icon={FolderTree} title="No categories yet" description="Create your first category with New category." />
                  </td>
                </tr>
              )}
              {categories.map((c) => (
                <tr key={c.id} className={table.tr}>
                  <td className={table.td}>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image} alt={c.name} className="size-10 shrink-0 rounded-lg bg-stone-100 object-cover dark:bg-white/5" />
                      <span className="font-medium text-stone-900 dark:text-stone-100">{c.name}</span>
                    </div>
                  </td>
                  <td className={`${table.td} font-mono text-xs text-stone-500 dark:text-stone-400`}>{c.slug}</td>
                  <td className={`${table.td} text-right tabular-nums text-stone-700 dark:text-stone-300`}>{counts[c.name.toLowerCase()] || 0}</td>
                  <td className={table.td}>
                    {c.featured ? (
                      <Pill tone="accent"><Star className="size-3 fill-current" /> Featured</Pill>
                    ) : (
                      <span className="text-xs text-stone-400">No</span>
                    )}
                  </td>
                  <td className={`${table.td} text-right`}>
                    <div className="flex justify-end gap-1">
                      <AdminButton variant="ghost" size="sm" onClick={() => openEdit(c)} className={iconButton} title="Edit category" aria-label={`Edit ${c.name}`}>
                        <Edit2 className="size-3.5" />
                      </AdminButton>
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(c)}
                        className={`${iconButton} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-300`}
                        title="Delete category"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4 backdrop-blur-[2px]">
          <div role="dialog" aria-modal="true" aria-labelledby="category-modal-title" className="relative w-full max-w-md rounded-xl border border-line bg-surface p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/[0.06] dark:hover:text-stone-200 cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <h3 id="category-modal-title" className="pr-8 text-base font-semibold text-stone-900 dark:text-white">
              {editing ? `Edit category "${editing.name}"` : 'New category'}
            </h3>
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="category-name" className={labelClass}>Name</label>
                <input
                  id="category-name"
                  type="text"
                  placeholder="e.g. Sneakers"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="category-image" className={labelClass}>Image</label>
                <div className="flex items-center gap-2">
                  <input
                    id="category-image"
                    type="text"
                    placeholder="https://... or /images/categories/x.jpg"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className={inputClass}
                  />
                  <label className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-surface px-3 text-sm font-medium text-stone-700 shadow-xs transition-colors hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-white/[0.06] ${uploading ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}>
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {uploading ? 'Uploading' : 'Upload'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={uploading}
                      onChange={(e) => {
                        void handleUpload(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
                {form.image && (
                  <PreviewImage src={form.image.trim()} className="mt-2 size-24 rounded-lg border border-line bg-stone-100 object-cover dark:bg-white/5" />
                )}
              </div>
              <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="size-4 accent-[#8b6f47]"
                />
                Featured (shown prominently on the home page)
              </label>
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <AdminButton onClick={() => setModalOpen(false)}>Cancel</AdminButton>
                <AdminButton type="submit" variant="primary" disabled={saving}>
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {editing ? 'Save changes' : 'Create category'}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
