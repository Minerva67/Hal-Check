
export const translations = {
  en: {
    title: "HalCheck",
    subtitle: "Check your prompts for hallucinations & strategy adherence",
    modelName: "Gemini 2.5 Flash",
    
    // Controls
    btnClear: "Reset",
    btnExample: "Load Demo",
    btnRun: "Run HalCheck",
    btnRunning: "Analyzing...",
    
    // Inputs
    labelFacts: "Ground Truth",
    labelFactsSub: "Knowledge Base",
    placeholderFacts: "Enter verifiable facts, product specs, or policy clauses here...",
    
    labelProcess: "Instructions",
    labelProcessSub: "Prompt",
    placeholderProcess: "Enter your System Prompt or User Instructions...",
    
    labelReasoning: "Reasoning Trace",
    labelReasoningSub: "Chain of Thought",
    placeholderReasoning: "(Optional) Paste the model's Chain of Thought / Reasoning Trace here to audit logical fallacies...",

    labelOutput: "Generated Content",
    labelOutputSub: "To Evaluate",
    placeholderOutput: "Paste the final AI-generated text here...",
    
    // Results - Executive Summary
    reportTitle: "Assessment Report",
    trustScore: "Reliability Score",
    strategyScore: "Strategy Adherence",
    metaStrategyLabel: "Detected Intent / Strategy",
    totalFlags: "Issues Detected",
    
    // Audit Workspace
    workspaceTitle: "Assessment Workspace",
    workspaceDesc: "Deep dive into accuracy, strategy alignment, and safety.",
    sourceText: "Content Source",
    findings: "Insights & Optimization",
    
    // Tabs
    tabOutput: "Final Output",
    tabReasoning: "Reasoning Trace",

    // Issue Cards
    cardTypeFact: "Accuracy Issue",
    cardTypeStrategy: "Strategy Gap",
    cardTypeCompliance: "Safety Risk",
    labelReason: "Diagnosis",
    labelPromptFix: "Optimization Strategy",
    labelTextFix: "Suggested Edit",
    
    // Dimension 2 (Prompt)
    dimPromptTitle: "Prompt Engineering",
    dimPromptDesc: "Logic refinement and constraint optimization.",
    originalPrompt: "Current Prompt",
    optimizedPrompt: "Optimized Prompt",
    statusOptimizing: "Generating Optimization Strategy...",
    btnCopy: "Copy",
    copied: "Copied!",
    applyPrompt: "Use Optimized Prompt",
    optimizationLogic: "Refinement Logic",
    
    // Errors
    errMissingInput: "Please provide both Ground Truth and Generated Content.",
    errFailed: "Assessment failed. Please check your network or API key."
  },
  
  zh: {
    title: "HalCheck",
    subtitle: "为您的提示词检查幻觉与策略遵循度",
    modelName: "Gemini 2.5 Flash",
    
    // Controls
    btnClear: "重置",
    btnExample: "加载示例",
    btnRun: "开始检测",
    btnRunning: "智能评估中...",
    
    // Inputs
    labelFacts: "事实依据 (Ground Truth)",
    labelFactsSub: "基准知识",
    placeholderFacts: "输入确定的事实信息...\n例如：产品详细参数、活动规则、法律条款等。",
    
    labelProcess: "指令与上下文 (Prompt)",
    labelProcessSub: "输入",
    placeholderProcess: "输入用于生成内容的提示词。\n\n提示：系统会自动保护结构化数据，仅针对指令逻辑优化。",
    
    labelReasoning: "推理过程 (Reasoning)",
    labelReasoningSub: "思维链",
    placeholderReasoning: "(可选) 粘贴推理模型的 Reasoning Trace / CoT 过程。\n系统将分析其逻辑推演是否存在谬误。",

    labelOutput: "AI 生成内容",
    labelOutputSub: "评估对象",
    placeholderOutput: "在此粘贴 AI 生成的内容...",
    
    // Results - Executive Summary
    reportTitle: "评估报告",
    trustScore: "可信度评分",
    strategyScore: "策略遵循度",
    metaStrategyLabel: "识别到的策略意图",
    totalFlags: "待优化项",
    
    // Audit Workspace
    workspaceTitle: "评估工作台",
    workspaceDesc: "事实准确性 · 策略一致性 · 安全风控",
    sourceText: "内容原文",
    findings: "评估发现与优化建议",

    // Tabs
    tabOutput: "最终输出",
    tabReasoning: "推理过程",
    
    // Issue Cards
    cardTypeFact: "准确性问题",
    cardTypeStrategy: "策略偏差",
    cardTypeCompliance: "风控提示",
    labelReason: "原因分析",
    labelPromptFix: "提示词优化策略",
    labelTextFix: "文本修改建议",
    
    // Dimension 2 (Prompt)
    dimPromptTitle: "提示词工程优化",
    dimPromptDesc: "修复逻辑漏洞，增强指令约束力。",
    originalPrompt: "原始提示词",
    optimizedPrompt: "优化推荐 (可编辑)",
    statusOptimizing: "正在生成提示词优化策略...",
    btnCopy: "复制",
    copied: "已复制",
    applyPrompt: "应用优化",
    optimizationLogic: "优化思路",
    
    // Errors
    errMissingInput: "请至少提供“事实依据”和“AI生成内容”。",
    errFailed: "评估失败，请检查网络或API Key设置。"
  }
};

export type Translation = typeof translations.en;
