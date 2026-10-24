'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useLanguageStore } from '@/stores/languageStore';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';

// Not linked from the admin sidebar for now; add a "languages" tab in app/admin/page.tsx to bring it back.
export default function LanguagesAdmin() {
  const toast = useToast();
  const [adminLanguages, setAdminLanguages] = useState<any[]>([]);
  const [showCreateLanguageModal, setShowCreateLanguageModal] = useState(false);
  const [showEditLanguageModal, setShowEditLanguageModal] = useState(false);
  const [selectedEditLanguage, setSelectedEditLanguage] = useState<any>(null);
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [newLanguageName, setNewLanguageName] = useState('');
  const [newLanguageFlag, setNewLanguageFlag] = useState('');
  const [newLanguageDefault, setNewLanguageDefault] = useState(false);
  const [newLanguageActive, setNewLanguageActive] = useState(true);
  const [editLanguageName, setEditLanguageName] = useState('');
  const [editLanguageFlag, setEditLanguageFlag] = useState('');
  const [editLanguageDefault, setEditLanguageDefault] = useState(false);
  const [editLanguageActive, setEditLanguageActive] = useState(true);

  const fetchLanguages = async () => {
    try {
      const res = await apiClient.get('/languages/admin/all');
      if (res.data?.success) {
        setAdminLanguages(res.data.data || []);
      }
    } catch (err: any) {
      toast.error('Failed to reload languages list.');
    }
  };

  const handleCreateLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/languages', {
        code: newLanguageCode.toLowerCase().trim(),
        name: newLanguageName.trim(),
        flag: newLanguageFlag.trim(),
        isDefault: newLanguageDefault,
        isActive: newLanguageActive,
      });
      if (res.data?.success) {
        toast.success(`Language ${newLanguageName} added successfully!`);
        fetchLanguages();
        setNewLanguageCode('');
        setNewLanguageName('');
        setNewLanguageFlag('');
        setNewLanguageDefault(false);
        setNewLanguageActive(true);
        setShowCreateLanguageModal(false);
        useLanguageStore.getState().loadLanguages();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add language.');
    }
  };

  const handleUpdateLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditLanguage) return;
    const lid = selectedEditLanguage.id || selectedEditLanguage._id;
    try {
      const res = await apiClient.put(`/languages/${lid}`, {
        name: editLanguageName.trim(),
        flag: editLanguageFlag.trim(),
        isDefault: editLanguageDefault,
        isActive: editLanguageActive,
      });
      if (res.data?.success) {
        toast.success(`Language updated successfully!`);
        fetchLanguages();
        setShowEditLanguageModal(false);
        useLanguageStore.getState().loadLanguages();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update language.');
    }
  };

  const handleDeleteLanguage = async (language: any) => {
    if (language.isDefault) {
      toast.error('Cannot delete the default base language.');
      return;
    }
    if (!confirm(`Are you sure you want to delete the language ${language.name}?`)) return;
    const lid = language.id || language._id;
    try {
      const res = await apiClient.delete(`/languages/${lid}`);
      if (res.data?.success) {
        toast.success(`Language deleted successfully.`);
        fetchLanguages();
        useLanguageStore.getState().loadLanguages();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete language.');
    }
  };

  const handleOpenEditLanguage = (language: any) => {
    setSelectedEditLanguage(language);
    setEditLanguageName(language.name);
    setEditLanguageFlag(language.flag);
    setEditLanguageDefault(language.isDefault);
    setEditLanguageActive(language.isActive);
    setShowEditLanguageModal(true);
  };

  const loading = useSectionLoad(fetchLanguages);
  if (loading) return <SectionLoading />;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 mb-4">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Dynamic Languages (Store Localization)</h2>
          <Button onClick={() => setShowCreateLanguageModal(true)} className="text-sm py-2 px-3 font-bold rounded-xl bg-[#8b6f47] text-white flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Add Language
          </Button>
        </div>

        <div className="overflow-x-auto border rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-400 uppercase text-[9px]">
              <tr>
                <th className="p-3">Flag</th>
                <th className="p-3">Language Name</th>
                <th className="p-3">Code</th>
                <th className="p-3">Visibility status</th>
                <th className="p-3">Default status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {adminLanguages.map((lang) => (
                <tr key={lang.id || lang._id} className="hover:bg-gray-50/50">
                  <td className="p-3 text-2xl font-bold font-serif">{lang.flag}</td>
                  <td className="p-3 font-bold text-gray-800 dark:text-gray-250">{lang.name}</td>
                  <td className="p-3 font-mono font-bold text-gray-500 uppercase">{lang.code}</td>
                  <td className="p-3">
                    {lang.isActive ? (
                      <span className="bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                        Active (Visible)
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                        Hidden (Inactive)
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {lang.isDefault ? (
                      <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20">
                        Base Language
                      </span>
                    ) : (
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                        Secondary
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditLanguage(lang)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg cursor-pointer"
                        title="Edit Language details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!lang.isDefault && (
                        <button
                          onClick={() => handleDeleteLanguage(lang)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                          title="Delete Language"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateLanguageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setShowCreateLanguageModal(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#8b6f47]" /> Add Dynamic Language
            </h3>

            <form onSubmit={handleCreateLanguage} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Language Code (ISO 2-letter)</label>
                <Input
                  type="text"
                  placeholder="e.g. fr"
                  maxLength={2}
                  value={newLanguageCode}
                  onChange={(e) => setNewLanguageCode(e.target.value.toLowerCase())}
                  required
                  className="w-full text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Language Name</label>
                <Input
                  type="text"
                  placeholder="e.g. French"
                  value={newLanguageName}
                  onChange={(e) => setNewLanguageName(e.target.value)}
                  required
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Flag Emoji</label>
                <Input
                  type="text"
                  placeholder="e.g. 🇫🇷"
                  value={newLanguageFlag}
                  onChange={(e) => setNewLanguageFlag(e.target.value)}
                  required
                  className="w-full text-sm text-center text-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="newLanguageDefault"
                  checked={newLanguageDefault}
                  onChange={(e) => setNewLanguageDefault(e.target.checked)}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30"
                />
                <label htmlFor="newLanguageDefault" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  Set as store base language
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newLanguageActive"
                  checked={newLanguageActive}
                  onChange={(e) => setNewLanguageActive(e.target.checked)}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30"
                />
                <label htmlFor="newLanguageActive" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                  Make active (visible in header switcher)
                </label>
              </div>

              <Button type="submit" className="w-full text-sm py-2.5 font-bold rounded-xl mt-4 bg-[#8b6f47] text-white cursor-pointer">
                Create Language
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LANGUAGE DIALOG MODAL */}
      {showEditLanguageModal && selectedEditLanguage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={() => setShowEditLanguageModal(false)} className="absolute top-4 right-4 p-2 bg-gray-50 dark:bg-gray-950 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 border-b pb-2 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[#8b6f47]" /> Edit Language: {selectedEditLanguage.code.toUpperCase()}
            </h3>

            <form onSubmit={handleUpdateLanguage} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Language Code (ISO)</label>
                <Input
                  type="text"
                  value={selectedEditLanguage.code.toUpperCase()}
                  disabled
                  className="w-full text-sm font-mono font-bold bg-gray-50/50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Language Name</label>
                <Input
                  type="text"
                  value={editLanguageName}
                  onChange={(e) => setEditLanguageName(e.target.value)}
                  required
                  className="w-full text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Flag Emoji</label>
                <Input
                  type="text"
                  value={editLanguageFlag}
                  onChange={(e) => setEditLanguageFlag(e.target.value)}
                  required
                  className="w-full text-sm text-center text-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editLanguageDefault"
                  checked={editLanguageDefault}
                  onChange={(e) => setEditLanguageDefault(e.target.checked)}
                  disabled={selectedEditLanguage.isDefault}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30 disabled:opacity-50"
                />
                <label htmlFor="editLanguageDefault" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none disabled:opacity-50">
                  Set as store base language
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editLanguageActive"
                  checked={editLanguageActive}
                  onChange={(e) => setEditLanguageActive(e.target.checked)}
                  disabled={selectedEditLanguage.isDefault}
                  className="rounded border-gray-300 text-[#8b6f47] focus:ring-[#8b6f47]/30 disabled:opacity-50"
                />
                <label htmlFor="editLanguageActive" className="text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none disabled:opacity-50">
                  Make active (visible in header switcher)
                </label>
              </div>

              <Button type="submit" className="w-full text-sm py-2.5 font-bold rounded-xl mt-4 bg-[#8b6f47] text-white cursor-pointer">
                Update Language Details
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
