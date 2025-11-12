import React, { useState, useEffect, useRef } from 'react';
import { Play, Moon, Sun, Save, Upload, Code2, Maximize2, Minimize2, Layout, Monitor, AlertCircle, CheckCircle } from 'lucide-react';
import Split from 'react-split';
import { useMediaQuery } from './utils/useMediaQuery';
import AIReviewPane from "./components/AIReviewPane";

export default function App() {
  const [code, setCode] = useState(`public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Welcome to CodeReviewX!");
        
        // Try some basic operations
        int sum = 5 + 10;
        System.out.println("5 + 10 = " + sum);
        
        // Loop example
        for (int i = 1; i <= 5; i++) {
            System.out.println("Count: " + i);
        }
    }
}`);
  
  const [output, setOutput] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState(null); // 'success', 'error', null
  const [isDark, setIsDark] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layout, setLayout] = useState('horizontal');
  const isLg = useMediaQuery('(min-width: 1024px)');
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

  const compileAndRun = async () => {
    setIsCompiling(true);
    setOutput('Compiling and running your Java code...\n');
    setCompileStatus(null);

    try {
      console.log('🚀 Sending request to backend...');
      console.log('Code length:', code.length);
      
      // Use local backend server to avoid CORS issues
      const response = await fetch('http://localhost:3001/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          language: 'java',
          versionIndex: '4',
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

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleLayout = () => {
    setLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  };

  // Call backend Gemini API for structured review
  const runAIReview = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const resp = await fetch('http://localhost:3001/api/gemini/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'java' })
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
        body: JSON.stringify({ code: currentCode, language: 'java' })
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

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      {/* Navbar */}
      <nav className={`border-b transition-colors duration-300 ${
        isDark 
          ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl' 
          : 'bg-white/80 border-slate-200 backdrop-blur-xl'
      }`}>
        <div className="max-w-full px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 ${
                isDark 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                  : 'bg-gradient-to-br from-blue-600 to-purple-700'
              }`}>
                <Code2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  CodeReviewX
                </h1>
                <p className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Java Code Editor
                </p>
              </div>
              <h1 className={`sm:hidden text-base font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                CodeReviewX
              </h1>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={compileAndRun}
                disabled={isCompiling}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  isDark
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/50'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/50'
                }`}
              >
                <Play className={`w-3 h-3 sm:w-4 sm:h-4 ${isCompiling ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isCompiling ? 'Running...' : 'Run'}</span>
              </button>

              <button
                onClick={toggleLayout}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title="Toggle Layout"
              >
                {layout === 'horizontal' ? <Layout className="w-4 h-4 sm:w-5 sm:h-5" /> : <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              <button
                className={`hidden sm:block p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title="Save Code"
              >
                <Save className="w-5 h-5" />
              </button>

              <button
                className={`hidden sm:block p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title="Upload File"
              >
                <Upload className="w-5 h-5" />
              </button>

              <button
                onClick={toggleFullscreen}
                className={`hidden md:block p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleTheme}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-blue-600'
                }`}
                title="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Workspace */}
      <div className={`flex transition-all duration-300 overflow-x-hidden ${
        isFullscreen ? 'h-screen' : 'h-[calc(100vh-60px)] sm:h-[calc(100vh-80px)]'
      }`}>
        {isFullscreen ? (
          // Fullscreen editor only
          <div className={`w-full h-full ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className={`h-10 sm:h-12 flex items-center justify-between px-3 sm:px-4 border-b ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex gap-1.5">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs sm:text-sm font-medium sm:ml-3">Main.java</span>
              </div>
              <div className="text-xs flex items-center gap-3">
                <span className={`px-2 py-1 rounded ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                  Java
                </span>
                <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                  {code.split('\n').length} lines
                </span>
              </div>
            </div>
            <div className={`h-[calc(100%-40px)] sm:h-[calc(100%-48px)] ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`w-full h-full p-2 sm:p-4 font-mono text-xs sm:text-sm resize-none focus:outline-none overflow-auto overflow-x-auto whitespace-pre ${
                  isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
                }`}
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", lineHeight: '1.6', tabSize: 4 }}
                wrap="off"
                spellCheck={false}
                placeholder="Write your Java code here..."
              />
            </div>
          </div>
        ) : (
          // Responsive resizable splits: outer (left/right), inner (editor/output)
          <Split
            className="flex w-full h-full flex-col lg:flex-row overflow-hidden"
            sizes={[70, 30]}
            minSize={[250, 200]}
            gutterSize={8}
            direction={isLg ? 'horizontal' : 'vertical'}
          >
            {/* Left column with vertical split */}
            <Split
              className={`flex flex-col h-full lg:border-r min-w-0 min-h-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
              sizes={[50, 50]}
              minSize={[150, 120]}
              gutterSize={8}
              direction="vertical"
            >
              {/* Editor (flex column for dynamic vertical resize) */}
              <div className={`flex flex-col h-full min-h-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className={`flex-shrink-0 h-10 sm:h-12 flex items-center justify-between px-3 sm:px-4 border-b ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex gap-1.5">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs sm:text-sm font-medium sm:ml-3">Main.java</span>
                  </div>
                  <div className="text-xs flex items-center gap-3">
                    <span className={`px-2 py-1 rounded ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                      Java
                    </span>
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                      {code.split('\n').length} lines
                    </span>
                  </div>
                </div>
                <div className={`relative flex-1 min-h-0 ${isDark ? 'bg-slate-900' : 'bg-white'} overflow-hidden`}> 
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={`w-full h-full p-2 sm:p-4 font-mono text-xs sm:text-sm resize-none focus:outline-none overflow-auto overflow-x-auto whitespace-pre ${
                      isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace", lineHeight: '1.6', tabSize: 4 }}
                    wrap="off"
                    spellCheck={false}
                    placeholder="Write your Java code here..."
                  />
                  {enableLiveReview && lineAnnotations.length > 0 && (
                    <div className="pointer-events-none absolute top-10 sm:top-12 left-0 h-[calc(100%-40px)] sm:h-[calc(100%-48px)] w-6 select-none text-[10px] font-mono">
                      <div className="relative w-full h-full">
                        {lineAnnotations.map((a) => (
                          <div
                            key={`mark-${a.line}`}
                            style={{ top: (a.line - 1) * 1.6 + 'em' }}
                            className={`absolute left-0 w-6 h-[1.4em] flex items-center justify-center ${
                              a.severity === 'error' ? 'text-red-500' : a.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                            }`}
                            title={(a.issue || a.suggestion || 'Info') + ` (line ${a.line})`}
                          >
                            ●
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Output */}
              <div className={`flex flex-col h-full min-h-0 ${isDark ? 'border-t border-slate-800' : 'border-t border-slate-200'} m-0 min-w-0`}> 
                <div className={`h-10 sm:h-12 flex items-center justify-between px-3 sm:px-4 border-b ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <span className="text-xs sm:text-sm font-medium">Console Output</span>
                  <div className="flex items-center gap-2">
                    {compileStatus === 'success' && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-500">Success</span>
                      </>
                    )}
                    {compileStatus === 'error' && (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs text-red-500">Error</span>
                      </>
                    )}
                    {isCompiling && (
                      <>
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${
                          isDark ? 'bg-blue-500' : 'bg-blue-600'
                        }`}></div>
                        <span className="text-xs">Running</span>
                      </>
                    )}
                  </div>
                </div>
                {/* stdin input */}
                <div className={`${isDark ? 'bg-slate-950' : 'bg-slate-50'} px-3 sm:px-4 pt-2`}> 
                  <label className="block text-[10px] sm:text-xs font-medium opacity-70 mb-1">Program Input (stdin)</label>
                  <textarea
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="Enter input lines your program reads (Scanner, BufferedReader, etc.)"
                    className={`w-full text-[11px] sm:text-xs rounded-md border p-2 resize-y min-h-[60px] focus:outline-none ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-600' : 'bg-white border-slate-300 text-slate-700 placeholder-slate-400'
                    }`}
                    spellCheck={false}
                  />
                </div>
                <div className={`flex-1 min-h-0 overflow-auto ${isDark ? 'bg-slate-950' : 'bg-slate-50'} p-0 m-0 min-w-0`}> 
                  <pre className={`w-full h-full p-3 sm:p-4 font-mono text-xs sm:text-sm whitespace-pre-wrap break-words ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}> 
{output || 'Click "Run" to compile and execute your Java code...'}
                  </pre>
                </div>
              </div>
            </Split>
            {/* Right column: AI review */}
            <div className="min-w-0 min-h-0 h-full overflow-hidden">
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
          </Split>
        )}
      </div>
    </div>
  );
}
