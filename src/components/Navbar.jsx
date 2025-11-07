import React from 'react';
import { Play, Moon, Sun, Save, Upload, Code2, Maximize2, Minimize2, Layout, Monitor } from 'lucide-react';

export default function Navbar({
  isDark,
  isFullscreen,
  layout,
  onRun,
  onToggleTheme,
  onToggleFullscreen,
  onToggleLayout
}) {
  return (
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
                Live Code Editor
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
              onClick={onRun}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                isDark
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/50'
              }`}
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Run</span>
            </button>

            <button
              onClick={onToggleLayout}
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
            >
              <Save className="w-5 h-5" />
            </button>

            <button
              className={`hidden sm:block p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <Upload className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleFullscreen}
              className={`hidden md:block p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button
              onClick={onToggleTheme}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-blue-600'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
