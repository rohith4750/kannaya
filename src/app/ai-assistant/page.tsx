'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, MessageSquare, ArrowRight, User, Package, RefreshCw } from 'lucide-react';

export default function AIAssistantPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([
    {
      sender: 'ai',
      text: 'Hello! I am **Kannaya AI**, your intelligent electrical store assistant. How can I help you today?',
      data: null,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const presetQueries = [
    'Which customer owes me the most?',
    'Which products are selling fastest?',
    'Show low stock products needing restock',
    'What is total supplier pending due?',
  ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || query;
    if (!q.trim()) return;

    const userMsg = { sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.answer,
          data: data.data,
          actionButton: data.actionButton,
        },
      ]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Sorry, I encountered an issue retrieving shop analytics data.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionButton = async (btn: any) => {
    if (btn.type === 'whatsapp_reminder') {
      try {
        const res = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reminder',
            customerPhone: btn.phone,
            customerName: btn.name,
            dueAmount: btn.dueAmount,
          }),
        });
        const data = await res.json();
        if (data.whatsappUrl) window.open(data.whatsappUrl, '_blank');
      } catch (e) {
        console.error(e);
      }
    } else if (btn.type === 'whatsapp_reorder') {
      window.location.href = '/suppliers';
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-5 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              Kannaya AI Business Assistant
            </h1>
            <p className="text-xs text-slate-400">
              Query sales performance, highest debtors, low stock reorders, and shop financials in plain English.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> PostgreSQL NLP Connected
        </span>
      </div>

      {/* Preset Query Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {presetQueries.map((pq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(pq)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-400" /> {pq}
          </button>
        ))}
      </div>

      {/* Chat Conversation History */}
      <div className="flex-1 glass-panel p-5 rounded-2xl overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs space-y-2 ${
                m.sender === 'user'
                  ? 'bg-amber-500 text-slate-950 font-semibold rounded-br-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

              {/* Data Table / Cards rendering */}
              {m.data && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  {Array.isArray(m.data) ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px]">
                        <thead className="text-slate-400 uppercase text-[9px]">
                          <tr>
                            {Object.keys(m.data[0] || {}).map((k) => (
                              <th key={k} className="py-1 px-2">
                                {k}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {m.data.map((row: any, i: number) => (
                            <tr key={i}>
                              {Object.values(row).map((v: any, j: number) => (
                                <td key={j} className="py-1.5 px-2 font-medium">
                                  {String(v)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {Object.entries(m.data).map(([k, v]) => (
                        <div key={k} className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                          <span className="text-slate-400 text-[10px] block">{k}</span>
                          <span className="font-bold text-amber-400">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              {m.actionButton && (
                <button
                  onClick={() => handleActionButton(m.actionButton)}
                  className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> {m.actionButton.label}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> Kannaya AI is analyzing live store data...
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI anything (e.g. Which customer owes me the most?)"
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-xl font-bold flex items-center gap-2 text-xs disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" /> Ask AI
        </button>
      </div>
    </div>
  );
}
