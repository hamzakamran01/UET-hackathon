'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Send, MessageSquare, X, Sparkles, Bot, User, Minimize2, Maximize2, Loader2, ChevronRight } from 'lucide-react';
import { aiAPI } from '@/lib/api/ai';
import { motion, AnimatePresence } from 'framer-motion';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: Date;
}

export default function AdminAssistantPanel() {
  const pathname = usePathname();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, open]);

  useEffect(() => {
    if (open && !minimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, minimized]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: input.trim(),
      timestamp: new Date(),
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
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistant]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: 'I encountered a system error. Please try again later.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Overview of today's queue",
    "Show active alerts",
    "List waiting services",
    "Analyze peak hours"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="pointer-events-auto mb-4 w-[400px] max-w-[calc(100vw-3rem)] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col"
            style={{ height: '600px', maxHeight: 'calc(100vh - 120px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">AI Commander</h3>
                  <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse"></span>
                    Online & Ready
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMinimized(true)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
                  <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-2">
                    <Bot className="w-10 h-10 text-blue-500/60" />
                  </div>
                  <div className="space-y-2 max-w-[280px]">
                    <h4 className="text-lg font-semibold text-white">How can I help you?</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      I can help you monitor queues, analyze performance, and manage services in real-time.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-[280px]">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(s);
                          // Optional: Auto-send or just populate
                        }}
                        className="text-xs text-left px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-blue-600/10 hover:text-blue-400 hover:border-blue-500/30 border border-slate-700/50 transition-all duration-300 flex items-center justify-between group"
                      >
                        {s}
                        <ChevronRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((m) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={m.id}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex max-w-[85%] gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${m.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-indigo-600 text-white'
                          }`}>
                          {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${m.role === 'user'
                              ? 'bg-blue-600 text-white rounded-tr-sm'
                              : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-sm'
                            }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          <span className="text-[10px] opacity-50 mt-1 block">
                            {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="flex max-w-[85%] gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        </div>
                        <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="relative">
                <input
                  ref={inputRef}
                  className="w-full rounded-xl bg-slate-800/50 pl-4 pr-12 py-3.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none border border-slate-700/50 focus:border-blue-500/50 focus:bg-slate-800 transition-all shadow-inner"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-600 mt-2">
                AI can make mistakes. Please verify sensitive information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto">
        <AnimatePresence mode="wait">
          {(!open || minimized) && (
            <motion.button
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setOpen(true);
                setMinimized(false);
              }}
              className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20 group-hover:opacity-40"></div>
              <Sparkles className="h-6 w-6" />

              {/* Notification Badge if needed */}
              {/* <span className="absolute top-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
              </span> */}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

