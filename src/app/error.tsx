'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Client Exception:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-red-100">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong!</h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        {error?.message || 'An unexpected client error occurred while loading this page.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <button
          onClick={() => {
            window.location.href = '/';
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition-all"
        >
          <Home className="w-4 h-4" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
