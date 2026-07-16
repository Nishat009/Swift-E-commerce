import React from 'react';
import { useAvatarStore } from '@/stores/avatarStore';
import { Award, CheckCircle, ShieldAlert, CircleCheck, Play, HelpCircle } from 'lucide-react';
import Button from '../ui/Button';
import { Product } from '@/types';

interface Challenge {
  id: string;
  title: string;
  description: string;
  budgetLimit: number;
  minStyleScore: number;
  requiredLayers: string[];
  rewardBadge: { id: string; name: string; icon: string };
  points: number;
}

export default function StyleChallenges() {
  const { wornItems, points, unlockedBadges, completeChallenge, avatar } = useAvatarStore();

  const challenges: Challenge[] = [
    {
      id: 'summer_casual',
      title: 'Resort Beach Chic',
      description: 'Create a warm summer silhouette. Outfit must stay under $150 and contain linen trousers or tank elements.',
      budgetLimit: 150,
      minStyleScore: 80,
      requiredLayers: ['top', 'pants'],
      rewardBadge: { id: 'summer_beach', name: 'Summer Beach King', icon: '🌴' },
      points: 50,
    },
    {
      id: 'office_formal',
      title: 'Executive Boardroom',
      description: 'Dress for a high-stakes corporate pitch. Must include a jacket + trousers (or dress) and stay under $350.',
      budgetLimit: 350,
      minStyleScore: 90,
      requiredLayers: ['jacket'],
      rewardBadge: { id: 'office_elite', name: 'Office Board Director', icon: '💼' },
      points: 100,
    },
    {
      id: 'streetwear_hype',
      title: 'Hypebeast Utilitarian',
      description: 'A streetwear look containing cargo pants and platform sneakers. Achieve a style score of 90+.',
      budgetLimit: 400,
      minStyleScore: 90,
      requiredLayers: ['pants', 'shoes'],
      rewardBadge: { id: 'hype_beast', name: 'Streetwear Icon', icon: '⚡' },
      points: 80,
    },
  ];

  const badgesList = [
    { id: 'first_avatar', name: 'Model Creator', desc: 'Customized your first fashion model avatar.', icon: '👤' },
    { id: 'avatar_collector', name: 'Lookbook Collector', desc: 'Saved an outfit configuration to wardrobes list.', icon: '🗂️' },
    { id: 'summer_beach', name: 'Summer Beach King', desc: 'Completed the Resort Beach Chic style challenge.', icon: '🌴' },
    { id: 'office_elite', name: 'Office Board Director', desc: 'Completed the Executive Boardroom style challenge.', icon: '💼' },
    { id: 'hype_beast', name: 'Streetwear Icon', desc: 'Completed the Hypebeast Utilitarian style challenge.', icon: '⚡' },
  ];

  const getSpec = (product: Product, key: string): string => {
    if (!product.specifications) return '';
    if (typeof (product.specifications as any).get === 'function') {
      return (product.specifications as any).get(key) || '';
    }
    return (product.specifications as any)[key] || '';
  };

  const handleVerifyChallenge = (challenge: Challenge) => {
    const items = Object.values(wornItems).filter(Boolean) as Product[];
    
    // 1. Verify required layers are worn
    const wornLayers = items.map(p => getSpec(p, 'Layer').toLowerCase());
    const hasRequiredLayers = challenge.requiredLayers.every(l => {
      if (l === 'pants' && wornLayers.includes('dress')) return true; // dress covers pants
      if (l === 'top' && wornLayers.includes('dress')) return true; // dress covers top
      return wornLayers.includes(l);
    });

    if (!hasRequiredLayers) {
      alert(`Verification Failed: You are missing required outfit pieces. (Required: ${challenge.requiredLayers.join(', ')})`);
      return;
    }

    // 2. Calculate budget
    const totalPrice = items.reduce((sum, item) => {
      const discountedPrice = item.price * (1 - (item.discountPercentage || 0) / 100);
      return sum + discountedPrice;
    }, 0);

    if (totalPrice > challenge.budgetLimit) {
      alert(`Verification Failed: Outfit cost ($${totalPrice.toFixed(0)}) exceeds budget limit of $${challenge.budgetLimit}.`);
      return;
    }

    // 3. Unlocked check
    if (unlockedBadges.includes(challenge.rewardBadge.id)) {
      alert('You have already completed this challenge and unlocked the badge!');
      return;
    }

    // Success! Complete
    completeChallenge(challenge.id, challenge.rewardBadge.id, challenge.points);
    alert(`Congratulations! You completed "${challenge.title}"! Unlocked Badge: ${challenge.rewardBadge.icon} ${challenge.rewardBadge.name} and earned +${challenge.points} style points.`);
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm h-full gap-6">
      {/* Points Display */}
      <div className="flex justify-between items-center bg-[#8b6f47]/5 p-4 rounded-xl border border-[#8b6f47]/15">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#8b6f47] dark:text-[#c9a96b]" />
          <span className="text-xs font-extrabold text-gray-700 dark:text-gray-200">Style Rewards Portal</span>
        </div>
        <span className="text-sm font-black text-[#8b6f47] dark:text-[#c9a96b] font-mono">{points} pts</span>
      </div>

      {/* List of Challenges */}
      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3.5">
          Daily Style Challenges
        </h4>
        <div className="space-y-3.5">
          {challenges.map((c) => {
            const completed = unlockedBadges.includes(c.rewardBadge.id);
            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-350 ${
                  completed
                    ? 'border-emerald-100 bg-emerald-50/10 dark:border-emerald-950 dark:bg-emerald-950/5'
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h5 className="text-xs font-black text-gray-800 dark:text-gray-200">{c.title}</h5>
                    {completed ? (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 uppercase">
                        <CircleCheck className="w-3.5 h-3.5" /> Checked
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-[#8b6f47] dark:text-[#c9a96b]">+{c.points} pts</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed mt-1">{c.description}</p>
                </div>

                <div className="flex items-center justify-between mt-4 gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span className="font-bold text-gray-500">Budget Limit:</span>
                    <span>${c.budgetLimit}</span>
                  </div>

                  {!completed && (
                    <button
                      onClick={() => handleVerifyChallenge(c)}
                      className="px-3.5 py-1.5 bg-[#8b6f47] hover:bg-[#6b5435] text-white dark:bg-[#c9a96b] dark:text-gray-950 text-[10px] font-black rounded-lg transition-colors border-0 flex items-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" /> Submit Look
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges unlocked section */}
      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3.5">
           unlocked Achievements
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {badgesList.map((badge) => {
            const unlocked = unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                  unlocked
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50/20'
                    : 'border-gray-100 dark:border-gray-800 opacity-30 select-none'
                }`}
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                  {badge.name}
                </span>
                <span className="text-[8px] text-gray-400 leading-tight mt-1 line-clamp-2">
                  {badge.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
