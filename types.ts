import { Translation } from "./i18n";

export interface HallucinationIssue {
  quote: string;
  source: 'output' | 'reasoning'; // Where did this occur?
  type: 'Fabrication' | 'Contradiction' | 'Omission' | 'Reasoning Error' | 'Other';
  reason: string;
  suggestion: string;
  replacement: string; 
}

export interface ComplianceIssue {
  quote: string;
  source: 'output' | 'reasoning';
  type: 'Ad Law Violation' | 'Risk' | 'Ethical Concern' | 'Strategy Violation';
  severity: 'High' | 'Medium' | 'Low';
  reason: string;
  suggestion: string;
}

export interface StrategyIssue {
  rule: string; 
  quote: string; 
  source: 'output' | 'reasoning';
  violation: string; 
  promptImprovement: string; 
}

export interface StrategyReport {
  metaStrategy: string; 
  adherenceScore: number; 
  issues: StrategyIssue[];
}

export interface AnalysisResult {
  hasHallucination: boolean;
  score: number;
  summary: string;
  rootCause: string;
  
  strategyReport: StrategyReport;

  // Optional for Two-Stage Loading
  promptSuggestions?: string[]; 
  optimizedPrompt?: string; 
  
  issues: HallucinationIssue[]; 
  complianceIssues?: ComplianceIssue[]; 
}

export interface AnalysisInput {
  facts: string;
  process: string;
  reasoning: string; // New: Chain of Thought input
  output: string;
  language: 'en' | 'zh';
}

export interface LocalizedComponentProps {
  t: Translation;
}