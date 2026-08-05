import React, { useState } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  Clock,
  Zap,
  TrendingUp,
  Leaf,
  Activity,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { BillRecord } from '../types';

interface InteractiveAnalyticsProps {
  bills: BillRecord[];
}

export const InteractiveAnalytics: React.FC<InteractiveAnalyticsProps> = ({ bills }) => {
  const [timeframe, setTimeframe] = useState<'6m' | '1y'>('6m');

  // Appliance Power Distribution Data
  const applianceData = [
    { name: 'HVAC & AC Units', value: 38, color: '#06b6d4' },
    { name: 'Refrigeration & Appliances', value: 24, color: '#10b981' },
    { name: 'EV Charger Level 2', value: 18, color: '#818cf8' },
    { name: 'Lighting & Electronics', value: 12, color: '#f59e0b' },
    { name: 'Water Heater', value: 8, color: '#ec4899' },
  ];

  // Peak Hours Heatmap Data
  const peakDistribution = [
    { hour: '12 AM - 4 AM', kwh: 42, rate: '₹4.75 (Off-Peak)' },
    { hour: '4 AM - 8 AM', kwh: 58, rate: '₹4.75 (Off-Peak)' },
    { hour: '8 AM - 12 PM', kwh: 95, rate: '₹6.50 (Mid-Peak)' },
    { hour: '12 PM - 4 PM', kwh: 145, rate: '₹10.50 (On-Peak Surge)' },
    { hour: '4 PM - 8 PM', kwh: 130, rate: '₹10.50 (On-Peak Surge)' },
    { hour: '8 PM - 12 AM', kwh: 58, rate: '₹6.50 (Mid-Peak)' },
  ];

  const trendData = [...bills].reverse().map((b) => ({
    month: b.billingMonth,
    units: b.unitsConsumedKwh,
    amount: b.amountDue,
    co2: Math.round(b.unitsConsumedKwh * 0.385),
  }));

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Interactive Power & Tariff Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Energy Consumption & Load Analytics
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Explore appliance power breakdowns, time-of-use peak demand hours, power factor efficiency logs, and carbon emissions metrics.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setTimeframe('6m')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeframe === '6m' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Last 6 Months
          </button>
          <button
            onClick={() => setTimeframe('1y')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeframe === '1y' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            12-Month Year View
          </button>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Area Chart */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span>Multi-Month Electricity Unit (kWh) & Cost (₹) Curve</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">Recharts Engine</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="units" name="Consumed kWh" fill="#06b6d4" fillOpacity={0.2} stroke="#06b6d4" strokeWidth={3} />
                <Area type="monotone" dataKey="amount" name="Bill Amount (₹)" fill="#10b981" fillOpacity={0.15} stroke="#10b981" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appliance Pie Chart */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <PieIcon className="w-5 h-5 text-indigo-400" />
              <span>Household Power Share (%)</span>
            </h2>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={applianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {applianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs">
            {applianceData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-300">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </span>
                <span className="font-mono font-bold text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time of Use Peak Hours Heatmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Daily Time-Of-Use Load Distribution (24-Hour)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Shift power-heavy loads away from 12 PM - 7 PM to reduce tier surge charges.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {peakDistribution.map((slot, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border space-y-2 text-center transition-all ${
                slot.rate.includes('Surge')
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : slot.rate.includes('Off-Peak')
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}
            >
              <p className="font-bold text-white">{slot.hour}</p>
              <p className="text-xl font-black font-mono">{slot.kwh} <span className="text-xs">kWh</span></p>
              <p className="text-[10px] font-semibold">{slot.rate}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
