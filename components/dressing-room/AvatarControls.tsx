import React, { useState } from 'react';
import { useAvatarStore } from '@/stores/avatarStore';
import { SKIN_TONES, HAIR_COLORS } from './SVGLayers';
import { Sparkles, Save, Trash2, Check, User } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function AvatarControls() {
  const {
    avatar,
    savedAvatars,
    setAvatarProperty,
    saveCurrentAvatar,
    loadSavedAvatar,
    deleteSavedAvatar
  } = useAvatarStore();

  const [avatarName, setAvatarName] = useState('');
  const [activeTab, setActiveTab] = useState<'body' | 'hair' | 'face' | 'saved'>('body');

  const eyeColors = [
    { name: 'Brown', value: '#5c3818' },
    { name: 'Blue', value: '#3a76a0' },
    { name: 'Green', value: '#3d633d' },
    { name: 'Amber', value: '#aa6b1e' },
    { name: 'Black', value: '#1a1a1a' },
  ];

  const handleSaveAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarName.trim()) return;
    saveCurrentAvatar(avatarName.trim());
    setAvatarName('');
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm h-full justify-between">
      <div>
        {/* Tab Headers */}
        <div className="flex border-b border-gray-100 dark:border-gray-800 pb-2 mb-6 justify-between gap-1 overflow-x-auto">
          {([
            { id: 'body', label: 'Body Shape' },
            { id: 'hair', label: 'Hair & Tone' },
            { id: 'face', label: 'Features' },
            { id: 'saved', label: 'My Wardrobes' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 px-1 text-sm font-semibold whitespace-nowrap transition-all duration-300 relative ${
                activeTab === tab.id
                  ? 'text-[#8b6f47] dark:text-[#c9a96b]'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b6f47] dark:bg-[#c9a96b]" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'body' && (
            <div className="space-y-6">
              {/* Gender Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Gender Archetype
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['female', 'male'] as const).map((gender) => (
                    <button
                      key={gender}
                      onClick={() => setAvatarProperty('gender', gender)}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold capitalize flex items-center justify-center gap-2 transition-all ${
                        avatar.gender === gender
                          ? 'border-[#8b6f47] bg-[#8b6f47]/5 text-[#8b6f47] dark:border-[#c9a96b] dark:bg-[#c9a96b]/5 dark:text-[#c9a96b]'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Type Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Body Silhouette
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: 'slim', label: 'Slim Fit' },
                    { id: 'regular', label: 'Regular' },
                    { id: 'athletic', label: 'Athletic' },
                    { id: 'plus', label: 'Plus Size' },
                  ] as const).map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => setAvatarProperty('bodyType', shape.id)}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                        avatar.bodyType === shape.id
                          ? 'border-[#8b6f47] bg-[#8b6f47]/5 text-[#8b6f47] dark:border-[#c9a96b] dark:bg-[#c9a96b]/5 dark:text-[#c9a96b]'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {shape.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Height Proportion
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['short', 'average', 'tall'] as const).map((height) => (
                    <button
                      key={height}
                      onClick={() => setAvatarProperty('height', height)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                        avatar.height === height
                          ? 'border-[#8b6f47] bg-[#8b6f47]/5 text-[#8b6f47] dark:border-[#c9a96b] dark:bg-[#c9a96b]/5 dark:text-[#c9a96b]'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {height}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hair' && (
            <div className="space-y-6">
              {/* Skin Tone Color Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Skin Palette
                </label>
                <div className="flex flex-wrap gap-3">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone.name}
                      onClick={() => setAvatarProperty('skinTone', tone.value)}
                      className={`w-9 h-9 rounded-full border-2 transition-all relative flex items-center justify-center`}
                      style={{ backgroundColor: tone.value, borderColor: avatar.skinTone === tone.value ? '#8b6f47' : '#e2e2e2' }}
                      title={tone.name}
                    >
                      {avatar.skinTone === tone.value && (
                        <Check className="w-4 h-4 text-white drop-shadow-sm font-bold" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Style */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Hairstyle
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {([
                    { id: 'short', label: 'Classic Crop' },
                    { id: 'long', label: 'Flowing Bob' },
                    { id: 'curly', label: 'Volumed Curl' },
                    { id: 'wavy', label: 'Soft Wave' },
                    { id: 'bald', label: 'Clean Shaven' },
                  ] as const).map((hair) => (
                    <button
                      key={hair.id}
                      onClick={() => setAvatarProperty('hairStyle', hair.id)}
                      className={`py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${
                        avatar.hairStyle === hair.id
                          ? 'border-[#8b6f47] bg-[#8b6f47]/5 text-[#8b6f47] dark:border-[#c9a96b] dark:bg-[#c9a96b]/5 dark:text-[#c9a96b]'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {hair.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Color Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Hair Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {HAIR_COLORS.map((hairC) => (
                    <button
                      key={hairC.name}
                      onClick={() => setAvatarProperty('hairColor', hairC.value)}
                      className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center`}
                      style={{ backgroundColor: hairC.value, borderColor: avatar.hairColor === hairC.value ? '#8b6f47' : '#e2e2e2' }}
                      title={hairC.name}
                    >
                      {avatar.hairColor === hairC.value && (
                        <Check className="w-4 h-4 text-white drop-shadow-sm font-bold" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'face' && (
            <div className="space-y-6">
              {/* Eye Color */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Iris Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {eyeColors.map((eye) => (
                    <button
                      key={eye.name}
                      onClick={() => setAvatarProperty('eyeColor', eye.value)}
                      className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center`}
                      style={{ backgroundColor: eye.value, borderColor: avatar.eyeColor === eye.value ? '#8b6f47' : '#e2e2e2' }}
                      title={eye.name}
                    >
                      {avatar.eyeColor === eye.value && (
                        <Check className="w-4 h-4 text-white drop-shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Eyebrows */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Eyebrow Density
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['normal', 'thick', 'thin'] as const).map((brow) => (
                    <button
                      key={brow}
                      onClick={() => setAvatarProperty('browStyle', brow)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                        avatar.browStyle === brow
                          ? 'border-[#8b6f47] bg-[#8b6f47]/5 text-[#8b6f47] dark:border-[#c9a96b] dark:bg-[#c9a96b]/5 dark:text-[#c9a96b]'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {brow}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mouth Expression */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Expression
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['smile', 'neutral', 'open'] as const).map((expr) => (
                    <button
                      key={expr}
                      onClick={() => setAvatarProperty('mouthExpression', expr)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                        avatar.mouthExpression === expr
                          ? 'border-[#8b6f47] bg-[#8b6f47]/5 text-[#8b6f47] dark:border-[#c9a96b] dark:bg-[#c9a96b]/5 dark:text-[#c9a96b]'
                          : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {expr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-6">
              {/* Input to save new layout */}
              <form onSubmit={handleSaveAvatar} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Name this wardrobe look..."
                  value={avatarName}
                  onChange={(e) => setAvatarName(e.target.value)}
                  className="flex-1 text-xs"
                />
                <Button
                  type="submit"
                  disabled={!avatarName.trim()}
                  className="bg-[#8b6f47] hover:bg-[#6b5435] text-white py-2 px-4 flex items-center justify-center gap-1 text-xs border-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </Button>
              </form>

              {/* List of saved setups */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {savedAvatars.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                    <p className="text-gray-400 text-xs">No saved lookbook outfits yet.</p>
                  </div>
                ) : (
                  savedAvatars.map((saved) => (
                    <div
                      key={saved.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-gray-850/50 group transition-all"
                    >
                      <div>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate max-w-[130px]">
                          {saved.name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {new Date(saved.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => loadSavedAvatar(saved)}
                          className="px-2.5 py-1.5 bg-gray-200 hover:bg-[#8b6f47] hover:text-white dark:bg-gray-800 dark:hover:bg-[#c9a96b] text-[10px] font-bold rounded-lg transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteSavedAvatar(saved.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                          title="Delete design"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Styled Tip card */}
      <div className="mt-8 bg-gradient-to-r from-[#8b6f47]/5 via-cream/10 to-[#8b6f47]/5 p-4 rounded-xl border border-[#8b6f47]/10 flex gap-2.5 items-start">
        <Sparkles className="w-5 h-5 text-[#8b6f47] dark:text-[#c9a96b] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
            Stylist Tip
          </p>
          <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
            Use the saved wardrobes tab to compare different outfits and colors side-by-side!
          </p>
        </div>
      </div>
    </div>
  );
}
