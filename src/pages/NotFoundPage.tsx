import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-4 py-12 text-center text-slate-100">
      <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-400">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-extrabold text-white">Page Not Found</h1>
      <p className="mt-3 text-sm text-slate-400 max-w-md">
        The route you are looking for does not exist. Return to the PowerSense home page or your dashboard.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-all"
        >
          Go home
        </Link>
        <Link
          to="/dashboard"
          className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-all"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
};
