import React, { useState, useRef, useEffect } from 'react';
import { useAvatarStore } from '@/stores/avatarStore';
import { fashionProducts } from '@/data/fashionCatalog';
import { MessageSquare, Send, Bot, User, Sparkles, Plus, Check } from 'lucide-react';
import { Product } from '@/types';
import Image from 'next/image';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  suggestedItems?: Product[];
}

export default function ChatAssistant() {
  const { tryOnItem, wornItems } = useAvatarStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hi there! I am your SwiftCart AI styling assistant. Tell me what occasion or vibe you are shopping for today! For example, try clicking one of the style prompts below.',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const prompts = [
    { text: '☀️ Summer Resort Beach', query: 'summer beach' },
    { text: '💼 Business Office Meeting', query: 'office meeting' },
    { text: '🥂 Evening cocktail party', query: 'cocktail party' },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getSpec = (product: Product, key: string): string => {
    if (!product.specifications) return '';
    if (typeof (product.specifications as any).get === 'function') {
      return (product.specifications as any).get(key) || '';
    }
    return (product.specifications as any)[key] || '';
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text,
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');

    // Generate AI response based on keywords
    setTimeout(() => {
      let responseText = "Interesting choice! I don't see any matching items in the immediate closet racks, but you can try styling denim jeans with a premium white tee!";
      let suggestions: Product[] = [];

      const query = text.toLowerCase();
      if (query.includes('summer') || query.includes('beach') || query.includes('resort')) {
        responseText = "Perfect! For a summer resort vibe, I suggest going with light, breathable items. Let's try on a Cream Cropped Ribbed Tank, Tailored Linen Trousers, and Oval Acetate Sunglasses for that classic vacation aesthetic.";
        suggestions = fashionProducts.filter((p) => [101, 104, 303].includes(Number(p.id)));
      } else if (query.includes('office') || query.includes('meeting') || query.includes('business') || query.includes('formal') || query.includes('corporate')) {
        responseText = "Understood. For a sleek professional setting, you want clean structures. I recommend layering the Camel Trench Coat over an Oxford Shirt and Sandy Chino pants.";
        suggestions = fashionProducts.filter((p) => [106, 202, 204].includes(Number(p.id)));
      } else if (query.includes('party') || query.includes('evening') || query.includes('cocktail') || query.includes('wedding')) {
        responseText = "Lovely! For evenings and events, try wearing our Silk Cowl-Neck Slip Dress paired with the Gold Choker & Hoop set, or the Eco-Leather Bomber for a masculine edgy night out.";
        suggestions = fashionProducts.filter((p) => [105, 108, 205].includes(Number(p.id)));
      } else if (query.includes('street') || query.includes('hype') || query.includes('casual')) {
        responseText = "Got it! Streetwear is all about comfort and utility. I suggest our Heavyweight Combed Cotton White Tee paired with Olive Cargo Pants and platform sneakers.";
        suggestions = fashionProducts.filter((p) => [201, 203, 207].includes(Number(p.id)));
      }

      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: responseText,
        suggestedItems: suggestions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 1000);
  };

  const isWorn = (product: Product): boolean => {
    const layer = getSpec(product, 'Layer').toLowerCase() as keyof typeof wornItems;
    return wornItems[layer]?.id === product.id;
  };

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm h-full justify-between">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-5 h-5 text-[#8b6f47] dark:text-[#c9a96b]" />
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
          Style Assistant
        </h3>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto max-h-[300px] mb-4 space-y-4 pr-1 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'assistant' && (
              <div className="w-6.5 h-6.5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            
            <div className="flex flex-col gap-2 max-w-[85%]">
              <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#8b6f47] text-white dark:bg-[#c9a96b] dark:text-gray-950 rounded-tr-none'
                  : 'bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-400 rounded-tl-none'
              }`}>
                {msg.text}
              </div>

              {/* Suggested items if any */}
              {msg.suggestedItems && msg.suggestedItems.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mt-1">
                  {msg.suggestedItems.map((item) => {
                    const worn = isWorn(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() => tryOnItem(item)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all hover:bg-gray-50/50 ${
                          worn
                            ? 'border-[#8b6f47] bg-[#8b6f47]/5 text-[#8b6f47] dark:border-[#c9a96b] dark:text-[#c9a96b]'
                            : 'border-gray-100 dark:border-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                            <Image src={item.thumbnail} alt={item.title} fill className="object-cover" />
                          </div>
                          <span className="truncate max-w-[120px]">{item.title}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0 mr-1">${item.price}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-6.5 h-6.5 rounded-full bg-[#8b6f47]/10 flex items-center justify-center text-[#8b6f47] shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Bottom controls */}
      <div>
        {/* Quick Prompts list */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.query)}
              className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full text-[10px] font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              {p.text}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputVal);
          }}
          className="flex gap-2"
        >
          <Input
            type="text"
            placeholder="Ask about styles, seasons, colors..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 text-xs py-2 border-gray-200"
          />
          <Button
            type="submit"
            disabled={!inputVal.trim()}
            className="bg-[#8b6f47] hover:bg-[#6b5435] text-white p-2 rounded-xl flex items-center justify-center border-0 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
