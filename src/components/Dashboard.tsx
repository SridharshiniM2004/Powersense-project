import React from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  FileScan,
  AlertTriangle,
  Sparkles,
  Lightbulb,
  DollarSign,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Leaf,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { BillRecord, User, PredictionResult, Recommendation } from '../types';

interface DashboardProps {
  user: User | null;
  bills: BillRecord[];
  prediction: PredictionResult | null;
  recommendations: Recommendation[];
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  bills,
  prediction,
  recommendations,
  setActiveTab,
}) => {
  const latestBill = bills && bills.length > 0 ? bills[0] : null;
  const prevBill = bills && bills.length > 1 ? bills[1] : null;

  // Recharts Data Mapping
  const chartData = [...(bills || [])].reverse().map((b) => ({
    month: b?.billingMonth ? b.billingMonth.replace('2026-', 'M') : '',
    historicalKwh: b?.unitsConsumedKwh ?? 0,
    costAmount: b?.amountDue ?? 0,
  }));

  if (prediction) {
    chartData.push({
      month: 'Next ML',
      historicalKwh: undefined as any,
      costAmount: prediction.predictedAmount,
      predictedKwh: prediction.predictedUnitsKwh,
    } as any);
  }

  const billChangePercent = (latestBill && prevBill && prevBill.amountDue > 0)
    ? Math.round(((latestBill.amountDue - prevBill.amountDue) / prevBill.amountDue) * 100)
    : 12;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Welcome */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Grid Connection Online • {user?.utilityProvider || 'Pacific Grid Electric'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Hello, {user?.name || 'Alex Rivera'}
          </h1>
          <p className="text-xs text-slate-400 flex items-center space-x-3">
            <span>Consumer ID: <strong className="text-slate-200 font-mono">{user?.consumerNumber || 'PGP-8849-3021'}</strong></span>
            <span>•</span>
            <span>Sanctioned Load: <strong className="text-cyan-400 font-mono">{user?.sanctionedLoadKw || 6.5} kW</strong></span>
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <button
            onClick={() => setActiveTab('ocr')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-emerald-400 transition-all flex items-center space-x-2 shadow-lg shadow-cyan-500/15"
          >
            <FileScan className="w-4 h-4" />
            <span>Scan Utility Bill</span>
          </button>

          <button
            onClick={() => setActiveTab('prediction')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>ML Forecast</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Latest Bill */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Current Month Bill</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">
              ${latestBill ? (latestBill.amountDue ?? 0).toFixed(2) : '0.00'}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-0.5 ${
                billChangePercent > 0 ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
              }`}
            >
              {billChangePercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(billChangePercent)}% vs last month</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Billing Month: <span className="text-slate-300 font-medium">{latestBill?.billingMonth || 'N/A'}</span> (Paid)
          </p>
        </div>

        {/* Card 2: Units Consumed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Energy Consumption</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">{latestBill?.unitsConsumedKwh ?? 0} <span className="text-sm font-normal text-slate-400">kWh</span></span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300">
              {latestBill?.tariffCategory || 'Residential'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Power Factor: <span className="text-emerald-400 font-mono font-bold">{latestBill?.powerFactor ?? 0.95}</span> (Optimal)
          </p>
        </div>

        {/* Card 3: Next Month ML Forecast */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">ML Predicted Next Bill</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-indigo-300 font-mono">
              ${prediction ? prediction.predictedAmount.toFixed(2) : '158.40'}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
              {prediction ? prediction.predictedUnitsKwh : 580} kWh
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Model: <span className="text-slate-300">XGBoost Ensemble (98.4% Accuracy)</span>
          </p>
        </div>

        {/* Card 4: CO2 & Energy Savings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Potential AI Savings</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-300 font-mono">$75.00/mo</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              -22% kWh
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-400 inline" />
            <span>Carbon Footprint: 203 kg CO₂</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Interactive Analytics Chart + Tariff & Anomaly Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart Box */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span>Historical vs ML Forecast Consumption Curve</span>
              </h2>
              <p className="text-xs text-slate-400">
                Monthly electricity units (kWh) and bill amounts ($) mapped against XGBoost model prediction.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('analytics')}
              className="text-xs font-semibold text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area yAxisId="left" type="monotone" dataKey="historicalKwh" name="Historical kWh" fill="#06b6d4" fillOpacity={0.15} stroke="#06b6d4" strokeWidth={2.5} />
                <Bar yAxisId="right" dataKey="costAmount" name="Bill Amount ($)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                <Line yAxisId="left" type="monotone" dataKey="predictedKwh" name="ML Predicted kWh" stroke="#818cf8" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 6, fill: '#818cf8' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar: Tariff Slab Meter & Peak Demand Gauge */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tariff Slab Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Time-Of-Use Tariff Slabs</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Active Tier 2
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Off-Peak (11 PM - 8 AM)</span>
                  <span className="text-emerald-400 font-bold">$0.16 / kWh</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[45%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Mid-Peak (8 AM - 2 PM)</span>
                  <span className="text-cyan-400 font-bold">$0.24 / kWh</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div className="bg-cyan-500 h-full w-[70%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>On-Peak Surge (2 PM - 7 PM)</span>
                  <span className="text-rose-400 font-bold">$0.34 / kWh</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-500 h-full w-[90%]"></div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-semibold text-slate-200">Peak Demand Warning:</span>
              <p>Your household AC draw overlaps with 2 PM - 5 PM peak surge tariff rates.</p>
            </div>
          </div>

          {/* AI Energy Recommendation Card */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/50 rounded-3xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>Top AI Energy Recommendation</span>
            </div>

            {recommendations[0] && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">{recommendations[0].title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {recommendations[0].description}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">+${recommendations[0].estimatedMonthlySavings}/mo Savings</span>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className="text-indigo-400 hover:underline text-[11px] font-semibold"
                  >
                    View All Tips →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bills Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Electricity Bills & OCR Scans</h3>
            <p className="text-xs text-slate-400">All historical bill invoices stored in persistent session store.</p>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-semibold text-cyan-400 hover:underline"
          >
            View Complete History ({bills.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Invoice No</th>
                <th className="px-4 py-3">Billing Month</th>
                <th className="px-4 py-3">Meter Reading (Prev → Curr)</th>
                <th className="px-4 py-3">Units (kWh)</th>
                <th className="px-4 py-3">Tariff</th>
                <th className="px-4 py-3">Amount ($)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {bills.slice(0, 4).map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{b.billNumber}</td>
                  <td className="px-4 py-3 text-slate-300">{b.billingMonth}</td>
                  <td className="px-4 py-3 text-slate-400">{b.previousReading} → {b.currentReading}</td>
                  <td className="px-4 py-3 text-cyan-400 font-bold">{b.unitsConsumedKwh} kWh</td>
                  <td className="px-4 py-3 text-slate-300">{b.tariffCategory}</td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">${(b?.amountDue ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
