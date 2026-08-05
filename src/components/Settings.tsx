import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle2, DollarSign, Bell, Bot, Sliders } from 'lucide-react';
import { api } from '../services/api';
import { UserSettings } from '../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const s = await api.getSettings();
        setSettings(s);
      } catch (err: any) {
        console.error('Settings fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSuccess(false);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
        Loading PowerSense Application Settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 flex items-center space-x-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Application Settings & Preferences</h1>
          <p className="text-xs text-slate-400">Configure regional currencies, high bill thresholds, and AI model parameters.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl text-xs">
        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* Currency & Units */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span>Regional Currency & Energy Units</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Currency Symbol</label>
              <select
                value={settings.currency}
                onChange={(e: any) =>
                  setSettings({
                    ...settings,
                    currency: e.target.value,
                    currencySymbol: e.target.value === 'INR' ? '₹' : e.target.value === 'EUR' ? '€' : e.target.value === 'GBP' ? '£' : '$',
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500"
              >
                <option value="USD">USD ($ - United States Dollar)</option>
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Energy Unit Standard</label>
              <select
                value={settings.unitType}
                onChange={(e: any) => setSettings({ ...settings, unitType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500"
              >
                <option value="kWh">Kilowatt-Hour (kWh)</option>
                <option value="MWh">Megawatt-Hour (MWh)</option>
              </select>
            </div>
          </div>
        </div>

        {/* High Bill Threshold */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>High Bill Anomaly Threshold</span>
          </h2>

          <div>
            <div className="flex justify-between text-slate-300 font-medium mb-1">
              <span>Alert Surge Threshold (%)</span>
              <span className="text-amber-400 font-bold">+{settings.alertThresholdPercent}% vs baseline</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={settings.alertThresholdPercent}
              onChange={(e) => setSettings({ ...settings, alertThresholdPercent: Number(e.target.value) })}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>

        {/* AI Chatbot Model */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center space-x-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>OpenRouter AI assistant model</span>
          </h2>

          <div>
            <label className="block text-slate-300 font-medium mb-1">AI Chat Model Alias</label>
            <select
              value={settings.aiChatModel}
              onChange={(e) => setSettings({ ...settings, aiChatModel: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500"
            >
              <option value="nvidia/nemotron-3-ultra-550b-a55b:free">Nemotron 3 Ultra (OpenRouter)</option>
              <option value="openrouter-gpt4o">OpenRouter / GPT-4o Power Advisor</option>
            </select>
          </div>
        </div>

        {/* Notification Toggles */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center space-x-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span>Notification & Alert Preferences</span>
          </h2>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
              <span className="text-slate-300 font-medium">Email Bill Reports & Insights Digest</span>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-4 h-4 accent-cyan-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
              <span className="text-slate-300 font-medium">Instant SMS High Tariff Surge Alerts</span>
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                className="w-4 h-4 accent-cyan-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
              <span className="text-slate-300 font-medium">Weekly AI Recommendation Summary</span>
              <input
                type="checkbox"
                checked={settings.weeklySummary}
                onChange={(e) => setSettings({ ...settings, weeklySummary: e.target.checked })}
                className="w-4 h-4 accent-cyan-500"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-emerald-400 shadow-lg shadow-cyan-500/15 transition-all flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Preferences...' : 'Save All Settings'}</span>
        </button>
      </form>
    </div>
  );
};
