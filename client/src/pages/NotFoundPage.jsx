/**
 * NotFoundPage Page
 *
 * Enterprise-styled 404 error page (#0B1120 bg, #111827 card).
 *
 * @module pages/NotFoundPage
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-center p-6 select-none font-sans relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="card bg-[#111827] border-white/[0.12] max-w-md w-full p-8 space-y-6 animate-slide-up shadow-2xl relative z-10">
        {/* Glow animated background circle */}
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse-slow" />
          <span className="font-heading text-7xl font-black text-white relative z-10">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-white">Page Not Found</h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            The page you are looking for doesn&apos;t exist or has been moved to another path.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Link to="/">
            <button className="btn-primary w-full py-3 text-sm">Go Home</button>
          </Link>
          <button onClick={() => navigate(-1)} className="btn-secondary w-full py-3 text-sm">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
export { NotFoundPage };
