import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnalysisResult, LocalizedComponentProps } from '../types';
import { CheckCircle2, BrainCircuit, X, Wand2, ArrowRight, Lightbulb, Target, LayoutDashboard, FileText, Check, AlertOctagon, Sparkles, Activity, Copy, Loader2 } from 'lucide-react';

interface AnalysisResultProps extends LocalizedComponentProps {
  result: AnalysisResult;
  loading: boolean;
  isOptimizing: boolean; // New prop for Phase 2 loading state
  onApplyPrompt: (newPrompt: string) => void;
  onApplyFix: (quote: string, replacement: string) => void;
  fullText: string;
  reasoningText: string;
  originalPrompt: string;
}

// --- UTILS: TOKENIZER & DIFF ALGORITHM ---

const tokenize = (text: string): string[] => {
  return text.split(/(\s+|[.,;?!()[\]{}])/).filter(t => t.length > 0);
};

type DiffType = 'eq' | 'add' | 'del';
interface DiffPart { type: DiffType; value: string; }

const computeDiff = (oldText: string, newText: string): DiffPart[] => {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);
  
  const diff: DiffPart[] = [];
  let i = 0;
  let j = 0;
  
  while (i < oldTokens.length || j < newTokens.length) {
    if (i >= oldTokens.length) {
      diff.push({ type: 'add', value: newTokens[j] });
      j++;
    } else if (j >= newTokens.length) {
      diff.push({ type: 'del', value: oldTokens[i] });
      i++;
    } else if (oldTokens[i] === newTokens[j]) {
      diff.push({ type: 'eq', value: oldTokens[i] });
      i++;
      j++;
    } else {
      let k = 1;
      let foundSync = false;
      const maxLookAhead = 15;
      
      while (k < maxLookAhead) {
        if (i + k < oldTokens.length && oldTokens[i + k] === newTokens[j]) {
           for (let m = 0; m < k; m++) diff.push({ type: 'del', value: oldTokens[i + m] });
           i += k;
           foundSync = true;
           break;
        }
        if (j + k < newTokens.length && oldTokens[i] === newTokens[j + k]) {
           for (let m = 0; m < k; m++) diff.push({ type: 'add', value: newTokens[j + m] });
           j += k;
           foundSync = true;
           break;
        }
        k++;
      }
      
      if (!foundSync) {
        diff.push({ type: 'del', value: oldTokens[i] });
        diff.push({ type: 'add', value: newTokens[j] });
        i++;
        j++;
      }
    }
  }
  return diff;
};

// --- COMPONENT: PROMPT DIFF EDITOR ---
const PromptDiffEditor: React.FC<{ 
  original: string; 
  initialOptimized?: string; 
  suggestions?: string[]; 
  rootCause: string;
  isOptimizing: boolean;
  t: LocalizedComponentProps['t'];
  onUpdate: (val: string) => void;
}> = ({ original, initialOptimized, suggestions, rootCause, isOptimizing, t, onUpdate }) => {
  const [editedPrompt, setEditedPrompt] = useState(initialOptimized || "");
  const [diffs, setDiffs] = useState<DiffPart[]>([]);
  const [copied, setCopied] = useState(false);
  
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (initialOptimized) {
      setEditedPrompt(initialOptimized);
    }
  }, [initialOptimized]);

  useEffect(() => {
    if (original && editedPrompt) {
      const computed = computeDiff(original, editedPrompt);
      setDiffs(computed);
    }
  }, [original, editedPrompt]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditedPrompt(val);
    onUpdate(val);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderLeftDiff = useMemo(() => {
    return diffs.map((part, idx) => {
      if (part.type === 'eq') return <span key={idx}>{part.value}</span>;
      if (part.type === 'del') return <span key={idx} className="bg-red-50 text-red-900 line-through decoration-red-300 opacity-60">{part.value}</span>;
      return null;
    });
  }, [diffs]);

  const renderRightHighlights = useMemo(() => {
    return diffs.map((part, idx) => {
       if (part.type === 'add') {
         return <span key={idx} className="bg-emerald-100/50 text-transparent rounded-[1px] box-decoration-clone">{part.value}</span>;
       }
       if (part.type === 'eq') {
         return <span key={idx} className="text-transparent">{part.value}</span>;
       }
       return null;
    });
  }, [diffs]);

  // Loading State for Phase 2
  if (isOptimizing) {
    return (
       <div className="space-y-6 animate-pulse">
          <div className="h-32 bg-indigo-50/50 rounded-xl border border-indigo-100/50 relative overflow-hidden">
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{t.statusOptimizing}</span>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
            <div className="bg-slate-100 rounded-xl"></div>
            <div className="bg-slate-50 rounded-xl"></div>
          </div>
       </div>
    );
  }

  // Fallback if no optimized prompt yet
  if (!initialOptimized) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Root Cause & Suggestions Box */}
      <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100 flex items-start gap-4">
         <div className="bg-indigo-100 p-2.5 rounded-lg shrink-0">
           <BrainCircuit className="w-5 h-5 text-indigo-600" />
         </div>
         <div className="flex-1">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">{t.optimizationLogic}</h4>
            <p className="text-sm text-slate-800 leading-relaxed mb-4 font-medium">{rootCause}</p>
            {suggestions && (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600 bg-white/80 p-3 rounded-lg border border-indigo-50">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            )}
         </div>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        {/* Left: Original */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col overflow-hidden">
           <div className="px-5 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.originalPrompt}</span>
           </div>
           <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-mono text-slate-500 text-xs leading-relaxed whitespace-pre-wrap break-words">
             {original ? renderLeftDiff : <span className="italic opacity-50">...</span>}
           </div>
        </div>

        {/* Right: Optimized */}
        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm flex flex-col relative overflow-hidden ring-2 ring-transparent focus-within:ring-emerald-100 transition-shadow">
           <div className="px-5 py-3 bg-emerald-50/30 border-b border-emerald-100 flex items-center justify-between z-20">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                 <Sparkles className="w-3 h-3" />
                 {t.optimizedPrompt}
              </span>
              <button 
                onClick={handleCopy}
                className="text-[10px] flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 rounded hover:bg-emerald-100/50 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t.copied : t.btnCopy}
              </button>
           </div>
           
           <div className="relative flex-1 w-full h-full overflow-hidden">
              <div 
                ref={backdropRef}
                className="absolute inset-0 p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words pointer-events-none overflow-hidden z-0" 
                aria-hidden="true"
              >
                 {renderRightHighlights}
              </div>
              
              <textarea
                ref={textareaRef}
                value={editedPrompt}
                onChange={handleChange}
                onScroll={handleScroll}
                spellCheck={false}
                className="absolute inset-0 z-10 w-full h-full bg-transparent p-6 border-0 focus:ring-0 font-mono text-slate-800 text-xs leading-relaxed resize-none focus:outline-none custom-scrollbar mix-blend-multiply placeholder-emerald-200"
              />
           </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: MODERN SCORE RING ---
const ScoreRing: React.FC<{ score: number; label: string; colorClass?: string }> = ({ score, label, colorClass }) => {
  const radius = 36;
  const stroke = 3; 
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = colorClass || (score < 60 ? 'stroke-rose-500' : score < 90 ? 'stroke-amber-500' : 'stroke-emerald-500');
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center mb-3">
        {/* Background Circle */}
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          <circle stroke="#f1f5f9" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
          <circle 
            stroke="currentColor" 
            fill="transparent" 
            strokeWidth={stroke} 
            strokeDasharray={circumference + ' ' + circumference} 
            style={{ strokeDashoffset }} 
            r={normalizedRadius} 
            cx={radius} 
            cy={radius} 
            strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-out`} 
          />
        </svg>
        <span className="absolute text-2xl font-bold text-slate-800 tracking-tighter">{score}</span>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">{label}</span>
    </div>
  );
};

type UnifiedIssueType = 'Fact' | 'Strategy' | 'Compliance';
interface UnifiedIssue {
  id: string;
  category: UnifiedIssueType;
  quote: string;
  reason: string;
  suggestion: string;
  referenceFix?: string;
  rule?: string;
  subType?: string;
  source: 'output' | 'reasoning';
}

const AuditWorkspace: React.FC<{ 
  fullText: string; 
  reasoningText: string;
  issues: UnifiedIssue[];
  t: LocalizedComponentProps['t'];
  onApplyFix: (quote: string, replacement: string) => void;
}> = ({ fullText, reasoningText, issues, t, onApplyFix }) => {
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'output' | 'reasoning'>('output');
  const issuesListRef = useRef<HTMLDivElement>(null);

  const displayIssues = issues.filter(i => i.source === activeTab);
  const displayText = activeTab === 'output' ? fullText : (reasoningText || 'No Reasoning Trace provided.');

  const handleTextClick = (issueId: string) => {
    setActiveIssueId(issueId);
    const card = document.getElementById(`issue-card-${issueId}`);
    if (card && issuesListRef.current) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderInteractiveText = () => {
    if (!displayIssues.length) return <p className="text-slate-600 whitespace-pre-wrap leading-loose">{displayText}</p>;

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    interface Match { start: number; end: number; issueId: string; category: UnifiedIssueType; }
    const matches: Match[] = [];

    displayIssues.forEach(issue => {
      if (!issue.quote) return;
      const regex = new RegExp(escapeRegExp(issue.quote), 'g');
      let match;
      while ((match = regex.exec(displayText)) !== null) {
        if (!matches.some(m => (match!.index >= m.start && match!.index < m.end))) {
          matches.push({ start: match.index, end: match.index + issue.quote.length, issueId: issue.id, category: issue.category });
        }
      }
    });
    matches.sort((a, b) => a.start - b.start);

    const parts = [];
    let lastIndex = 0;

    matches.forEach((match, i) => {
      if (match.start > lastIndex) {
        parts.push(<span key={`text-${i}`}>{displayText.substring(lastIndex, match.start)}</span>);
      }

      const isActive = activeIssueId === match.issueId;
      let classes = "cursor-pointer rounded-[2px] px-[1px] transition-all duration-200 border-b-2 ";
      
      if (match.category === 'Fact') {
        classes += isActive 
          ? "bg-rose-100 text-rose-900 border-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.2)]" 
          : "bg-rose-50/80 text-rose-900 border-rose-200 hover:bg-rose-100";
      } else if (match.category === 'Strategy') {
        classes += isActive 
          ? "bg-indigo-100 text-indigo-900 border-indigo-500 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]" 
          : "bg-indigo-50/80 text-indigo-900 border-indigo-200 hover:bg-indigo-100";
      } else {
        classes += isActive 
          ? "bg-amber-100 text-amber-900 border-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]" 
          : "bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100";
      }

      parts.push(
        <span
          key={`match-${i}`}
          className={classes}
          onClick={(e) => { e.stopPropagation(); handleTextClick(match.issueId); }}
        >
          {displayText.substring(match.start, match.end)}
        </span>
      );
      lastIndex = match.end;
    });

    if (lastIndex < displayText.length) {
      parts.push(<span key="text-end">{displayText.substring(lastIndex)}</span>);
    }

    return parts;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[700px]">
      {/* LEFT: SOURCE TEXT & TABS */}
      <div className="xl:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <FileText className="w-3.5 h-3.5" />
               {t.sourceText}
            </span>
            
            <div className="flex bg-slate-200/50 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('output')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'output' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.tabOutput}
                </button>
                <button 
                  onClick={() => setActiveTab('reasoning')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'reasoning' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.tabReasoning}
                </button>
            </div>
         </div>
         <div className="flex-1 p-8 overflow-y-auto custom-scrollbar text-[15px] leading-loose text-slate-700 font-normal whitespace-pre-wrap" onClick={() => setActiveIssueId(null)}>
            {renderInteractiveText()}
         </div>
      </div>

      {/* RIGHT: INSIGHTS CARD LIST */}
      <div className="xl:col-span-5 flex flex-col rounded-2xl border border-slate-200/60 shadow-inner bg-slate-50/50 overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <LayoutDashboard className="w-3.5 h-3.5" />
               {t.findings}
            </span>
            <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full shadow-sm">{displayIssues.length}</span>
         </div>
         
         <div ref={issuesListRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
            {displayIssues.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 opacity-60">
                  <CheckCircle2 className="w-10 h-10 stroke-1" />
                  <p className="text-sm font-medium">No issues detected in {activeTab === 'output' ? 'Output' : 'Reasoning'}.</p>
               </div>
            ) : (
               displayIssues.map((issue) => (
                 <div 
                   key={issue.id} 
                   id={`issue-card-${issue.id}`}
                   className={`rounded-xl p-5 transition-all duration-300 relative overflow-hidden ${
                     activeIssueId === issue.id 
                       ? 'bg-white shadow-lg shadow-indigo-100 ring-1 ring-indigo-50 translate-x-1' 
                       : 'bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
                   }`}
                   onClick={() => setActiveIssueId(issue.id)}
                 >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      issue.category === 'Fact' ? 'bg-rose-500' : issue.category === 'Strategy' ? 'bg-indigo-500' : 'bg-amber-500'
                    }`} />

                    <div className="flex items-center justify-between mb-3 pl-2">
                       <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                             issue.category === 'Fact' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                             issue.category === 'Strategy' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                             'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {issue.category === 'Fact' ? t.cardTypeFact : issue.category === 'Strategy' ? t.cardTypeStrategy : t.cardTypeCompliance}
                          </span>
                       </div>
                    </div>

                    <div className="pl-2 space-y-4">
                        <p className="text-xs text-slate-400 italic line-clamp-2">"{issue.quote}"</p>
                        <div>
                           <div className="flex items-center gap-1.5 mb-1">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.labelReason}</span>
                           </div>
                           <p className="text-xs text-slate-700 font-medium leading-relaxed">{issue.reason}</p>
                        </div>
                        <div className={`p-3 rounded-lg border ${
                           issue.category === 'Fact' ? 'bg-rose-50 border-rose-100' : 
                           issue.category === 'Strategy' ? 'bg-indigo-50 border-indigo-100' : 'bg-amber-50 border-amber-100'
                        }`}>
                           <div className="flex items-center gap-1.5 mb-1.5">
                              <Lightbulb className={`w-3.5 h-3.5 ${
                                 issue.category === 'Fact' ? 'text-rose-600' : issue.category === 'Strategy' ? 'text-indigo-600' : 'text-amber-600'
                              }`} />
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                 issue.category === 'Fact' ? 'text-rose-700' : issue.category === 'Strategy' ? 'text-indigo-700' : 'text-amber-700'
                              }`}>{t.labelPromptFix}</span>
                           </div>
                           <p className={`text-xs font-medium leading-relaxed ${
                              issue.category === 'Fact' ? 'text-rose-900' : issue.category === 'Strategy' ? 'text-indigo-900' : 'text-amber-900'
                           }`}>{issue.suggestion}</p>
                        </div>
                        {issue.referenceFix && activeTab === 'output' && (
                          <button 
                            className="w-full mt-2 group flex items-center justify-between p-2 rounded-lg border border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left"
                            onClick={(e) => { e.stopPropagation(); onApplyFix(issue.quote, issue.referenceFix!); }}
                          >
                             <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 uppercase transition-colors">{t.labelTextFix}</span>
                                <span className="text-xs text-slate-600 group-hover:text-emerald-800 font-mono mt-0.5 line-clamp-1">{issue.referenceFix}</span>
                             </div>
                             <Wand2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                          </button>
                        )}
                    </div>
                 </div>
               ))
            )}
         </div>
      </div>
    </div>
  );
};


export const AnalysisResultSection: React.FC<AnalysisResultProps> = ({ result, loading, isOptimizing, onApplyPrompt, onApplyFix, fullText, reasoningText, originalPrompt, t }) => {
  const [currentEditedPrompt, setCurrentEditedPrompt] = useState(result?.optimizedPrompt || "");

  useEffect(() => {
    if (result && result.optimizedPrompt) {
      setCurrentEditedPrompt(result.optimizedPrompt);
    }
  }, [result]);

  const unifiedIssues: UnifiedIssue[] = useMemo(() => {
    if (!result) return [];
    const ui: UnifiedIssue[] = [];
    
    result.issues.forEach((i, idx) => {
      ui.push({
        id: `fact-${idx}`,
        category: 'Fact',
        quote: i.quote,
        source: i.source || 'output',
        reason: i.reason,
        suggestion: i.suggestion,
        referenceFix: i.replacement,
        subType: i.type
      });
    });

    result.strategyReport?.issues.forEach((i, idx) => {
      ui.push({
        id: `strat-${idx}`,
        category: 'Strategy',
        quote: i.quote,
        source: i.source || 'output',
        reason: i.violation,
        suggestion: i.promptImprovement,
        rule: i.rule,
        subType: 'Adherence'
      });
    });

    result.complianceIssues?.forEach((i, idx) => {
      ui.push({
        id: `comp-${idx}`,
        category: 'Compliance',
        quote: i.quote,
        source: i.source || 'output',
        reason: i.reason,
        suggestion: i.suggestion,
        subType: i.type
      });
    });

    return ui;
  }, [result]);

  if (loading) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center space-y-4 p-32 bg-white rounded-3xl border border-slate-100 shadow-sm animate-pulse">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm tracking-wide">{t.btnRunning}</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-16 animate-fade-in pb-20">
      
      {/* 1. REPORT HEADER CARD */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row">
           <div className="p-10 flex-1 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg shadow-slate-900/10">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{t.reportTitle}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Generated by Gemini 2.5</p>
                </div>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed mb-8 max-w-2xl">
                {result.summary}
              </p>
              
              <div className="inline-flex items-center gap-3 bg-indigo-50/50 px-4 py-3 rounded-xl border border-indigo-100/50">
                 <Target className="w-4 h-4 text-indigo-500" />
                 <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{t.metaStrategyLabel}</p>
                    <p className="text-xs font-semibold text-indigo-900">"{result.strategyReport.metaStrategy}"</p>
                 </div>
              </div>
           </div>

           <div className="p-10 flex items-center justify-center gap-10 bg-slate-50/50 border-l border-slate-100 min-w-[360px]">
              <ScoreRing score={result.score} label={t.trustScore} />
              <div className="h-16 w-px bg-slate-200/60"></div>
              <ScoreRing 
                score={result.strategyReport.adherenceScore} 
                label={t.strategyScore} 
                colorClass={result.strategyReport.adherenceScore > 80 ? 'stroke-indigo-500' : 'stroke-purple-500'} 
              />
           </div>
        </div>
      </div>

      {/* 2. ASSESSMENT WORKSPACE */}
      <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
                 <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                    <AlertOctagon className="w-5 h-5 text-indigo-600" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-800">{t.workspaceTitle}</h3>
                   <p className="text-xs text-slate-500 font-medium">{t.workspaceDesc}</p>
                 </div>
            </div>
          </div>
          
          <AuditWorkspace 
            fullText={fullText} 
            reasoningText={reasoningText}
            issues={unifiedIssues} 
            t={t} 
            onApplyFix={onApplyFix} 
          />
      </section>

      {/* 3. PROMPT OPTIMIZATION */}
      <section className="space-y-6 pt-10 border-t border-slate-100">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                 <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                    <Wand2 className="w-5 h-5 text-emerald-600" />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-slate-800">{t.dimPromptTitle}</h3>
                   <p className="text-xs text-slate-500 font-medium">{t.dimPromptDesc}</p>
                 </div>
              </div>
              <button 
                onClick={() => onApplyPrompt(currentEditedPrompt)}
                className="text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 py-3 px-6 rounded-xl transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
                disabled={isOptimizing || !currentEditedPrompt}
              >
                <Check className="w-4 h-4" />
                {t.applyPrompt}
              </button>
           </div>
           
           <PromptDiffEditor 
              original={originalPrompt} 
              initialOptimized={result.optimizedPrompt}
              suggestions={result.promptSuggestions}
              rootCause={result.rootCause}
              isOptimizing={isOptimizing}
              t={t}
              onUpdate={setCurrentEditedPrompt}
           />
      </section>

    </div>
  );
};