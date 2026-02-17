'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Send, MessageCircle } from 'lucide-react';
import { aiAPI } from '@/lib/api/ai';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

export default function AdminAssistantPanel() {
  const pathname = usePathname();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiAPI.sendMessage({
        message: userMessage.text,
        context: {
          currentRoute: pathname ?? undefined,
        },
      });

      const assistant: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: response.message,
      };

      setMessages((prev) => [...prev, assistant]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        text:
          'I could not process this request right now. Please try again in a moment.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div className="mb-3 w-[320px] sm:w-[380px] rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                AI
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-100">
                  Admin Assistant
                </span>
                <span className="text-[10px] text-slate-400">
                  Ask about queues, services, tokens
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-100"
            >
              Close
            </button>
          </div>

          <div className="flex-1 max-h-72 overflow-y-auto px-3 py-2 space-y-2 text-xs text-slate-100">
            {messages.length === 0 && (
              <p className="text-[11px] text-slate-400">
                Try: &quot;Show me today&apos;s queue for this page&quot; or
                &quot;Cancel token ABC-001 for service&quot;.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/80 px-3 py-2">
            <input
              className="flex-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none border border-slate-700 focus:border-blue-500"
              placeholder="Ask the assistant..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs disabled:opacity-60"
            >
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-900/40 hover:bg-blue-500 transition-colors"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}

