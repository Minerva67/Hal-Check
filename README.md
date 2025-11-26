# HalCheck · Hallucination & Logic Check

一款用于 **AI 输出可信度审计、策略遵循分析、推理过程检查、Prompt 优化** 的轻量级 Web 工具。

HalCheck 可以对模型输出的结果、提示词、推理链（Reasoning Trace）进行综合分析，识别错误、指出根因，并自动生成优化建议与改进后的 Prompt。

---

## ✨ 功能特点

### 🔍 1. 事实审计（Fact Check）

* 检查模型输出是否与 Ground Truth 一致
* 自动识别：臆造、矛盾、遗漏、错误推理等问题

### 🧠 2. 推理链（CoT）分析

* 支持输入 reasoning trace
* 自动识别：忽略约束、错误逻辑跳跃、不合理推理

### 🎯 3. 策略遵循（Strategy Audit）

* 自动抽取 Prompt 的 Meta Strategy
* 检查生成内容是否遵循策略（语气、禁用词、风控等）

### 🛡️ 4. 合规审计（Compliance Check）

* 检测广告法违规（如“最”“第一”）
* 检测敏感风险项（Safety / Ethical）

### ⚙️ 5. Prompt 自动优化（Two-Stage Pipeline）

为提升性能，流程被拆分为两阶段：

* **Phase 1（极速）**：返回 Fact / Strategy / Compliance 审计结果
* **Phase 2（后台）**：自动生成提示词优化建议 & 优化后的 Prompt
* 支持一键复制优化后 Prompt

### 💡 6. 更高效的用户体验（UI / UX）

* 4-列输入工作区（Facts / Prompt / Reasoning / Output）
* 滑动高亮错误来源（Output / Reasoning 可切换）
* 优化提示词区域带 Diff 对比（新增 vs 删除）
* 一键应用优化内容

---

## 🧱 技术架构

### **前端：React + TypeScript**

* UI 使用 Tailwind + 自定义动画
* 高级 diff 高亮与双层编辑器
* 多语言（中文 / 英文）切换支持

### **AI 服务：Gemini 2.5 Flash**

* 自定义系统指令
* JSON Schema 强约束输出
* 使用两阶段模型调用降低首屏延迟

---

## 🚀 项目启动

### 1. 克隆项目

```bash
git clone https://github.com/<your-repo>/HalCheck.git
cd HalCheck
```

### 2. 安装依赖

```bash
npm install
```

### 3. 设置环境变量

在根目录创建 `.env`：

```
API_KEY=your_gemini_api_key_here
```

### 4. 启动项目

```bash
npm run dev
```

项目将运行在：

```
http://localhost:5173
```

---

## 📁 项目结构

```
src/
├── components/
│   ├── Header.tsx
│   ├── AnalysisResult.tsx
│
├── services/
│   ├── geminiService.ts  ← 两阶段Pipeline核心
│
├── types.ts              ← 数据 Schema & 类型定义
├── i18n.ts               ← 语言文案
├── App.tsx               ← 主逻辑与状态管理
```

---

## 🔧 Two-Stage Pipeline（性能优化机制）

### Phase 1：`auditContent()`

* 极快速返回
* 检查：事实准确性 / 策略遵循 / 风控 / 推理出错点

### Phase 2：`generateOptimizedPrompt()`

* 后台运行
* 根据所有问题生成优化建议
* 输出优化后的 Prompt
* Diff 高亮展示 + 一键复制

---

## 🧪 示例输入

工具内置示例可直接加载：

* 示例 Facts
* 示例 Prompt
* 示例 Reasoning（推理链）
* 示例 Output

方便进行测试与 Debug。

---

## 🤝 贡献

欢迎提出 Issue 或 PR！

---

## 📝 License

MIT License.
