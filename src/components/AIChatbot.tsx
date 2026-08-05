import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  RefreshCw,
  User as UserIcon,
  HelpCircle,
  Lightbulb,
  FileText,
  DollarSign,
  ThumbsUp,
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage, BillRecord, User } from '../types';

interface AIChatbotProps {
  user: User | null;
  bills: BillRecord[];
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ user, bills }) => {
  const latestBill = bills[0];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `Hello ${user?.name || 'Rajesh'}! I am **PowerSense AI** — your dedicated energy optimization assistant.\n\nI have automatically loaded your latest OCR bill (**Month ${latestBill?.billingMonth || '2026-07'}**: **${latestBill?.unitsConsumedKwh || 528} kWh**, **₹${latestBill?.amountDue || 4224.00}**).\n\nHow can I help you save on your electricity bill today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'How can I lower my electricity bill by 20%?',
        'Explain my Tier 2 vs Tier 3 tariff pricing',
        'What is the payback period for a 5kW solar panel?',
        'How does my peak load affect fixed charges?',
      ],
      billContextAttached: true,
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const reply = await api.sendChatMessage(query, historyPayload);

      const assistantMsg: ChatMessage = {
        id: `msg_res_${Date.now()}`,
        sender: 'assistant',
        text: reply.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: reply.suggestions || [
          'Show me my appliance power breakdown',
          'How can I optimize my EV charger schedule?',
        ],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text: `Error connecting to PowerSense AI: ${err.message}. Please check your internet connection or server status.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OpenRouter • Nemotron energy advisor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            PowerSense AI Energy Advisor
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Context-aware AI assistant equipped with your actual utility bill OCR records, tariff tier structures, and ML forecasting predictions.
          </p>
        </div>

        {latestBill && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1">
            <span className="text-slate-400 font-semibold flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bill Context Attached</span>
            </span>
            <p className="font-mono text-cyan-400 font-bold">
              {latestBill.billingMonth}: {latestBill.unitsConsumedKwh} kWh (${latestBill.amountDue})
            </p>
          </div>
        )}
      </div>

      {/* Main Chat Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col h-[600px] relative">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 flex-shrink-0 mt-0.5 shadow-md shadow-cyan-500/15">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 space-y-3 leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Formatted Text */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Suggestions Pills */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Suggested Queries:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(sug)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] text-cyan-300 hover:text-white transition-all text-left"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className={`text-[10px] ${
                    msg.sender === 'user' ? 'text-slate-900/80' : 'text-slate-400'
                  } text-right`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 flex-shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-3 text-xs text-slate-400 p-2">
              <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span>PowerSense AI is analyzing tariff schedules & generating advice...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="pt-4 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your electricity bill, tariff tiers, solar ROI, or AC setpoint..."
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 transition-all flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
