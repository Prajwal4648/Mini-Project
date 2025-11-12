import React from "react";
import { CheckCircle, AlertCircle, Terminal } from "lucide-react";

export default function OutputPane({ output, isDark, isCompiling, compileStatus }) {
  return (
    <div
      className={`transition-all duration-300 flex flex-col border-t ${
        isDark ? "border-slate-800" : "border-slate-200"
      } h-1/2 lg:h-full w-full lg:w-[40%]`}
    >
      {/* Header */}
      <div
        className={`h-10 sm:h-12 flex items-center justify-between px-3 sm:px-4 border-b ${
          isDark
            ? "bg-slate-900 border-slate-800 text-slate-300"
            : "bg-slate-100 border-slate-200 text-slate-600"
        }`}
      >
        <span className="text-xs sm:text-sm font-medium flex items-center gap-2">
          <Terminal className="w-4 h-4" /> Console Output
        </span>

        <div className="flex items-center gap-2">
          {compileStatus === "success" && (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-500">Success</span>
            </>
          )}
          {compileStatus === "error" && (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-500">Error</span>
            </>
          )}
          {isCompiling && (
            <>
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isDark ? "bg-blue-500" : "bg-blue-600"
                }`}
              ></div>
              <span className="text-xs">Running...</span>
            </>
          )}
        </div>
      </div>

      {/* Console */}
      <div
        className={`flex-1 overflow-auto ${
          isDark ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        <div className="w-full h-full p-3 sm:p-4">
          <pre
            className={`font-mono text-xs sm:text-sm whitespace-pre-wrap ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}
          >
            {output || 'Click "Run" to execute your code...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
