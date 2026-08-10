import React, { useState } from 'react';
import { useAvatarStore } from '@/stores/avatarStore';
import { GenderType, BodyType, HeightType, HairStyleType } from '@/types/dressingRoom';
import { Sparkles, Save, User, UserCheck, Trash2, Check, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function AvatarProfileComponent() {
  const {
    avatar,
    setAvatarProperty,
    savedAvatars,
    saveCurrentAvatar,
    loadSavedAvatar,
    deleteSavedAvatar,
  } = useAvatarStore();

  const [presetName, setPresetName] = useState('');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const skinTones = [
    { label: 'Porcelain', value: '#f7dad0' },
    { label: 'Fair', value: '#f3c7b6' },
    { label: 'Sand / Beige', value: '#e0a96d' },
    { label: 'Honey / Tan', value: '#c68642' },
    { label: 'Deep Chestnut', value: '#8d5524' },
    { label: 'Rich Espresso', value: '#4a2912' },
  ];

  const hairColors = [
    { label: 'Jet Black', value: '#1a1a1a' },
    { label: 'Dark Brown', value: '#4a3728' },
    { label: 'Golden Chestnut', value: '#8b5a2b' },
    { label: 'Honey Blonde', value: '#d4a359' },
    { label: 'Auburn Red', value: '#802b1c' },
    { label: 'Silver Gray', value: '#a0a0a0' },
  ];

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    saveCurrentAvatar(presetName.trim());
    setPresetName('');
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Avatar Customization Profile
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Personalize physical dimensions, hair, skin tone, and styling presets for virtual try-on.
          </p>
        </div>
      </div>

      {/* Preset Profiles Bar */}
      {savedAvatars.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Saved Avatar Looks
          </label>
          <div className="flex flex-wrap gap-2">
            {savedAvatars.map((saved) => (
              <div
                key={saved.id}
                className="group flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-medium text-amber-900 dark:text-amber-300 transition-all cursor-pointer"
                onClick={() => loadSavedAvatar(saved)}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{saved.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSavedAvatar(saved.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                  title="Delete Preset"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gender Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Gender
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['female', 'male'] as GenderType[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setAvatarProperty('gender', g)}
              className={`py-2.5 px-4 rounded-xl text-sm font-semibold capitalize border transition-all flex items-center justify-center gap-2 ${
                avatar.gender === g
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-400'
              }`}
            >
              {avatar.gender === g && <Check className="w-4 h-4" />}
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Body Type */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Body Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {(['slim', 'regular', 'athletic', 'plus_size'] as BodyType[]).map((bt) => (
            <button
              key={bt}
              type="button"
              onClick={() => setAvatarProperty('bodyType', bt)}
              className={`py-2 px-2 rounded-xl text-xs font-medium capitalize border transition-all text-center ${
                avatar.bodyType === bt
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-400'
              }`}
            >
              {bt.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Height */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Height
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['short', 'average', 'tall'] as HeightType[]).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setAvatarProperty('height', h)}
              className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border transition-all text-center ${
                avatar.height === h
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-400'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Skin Tone Swatches */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Skin Tone
        </label>
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {skinTones.map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setAvatarProperty('skinTone', st.value)}
              className={`w-9 h-9 rounded-full border-2 transition-transform relative shrink-0 ${
                avatar.skinTone === st.value
                  ? 'border-amber-500 scale-110 shadow-md ring-2 ring-amber-500/30'
                  : 'border-white dark:border-gray-800 hover:scale-105'
              }`}
              style={{ backgroundColor: st.value }}
              title={st.label}
            >
              {avatar.skinTone === st.value && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-md">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Hair Customization */}
      <div className="grid grid-cols-2 gap-4">
        {/* Hair Style */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Hair Style
          </label>
          <select
            value={avatar.hairStyle}
            onChange={(e) => setAvatarProperty('hairStyle', e.target.value as HairStyleType)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-amber-500"
          >
            <option value="short">Short Trim</option>
            <option value="long">Long Flowing</option>
            <option value="curly">Curly Volume</option>
            <option value="bob">Sleek Bob</option>
            <option value="bald">Buzz / Bald</option>
          </select>
        </div>

        {/* Hair Color */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Hair Color
          </label>
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {hairColors.map((hc) => (
              <button
                key={hc.value}
                type="button"
                onClick={() => setAvatarProperty('hairColor', hc.value)}
                className={`w-7 h-7 rounded-full border-2 transition-transform shrink-0 ${
                  avatar.hairColor === hc.value
                    ? 'border-amber-500 scale-110 shadow-xs'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                style={{ backgroundColor: hc.value }}
                title={hc.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Save Preset Form */}
      <form onSubmit={handleSavePreset} className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder='Save Preset (e.g. "My Office Look")'
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            className="text-xs"
          />
          <Button type="submit" size="sm" className="shrink-0 gap-1 text-xs">
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>
        </div>
        {isSavedNotice && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Preset saved successfully!
          </p>
        )}
      </form>
    </div>
  );
}
