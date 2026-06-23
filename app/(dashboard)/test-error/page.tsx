'use client';

import { useEffect, useState } from 'react';

export default function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    // This will be caught by app/error.tsx
    throw new Error('Ini adalah error percobaan untuk melihat UI Error Boundary!');
  }

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h1 className="text-xl font-bold text-slate-200">Halaman Uji Coba Error Boundary</h1>
      <p className="text-slate-400">Klik tombol di bawah ini untuk mensimulasikan komponen yang crash (rusak).</p>
      
      <button 
        onClick={() => setShouldError(true)}
        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg transition-all"
      >
        Picu Error (Crash Component)
      </button>
    </div>
  );
}
