import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisInput, AnalysisResult } from "../types";

const apiKey = process.env.API_KEY;

// Schema for Phase 1: Audit
const auditSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hasHallucination: { type: Type.BOOLEAN },
    score: { type: Type.INTEGER },
    summary: { type: Type.STRING },
    strategyReport: {
      type: Type.OBJECT,
      properties: {
        metaStrategy: { type: Type.STRING },
        adherenceScore: { type: Type.INTEGER },
        issues: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              rule: { type: Type.STRING },
              source: { type: Type.STRING, enum: ["output", "reasoning"] },
              quote: { type: Type.STRING },
              violation: { type: Type.STRING },
              promptImprovement: { type: Type.STRING }
            },
            required: ["rule", "quote", "source", "violation", "promptImprovement"]
          }
        }
      },
      required: ["metaStrategy", "adherenceScore", "issues"]
    },
    rootCause: { type: Type.STRING },
    issues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          source: { type: Type.STRING, enum: ["output", "reasoning"] },
          type: { type: Type.STRING, enum: ["Fabrication", "Contradiction", "Omission", "Reasoning Error", "Other"] },
          reason: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          replacement: { type: Type.STRING },
        },
        required: ["quote", "source", "type", "reason", "suggestion", "replacement"],
      },
    },
    complianceIssues: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          source: { type: Type.STRING, enum: ["output", "reasoning"] },
          type: { type: Type.STRING, enum: ["Ad Law Violation", "Risk", "Ethical Concern", "Strategy Violation"] },
          severity: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          reason: { type: Type.STRING },
          suggestion: { type: Type.STRING },
        },
        required: ["quote", "source", "type", "severity", "reason", "suggestion"],
      },
    },
  },
  required: ["hasHallucination", "score", "summary", "strategyReport", "rootCause", "issues"],
};

// Schema for Phase 2: Optimization
const optimizationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    promptSuggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    optimizedPrompt: {
      type: Type.STRING,
    },
  },
  required: ["promptSuggestions", "optimizedPrompt"]
};

// Phase 1: Audit Content (Fast)
export const auditContent = async (input: AnalysisInput): Promise<AnalysisResult> => {
  if (!apiKey) throw new Error("API Key not found.");
  const ai = new GoogleGenAI({ apiKey });
  const language = input.language === 'zh' ? 'Chinese (Simplified)' : 'English';

  const systemInstruction = `
    You are an expert AI Auditor and Chief Strategy Officer.
    
    ### TASK: UNIFIED ASSESSMENT
    1. **Fact Check**: Compare 'Model Output' against 'Facts'. Flag Fabrications, Contradictions, and Omissions.
    2. **Reasoning Audit**: Analyze 'Reasoning Trace' for logical fallacies, ignored constraints, or premature conclusions.
    3. **Strategy Audit**: Extract 'Meta Strategy' from 'Process/Prompt' and check adherence.
    4. **Compliance**: Check for Ad Law Violations (e.g., "Best", "No.1") and safety risks.
    5. **Root Cause**: Diagnose WHY the model failed.

    ### RULES:
    - **Semantic Equivalence**: Do NOT flag if meaning is preserved.
    - **Language**: Output all analysis in **${language}**.
  `;

  const prompt = `
    --- FACTS ---
    ${input.facts || "N/A"}
    --- USER PROMPT ---
    ${input.process || "N/A"}
    --- REASONING ---
    ${input.reasoning || "N/A"}
    --- OUTPUT ---
    ${input.output}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: auditSchema,
      temperature: 0.2,
    },
  });

  if (response.text) {
    return JSON.parse(response.text) as AnalysisResult;
  }
  throw new Error("Empty response from AI.");
};

// Phase 2: Optimize Prompt (Slow)
export const generateOptimizedPrompt = async (input: AnalysisInput, auditResult: AnalysisResult): Promise<{ optimizedPrompt: string; promptSuggestions: string[] }> => {
  if (!apiKey) throw new Error("API Key not found.");
  const ai = new GoogleGenAI({ apiKey });
  const language = input.language === 'zh' ? 'Chinese (Simplified)' : 'English';

  const systemInstruction = `
    You are an expert Prompt Engineer.
    Based on the audit issues provided, optimize the user's prompt to prevent these specific errors.

    ### CRITICAL RULES:
    1. **PROTECT VARIABLES**: The user's prompt contains DYNAMIC INPUT sections (e.g., '## Data', '{{var}}'). **DO NOT** optimize these. Only optimize instructions/logic.
    2. **Minimal Modification**: Keep original structure. Only add constraints to fix detected issues.
    3. **Raw Text**: Return optimized prompt as raw text.
    4. **Language**: Explanations in **${language}**.
  `;

  const prompt = `
    --- ORIGINAL PROMPT ---
    ${input.process}
    
    --- AUDIT ISSUES ---
    Root Cause: ${auditResult.rootCause}
    Issues: ${JSON.stringify(auditResult.issues)}
    Strategy Gaps: ${JSON.stringify(auditResult.strategyReport.issues)}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: optimizationSchema,
      temperature: 0.5,
    },
  });

  if (response.text) {
    let parsed = JSON.parse(response.text);
    // Clean markdown if present
    if (parsed.optimizedPrompt.startsWith("```")) {
      parsed.optimizedPrompt = parsed.optimizedPrompt.replace(/^```(markdown|text)?/, '').replace(/```$/, '').trim();
    }
    return parsed;
  }
  throw new Error("Empty response from AI.");
};