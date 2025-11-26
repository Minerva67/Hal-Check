
import React from 'react';
import { Layers } from 'lucide-react';
import { Translation } from '../i18n';

interface HeaderProps {
  t: Translation;
}

export const Header: React.FC<HeaderProps> = ({ t }) => {
  return (
    <header className="bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">{t.title}</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-0.5">{t.subtitle}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
           <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{t.modelName}</span>
           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
        </div>
      </div>
    </header>
  );
};
