import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  FileScan,
  Zap,
  DollarSign,
  Cpu,
  Activity,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { api } from '../services/api';
import { AdminStats, User } from '../types';

export const AdminPanel: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, u] = await Promise.all([api.getAdminStats(), api.getAdminUsers()]);
        setStats(s);
        setUsers(u);
      } catch (err: any) {
        console.error('Admin fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3 bg-slate-900 rounded-3xl border border-slate-800">
        <Cpu className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-300">Loading PowerSense Admin Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Platform Control & Model Diagnostics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            PowerSense SaaS Admin Operations
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Monitor system-wide OCR model accuracy, ML MAE forecasting metrics, active SaaS users, and aggregate grid energy savings.
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Total SaaS Users</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono">{stats.totalUsers.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-400 font-semibold">{stats.activeUsers24h} Active (Last 24h)</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Bills Processed</span>
              <FileScan className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-300 font-mono">{stats.totalBillsProcessed.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400">PaddleOCR Accuracy: <strong className="text-emerald-400">{stats.ocrAccuracyPercent}%</strong></p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Total Energy Analyzed</span>
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-indigo-300 font-mono">{(stats.totalKwhAnalyzed / 1000000).toFixed(2)} MWh</p>
            <p className="text-[11px] text-slate-400">Model MAE: <strong className="text-indigo-400">{stats.modelMaeKwh} kWh</strong></p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Aggregate User Savings</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-300 font-mono">${stats.totalSavingsGeneratedAmount.toLocaleString()}</p>
            <p className="text-[11px] text-amber-400 font-semibold">Verified Utility Cost Reduction</p>
          </div>
        </div>
      )}

      {/* User Management List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Registered SaaS Accounts ({users.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">User Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Utility Provider</th>
                <th className="px-4 py-3">Consumer ID</th>
                <th className="px-4 py-3">Sanctioned Load</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                  <td className="px-4 py-3 text-slate-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.utilityProvider}</td>
                  <td className="px-4 py-3 text-cyan-400">{u.consumerNumber}</td>
                  <td className="px-4 py-3 text-emerald-400">{u.sanctionedLoadKw} kW</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
