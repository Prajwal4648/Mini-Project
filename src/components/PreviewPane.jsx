import React from 'react';

export default function PreviewPane({ code, previewKey, isDark, layout }) {
  return (
    <div className={`transition-all duration-300 flex flex-col ${
      layout === 'vertical' 
        ? 'w-full h-1/2' 
        : 'w-full md:w-1/2 h-1/2 md:h-full'
    }`}>
      <div className={`h-10 sm:h-12 flex items-center justify-between px-3 sm:px-4 border-b ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-slate-300' 
          : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <span className="text-xs sm:text-sm font-medium">Live Preview</span>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${
            isDark ? 'bg-green-500' : 'bg-green-600'
          }`}></div>
          <span className="text-xs">Live</span>
        </div>
      </div>
      
      <div className={`flex-1 overflow-hidden ${
        isDark ? 'bg-slate-900' : 'bg-white'
      }`}>
        <div className="w-full h-full p-2 sm:p-4">
          <div className={`w-full h-full rounded-lg overflow-hidden shadow-2xl ${
            isDark 
              ? 'bg-white ring-1 ring-slate-800' 
              : 'bg-white ring-1 ring-slate-200'
          }`}>
            <iframe
              key={previewKey}
              srcDoc={code}
              className="w-full h-full border-0"
              title="Live Preview"
              sandbox="allow-scripts allow-modals"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
