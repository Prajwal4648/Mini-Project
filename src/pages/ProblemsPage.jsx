import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Sun, Moon, Search, ChevronDown, ChevronRight, BookOpen, Tag, Filter, ArrowRight } from 'lucide-react';

const DIFFICULTY_ORDER = { Easy: 1, Medium: 2, Hard: 3 };
const DIFFICULTY_COLORS = {
  Easy: { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  Medium: { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
  Hard: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-400' },
};
const DIFFICULTY_COLORS_LIGHT = {
  Easy: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Medium: { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Hard: { badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
};

const POPULAR_CATEGORIES = [
  'Array', 'String', 'Dynamic Programming', 'Tree', 'Graph',
  'Binary Search', 'Hash Table', 'Math', 'Greedy', 'Linked List',
  'Backtracking', 'Sorting', 'Stack', 'Two Pointers', 'Recursion',
];

export default function ProblemsPage() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/problems?limit=300');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const list = data?.questions || data?.problemsetQuestionList?.questions || [];
      setProblems(list);
    } catch (err) {
      setError(err.message || 'Failed to load problems. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Build category → problems map, sorted by difficulty
  const categorizedProblems = useMemo(() => {
    const map = {};
    problems.forEach((p) => {
      const tags = p.topicTags?.length ? p.topicTags : [{ name: 'Uncategorized', slug: 'uncategorized' }];
      tags.forEach((tag) => {
        const cat = tag.name;
        if (!map[cat]) map[cat] = [];
        if (!map[cat].find((x) => x.titleSlug === p.titleSlug)) {
          map[cat].push(p);
        }
      });
    });
    // Sort each category's problems by difficulty
    Object.keys(map).forEach((cat) => {
      map[cat].sort((a, b) => {
        const da = DIFFICULTY_ORDER[a.difficulty] ?? 4;
        const db = DIFFICULTY_ORDER[b.difficulty] ?? 4;
        return da - db;
      });
    });
    return map;
  }, [problems]);

  const sortedCategories = useMemo(() => {
    return Object.keys(categorizedProblems).sort((a, b) => {
      const ai = POPULAR_CATEGORIES.indexOf(a);
      const bi = POPULAR_CATEGORIES.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [categorizedProblems]);

  const visibleCategories = showAllCategories ? sortedCategories : sortedCategories.slice(0, 20);

  const filteredProblems = useMemo(() => {
    let list = problems;
    if (difficultyFilter !== 'All') list = list.filter((p) => p.difficulty === difficultyFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.topicTags?.some((t) => t.name.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => {
      const da = DIFFICULTY_ORDER[a.difficulty] ?? 4;
      const db = DIFFICULTY_ORDER[b.difficulty] ?? 4;
      return da !== db ? da - db : (a.questionFrontendId || 0) - (b.questionFrontendId || 0);
    });
  }, [problems, search, difficultyFilter]);

  const categoryFilteredProblems = useMemo(() => {
    if (selectedCategory === 'All') return filteredProblems;
    return filteredProblems.filter((p) =>
      p.topicTags?.some((t) => t.name === selectedCategory)
    );
  }, [filteredProblems, selectedCategory]);

  const toggleCategory = (cat) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const diff = isDark ? DIFFICULTY_COLORS : DIFFICULTY_COLORS_LIGHT;

  const bg = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const navBg = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200';
  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400';
  const sidebarItemBase = `w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 truncate`;
  const sidebarItemActive = isDark ? 'bg-blue-600/30 text-blue-300 font-medium' : 'bg-blue-100 text-blue-700 font-medium';
  const sidebarItemInactive = isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
  const rowHover = isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50';
  const divider = isDark ? 'border-slate-800' : 'border-slate-200';

  if (loading) {
    return (
      <div className={`min-h-screen ${bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className={`${textSecondary} text-sm`}>Fetching problems from LeetCode...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`}>
      {/* Navbar */}
      <nav className={`border-b transition-colors duration-300 backdrop-blur-xl sticky top-0 z-30 ${navBg}`}>
        <div className="max-w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Code2 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-lg sm:text-xl font-bold ${textPrimary}`}>CodeReviewX</h1>
              <p className={`text-xs ${textSecondary}`}>LeetCode Problems</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden sm:inline">Editor</span>
            </Link>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-slate-100 hover:bg-slate-200 text-blue-600'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-sm flex items-center gap-2">
          <span className="font-medium">Error:</span> {error}
          <button onClick={fetchProblems} className="ml-auto underline hover:no-underline">Retry</button>
        </div>
      )}

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar — categories */}
        <aside className={`hidden lg:flex flex-col w-56 xl:w-64 border-r overflow-y-auto shrink-0 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="p-3 border-b ${divider}">
            <p className={`text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>Categories</p>
          </div>
          <div className="p-2 space-y-0.5">
            <button
              className={`${sidebarItemBase} ${selectedCategory === 'All' ? sidebarItemActive : sidebarItemInactive}`}
              onClick={() => setSelectedCategory('All')}
            >
              All Problems
              <span className={`ml-1 text-xs ${textSecondary}`}>({problems.length})</span>
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                className={`${sidebarItemBase} ${selectedCategory === cat ? sidebarItemActive : sidebarItemInactive}`}
                onClick={() => setSelectedCategory(cat)}
                title={cat}
              >
                {cat}
                <span className={`ml-1 text-xs ${textSecondary}`}>({categorizedProblems[cat]?.length})</span>
              </button>
            ))}
            {sortedCategories.length > 20 && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className={`${sidebarItemBase} ${sidebarItemInactive} italic`}
              >
                {showAllCategories ? 'Show less...' : `+${sortedCategories.length - 20} more...`}
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Controls */}
          <div className={`sticky top-0 z-20 px-4 py-3 border-b ${isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50/90 border-slate-200'} backdrop-blur-sm`}>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                <input
                  type="text"
                  placeholder="Search problems or topics..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${inputBg}`}
                />
              </div>
              {/* Difficulty filter */}
              <div className="flex items-center gap-1">
                {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficultyFilter(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                      difficultyFilter === d
                        ? d === 'All'
                          ? isDark ? 'bg-blue-600/30 border-blue-500/50 text-blue-300' : 'bg-blue-100 border-blue-300 text-blue-700'
                          : `${diff[d]?.badge} border`
                        : isDark ? 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {/* Mobile category dropdown */}
              <div className="lg:hidden relative">
                <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`pl-9 pr-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${inputBg}`}
                >
                  <option value="All">All Categories</option>
                  {sortedCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {/* Stats */}
              <span className={`ml-auto text-xs ${textSecondary} hidden sm:block`}>
                {categoryFilteredProblems.length} problem{categoryFilteredProblems.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Problems list */}
          <div className="p-4">
            {!error && categoryFilteredProblems.length === 0 && !loading && (
              <div className={`text-center py-16 ${textSecondary}`}>
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No problems found matching your filters.</p>
              </div>
            )}

            {/* Grouped by category when "All" selected and no search */}
            {selectedCategory === 'All' && !search && difficultyFilter === 'All' ? (
              <div className="space-y-3">
                {sortedCategories.map((cat) => {
                  const isOpen = expandedCategories[cat] ?? false;
                  const catProblems = categorizedProblems[cat];
                  const easyCnt = catProblems.filter((p) => p.difficulty === 'Easy').length;
                  const medCnt = catProblems.filter((p) => p.difficulty === 'Medium').length;
                  const hardCnt = catProblems.filter((p) => p.difficulty === 'Hard').length;
                  return (
                    <div key={cat} className={`rounded-xl border overflow-hidden transition-all duration-200 ${cardBg}`}>
                      {/* Category header */}
                      <button
                        onClick={() => toggleCategory(cat)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}
                      >
                        {isOpen ? (
                          <ChevronDown className={`w-4 h-4 shrink-0 ${textSecondary}`} />
                        ) : (
                          <ChevronRight className={`w-4 h-4 shrink-0 ${textSecondary}`} />
                        )}
                        <span className={`font-semibold text-sm ${textPrimary}`}>{cat}</span>
                        <span className={`text-xs ${textSecondary}`}>({catProblems.length})</span>
                        <div className="ml-auto flex items-center gap-2">
                          {easyCnt > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${diff.Easy?.badge}`}>{easyCnt} Easy</span>
                          )}
                          {medCnt > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${diff.Medium?.badge}`}>{medCnt} Medium</span>
                          )}
                          {hardCnt > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${diff.Hard?.badge}`}>{hardCnt} Hard</span>
                          )}
                        </div>
                      </button>
                      {/* Problems rows */}
                      {isOpen && (
                        <div className={`border-t ${divider}`}>
                          <ProblemTable problems={catProblems} isDark={isDark} diff={diff} textSecondary={textSecondary} textPrimary={textPrimary} rowHover={rowHover} divider={divider} navigate={navigate} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Flat list for filtered/searched results */
              <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${divider}`}>
                  <Filter className={`w-4 h-4 ${textSecondary}`} />
                  <span className={`text-sm font-semibold ${textPrimary}`}>
                    {selectedCategory !== 'All' ? selectedCategory : 'Filtered Results'}
                  </span>
                  <span className={`text-xs ${textSecondary}`}>({categoryFilteredProblems.length})</span>
                </div>
                <ProblemTable problems={categoryFilteredProblems} isDark={isDark} diff={diff} textSecondary={textSecondary} textPrimary={textPrimary} rowHover={rowHover} divider={divider} navigate={navigate} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ProblemTable({ problems, isDark, diff, textSecondary, textPrimary, rowHover, divider, navigate }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? problems : problems.slice(0, 25);

  return (
    <>
      <table className="w-full text-sm">
        <thead>
          <tr className={`text-xs uppercase tracking-wider ${textSecondary} border-b ${divider}`}>
            <th className="px-4 py-2 text-left w-12">#</th>
            <th className="px-4 py-2 text-left">Title</th>
            <th className="px-4 py-2 text-left hidden sm:table-cell">Tags</th>
            <th className="px-4 py-2 text-left">Difficulty</th>
            <th className="px-4 py-2 text-center w-10"></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((p, i) => {
            const d = p.difficulty || 'Unknown';
            const colors = diff[d];
            return (
              <tr
                key={`${p.titleSlug}-${i}`}
                onClick={() => navigate(`/?problem=${p.titleSlug}`)}
                className={`border-b last:border-b-0 ${divider} ${rowHover} transition-colors duration-100 cursor-pointer`}
              >
                <td className={`px-4 py-3 ${textSecondary} w-12 tabular-nums`}>
                  {p.questionFrontendId || '–'}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${textPrimary}`}>{p.title}</span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {p.topicTags?.slice(0, 3).map((t) => (
                      <span
                        key={t.slug}
                        className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {t.name}
                      </span>
                    ))}
                    {(p.topicTags?.length ?? 0) > 3 && (
                      <span className={`text-xs ${textSecondary}`}>+{p.topicTags.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {colors ? (
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${colors.badge}`}>{d}</span>
                  ) : (
                    <span className={`text-xs ${textSecondary}`}>{d}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400'}`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {problems.length > 25 && (
        <div className={`px-4 py-3 border-t ${divider} text-center`}>
          <button
            onClick={() => setShowAll(!showAll)}
            className={`text-sm font-medium transition-colors duration-150 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            {showAll ? 'Show less' : `Show all ${problems.length} problems`}
          </button>
        </div>
      )}
    </>
  );
}
