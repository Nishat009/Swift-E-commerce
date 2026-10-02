'use client';

import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Edit2, Trash2, X, RefreshCw, Layers, Upload, Star } from 'lucide-react';
import { errMsg, uploadImage } from './adminUtils';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  featured: boolean;
}

const emptyForm = { name: '', image: '', featured: false };

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
      const res = await apiClient.get('/categories');
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#8b6f47]" /> Product Categories
        </h2>
        <Button onClick={openCreate} className="text-sm py-2 px-3 font-bold rounded-xl bg-[#8b6f47] text-white flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Category
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Categories appear in the storefront menu and in the product form. Renaming a category moves its products with it.
        A category that still has active products cannot be deleted.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#8b6f47]" /> Loading categories...
        </div>
      ) : loadError ? (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={load}>Retry</Button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px]">
              <tr>
                <th className="p-3">Image</th>
                <th className="p-3">Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Products</th>
                <th className="p-3">Featured</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">No categories yet.</td>
                </tr>
              )}
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50">
                  <td className="p-3">
                    <img src={c.image} alt={c.name} className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
                  </td>
                  <td className="p-3 font-bold text-gray-800 dark:text-gray-200">{c.name}</td>
                  <td className="p-3 font-mono text-xs text-gray-500">{c.slug}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-300">{counts[c.name.toLowerCase()] || 0}</td>
                  <td className="p-3">
                    {c.featured ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">
                        <Star className="w-3 h-3 fill-amber-500" /> Featured
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">No</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit category">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(c)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete category">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">
              {editing ? `Edit category "${editing.name}"` : 'New category'}
            </h3>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Sneakers"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Image</label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    placeholder="https://... or /images/categories/x.jpg"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="w-full text-sm"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-[#8b6f47] text-[#8b6f47] text-xs font-bold cursor-pointer hover:bg-[#8b6f47]/5 whitespace-nowrap">
                    <Upload className="w-4 h-4" />
                    {uploading ? '...' : 'Upload'}
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
                  <img src={form.image} alt="Preview" className="mt-2 w-24 h-24 rounded-xl object-cover bg-gray-100 border" />
                )}
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="rounded border-gray-300 text-[#8b6f47]"
                />
                Featured (shown prominently on the home page)
              </label>
              <Button type="submit" loading={saving} className="w-full text-sm py-2.5 font-bold rounded-xl bg-[#8b6f47] text-white">
                {editing ? 'Save changes' : 'Create category'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
