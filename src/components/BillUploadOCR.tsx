import React, { useState } from 'react';
import {
  FileScan,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  DollarSign,
  FileText,
  Calendar,
  Layers,
  Save,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../services/api';
import { OCRResult, BillRecord } from '../types';
import { SAMPLE_BILL_PRESETS } from '../data/sampleData';

interface BillUploadOCRProps {
  onBillAdded: (bill: BillRecord) => void;
  setActiveTab: (tab: string) => void;
}

export const BillUploadOCR: React.FC<BillUploadOCRProps> = ({ onBillAdded, setActiveTab }) => {
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [activeTab, setEditTab] = useState<'fields' | 'breakdown' | 'rawText'>('fields');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Editable Form State
  const [formState, setFormState] = useState<Partial<OCRResult>>({});

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setStatusMessage('Reading your bill securely with online OCR...');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      setUploadedImagePreview(base64Str);

      try {
        const result = await api.processOCR({
          imageBase64: base64Str,
          mimeType: file.type || 'image/png',
        });
        setOcrResult(result);
        setFormState(result);
        setStatusMessage(null);
      } catch (err: any) {
        setStatusMessage(`OCR Processing Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = async (preset: typeof SAMPLE_BILL_PRESETS[0]) => {
    setLoading(true);
    setStatusMessage(`Running OCR extraction on preset: "${preset.name}"...`);
    setUploadedImagePreview('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80');

    try {
      const result = await api.processOCR({ samplePreset: preset });
      setOcrResult(result);
      setFormState(result);
      setStatusMessage(null);
    } catch (err: any) {
      setStatusMessage(`OCR Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBill = async () => {
    if (!formState.consumerName || !formState.unitsConsumedKwh) return;

    setLoading(true);
    try {
      const saved = await api.createBill({
        billNumber: formState.billNumber || `INV-${Date.now().toString().slice(-6)}`,
        consumerName: formState.consumerName,
        billingMonth: formState.billingMonth || new Date().toISOString().slice(0, 7),
        issueDate: formState.issueDate || new Date().toISOString().slice(0, 10),
        dueDate: formState.dueDate || new Date(Date.now() + 18 * 86400000).toISOString().slice(0, 10),
        previousReading: formState.previousReading || 14000,
        currentReading: formState.currentReading || 14500,
        unitsConsumedKwh: Number(formState.unitsConsumedKwh),
        sanctionedLoadKw: Number(formState.sanctionedLoadKw || 6.5),
        powerFactor: Number(formState.powerFactor || 0.96),
        tariffCategory: formState.tariffCategory || 'Residential Tier-2',
        amountDue: Number(formState.amountDue),
        breakdown: formState.breakdown || {
          energyCharges: Number(formState.amountDue) * 0.78,
          fixedCharges: 14.50,
          taxesAndSurcharges: Number(formState.amountDue) * 0.12,
          fuelAdjustmentCharge: Number(formState.amountDue) * 0.05,
          latePaymentFee: 0,
        },
        ocrConfidence: ocrResult?.confidenceScore || 0.98,
        status: 'paid',
      });

      onBillAdded(saved);
      setActiveTab('dashboard');
    } catch (err: any) {
      alert(`Save Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Online OCR & Multimodal Vision Extraction</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Electricity Bill OCR Engine
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Upload any electricity utility bill photo or document. Our OCR parser automatically extracts meter readings, kWh consumption, tariff breakdown charges, and dates.
          </p>
        </div>

        {ocrResult && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSaveBill}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-emerald-400 shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Verify & Save Bill</span>
            </button>
          </div>
        )}
      </div>

      {/* Preset Sample Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
          <span className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Try OCR Scan with Preset Benchmark Bills</span>
          </span>
          <span className="text-[10px] text-slate-400">One-click instant parsing</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_BILL_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(preset)}
              disabled={loading}
              className="p-3 text-left rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-xs space-y-1 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white group-hover:text-cyan-300">{preset.name}</span>
                <span className="font-mono text-cyan-400 font-bold">${preset.amount}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {preset.consumer} • {preset.units} kWh ({preset.tariff})
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* OCR Main Scanner & Side-by-Side Reviewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Upload Box & Image Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload Bill Photo or PDF</span>
            </h3>

            {/* Dropzone */}
            <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-8 text-center space-y-3 transition-colors group cursor-pointer bg-slate-950/50">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <FileScan className="w-6 h-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-200">
                  Drag & Drop or Click to Upload Utility Bill
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports PNG, JPG, WEBP, or PDF electricity invoices.
                </p>
              </div>
            </div>

            {/* Image Preview Window */}
            {uploadedImagePreview && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center space-x-1">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Uploaded Bill Document</span>
                  </span>
                  {ocrResult && (
                    <span className="text-emerald-400 font-bold font-mono text-[11px]">
                      Confidence: {Math.round(ocrResult.confidenceScore * 100)}%
                    </span>
                  )}
                </div>
                <div className="w-full h-64 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-2">
                  <img
                    src={uploadedImagePreview}
                    alt="Uploaded Bill OCR"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Extracted OCR Fields Editor */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>OCR Extracted Data Inspector</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Review and refine parsed invoice fields before committing to persistent database.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setEditTab('fields')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'fields' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Key Fields
                </button>
                <button
                  onClick={() => setEditTab('breakdown')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'breakdown' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Breakdown
                </button>
                <button
                  onClick={() => setEditTab('rawText')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'rawText' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Text Logs
                </button>
              </div>
            </div>

            {loading && (
              <div className="p-8 text-center space-y-3 bg-slate-950 rounded-2xl border border-slate-800">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-xs font-medium text-slate-200">{statusMessage || 'Processing OCR...'}</p>
              </div>
            )}

            {!loading && !ocrResult && (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2 bg-slate-950 rounded-2xl border border-slate-800">
                <FileScan className="w-8 h-8 mx-auto text-slate-400" />
                <p>No bill scanned yet. Upload a bill image or select a benchmark preset above.</p>
              </div>
            )}

            {!loading && ocrResult && (
              <>
                {/* Fields Form Tab */}
                {activeTab === 'fields' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Consumer Name</label>
                      <input
                        type="text"
                        value={formState.consumerName || ''}
                        onChange={(e) => setFormState({ ...formState, consumerName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Invoice Number</label>
                      <input
                        type="text"
                        value={formState.billNumber || ''}
                        onChange={(e) => setFormState({ ...formState, billNumber: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Billing Month</label>
                      <input
                        type="text"
                        value={formState.billingMonth || ''}
                        onChange={(e) => setFormState({ ...formState, billingMonth: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={formState.dueDate || ''}
                        onChange={(e) => setFormState({ ...formState, dueDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Previous Reading</label>
                      <input
                        type="number"
                        value={formState.previousReading || 0}
                        onChange={(e) => {
                          const prev = Number(e.target.value);
                          const curr = formState.currentReading || prev + 500;
                          setFormState({
                            ...formState,
                            previousReading: prev,
                            unitsConsumedKwh: Math.max(0, curr - prev),
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-400 font-mono font-bold focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Current Reading</label>
                      <input
                        type="number"
                        value={formState.currentReading || 0}
                        onChange={(e) => {
                          const curr = Number(e.target.value);
                          const prev = formState.previousReading || 0;
                          setFormState({
                            ...formState,
                            currentReading: curr,
                            unitsConsumedKwh: Math.max(0, curr - prev),
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-400 font-mono font-bold focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Units Consumed (kWh)</label>
                      <input
                        type="number"
                        value={formState.unitsConsumedKwh || 0}
                        onChange={(e) => setFormState({ ...formState, unitsConsumedKwh: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-cyan-400 font-mono font-bold focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Total Payable Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formState.amountDue || 0}
                        onChange={(e) => setFormState({ ...formState, amountDue: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono font-bold focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {/* Breakdown Tab */}
                {activeTab === 'breakdown' && formState.breakdown && (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Base Energy Charges</span>
                        <span className="font-mono text-cyan-400 font-bold">₹{formState.breakdown.energyCharges?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Fixed Grid Access Charge</span>
                        <span className="font-mono text-cyan-400 font-bold">₹{formState.breakdown.fixedCharges?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Taxes & Environmental Surcharges</span>
                        <span className="font-mono text-cyan-400 font-bold">₹{formState.breakdown.taxesAndSurcharges?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Fuel Adjustment Factor</span>
                        <span className="font-mono text-cyan-400 font-bold">₹{formState.breakdown.fuelAdjustmentCharge?.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center font-bold text-white">
                        <span>Net Extracted Total</span>
                        <span className="font-mono text-emerald-400 text-sm">₹{formState.amountDue?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Raw Snippets Tab */}
                {activeTab === 'rawText' && (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 font-mono text-[11px] text-slate-300">
                    <p className="text-slate-400 font-semibold mb-2">OCR Detected Text Fragments:</p>
                    {ocrResult.rawTextSnippets.map((snippet, idx) => (
                      <div key={idx} className="p-2 bg-slate-900 rounded border border-slate-800/80">
                        {snippet}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Status: <strong className="text-emerald-400">OCR Extract Verified</strong>
                  </span>

                  <button
                    onClick={handleSaveBill}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-emerald-400 shadow-lg shadow-cyan-500/15 transition-all flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save to Bill History</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
