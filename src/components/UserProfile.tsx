import React, { useState } from 'react';
import { User as UserIcon, Shield, Building, Home, Users, Save, CheckCircle2, Zap } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface UserProfileProps {
  user: User | null;
  onUserUpdated: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUserUpdated }) => {
  const [name, setName] = useState(user?.name || '');
  const [utilityProvider, setUtilityProvider] = useState(user?.utilityProvider || '');
  const [consumerNumber, setConsumerNumber] = useState(user?.consumerNumber || '');
  const [sanctionedLoadKw, setSanctionedLoadKw] = useState(user?.sanctionedLoadKw || 6.5);
  const [homeAreaSqFt, setHomeAreaSqFt] = useState(user?.homeAreaSqFt || 1850);
  const [occupants, setOccupants] = useState(user?.occupants || 4);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const updated = await api.updateProfile({
        name,
        utilityProvider,
        consumerNumber,
        sanctionedLoadKw,
        homeAreaSqFt,
        occupants,
      });
      onUserUpdated(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 flex items-center space-x-4 shadow-xl">
        <img
          src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
          alt={user?.name}
          className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/40"
        />
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-white">{user?.name}</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-slate-400">{user?.email}</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl text-xs">
        <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center space-x-2">
          <UserIcon className="w-4 h-4 text-cyan-400" />
          <span>Household & Utility Specification</span>
        </h2>

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Profile successfully updated in database!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Utility Electric Provider</label>
            <input
              type="text"
              value={utilityProvider}
              onChange={(e) => setUtilityProvider(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Consumer / Meter ID</label>
            <input
              type="text"
              value={consumerNumber}
              onChange={(e) => setConsumerNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Sanctioned Grid Load (kW)</label>
            <input
              type="number"
              step="0.5"
              value={sanctionedLoadKw}
              onChange={(e) => setSanctionedLoadKw(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-400 font-bold focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Home Size (sq ft)</label>
            <input
              type="number"
              value={homeAreaSqFt}
              onChange={(e) => setHomeAreaSqFt(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Occupants Count</label>
            <input
              type="number"
              value={occupants}
              onChange={(e) => setOccupants(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-cyan-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-emerald-400 shadow-lg shadow-cyan-500/15 transition-all flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Saving Profile...' : 'Save Profile Changes'}</span>
        </button>
      </form>
    </div>
  );
};
