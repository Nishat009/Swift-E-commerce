import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, Bot, User, ShoppingBag, ArrowRight, RefreshCw } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useAIStore } from '@/stores/aiStore';
import { useAvatarStore } from '@/stores/avatarStore';
import { useCartStore } from '@/stores/cartStore';
import { fashionProducts } from '@/data/fashionCatalog';
import { StylistMessage } from '@/types/ai';
import Image from 'next/image';
import Button from '@/components/ui/Button';

export default function FloatingAIStylist() {
  const { userProfile } = useAIStore();
  const { tryOnItem } = useAvatarStore();
  const addItem = useCartStore((state) => state.addItem);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<StylistMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: "Hello! I am your Swift AI Stylist. Tell me your budget, occasion, or style vibe (e.g., 'Wedding outfit under 5000 taka' or 'Suggest office outfit') and I'll curate complete look recommendations!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const promptChips = [
    'I need a wedding outfit under 5000 taka',
    'Find black shirts under 2000',
    'Suggest office outfit',
    'What matches with this jeans?',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const userMsg: StylistMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      const responseMsg = await aiService.queryAIStylist(text, userProfile, fashionProducts);
      setMessages((prev) => [...prev, responseMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'assistant',
          text: "I encountered a minor glitch finding matching items, but try checking our Trending collection!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddOutfitToCart = (items: any[]) => {
    items.forEach((item) => addItem(item, 1));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs px-4 py-3.5 rounded-full shadow-2xl hover:shadow-amber-500/25 transition-all transform hover:scale-105"
        >
          <Sparkles className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Swift AI Stylist</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[390px] h-[540px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">Swift AI Stylist</h3>
                <p className="text-[10px] text-amber-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Personal Fashion AI Active
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt Chips */}
          <div className="p-2.5 bg-amber-500/5 border-b border-amber-500/10 flex gap-1.5 overflow-x-auto shrink-0">
            {promptChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-amber-600/10 border border-amber-600/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                )}

                <div className={`max-w-[82%] space-y-2`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-amber-600 text-white rounded-tr-none'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className="block text-[9px] opacity-70 text-right mt-1">{msg.timestamp}</span>
                  </div>

                  {/* Suggested Outfit Card */}
                  {msg.suggestedOutfit && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-amber-900 dark:text-amber-300">
                          {msg.suggestedOutfit.title}
                        </span>
                        <span className="font-extrabold text-amber-600">
                          ${msg.suggestedOutfit.totalPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {msg.suggestedOutfit.items.map((item) => (
                          <div key={item.id} className="relative h-16 rounded-lg overflow-hidden border border-amber-500/20">
                            <Image src={item.images?.[0] || item.thumbnail || item.image || '/placeholder-fashion.jpg'} alt={item.title} fill className="object-cover" />
                          </div>
                        ))}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleAddOutfitToCart(msg.suggestedOutfit!.items)}
                        className="w-full justify-center text-[11px] py-1.5 gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" /> Add Entire Look to Cart
                      </Button>
                    </div>
                  )}

                  {/* Suggested Products Grid */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && !msg.suggestedOutfit && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {msg.suggestedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 flex flex-col justify-between"
                        >
                          <div className="relative h-20 w-full rounded-lg overflow-hidden mb-1">
                            <Image src={p.images?.[0] || p.thumbnail || p.image || '/placeholder-fashion.jpg'} alt={p.title} fill className="object-cover" />
                          </div>
                          <p className="font-bold text-[10px] line-clamp-1 text-gray-900 dark:text-white">{p.title}</p>
                          <p className="text-[10px] font-extrabold text-amber-600">${p.price.toFixed(2)}</p>
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => addItem(p, 1)}
                              className="flex-1 bg-amber-600 text-white rounded-md py-1 text-[9px] font-bold"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => tryOnItem(p)}
                              className="px-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md py-1 text-[9px]"
                              title="Try On"
                            >
                              Try
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-gray-400 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>AI Stylist is thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-2">
            <input
              type="text"
              placeholder="Ask AI Stylist (e.g. Black shirt under 2000)..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => handleSend()}
              className="bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-xl transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
