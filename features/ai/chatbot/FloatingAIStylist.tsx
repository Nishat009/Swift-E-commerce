import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, ShoppingBag, RefreshCw } from 'lucide-react';
import { useAvatarStore } from '@/stores/avatarStore';
import { useCartStore } from '@/stores/cartStore';
import { StylistMessage } from '@/types/ai';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

const welcomeMessage: StylistMessage = {
  id: 'welcome_1',
  sender: 'assistant',
  text: "Hello! I am your Swift Style Assistant. Tell me your budget, occasion, or style vibe and I'll find available pieces from our catalog.",
  timestamp: '',
};

export default function FloatingAIStylist() {
  const { user } = useAuth();
  const { tryOnItem } = useAvatarStore();
  const addItem = useCartStore((state) => state.addItem);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<StylistMessage[]>([welcomeMessage]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef('');

  useEffect(() => {
    const existingSession = localStorage.getItem('swiftcart_chat_session');
    sessionIdRef.current = existingSession || crypto.randomUUID();
    if (!existingSession) localStorage.setItem('swiftcart_chat_session', sessionIdRef.current);
  }, []);

  useEffect(() => {
    if (user) return;
    const conversation = messages.filter((message) => message.id !== welcomeMessage.id).slice(-30);
    if (conversation.length) localStorage.setItem('swiftcart_chat_history', JSON.stringify(conversation));
  }, [messages, user]);

  useEffect(() => {
    if (!user) {
      try {
        const saved = JSON.parse(localStorage.getItem('swiftcart_chat_history') || '[]');
        setMessages(Array.isArray(saved) ? [welcomeMessage, ...saved.slice(-30)] : [welcomeMessage]);
      } catch {
        setMessages([welcomeMessage]);
      }
      return;
    }
    let active = true;
    apiClient.get('/chat/mine').then(({ data }) => {
      if (!active || !Array.isArray(data?.data)) return;
      const history: StylistMessage[] = data.data.flatMap((entry: {
        id: string; message: string; assistantReply: string; suggestedProducts?: StylistMessage['suggestedProducts']; createdAt: string;
      }) => {
        const timestamp = new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return [
          { id: `${entry.id}-user`, sender: 'user' as const, text: entry.message, timestamp },
          { id: `${entry.id}-assistant`, sender: 'assistant' as const, text: entry.assistantReply, timestamp, suggestedProducts: entry.suggestedProducts },
        ];
      });
      setMessages([welcomeMessage, ...history.slice(-30)]);
    }).catch(() => {});
    return () => { active = false; };
  }, [user?.id]);

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
    if (!text || isTyping) return;

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
      const response = await apiClient.post('/chat', { sessionId: sessionIdRef.current, message: text });
      const reply = response.data?.data?.reply;
      if (!reply?.text) throw new Error('The assistant did not return a reply.');
      const responseMsg: StylistMessage = {
        id: crypto.randomUUID(), sender: 'assistant', text: reply.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedProducts: reply.products,
      };
      setMessages((prev) => [...prev, responseMsg]);
    } catch {
      const fallback: StylistMessage = {
          id: Math.random().toString(),
          sender: 'assistant',
          text: 'The assistant is unavailable right now. Your message was not sent; please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallback]);
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
          className="group flex items-center gap-2 bg-ink text-paper text-xs font-medium tracking-wide pl-3.5 pr-4 py-3 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#c9a96b]" />
          <span>Swift Style Assistant</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[390px] h-[540px] bg-surface border border-line rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-stone-950 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-sans text-sm font-medium leading-tight">Swift Style Assistant</h3>
                <p className="text-[11px] text-stone-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Catalog Recommendations
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
          <div className="no-scrollbar p-2.5 border-b border-line flex gap-1.5 overflow-x-auto shrink-0">
            {promptChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap bg-transparent hover:border-ink border border-line text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0"
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
                  <div className="w-6 h-6 rounded-full bg-stone-100 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                  </div>
                )}

                <div className={`max-w-[82%] space-y-2`}>
                  <div
                    className={`p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-ink text-paper rounded-tr-sm'
                        : 'bg-stone-100 dark:bg-white/[0.06] text-stone-800 dark:text-stone-200 rounded-tl-sm'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className="block text-[10px] opacity-60 text-right mt-1">{msg.timestamp}</span>
                  </div>

                  {/* Suggested Outfit Card */}
                  {msg.suggestedOutfit && (
                    <div className="border border-line rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium text-ink">
                          {msg.suggestedOutfit.title}
                        </span>
                        <span className="font-medium text-ink">
                          ${msg.suggestedOutfit.totalPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {msg.suggestedOutfit.items.map((item) => (
                          <div key={item.id} className="relative h-16 rounded-sm overflow-hidden bg-stone-100 dark:bg-stone-800">
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
                          className="border border-line rounded-lg p-2 flex flex-col justify-between"
                        >
                          <div className="relative h-20 w-full rounded-sm overflow-hidden mb-1 bg-stone-100 dark:bg-stone-800">
                            <Image src={p.images?.[0] || p.thumbnail || p.image || '/placeholder-fashion.jpg'} alt={p.title} fill className="object-cover" />
                          </div>
                          <p className="font-medium text-[11px] line-clamp-1 text-ink">{p.title}</p>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400">${(p.price * (1 - (p.discountPercentage || 0) / 100)).toFixed(2)}</p>
                          <div className="flex gap-1 mt-1">
                            <button
                              onClick={() => addItem(p, 1)}
                              className="flex-1 bg-ink text-paper rounded-md py-1 text-[10px] font-medium"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => tryOnItem(p)}
                              className="px-1.5 bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300 rounded-md py-1 text-[10px]"
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
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-400" />
                <span>Finding available pieces...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-line flex gap-2">
            <input
              type="text"
              placeholder="Ask for styles (e.g. black shirt under $20)..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
              className="flex-1 bg-transparent border border-line rounded-full px-4 py-2 text-xs text-ink placeholder:text-stone-400 focus:outline-none focus:border-ink"
            />
            <button
              onClick={() => handleSend()}
              disabled={isTyping || !inputVal.trim()}
              className="bg-ink text-paper p-2.5 rounded-full transition-opacity hover:opacity-85 shrink-0 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
