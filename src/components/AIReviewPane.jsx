import React, { useState } from "react";
import { Brain, Sparkles, Loader2, AlertTriangle, PlayCircle, Eye, EyeOff } from "lucide-react";

// Props:
// - review: string (quick heuristic)
// - analysis: { issues?: string[], improvements?: string[], complexity?: { time: string, space: string, notes?: string }, hints?: string[] } | null
// - loading: boolean
// - error: string | null
// - onDeepReview: () => void
// - isDark: boolean
export default function AIReviewPane({ review, analysis, loading, error, onDeepReview, isDark, lineAnnotations = [], enableLiveReview, setEnableLiveReview, aiLiveLoading }) {
  const [expandedLines, setExpandedLines] = useState({});
  const toggleLine = (ln) => setExpandedLines(prev => ({ ...prev, [ln]: !prev[ln] }));
  return (
    <aside
      className={`transition-all duration-300 flex flex-col h-full w-full border-t lg:border-t-0 lg:border-l ${
        isDark ? "border-slate-800" : "border-slate-200"
      }`}
    >
      <div
        className={`h-10 sm:h-12 flex items-center justify-between px-3 sm:px-4 border-b ${
          isDark
            ? "bg-slate-900 border-slate-800 text-slate-300"
            : "bg-slate-100 border-slate-200 text-slate-600"
        }`}
      >
        <span className="text-xs sm:text-sm font-medium flex items-center gap-2">
          <Brain className="w-4 h-4" /> AI Code Review
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEnableLiveReview(e => !e)}
            className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${enableLiveReview ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-white'} ${loading ? 'opacity-70' : ''}`}
            title={enableLiveReview ? 'Disable Live Line Review' : 'Enable Live Line Review'}
          >
            {enableLiveReview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">Live Review</span>
          </button>
          <button
            onClick={onDeepReview}
            disabled={loading}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-60 ${
              isDark
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            title="Analyze with AI"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlayCircle className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Deep Review</span>
          </button>
        </div>
      </div>
      <div
        className={`flex-1 p-3 sm:p-4 overflow-auto ${
          isDark ? "bg-slate-950 text-slate-200" : "bg-white text-slate-800"
        }`}
      >
        {/* Error state */}
        {error && (
          <div className={`mb-3 flex items-start gap-2 text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <div>
              <div className="font-medium">AI review error</div>
              <div className="opacity-80 break-words">{error}</div>
            </div>
          </div>
        )}

        {/* Structured analysis when available */}
        {enableLiveReview && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-60">Line Annotations</h3>
            {aiLiveLoading && (
              <div className="text-xs flex items-center gap-2 mb-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Analyzing code...</span>
              </div>
            )}
            {!aiLiveLoading && lineAnnotations.length === 0 && (
              <div className="text-xs opacity-60">No line-specific issues detected yet.</div>
            )}
            <div className="space-y-2">
              {lineAnnotations.map(item => (
                <div key={item.line} className={`border rounded p-2 text-xs ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="font-mono opacity-60">Line {item.line}</div>
                      <div className="font-medium text-[11px] break-words">
                        {item.issue || item.suggestion || 'Info'}
                      </div>
                      {item.hint && <div className="text-purple-600 dark:text-purple-400">Hint: {item.hint}</div>}
                    </div>
                    {item.explanationSteps?.length > 0 && (
                      <button
                        onClick={() => toggleLine(item.line)}
                        className={`ml-2 text-[10px] px-2 py-1 rounded ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-300'} transition-colors`}
                      >
                        {expandedLines[item.line] ? 'Hide Steps' : 'Show Steps'}
                      </button>
                    )}
                  </div>
                  {expandedLines[item.line] && item.explanationSteps?.length > 0 && (
                    <ol className="mt-2 list-decimal ml-5 space-y-1">
                      {item.explanationSteps.map((st, idx) => (
                        <li key={idx}>{st}</li>
                      ))}
                    </ol>
                  )}
                  <div className="mt-1 flex items-center gap-1 font-mono text-[10px] opacity-60">
                    <span className={item.severity === 'error' ? 'text-red-500' : item.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'}>
                      {item.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <hr className={`my-4 border-dashed ${isDark ? 'border-slate-700' : 'border-slate-300'}`} />
          </div>
        )}
        {analysis ? (
          <div className="space-y-4 text-sm">
            {Array.isArray(analysis.issues) && analysis.issues.length > 0 && (
              <section>
                <h3 className={`font-semibold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>Issues</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {analysis.issues.map((it, idx) => (
                    <li key={`issue-${idx}`} className="break-words">{it}</li>
                  ))}
                </ul>
              </section>
            )}

            {Array.isArray(analysis.improvements) && analysis.improvements.length > 0 && (
              <section>
                <h3 className={`font-semibold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>Improvements</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {analysis.improvements.map((it, idx) => (
                    <li key={`impr-${idx}`} className="break-words">{it}</li>
                  ))}
                </ul>
              </section>
            )}

            {analysis.complexity && (
              <section>
                <h3 className={`font-semibold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>Complexity</h3>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div className={`rounded px-2 py-1 ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
                    <span className="font-medium">Time:</span> {analysis.complexity.time || "N/A"}
                  </div>
                  <div className={`rounded px-2 py-1 ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
                    <span className="font-medium">Space:</span> {analysis.complexity.space || "N/A"}
                  </div>
                  {analysis.complexity.notes && (
                    <div className={`col-span-2 rounded px-2 py-1 ${isDark ? "bg-slate-900" : "bg-slate-100"}`}>
                      <span className="font-medium">Notes:</span> {analysis.complexity.notes}
                    </div>
                  )}
                </div>
              </section>
            )}

            {Array.isArray(analysis.hints) && analysis.hints.length > 0 && (
              <section>
                <h3 className={`font-semibold mb-1 ${isDark ? "text-slate-100" : "text-slate-900"}`}>Hints</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {analysis.hints.map((it, idx) => (
                    <li key={`hint-${idx}`} className="break-words">{it}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ) : (
          // Fallback quick heuristic review
          <div className="space-y-2 text-sm leading-relaxed whitespace-pre-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className={isDark ? "text-yellow-300" : "text-yellow-600"} />
              <span className="font-medium">Quick review</span>
            </div>
            <div className="opacity-90">{review || "Run AI review to get feedback, suggestions, and improvements."}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
