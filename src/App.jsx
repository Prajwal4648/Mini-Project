import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Play, Moon, Sun, Code2, AlertCircle, CheckCircle, BookOpen, Loader2, Brain } from 'lucide-react';
import Split from 'react-split';
import AIReviewPane from "./components/AIReviewPane";

const LANG_CONFIG = {
  java:       { label: 'Java',       jdoodle: 'java',    version: '4', ext: 'java', badge: 'bg-orange-500/20 text-orange-400' },
  python3:    { label: 'Python 3',   jdoodle: 'python3', version: '4', ext: 'py',   badge: 'bg-blue-500/20 text-blue-400'   },
  cpp:        { label: 'C++17',      jdoodle: 'cpp17',   version: '1', ext: 'cpp',  badge: 'bg-purple-500/20 text-purple-400' },
  javascript: { label: 'JavaScript', jdoodle: 'nodejs',  version: '4', ext: 'js',   badge: 'bg-yellow-500/20 text-yellow-400' },
};

const DEFAULT_CODE = {
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  python3: `# Python 3
print("Hello, World!")`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  javascript: `// JavaScript (Node.js)
console.log("Hello, World!");`,
};

const DIFFICULTY_COLORS = {
  Easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Hard: 'bg-red-500/20 text-red-400 border-red-500/30',
};
const DIFFICULTY_COLORS_LIGHT = {
  Easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200',
  Hard: 'bg-red-100 text-red-700 border-red-200',
};

export default function App() {
  const [searchParams] = useSearchParams();
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(DEFAULT_CODE.java);
  const [problemTemplates, setProblemTemplates] = useState({});
  const [problemDrivers, setProblemDrivers]   = useState({});
  
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState(null); // 'success', 'error', null
  const [isDark, setIsDark] = useState(true);
  const [leftTab, setLeftTab] = useState('description');
  const [rightTab, setRightTab] = useState('output');
  // AI review state
  const [aiAnalysis, setAiAnalysis] = useState(null); // { issues, improvements, complexity, hints }
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  // stdin for program input
  const [stdin, setStdin] = useState('');
  // Live per-line review state
  const [enableLiveReview, setEnableLiveReview] = useState(false);
  const [lineAnnotations, setLineAnnotations] = useState([]); // [{line, issue, hint, severity, suggestion, explanationSteps}]
  const [aiLiveLoading, setAiLiveLoading] = useState(false);
  const reviewDebounceRef = useRef(null);

  // Problem state
  const [problem, setProblem] = useState(null);       // { title, difficulty, content, topicTags, ... }
  const [hiddenDriverCode, setHiddenDriverCode] = useState('');
  const [showProblemPane, setShowProblemPane] = useState(true);
  const [problemLoading, setProblemLoading] = useState(false);

  // Fetch problem when URL param changes
  useEffect(() => {
    const slug = searchParams.get('problem');
    if (!slug) {
      setProblem(null);
      setProblemTemplates({});
      setProblemDrivers({});
      setHiddenDriverCode('');
      setCode(DEFAULT_CODE[language]);
      return;
    }
    setProblemLoading(true);
    fetch(`http://localhost:3001/api/problem/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.message || data.error);
        setProblem(data);
        setProblemTemplates(data.templates || {});
        setProblemDrivers(data.driverCodes || {});
        setCode(data.templates?.[language] || data.templates?.java || '');
        setHiddenDriverCode(data.driverCodes?.[language] || data.driverCodes?.java || '');
        setOutput('');
        setCompileStatus(null);
      })
      .catch(err => console.error('Problem fetch error:', err))
      .finally(() => setProblemLoading(false));
  }, [searchParams]);

  // Swap template + driver when user changes language
  useEffect(() => {
    if (problem) {
      setCode(problemTemplates[language] || `// No ${LANG_CONFIG[language]?.label} template available for this problem.`);
      setHiddenDriverCode(problemDrivers[language] || '');
    } else {
      setCode(DEFAULT_CODE[language]);
      setHiddenDriverCode('');
    }
    setOutput('');
    setCompileStatus(null);
  }, [language]);

  const compileAndRun = async () => {
    setIsCompiling(true);
    setRightTab('output');
    setOutput('Compiling and running your Java code...\n');
    setCompileStatus(null);

    try {
      console.log('🚀 Sending request to backend...');
      console.log('Code length:', code.length);
      
      // Use local backend server to avoid CORS issues
      const fullCode = hiddenDriverCode ? `${code}\n\n${hiddenDriverCode}` : code;
      const langCfg = LANG_CONFIG[language];
      const response = await fetch('http://localhost:3001/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: fullCode,
          language: langCfg.jdoodle,
          versionIndex: langCfg.version,
          stdin
        })
      });

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.output) {
        setOutput(result.output);
        setCompileStatus('success');
      } else if (result.error) {
        setOutput(`Compilation Error:\n${result.error}`);
        setCompileStatus('error');
      } else if (result.statusCode === 200) {
        setOutput('✓ Program executed successfully (no output).');
        setCompileStatus('success');
      } else {
        setOutput('No output received from the compiler.');
        setCompileStatus('success');
      }
    } catch (error) {
      console.error('Compilation error:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setOutput(`❌ Backend Server Not Running

⚠️ The local backend server is not running. Please start it to compile Java code.

🚀 How to start the server:

1. Open a new terminal
2. Run: npm run server

Or run both frontend and backend together:
   npm start

💡 The backend server runs on port 3001 and handles API requests
   to avoid CORS issues when calling the compilation service.

📝 Your code is saved in the editor!`);
      } else {
        setOutput(`❌ Error: ${error.message}\n\nPlease check your code for syntax errors or try again.`);
      }
      setCompileStatus('error');
    } finally {
      setIsCompiling(false);
    }
  };

  // Call backend Gemini API for structured review
  const runAIReview = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const resp = await fetch('http://localhost:3001/api/gemini/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: LANG_CONFIG[language]?.label || language })
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`AI review failed (${resp.status}): ${text}`);
      }
      const data = await resp.json();
      const analysis = data?.analysis;
      setAiAnalysis(analysis || null);
    } catch (err) {
      setAiError(err.message || 'AI review failed');
      setAiAnalysis(null);
    } finally {
      setAiLoading(false);
    }
  };

  // Live per-line annotations fetch (debounced on code changes)
  const fetchLineAnnotations = async (currentCode) => {
    setAiLiveLoading(true);
    try {
      const resp = await fetch('http://localhost:3001/api/gemini/annotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentCode, language: LANG_CONFIG[language]?.label || language })
      });
      const data = await resp.json();
      if (resp.ok) {
        setLineAnnotations(Array.isArray(data.lines) ? data.lines : []);
      }
    } catch (e) {
      // ignore transient errors for live mode
    } finally {
      setAiLiveLoading(false);
    }
  };

  useEffect(() => {
    if (!enableLiveReview) return;
    if (reviewDebounceRef.current) clearTimeout(reviewDebounceRef.current);
    reviewDebounceRef.current = setTimeout(() => {
      fetchLineAnnotations(code);
    }, 1200);
    return () => reviewDebounceRef.current && clearTimeout(reviewDebounceRef.current);
  }, [code, enableLiveReview]);

  // lightweight AI review summary text
  const aiReview = (() => {
    const lines = code.split('\n').length;
    const hasPrint = /System\.out\.println/.test(code);
    const hasLoop = /for\s*\(|while\s*\(/.test(code);
    const tips = [];
    if (!hasPrint) tips.push('- Consider adding System.out.println for visible output.');
    if (!hasLoop) tips.push('- Try a loop or conditional to demonstrate logic.');
    tips.push(`- Lines: ${lines}`);
    return `Quick review\n${tips.join('\n')}`;
  })();

  const tabCls = (active) =>
    `px-4 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
      active
        ? isDark ? 'border-blue-500 text-blue-400 bg-transparent' : 'border-blue-600 text-blue-600 bg-transparent'
        : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-700'
    }`;

  const panelBg   = isDark ? 'bg-slate-900'  : 'bg-white';
  const barBg     = isDark ? 'bg-slate-900 border-slate-800'  : 'bg-slate-50 border-slate-200';
  const divider   = isDark ? 'border-slate-800' : 'border-slate-200';
  const muted     = isDark ? 'text-slate-400'   : 'text-slate-500';

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>

      {/* ── NAVBAR ─────────────────────────────────────── */}
      <nav className={`shrink-0 h-12 flex items-center px-4 gap-3 border-b ${barBg}`}>
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Code2 className="w-4 h-4 text-white" />
          </div>
          <span className={`hidden sm:block font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
            CodeReviewX
          </span>
        </div>

        {/* Problem title + difficulty */}
        {(problem || problemLoading) && (
          <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-100'}`}>
            {problemLoading
              ? <Loader2 className={`w-3.5 h-3.5 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              : <>
                  <span className={`text-xs font-medium max-w-[220px] truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{problem?.title}</span>
                  {problem?.difficulty && (
                    <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded border font-semibold ${(isDark ? DIFFICULTY_COLORS : DIFFICULTY_COLORS_LIGHT)[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                  )}
                </>
            }
          </div>
        )}

        {/* Spacer */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/problems"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Problems</span>
          </Link>

          <button
            onClick={compileAndRun}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
            {isCompiling ? 'Running...' : 'Run'}
          </button>

          <button
            onClick={() => setIsDark(d => !d)}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-slate-200 hover:bg-slate-300 text-blue-600'}`}
          >
            {isDark
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* ── 3-PANEL WORKSPACE ──────────────────────────── */}
      <div className="flex-1 min-h-0">
        <Split
          className="flex h-full"
          sizes={[28, 44, 28]}
          minSize={[220, 280, 220]}
          gutterSize={5}
          direction="horizontal"
          gutterStyle={() => ({
            backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
            cursor: 'col-resize',
          })}
        >

          {/* ── LEFT: Question Panel ──────────────────── */}
          <div className={`flex flex-col h-full overflow-hidden border-r ${divider} ${panelBg}`}>
            {/* Tab bar */}
            <div className={`shrink-0 flex items-center border-b ${barBg}`}>
              <button className={tabCls(leftTab === 'description')} onClick={() => setLeftTab('description')}>Description</button>
              <button className={tabCls(leftTab === 'examples')}    onClick={() => setLeftTab('examples')}>Examples</button>
              {problem?.topicTags?.slice(0, 2).map(t => (
                <span key={t.slug} className={`hidden lg:inline-block ml-1 text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>{t.name}</span>
              ))}
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto p-4 ${panelBg}`}>
              {problemLoading && (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <Loader2 className={`w-6 h-6 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`text-sm ${muted}`}>Loading problem...</span>
                </div>
              )}

              {!problem && !problemLoading && (
                <div className={`flex flex-col items-center justify-center h-40 text-center gap-3 ${muted}`}>
                  <BookOpen className="w-10 h-10 opacity-30" />
                  <p className="text-sm font-medium">No problem selected</p>
                  <p className="text-xs">
                    Browse the{' '}
                    <Link to="/problems" className={`underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      Problems
                    </Link>{' '}
                    page and click any question
                  </p>
                </div>
              )}

              {problem && leftTab === 'description' && (
                <div
                  className={`prose prose-sm max-w-none leading-relaxed ${
                    isDark
                      ? 'prose-invert text-slate-300 [&_code]:bg-slate-800 [&_code]:text-blue-300 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.8em] [&_pre]:bg-slate-800 [&_pre]:rounded-lg [&_strong]:text-white [&_p]:text-slate-300 [&_li]:text-slate-300'
                      : 'text-slate-700 [&_code]:bg-slate-100 [&_code]:text-blue-700 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[0.8em]'
                  }`}
                  dangerouslySetInnerHTML={{ __html: problem.content }}
                />
              )}

              {leftTab === 'examples' && !problemLoading && (
                <div className="space-y-4">
                  {problem?.exampleTestcases
                    ? problem.exampleTestcases.split('\n').filter(Boolean).map((line, i) => (
                        <div key={i} className={`rounded-xl border p-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${muted}`}>Input {i + 1}</p>
                          <pre className={`font-mono text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{line}</pre>
                        </div>
                      ))
                    : <p className={`text-sm ${muted}`}>No examples available.</p>
                  }
                </div>
              )}
            </div>
          </div>

          {/* ── MIDDLE: Code Editor ───────────────────── */}
          <div className={`flex flex-col h-full overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            {/* Editor header bar */}
            <div className={`shrink-0 flex items-center justify-between px-3 py-2 border-b ${barBg}`}>
              <div className="flex items-center gap-2">
                <span className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                </span>
                <span className={`text-xs font-medium ml-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Solution.{LANG_CONFIG[language]?.ext}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {/* Language selector */}
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className={`text-xs px-2 py-1 rounded border font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {Object.entries(LANG_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
                <span className={muted}>{code.split('\n').length} lines</span>
              </div>
            </div>

            {/* Textarea */}
            <div className={`relative flex-1 min-h-0 overflow-hidden ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`}>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full h-full p-4 font-mono text-sm resize-none focus:outline-none overflow-auto whitespace-pre ${
                  isDark ? 'bg-[#0f172a] text-slate-100 caret-blue-400' : 'bg-white text-slate-900'
                }`}
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", lineHeight: '1.7', tabSize: 4 }}
                wrap="off"
                spellCheck={false}
                placeholder="Write your Java solution here..."
              />
              {/* Live annotation dots */}
              {enableLiveReview && lineAnnotations.length > 0 && (
                <div className="pointer-events-none absolute top-0 left-1 w-4 h-full select-none">
                  {lineAnnotations.map((a) => (
                    <div
                      key={`mark-${a.line}`}
                      style={{ position: 'absolute', top: `calc(${a.line - 1} * 1.7em + 1rem)` }}
                      className={`w-4 h-[1.5em] flex items-center justify-center text-[10px] ${a.severity === 'error' ? 'text-red-500' : a.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}
                      title={`Line ${a.line}: ${a.issue || a.suggestion || ''}`}
                    >●</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Output + AI Review ─────────────── */}
          <div className={`flex flex-col h-full overflow-hidden border-l ${divider} ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
            {/* Tab bar */}
            <div className={`shrink-0 flex items-center border-b ${barBg}`}>
              <button className={tabCls(rightTab === 'output')} onClick={() => setRightTab('output')}>
                Output
              </button>
              <button
                className={`${tabCls(rightTab === 'ai')} flex items-center gap-1`}
                onClick={() => setRightTab('ai')}
              >
                <Brain className="w-3 h-3" /> AI Review
              </button>
              {/* Status badge */}
              <span className="ml-auto mr-3 flex items-center gap-1.5">
                {isCompiling && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                {compileStatus === 'success' && !isCompiling && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                {compileStatus === 'error'   && !isCompiling && <AlertCircle  className="w-3.5 h-3.5 text-red-500"   />}
              </span>
            </div>

            {/* Output tab */}
            {rightTab === 'output' && (
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* stdin */}
                <div className={`shrink-0 border-b px-3 py-2.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${muted}`}>
                    Program Input (stdin)
                  </label>
                  <textarea
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="Enter input for your program..."
                    rows={2}
                    className={`w-full text-xs font-mono rounded-lg border px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/40 ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400'
                    }`}
                    spellCheck={false}
                  />
                </div>
                {/* Console output */}
                <div className={`shrink-0 flex items-center justify-between px-3 py-1.5 border-b ${barBg}`}>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${muted}`}>Console</span>
                  {compileStatus === 'success' && <span className="text-[10px] font-medium text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Passed</span>}
                  {compileStatus === 'error'   && <span className="text-[10px] font-medium text-red-500   flex items-center gap-1"><AlertCircle  className="w-3 h-3" />Error</span>}
                </div>
                <div className={`flex-1 min-h-0 overflow-auto p-3 ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                  <pre className={`font-mono text-xs whitespace-pre-wrap break-words leading-relaxed ${
                    compileStatus === 'error' ? 'text-red-400' : isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {output || 'Click "Run" to compile and execute your code...'}
                  </pre>
                </div>
              </div>
            )}

            {/* AI Review tab */}
            {rightTab === 'ai' && (
              <div className="flex-1 min-h-0 overflow-hidden">
                <AIReviewPane
                  review={aiReview}
                  analysis={aiAnalysis}
                  loading={aiLoading}
                  error={aiError}
                  onDeepReview={runAIReview}
                  lineAnnotations={lineAnnotations}
                  enableLiveReview={enableLiveReview}
                  setEnableLiveReview={setEnableLiveReview}
                  aiLiveLoading={aiLiveLoading}
                  isDark={isDark}
                />
              </div>
            )}
          </div>

        </Split>
      </div>
    </div>
  );
}
