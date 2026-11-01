import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import AIBadge from '@/components/ui/AIBadge';
import AvatarViewer from '@/components/dressing-room/AvatarViewer';
import AvatarProfileComponent from './AvatarProfileComponent';
import { Product } from '@/types';
import { useAvatarStore } from '@/stores/avatarStore';
import { useCartStore } from '@/stores/cartStore';
import { Sparkles, Upload, User, ShoppingBag, Eye, Camera, RefreshCw } from 'lucide-react';
import Image from 'next/image';

import DressRoomViewer from '@/components/dressing-room/DressRoomViewer';

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function TryOnModal({ isOpen, onClose, product }: TryOnModalProps) {
  const { tryOnItem } = useAvatarStore();
  const addItem = useCartStore((state) => state.addItem);

  const [mode, setMode] = useState<'dressroom' | 'avatar' | 'photo'>('dressroom');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewAngle, setViewAngle] = useState<'front' | 'left' | 'right' | 'back'>('front');
  const [activeTab, setActiveTab] = useState<'preview' | 'customize'>('preview');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsGenerating(true);
      const url = URL.createObjectURL(file);
      setTimeout(() => {
        setPhotoPreview(url);
        setIsGenerating(false);
      }, 1000);
    }
  };

  const handleAddToCart = () => {
    addItem(product, 1);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AIBadge type="recommended" label="SwiftCart Dress Room Studio" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
              &quot;{product.title}&quot; Dress Room
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Switch between studio product shots and real editorial model wearing look.
            </p>
          </div>

          {/* Mode Switcher (Avatar modes temporarily commented out for later development) */}
          {/*
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setMode('dressroom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === 'dressroom'
                  ? 'bg-[#8b6f47] text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Dress Room
            </button>

            <button
              onClick={() => {
                setMode('avatar');
                tryOnItem(product);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === 'avatar'
                  ? 'bg-[#8b6f47] text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              3D Avatar
            </button>

            <button
              onClick={() => setMode('photo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === 'photo'
                  ? 'bg-[#8b6f47] text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Photo
            </button>
          </div>
          */}
        </div>

        {/* Content Area: Dress Room Dual Product & Model View */}
        <div className="py-2">
          <DressRoomViewer product={product} showDetails={true} />
        </div>

        {/*
        ========================================================================
        [3D AVATAR & PHOTO RENDERING PREVIEWS - TEMPORARILY COMMENTED OUT]
        ========================================================================
        {mode === 'avatar' ? (
          activeTab === 'preview' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 bg-gradient-to-b from-gray-50 to-amber-500/5 dark:from-gray-950 dark:to-amber-950/20 rounded-3xl p-4 border border-gray-200 dark:border-gray-800 shadow-inner flex flex-col items-center justify-center min-h-[380px] relative">
                <AvatarViewer />

                <div className="absolute bottom-3 flex items-center gap-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 text-xs shadow-md">
                  {(['front', 'left', 'right', 'back'] as const).map((angle) => (
                    <button
                      key={angle}
                      onClick={() => setViewAngle(angle)}
                      className={`px-2.5 py-1 rounded-full capitalize font-medium transition-all ${
                        viewAngle === angle
                          ? 'bg-amber-600 text-white font-bold'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                      }`}
                    >
                      {angle}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                    <Image
                      src={product.images?.[0] || product.thumbnail || product.image || '/placeholder-fashion.jpg'}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-extrabold">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">Category: {product.category}</p>
                  </div>
                </div>

                <div className="bg-amber-500/10 dark:bg-amber-500/5 p-3 rounded-2xl border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    AI Fit Analysis:
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400">
                    Based on your selected avatar proportions, this item offers a regular comfortable silhouette with optimal shoulder drape.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <Button onClick={handleAddToCart} className="w-full justify-center gap-2 text-xs font-bold py-3">
                    <ShoppingBag className="w-4 h-4" />
                    Add Worn Item to Cart
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <AvatarProfileComponent />
          )
        ) : (
          <div className="space-y-4 text-center py-4">
            {!photoPreview ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl p-8 hover:border-amber-500 transition-colors flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
                <Upload className="w-10 h-10 text-amber-500 animate-bounce" />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    Upload a Full-Body or Torso Photo
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG or JPG up to 10MB. Our AI will automatically map &quot;{product.title}&quot; onto your body contours.
                  </p>
                </div>
                <label className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-md">
                  Browse File
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {isGenerating ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      AI is rendering clothing fit on your uploaded photo...
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="relative h-80 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg">
                      <Image src={photoPreview} alt="Personal Try-On" fill className="object-cover" />
                      <div className="absolute top-3 left-3">
                        <AIBadge type="match" label="AI Fit Synthesized" />
                      </div>
                    </div>
                    <div className="space-y-4 text-left">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white">
                        AI Personalized Photorealistic Try-On
                      </h4>
                      <p className="text-xs text-gray-500">
                        Our neural network aligned garment textures and shadows to match your uploaded portrait.
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={handleAddToCart} className="flex-1 justify-center text-xs py-2.5">
                          Add To Cart
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setPhotoPreview(null)}
                          className="text-xs py-2.5"
                        >
                          Change Photo
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        */}
      </div>
    </Modal>
  );
}
