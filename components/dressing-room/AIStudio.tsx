import React, { useState } from 'react';
import { useAvatarStore } from '@/stores/avatarStore';
import { Bot, Sparkles, Image as ImageIcon, Sliders, RefreshCw, Send } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function AIStudio() {
  const { avatar, setAvatarProperty } = useAvatarStore();
  const [promptText, setPromptText] = useState('');
  const [rendering, setRendering] = useState(false);
  const [renderStep, setRenderStep] = useState(0);

  const scenes = [
    { id: 'studio', label: 'Classic Studio', desc: 'Neutral studio backdrop', icon: '🎨' },
    { id: 'paris', label: 'Parisian Cafe', desc: 'Chic sidewalk coffee shop', icon: '☕' },
    { id: 'tokyo', label: 'Tokyo Neons', desc: 'Vibrant urban night street', icon: '🌆' },
    { id: 'beach', label: 'Sunset Resort', desc: 'Warm tropical sand & waves', icon: '🏖️' },
    { id: 'rooftop', label: 'Metropolitan Rooftop', desc: 'City skyline at golden hour', icon: '🏢' },
    { id: 'editorial', label: 'Concrete Gallery', desc: 'Brutalist minimalist editorial', icon: '🏛️' },
  ];

  const poses = [
    { id: 'default', label: 'Standard Pose', desc: 'Natural standing' },
    { id: 'hips', label: 'Hands on Hips', desc: 'Confident editorial stance' },
    { id: 'crossed', label: 'Arms Crossed', desc: 'Casual structured look' },
  ] as const;

  const handleRenderScene = (sceneId: string) => {
    setRendering(true);
    setRenderStep(1);

    // Simulate multi-step AI generation
    setTimeout(() => {
      setRenderStep(2);
      setTimeout(() => {
        setRenderStep(3);
        setTimeout(() => {
          setAvatarProperty('backgroundScene', sceneId);
          setRendering(false);
          setRenderStep(0);
        }, 1200);
      }, 1000);
    }, 800);
  };

  const handleCustomPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    // Detect keywords from prompt to pick closest scene
    const text = promptText.toLowerCase();
    let bestScene = 'editorial';
    if (text.includes('beach') || text.includes('sand') || text.includes('ocean') || text.includes('sea')) {
      bestScene = 'beach';
    } else if (text.includes('tokyo') || text.includes('neon') || text.includes('night') || text.includes('japan')) {
      bestScene = 'tokyo';
    } else if (text.includes('paris') || text.includes('cafe') || text.includes('coffee') || text.includes('street')) {
      bestScene = 'paris';
    } else if (text.includes('rooftop') || text.includes('skyline') || text.includes('city') || text.includes('lounge')) {
      bestScene = 'rooftop';
    }

    handleRenderScene(bestScene);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm h-full justify-between gap-6">
      {/* Top half */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#8b6f47] dark:text-[#c9a96b]" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
            AI Photo Studio
          </h3>
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed">
          Create lifestyle shoots instantly. Choose poses and photo scene backdrops to frame your custom consistent avatar character model.
        </p>

        {/* Pose Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" /> Shoot Pose Stance
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {poses.map((p) => (
              <button
                key={p.id}
                onClick={() => setAvatarProperty('pose', p.id)}
                className={`flex justify-between items-center p-3 rounded-xl border text-xs text-left transition-all ${
                  avatar.pose === p.id
                    ? 'border-[#8b6f47] bg-[#8b6f47]/5 text-[#8b6f47] dark:border-[#c9a96b] dark:text-[#c9a96b]'
                    : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
                }`}
              >
                <div>
                  <span className="font-bold block">{p.label}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">{p.desc}</span>
                </div>
                {avatar.pose === p.id && (
                  <span className="w-2 h-2 rounded-full bg-[#8b6f47] dark:bg-[#c9a96b]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Scene Backdrop Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" /> Scene Backdrop
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => handleRenderScene(scene.id)}
                disabled={rendering}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between h-[85px] transition-all relative ${
                  avatar.backgroundScene === scene.id
                    ? 'border-[#8b6f47] bg-[#8b6f47]/5 text-[#8b6f47] dark:border-[#c9a96b] dark:text-[#c9a96b]'
                    : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'
                }`}
              >
                <div className="flex justify-between w-full">
                  <span className="text-xl">{scene.icon}</span>
                  {avatar.backgroundScene === scene.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8b6f47] dark:bg-[#c9a96b]" />
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-bold block truncate">{scene.label}</span>
                  <span className="text-[9px] text-gray-400 truncate block mt-0.5">{scene.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prompt Form & AI Rendering Overlay */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-5 space-y-4">
        {rendering ? (
          <div className="bg-[#8b6f47]/5 border border-[#8b6f47]/15 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#8b6f47] dark:text-[#c9a96b] animate-spin" />
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {renderStep === 1 && 'Analyzing outfit coordinates...'}
                {renderStep === 2 && 'Warping sleeve vectors to pose...'}
                {renderStep === 3 && 'Synthesizing depth-of-field background...'}
              </p>
              <div className="w-32 bg-gray-200 h-1 rounded-full overflow-hidden mx-auto">
                <div
                  className="bg-[#8b6f47] dark:bg-[#c9a96b] h-full transition-all duration-1000"
                  style={{ width: `${(renderStep / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomPromptSubmit} className="space-y-2.5">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Prompt Generator (Optional)
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="e.g. at a street cafe in sunset..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="flex-1 text-xs"
              />
              <Button
                type="submit"
                disabled={!promptText.trim()}
                className="bg-[#8b6f47] hover:bg-[#6b5435] text-white p-2 rounded-xl flex items-center justify-center border-0 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </form>
        )}

        {/* Tip text */}
        <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-xl flex gap-2 items-start border border-gray-100/50">
          <Sparkles className="w-4 h-4 text-[#8b6f47] dark:text-[#c9a96b] shrink-0 mt-0.5" />
          <p className="text-[9px] text-gray-400 leading-normal">
            Exporting your styled avatar model will now include your custom blurred backdrop and coordinate pose layers automatically!
          </p>
        </div>
      </div>
    </div>
  );
}
