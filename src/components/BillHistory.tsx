import React, { useState } from 'react';
import {
  History,
  FileText,
  Search,
  Download,
  Trash2,
  Plus,
  Eye,
  CheckCircle2,
  Calendar,
  DollarSign,
  Zap,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { BillRecord } from '../types';

interface BillHistoryProps {
  bills: BillRecord[];
  onBillDeleted: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export const BillHistory: React.FC<BillHistoryProps> = ({
  bills,
  onBillDeleted,
  setActiveTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<BillRecord | null>(null);

  const filteredBills = bills.filter(
    (b) =>
      b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.billingMonth.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.consumerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bill record?')) return;
    try {
      await api.deleteBill(id);
      onBillDeleted(id);
      if (selectedBill?.id === id) setSelectedBill(null);
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Invoice No,Billing Month,Units kWh,Amount Due,Status,Issue Date,Due Date\n'];
    const rows = bills.map((b) =>
      `${b.billNumber},${b.billingMonth},${b.unitsConsumedKwh},${b.amountDue},${b.status},${b.issueDate},${b.dueDate}\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PowerSense_Bill_History_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <History className="w-3.5 h-3.5" />
            <span>Persistent Utility Invoices & OCR Audit Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Electricity Bill History & Records
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Audit historical utility invoices, view side-by-side OCR confidence details, and export records for accounting and tax reporting.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export CSV Report</span>
          </button>

          <button
            onClick={() => setActiveTab('ocr')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-emerald-400 transition-all flex items-center space-x-1.5 shadow-lg shadow-cyan-500/15"
          >
            <Plus className="w-4 h-4" />
            <span>Scan New Bill</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number, month, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing <strong className="text-white">{filteredBills.length}</strong> of {bills.length} bills
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Invoice Number</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Units (kWh)</th>
                <th className="px-4 py-3">Readings (Prev → Curr)</th>
                <th className="px-4 py-3">Total Payable</th>
                <th className="px-4 py-3">OCR Accuracy</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredBills.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white">{b.billNumber}</td>
                  <td className="px-4 py-3 text-slate-300">{b.billingMonth}</td>
                  <td className="px-4 py-3 text-cyan-400 font-bold">{b.unitsConsumedKwh} kWh</td>
                  <td className="px-4 py-3 text-slate-400">{b.previousReading} → {b.currentReading}</td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">${(b?.amountDue ?? 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-indigo-400 font-bold">{Math.round((b.ocrConfidence || 0.98) * 100)}%</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => setSelectedBill(b)}
                      className="p-1.5 text-cyan-400 hover:text-cyan-200 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-200 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 shadow-2xl">
            <button
              onClick={() => setSelectedBill(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase">
                Invoice Details
              </span>
              <h3 className="text-xl font-bold text-white">{selectedBill.billNumber}</h3>
              <p className="text-xs text-slate-400">Consumer: {selectedBill.consumerName} ({selectedBill.billingMonth})</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400">Previous Reading</p>
                <p className="font-mono font-bold text-cyan-400">{selectedBill.previousReading}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400">Current Reading</p>
                <p className="font-mono font-bold text-cyan-400">{selectedBill.currentReading}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400">Units Consumed</p>
                <p className="font-mono font-bold text-cyan-400">{selectedBill.unitsConsumedKwh} kWh</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400">Amount Payable</p>
                <p className="font-mono font-bold text-emerald-400">${(selectedBill.amountDue ?? 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <p className="font-bold text-white">Itemized Charges Breakdown:</p>
              <div className="flex justify-between text-slate-300">
                <span>Energy Charges:</span>
                <span className="font-mono">${(selectedBill.breakdown?.energyCharges ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Fixed Charges:</span>
                <span className="font-mono">${(selectedBill.breakdown?.fixedCharges ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Taxes & Surcharges:</span>
                <span className="font-mono">${(selectedBill.breakdown?.taxesAndSurcharges ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
