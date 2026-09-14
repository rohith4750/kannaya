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
    <div className="h-[calc(100vh-5rem)] flex flex-col w-full space-y-4">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-[5px] border border-[#cbcbcb] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[5px] bg-[#6d8196]/10 text-[#6d8196]">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-[#4a4a4a] flex items-center gap-2">
              Kannaya AI Business Assistant
            </h1>
            <p className="text-xs text-slate-500">
              Query sales performance, highest debtors, low stock reorders, and shop financials in plain English.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-[5px] text-[10px] font-bold bg-[#ffffe3] text-[#4a4a4a] border border-[#cbcbcb] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#6d8196]" /> PostgreSQL Connected
        </span>
      </div>

      {/* Preset Query Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {presetQueries.map((pq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(pq)}
            className="bg-white hover:bg-[#ffffe3] text-[#4a4a4a] border border-[#cbcbcb] text-xs px-3 py-1.5 rounded-[5px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-[#6d8196]" /> {pq}
          </button>
        ))}
      </div>

      {/* Chat Conversation History */}
      <div className="flex-1 bg-white p-5 rounded-[5px] border border-[#cbcbcb] shadow-sm overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-4xl rounded-[5px] p-4 text-xs space-y-2 border ${
                m.sender === 'user'
                  ? 'bg-[#6d8196] text-white border-[#6d8196] font-medium'
                  : 'bg-slate-50 border-[#cbcbcb] text-[#4a4a4a]'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

              {/* Data Table / Cards rendering */}
              {m.data && (
                <div className="mt-3 pt-3 border-t border-[#cbcbcb]">
                  {Array.isArray(m.data) ? (
                    <div className="overflow-x-auto">
                      <table className="erp-table">
                        <thead>
                          <tr>
                            {Object.keys(m.data[0] || {}).map((k) => (
                              <th key={k}>
                                {k}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {m.data.map((row: any, i: number) => (
                            <tr key={i}>
                              {Object.values(row).map((v: any, j: number) => (
                                <td key={j} className="font-medium">
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
                        <div key={k} className="bg-white p-2 rounded-[5px] border border-[#cbcbcb]">
                          <span className="text-slate-500 text-[10px] block font-bold">{k}</span>
                          <span className="font-extrabold text-[#6d8196]">{String(v)}</span>
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
                  className="mt-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded-[5px] text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> {m.actionButton.label}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#6d8196]" /> Kannaya AI is analyzing live store data...
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
          className="flex-1 bg-white border border-[#cbcbcb] rounded-[5px] px-4 py-2.5 text-xs text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !query.trim()}
          className="bg-[#6d8196] hover:bg-[#5b6f84] text-white px-5 rounded-[5px] font-bold flex items-center gap-2 text-xs disabled:opacity-50 transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" /> Ask AI
        </button>
      </div>
    </div>
  );
}
