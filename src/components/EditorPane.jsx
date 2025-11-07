import React from 'react';

export default function EditorPane({ code, setCode, isDark, isFullscreen, layout }) {
  return (
    <div className={`transition-all duration-300 ${
      isFullscreen 
        ? 'w-full h-full' 
        : layout === 'vertical' 
          ? 'w-full h-1/2' 
          : 'w-full md:w-1/2 h-1/2 md:h-full'
    } ${layout === 'vertical' ? 'border-b' : 'md:border-r'} ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
      <div className={`h-10 sm:h-12 flex items-center justify-between px-3 sm:px-4 border-b ${
        isDark 
          ? 'bg-slate-900 border-slate-800 text-slate-300' 
          : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs sm:text-sm font-medium sm:ml-3">index.html</span>
        </div>
        <div className="text-xs">
          <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
            {code.split('\n').length} lines
          </span>
        </div>
      </div>
      
      <div className={`h-[calc(100%-40px)] sm:h-[calc(100%-48px)] ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={`w-full h-full p-2 sm:p-4 font-mono text-xs sm:text-sm resize-none focus:outline-none ${
            isDark 
              ? 'bg-slate-900 text-slate-100' 
              : 'bg-white text-slate-900'
          }`}
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            lineHeight: '1.6',
            tabSize: 2
          }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
