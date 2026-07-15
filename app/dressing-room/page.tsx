'use client';

import React, { useState } from 'react';
import AvatarViewer from '@/components/dressing-room/AvatarViewer';
import AvatarControls from '@/components/dressing-room/AvatarControls';
import ClosetBuilder from '@/components/dressing-room/ClosetBuilder';
import SmartStylist from '@/components/dressing-room/SmartStylist';
import StyleChallenges from '@/components/dressing-room/StyleChallenges';
import ChatAssistant from '@/components/dressing-room/ChatAssistant';
import AIStudio from '@/components/dressing-room/AIStudio';
import { Sparkles, MessageSquare, Award, Shirt, Sliders, ChevronRight, Bot } from 'lucide-react';
import Link from 'next/link';

export default function DressingRoomPage() {
  const [sidebarTab, setSidebarTab] = useState<'customizer' | 'challenges' | 'chat' | 'aistudio'>('customizer');
  const [shopTab, setShopTab] = useState<'closet' | 'stylist'>('closet');

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-gray-950">
      {/* Premium Studio Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-background via-cream/30 to-[#8b6f47]/5 py-6 border-b border-gray-200/50 dark:border-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-1">
              <Link href="/" className="hover:text-gray-600 dark:hover:text-gray-200">Store</Link>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-[#8b6f47] dark:text-[#c9a96b]">Interactive Studio</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-[#f5f1eb] tracking-tight">
              Virtual Dressing Room
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
              Strut down the runway, customize your rigged Ready Player Me model, and inspect color coordinates instantly.
            </p>
          </div>

          {/* Quick Stats / Points bubble */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl py-2.5 px-4 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#8b6f47]/10 flex items-center justify-center text-[#8b6f47] dark:text-[#c9a96b]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold">Studio Engine</span>
                <span className="text-xs font-black text-gray-800 dark:text-gray-250">WebGL 3D Catwalk</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMN 1: Avatar Settings / Achievements / AI Chat (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full">
            {/* Sidebar Tab Triggers */}
            <div className="grid grid-cols-4 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl border border-gray-200/55 dark:border-gray-850">
              <button
                onClick={() => setSidebarTab('customizer')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'customizer'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Avatar
              </button>
              <button
                onClick={() => setSidebarTab('challenges')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'challenges'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                Challenges
              </button>
              <button
                onClick={() => setSidebarTab('chat')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'chat'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Assistant
              </button>
              <button
                onClick={() => setSidebarTab('aistudio')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'aistudio'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                Studio
              </button>
            </div>

            {/* Sidebar Active Panel */}
            <div className="min-h-[500px]">
              {sidebarTab === 'customizer' && <AvatarControls />}
              {sidebarTab === 'challenges' && <StyleChallenges />}
              {sidebarTab === 'chat' && <ChatAssistant />}
              {sidebarTab === 'aistudio' && <AIStudio />}
            </div>
          </div>

          {/* COLUMN 2: Large Viewport Visualizer (4 Columns) */}
          <div className="lg:col-span-4 h-full min-h-[500px]">
            <AvatarViewer />
          </div>

          {/* COLUMN 3: E-commerce Closet Inventory / Stylist scoring (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full">
            {/* Shop Drawer Tab Triggers */}
            <div className="grid grid-cols-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl border border-gray-200/55 dark:border-gray-850">
              <button
                onClick={() => setShopTab('closet')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  shopTab === 'closet'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                Closet Racks
              </button>
              <button
                onClick={() => setShopTab('stylist')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  shopTab === 'stylist'
                    ? 'bg-white dark:bg-gray-850 text-[#8b6f47] dark:text-[#c9a96b] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Stylist
              </button>
            </div>

            {/* Shop Active Panel */}
            <div className="min-h-[500px]">
              {shopTab === 'closet' && <ClosetBuilder />}
              {shopTab === 'stylist' && <SmartStylist />}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
