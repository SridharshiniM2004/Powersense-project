import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Cpu,
  Zap,
  Sliders,
  DollarSign,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Flame,
  Sun,
  Tv,
  Car,
  Home,
  Users,
  Leaf,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { PredictionResult, MLPredictionInput, BillRecord } from '../types';

interface PredictionEngineProps {
  bills: BillRecord[];
}

export const PredictionEngine: React.FC<PredictionEngineProps> = ({ bills }) => {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  // Form Inputs for ML Model
  const [billingMonth, setBillingMonth] = useState<number>(8); // August
  const [homeAreaSqFt, setHomeAreaSqFt] = useState<number>(1850);
  const [occupants, setOccupants] = useState<number>(4);
  const [acCount, setAcCount] = useState<number>(2);
  const [acAverageHoursDaily, setAcAverageHoursDaily] = useState<number>(8);
  const [hasEvCharger, setHasEvCharger] = useState<boolean>(true);
  const [hasSolarPanels, setHasSolarPanels] = useState<boolean>(false);
  const [solarCapacityKw, setSolarCapacityKw] = useState<number>(5.0);
  const [heavyHvacUsage, setHeavyHvacUsage] = useState<boolean>(false);
  const [avgTemperatureC, setAvgTemperatureC] = useState<number>(32); // 32°C Summer

  const historyUnits = bills.map((b) => b.unitsConsumedKwh);

  const runPrediction = async () => {
    setLoading(true);
    try {
      const input: MLPredictionInput = {
        historyUnits,
        billingMonth,
        homeAreaSqFt,
        occupants,
        acCount,
        acAverageHoursDaily,
        hasEvCharger,
        hasSolarPanels,
        solarCapacityKw,
        hasWaterHeater: true,
        heavyHvacUsage,
        sanctionedLoadKw: 6.5,
        tariffCategory: 'Residential',
        avgTemperatureC,
      };

      const result = await api.predictUsage(input);
      setPrediction(result);
    } catch (err: any) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPrediction();
  }, [
    billingMonth,
    homeAreaSqFt,
    occupants,
    acCount,
    acAverageHoursDaily,
    hasEvCharger,
    hasSolarPanels,
    solarCapacityKw,
    heavyHvacUsage,
    avgTemperatureC,
  ]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5" />
            <span>XGBoost & LightGBM Machine Learning Ensemble</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Electricity Units & Cost Prediction Engine
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Fine-tuned multivariate regression ML model predicting next month's kWh consumption, tiered energy costs, peak power demand, and top bill drivers.
          </p>
        </div>

        <button
          onClick={runPrediction}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs hover:opacity-90 transition-all flex items-center space-x-2 shadow-lg shadow-indigo-500/20"
        >
          <TrendingUp className="w-4 h-4" />
          <span>{loading ? 'Re-Running ML Model...' : 'Recalculate Forecast'}</span>
        </button>
      </div>

      {/* Main Grid: Parameters Sidebar + Prediction Results Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Parameters Panel */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Household & Seasonal ML Features</span>
            </h3>
            <span className="text-[10px] text-slate-400">Real-time inference</span>
          </div>

          <div className="space-y-5 text-xs">
            {/* Season / Month */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex justify-between">
                <span>Billing Month / Season</span>
                <span className="text-cyan-400 font-bold">Month {billingMonth}</span>
              </label>
              <select
                value={billingMonth}
                onChange={(e) => setBillingMonth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>January (Winter Heating)</option>
                <option value={4}>April (Mild Spring)</option>
                <option value={7}>July (Peak Summer AC)</option>
                <option value={8}>August (Peak Summer AC)</option>
                <option value={10}>October (Autumn)</option>
                <option value={12}>December (Winter Peak)</option>
              </select>
            </div>

            {/* Ambient Temperature */}
            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Average Temperature Index</span>
                <span className="text-amber-400 font-bold">{avgTemperatureC}°C ({Math.round(avgTemperatureC * 1.8 + 32)}°F)</span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                value={avgTemperatureC}
                onChange={(e) => setAvgTemperatureC(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Air Conditioners & AC Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">AC Units</label>
                <select
                  value={acCount}
                  onChange={(e) => setAcCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value={0}>0 (No AC)</option>
                  <option value={1}>1 AC Unit</option>
                  <option value={2}>2 AC Units</option>
                  <option value={3}>3 AC Units</option>
                  <option value={4}>4+ AC Units</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Avg Daily Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={acAverageHoursDaily}
                  onChange={(e) => setAcAverageHoursDaily(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Occupants & Home Area */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Home Size (sq ft)</label>
                <input
                  type="number"
                  step="100"
                  value={homeAreaSqFt}
                  onChange={(e) => setHomeAreaSqFt(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Occupants</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={occupants}
                  onChange={(e) => setOccupants(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Heavy Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="flex items-center space-x-2 text-slate-300 font-medium">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span>Level 2 EV Charger</span>
                </span>
                <input
                  type="checkbox"
                  checked={hasEvCharger}
                  onChange={(e) => setHasEvCharger(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="flex items-center space-x-2 text-slate-300 font-medium">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Rooftop Solar Array</span>
                </span>
                <input
                  type="checkbox"
                  checked={hasSolarPanels}
                  onChange={(e) => setHasSolarPanels(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
              </label>

              {hasSolarPanels && (
                <div className="pl-4 pt-1">
                  <label className="block text-slate-400 mb-1 text-[11px]">Solar Array Capacity (kW)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={solarCapacityKw}
                    onChange={(e) => setSolarCapacityKw(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-amber-300 font-bold"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: ML Output Analytics Cards */}
        <div className="lg:col-span-7 space-y-6">
          {prediction && (
            <>
              {/* Main Predicted Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Units Card */}
                <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-xl shadow-indigo-500/5">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    Predicted Units Consumption
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black text-white font-mono">{prediction.predictedUnitsKwh}</span>
                    <span className="text-sm text-indigo-300 font-bold">kWh</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300">Confidence Bounds (±6%):</span>
                    <p className="font-mono text-cyan-400 font-bold">
                      {prediction.confidenceLowerUnits} kWh — {prediction.confidenceUpperUnits} kWh
                    </p>
                  </div>
                </div>

                {/* Amount Card */}
                <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 space-y-3 relative overflow-hidden shadow-xl shadow-emerald-500/5">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Predicted Electricity Bill
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black text-emerald-300 font-mono">₹{prediction.predictedAmount.toFixed(2)}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300">Confidence Bounds (₹):</span>
                    <p className="font-mono text-emerald-400 font-bold">
                      ₹{prediction.confidenceLowerAmount.toFixed(2)} — ₹{prediction.confidenceUpperAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Peak Demand & Carbon Row */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Peak Demand</p>
                  <p className="text-xl font-black text-amber-400 font-mono mt-1">{prediction.peakDemandKw} kW</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">MoM Change</p>
                  <p className={`text-xl font-black font-mono mt-1 ${prediction.monthOverMonthChangePercent > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {prediction.monthOverMonthChangePercent > 0 ? `+${prediction.monthOverMonthChangePercent}%` : `${prediction.monthOverMonthChangePercent}%`}
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">CO₂ Footprint</p>
                  <p className="text-xl font-black text-emerald-400 font-mono mt-1">{prediction.co2EmissionsKg} kg</p>
                </div>
              </div>

              {/* Tier Breakdown Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Tiered Tariff Cost Structure</span>
                </h3>

                <div className="space-y-3">
                  {prediction.tierBreakdown.map((tier, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between items-center font-semibold text-slate-200">
                        <span>{tier.tierName}</span>
                        <span className="font-mono text-cyan-400">₹{tier.cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Units: {tier.units} kWh</span>
                        <span>Rate: ₹{tier.ratePerUnit.toFixed(2)}/kWh</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Cost Drivers */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>Top Cost Driver Breakdown</span>
                </h3>

                <div className="space-y-3">
                  {prediction.keyCostDrivers.map((driver, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-300 font-medium">
                        <span>{driver.factor}</span>
                        <span className="font-mono text-emerald-400 font-bold">₹{driver.impactAmount} ({driver.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full"
                          style={{ width: `${driver.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
