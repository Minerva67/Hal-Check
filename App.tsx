import React, { useState } from 'react';
import { Header } from './components/Header';
import { AnalysisResultSection } from './components/AnalysisResult';
import { AnalysisInput, AnalysisResult } from './types';
import { auditContent, generateOptimizedPrompt } from './services/geminiService';
import { Sparkles, AlertTriangle, PlayCircle, Database, Command, FileText, RotateCcw, Zap, Activity } from 'lucide-react';
import { translations, Translation } from './i18n';

const EXAMPLE_INPUTS: AnalysisInput = {
  facts: `1. Apple released the iPhone 15 in September 2023.
2. The iPhone 15 features a USB-C port.
3. The Pro models use Titanium frames.`,
  process: `User Instruction: "Write a super exciting, ground-breaking marketing snippet about the new iPhone 15 launch for Gen Z.
  
Meta Strategy:
- Tone: Extremely Hype & Energetic.
- Constraint: No superlatives allowed (Ad Law).
- Key Focus: The material change."
  
## Product Info (DO NOT EDIT)
- Model: iPhone 15
- Color: Blue`,
  reasoning: `Thinking Process:
1. User wants hype. I should use strong words like "Best ever" and "Revolutionary". (Error: Ignores "No superlatives" constraint)
2. Target is Gen Z, so I will mention "Universe" and "Galaxy".
3. Key focus is material, so I will emphasize the Titanium.
4. Product info says Blue, I will stick to that.`,
  output: `The absolute best phone ever made is finally here. The iPhone 15, released in December 2023, revolutionizes the universe with its Lightning II port. The titanium frame makes it the #1 lightweight phone in the galaxy.`,
  language: 'en'
};

const App: React.FC = () => {
  const [inputs, setInputs] = useState<AnalysisInput>({
    facts: '',
    process: '',
    reasoning: '',
    output: '',
    language: 'zh' // Default to Chinese
  });

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false); // Stage 2 Loading State
  const [error, setError] = useState<string | null>(null);

  // Get current translation
  const t: Translation = inputs.language === 'zh' ? translations.zh : translations.en;

  const handleInputChange = (field: keyof AnalysisInput, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    if (window.confirm(inputs.language === 'zh' ? '确定要清空所有输入吗？' : 'Are you sure you want to clear all inputs?')) {
        setInputs(prev => ({ ...prev, facts: '', process: '', reasoning: '', output: '' }));
        setResult(null);
        setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!inputs.facts.trim() || !inputs.output.trim()) {
      setError(t.errMissingInput);
      return;
    }

    setLoading(true);
    setOptimizing(false);
    setError(null);
    setResult(null);

    try {
      // Phase 1: Audit (Fast)
      const audit = await auditContent(inputs);
      setResult(audit);
      
      // Auto-scroll to results
      setTimeout(() => {
        const resultElement = document.getElementById('results-section');
        if (resultElement) {
          resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      setLoading(false);
      
      // Phase 2: Optimization (Background)
      setOptimizing(true);
      const optimization = await generateOptimizedPrompt(inputs, audit);
      
      setResult(prev => {
         if (!prev) return null;
         return { ...prev, ...optimization };
      });

    } catch (err) {
      console.error(err);
      setError(t.errFailed);
    } finally {
      setLoading(false);
      setOptimizing(false);
    }
  };

  const loadExample = () => {
    setInputs({
      ...EXAMPLE_INPUTS,
      language: inputs.language // Keep current language setting
    });
    setResult(null);
    setError(null);
  };

  const handleApplyFix = (quote: string, replacement: string) => {
    const newOutput = inputs.output.replace(quote, replacement);
    setInputs(prev => ({ ...prev, output: newOutput }));
    
    if (result) {
      setResult(prev => {
        if (!prev) return null;
        return {
          ...prev,
          issues: prev.issues.filter(i => i.quote !== quote)
        };
      });
    }
  };

  const handleApplyPrompt = (newPrompt: string) => {
    handleInputChange('process', newPrompt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-sans pb-32">
      <Header t={t} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* --- TOP SECTION: CONTROL BAR & WORKSPACE --- */}
        <section className="space-y-6">
          
          {/* 1. Control Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             {/* Left: Branding/Context */}
             <div className="hidden md:flex items-center gap-2 opacity-50">
               <Zap className="w-4 h-4 text-indigo-500" />
               <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Unified Assessment Engine</span>
             </div>

             {/* Right: Actions */}
             <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <select 
                  value={inputs.language}
                  onChange={(e) => handleInputChange('language', e.target.value as 'zh' | 'en')}
                  className="text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
                
                <button 
                  onClick={handleClear}
                  className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-all"
                  title={t.btnClear}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button 
                  onClick={loadExample}
                  className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-indigo-200 rounded-lg transition-all shadow-sm hover:shadow"
                >
                  <PlayCircle className="w-4 h-4" />
                  {t.btnExample}
                </button>
             </div>
          </div>

          {/* 2. Workspace Grid (4 Cols) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden ring-1 ring-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              
              {/* Col 1: Facts */}
              <div className="flex flex-col group transition-colors hover:bg-slate-50/30">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                    <div className="p-1.5 bg-emerald-50 rounded-md">
                        <Database className="w-4 h-4 text-emerald-600" />
                    </div>
                    {t.labelFacts}
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-600/80 bg-emerald-50 px-2 py-0.5 rounded-full">{t.labelFactsSub}</span>
                </div>
                <textarea
                  value={inputs.facts}
                  onChange={(e) => handleInputChange('facts', e.target.value)}
                  className="flex-1 min-h-[320px] p-5 text-sm bg-transparent border-0 focus:ring-0 text-slate-700 placeholder:text-slate-300 font-mono resize-none leading-relaxed"
                  placeholder={t.placeholderFacts}
                />
              </div>

              {/* Col 2: Process */}
              <div className="flex flex-col group transition-colors hover:bg-slate-50/30">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                    <div className="p-1.5 bg-blue-50 rounded-md">
                        <Command className="w-4 h-4 text-blue-600" />
                    </div>
                    {t.labelProcess}
                  </label>
                  <span className="text-[10px] font-semibold text-blue-600/80 bg-blue-50 px-2 py-0.5 rounded-full">{t.labelProcessSub}</span>
                </div>
                <textarea
                  value={inputs.process}
                  onChange={(e) => handleInputChange('process', e.target.value)}
                  className="flex-1 min-h-[320px] p-5 text-sm bg-transparent border-0 focus:ring-0 text-slate-700 placeholder:text-slate-300 font-mono resize-none leading-relaxed"
                  placeholder={t.placeholderProcess}
                />
              </div>

               {/* Col 3: Reasoning (New) */}
               <div className="flex flex-col group transition-colors hover:bg-slate-50/30">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                    <div className="p-1.5 bg-amber-50 rounded-md">
                        <Activity className="w-4 h-4 text-amber-600" />
                    </div>
                    {t.labelReasoning}
                  </label>
                  <span className="text-[10px] font-semibold text-amber-600/80 bg-amber-50 px-2 py-0.5 rounded-full">{t.labelReasoningSub}</span>
                </div>
                <textarea
                  value={inputs.reasoning}
                  onChange={(e) => handleInputChange('reasoning', e.target.value)}
                  className="flex-1 min-h-[320px] p-5 text-sm bg-transparent border-0 focus:ring-0 text-slate-700 placeholder:text-slate-300 font-mono resize-none leading-relaxed"
                  placeholder={t.placeholderReasoning}
                />
              </div>

              {/* Col 4: Output */}
              <div className="flex flex-col group transition-colors hover:bg-slate-50/30">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                  <label className="flex items-center gap-2.5 text-sm font-bold text-slate-800">
                     <div className="p-1.5 bg-purple-50 rounded-md">
                        <FileText className="w-4 h-4 text-purple-600" />
                     </div>
                    {t.labelOutput}
                  </label>
                  <span className="text-[10px] font-semibold text-purple-600/80 bg-purple-50 px-2 py-0.5 rounded-full">{t.labelOutputSub}</span>
                </div>
                <textarea
                  value={inputs.output}
                  onChange={(e) => handleInputChange('output', e.target.value)}
                  className="flex-1 min-h-[320px] p-5 text-sm bg-transparent border-0 focus:ring-0 text-slate-700 placeholder:text-slate-300 font-mono resize-none leading-relaxed"
                  placeholder={t.placeholderOutput}
                />
              </div>

            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center justify-center pt-6">
             {error && (
                <div className="mb-6 px-4 py-3 bg-red-50/50 border border-red-100 rounded-xl flex items-center gap-3 text-sm text-red-600 shadow-sm max-w-lg w-full backdrop-blur-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
             
             <button
                onClick={handleAnalyze}
                disabled={loading}
                className={`group relative overflow-hidden rounded-xl py-4 px-12 font-bold text-white shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 transform active:scale-95 ${
                  loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-indigo-600 hover:to-blue-600'
                }`}
              >
                <div className="flex items-center gap-3 relative z-10 text-sm tracking-wide">
                  {loading ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                     <Sparkles className="w-5 h-5" />
                  )}
                  <span>{loading ? t.btnRunning : t.btnRun}</span>
                </div>
             </button>
          </div>
        </section>

        {/* --- BOTTOM SECTION: RESULTS --- */}
        <div id="results-section" className="pt-8">
           <AnalysisResultSection 
              result={result!} 
              loading={loading}
              isOptimizing={optimizing} 
              onApplyFix={handleApplyFix}
              onApplyPrompt={handleApplyPrompt}
              fullText={inputs.output}
              reasoningText={inputs.reasoning}
              originalPrompt={inputs.process}
              t={t}
            />
        </div>

      </main>
    </div>
  );
};

export default App;