import React from 'react';
import { Zap, ShieldCheck, Cpu, HardDrive, Sparkles, Code2 } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="font-extrabold text-lg text-slate-100">
                Power<span className="text-cyan-400">Sense</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Enterprise AI-Based Smart Electricity Bill Prediction, OCR Extraction, and Energy Optimization System. Built for residential homes, commercial enterprises, and utility operators.
            </p>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>System Operational</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Loaded prediction models + OpenRouter</span>
              </span>
            </div>
          </div>

          {/* Core Modules */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-semibold text-sm">Core Modules</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveTab('dashboard')} className="hover:text-cyan-400 transition-colors">
                  Interactive Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('ocr')} className="hover:text-cyan-400 transition-colors">
                  PaddleOCR & Document Scanner
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('prediction')} className="hover:text-cyan-400 transition-colors">
                  ML kWh & Cost Predictor
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('analytics')} className="hover:text-cyan-400 transition-colors">
                  Tariff & Load Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* AI Features */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-semibold text-sm">AI Capabilities</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveTab('chatbot')} className="hover:text-cyan-400 transition-colors">
                  AI Energy Chatbot
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('recommendations')} className="hover:text-cyan-400 transition-colors">
                  Personalized Energy Savings
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('history')} className="hover:text-cyan-400 transition-colors">
                  Audit & Bill History
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('admin')} className="hover:text-cyan-400 transition-colors">
                  Admin Analytics Panel
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture Tech Stack */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-semibold text-sm">Tech Architecture</h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>Frontend:</span>
                <span className="font-mono text-cyan-400">React + Tailwind</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>Backend:</span>
                <span className="font-mono text-emerald-400">FastAPI / Supabase</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-between">
                <span>OCR & AI:</span>
                <span className="font-mono text-indigo-400">PaddleOCR + OpenRouter</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} PowerSense Inc. All rights reserved. Free & Open Energy Platform.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer">Security Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
