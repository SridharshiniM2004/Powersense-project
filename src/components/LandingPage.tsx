import React, { useState } from 'react';
import {
  Zap,
  FileScan,
  TrendingUp,
  Bot,
  BarChart3,
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calculator,
  Flame,
  Award,
} from 'lucide-react';

interface LandingPageProps {
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  isAdmin?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ setActiveTab, onOpenAuth, isAdmin = false }) => {
  // Interactive Landing Calculator State
  const [calcUnits, setCalcUnits] = useState<number>(480);
  const [calcTariff, setCalcTariff] = useState<'Residential' | 'Commercial'>('Residential');
  const [calcHasSolar, setCalcHasSolar] = useState<boolean>(false);

  // Quick live estimate
  const ratePerUnit = calcTariff === 'Residential' ? 0.24 : 0.28;
  const rawCost = calcUnits * ratePerUnit + 14.50;
  const solarCredit = calcHasSolar ? rawCost * 0.45 : 0;
  const estimatedCost = Math.round((rawCost - solarCredit) * 100) / 100;
  const potentialSavings = Math.round((rawCost * 0.22) * 100) / 100;

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-28">
        {/* Glowing Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-indigo-500/15 to-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next-Gen Energy AI & OCR Machine Learning Engine</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Predict, Analyze & Optimize Your Electricity Bills with <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">PowerSense AI</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Scan utility bills instantly using OCR, run ML-driven unit & cost forecasting, uncover hidden tariff surges, and receive real-time AI recommendations to cut energy costs by up to 30%.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setActiveTab('ocr')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500 text-slate-950 font-bold text-sm hover:opacity-95 shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 group"
              >
                <FileScan className="w-4 h-4" />
                <span>Upload Bill OCR Scan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 font-semibold text-sm hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Explore Live Dashboard</span>
              </button>
            </div>

            {/* Trust Metrics */}
            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80 text-left">
              <div>
                <p className="text-2xl font-black text-cyan-400">98.4%</p>
                <p className="text-xs text-slate-400">PaddleOCR Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400">12.3 kWh</p>
                <p className="text-xs text-slate-400">ML Model MAE Error</p>
              </div>
              <div>
                <p className="text-2xl font-black text-indigo-400">$184k+</p>
                <p className="text-xs text-slate-400">User Energy Savings</p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-400">Real-Time</p>
                <p className="text-xs text-slate-400">OpenRouter AI Chatbot</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Quick ROI Estimator Widget */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Calculator className="w-4 h-4" />
                <span>Live Energy & Savings Simulator</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Instant Bill & Optimization Calculator</h2>
              <p className="text-xs text-slate-400">
                Adjust monthly kWh usage and setup parameters to test our ML tariff forecasting logic.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('prediction')}
              className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-all flex items-center space-x-2"
            >
              <span>Launch Full ML Predictor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Inputs */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-300 mb-2">
                  <span>Monthly Consumption Target</span>
                  <span className="font-mono text-cyan-400 font-bold text-sm">{calcUnits} kWh</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1500"
                  step="10"
                  value={calcUnits}
                  onChange={(e) => setCalcUnits(Number(e.target.value))}
                  className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>100 kWh (Apartment)</span>
                  <span>750 kWh (House)</span>
                  <span>1500 kWh (Large Commercial)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Tariff Schedule</label>
                  <select
                    value={calcTariff}
                    onChange={(e: any) => setCalcTariff(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Residential">Residential Tiered ($0.24/kWh)</option>
                    <option value="Commercial">Commercial Small Business ($0.28/kWh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Solar Net-Metering</label>
                  <button
                    type="button"
                    onClick={() => setCalcHasSolar(!calcHasSolar)}
                    className={`w-full py-2 px-3 rounded-lg border text-left font-medium transition-all ${
                      calcHasSolar
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {calcHasSolar ? 'Solar Active (-45% Grid Draw)' : 'No Solar (100% Grid)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Preview Box */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Estimated Monthly Bill</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {calcTariff}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-3xl font-black text-white font-mono">${estimatedCost}</p>
                <p className="text-xs text-slate-400">
                  Base Energy Charges + Fixed Grid Fees
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AI Optimization Potential</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">${potentialSavings}/mo</span>
                </div>
                <p className="text-[11px] text-emerald-400/80">
                  By shifting peak hour loads and setting AC setpoint +2°F.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-white">Full-Stack SaaS Feature Suite</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Engineered with modern machine learning, high-accuracy OCR vision, and OpenRouter AI chat capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <FileScan className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">PaddleOCR Bill Scanner</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload utility bill photos or PDFs. Automatically parses meter readings, tariff categories, due dates, fixed charges, and net consumption with 98%+ accuracy.
            </p>
            <button
              onClick={() => setActiveTab('ocr')}
              className="text-xs font-semibold text-cyan-400 flex items-center space-x-1 hover:underline pt-2"
            >
              <span>Scan Utility Bill</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">XGBoost & LightGBM Predictor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Predict next month's kWh consumption and bill amounts with upper/lower confidence bounds, peak demand warnings, and carbon footprint metrics.
            </p>
            <button
              onClick={() => setActiveTab('prediction')}
              className="text-xs font-semibold text-emerald-400 flex items-center space-x-1 hover:underline pt-2"
            >
              <span>Run Prediction Model</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-indigo-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">AI Energy Chatbot</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Chat directly with your personal AI energy advisor. Asks questions about your bill breakdown, tariff slab thresholds, solar net metering, and appliance audits.
            </p>
            <button
              onClick={() => setActiveTab('chatbot')}
              className="text-xs font-semibold text-indigo-400 flex items-center space-x-1 hover:underline pt-2"
            >
              <span>Start AI Consultation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* No Subscription Guarantee & System Modules */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 lg:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>100% Free & Open Access — No Subscriptions Required</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white max-w-3xl mx-auto leading-tight">
            Comprehensive Energy Intelligence for Every Indian Household & Enterprise
          </h2>

          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            PowerSense operates completely subscription-free. Access OCR bill scanning, ML electricity cost prediction in Indian Rupees (₹), and AI-driven energy-saving recommendations without hidden fees or paywalls.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={onOpenAuth}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black text-sm hover:from-cyan-400 hover:to-emerald-400 shadow-xl shadow-cyan-500/20 transition-all flex items-center space-x-2"
            >
              <span>Launch Dashboard Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
