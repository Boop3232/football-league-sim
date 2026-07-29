import React from 'react';
import { Trophy, Users, Calendar, Settings, Play, RefreshCw, Sparkles, Download, Upload } from 'lucide-react';
import { LeagueSettings, Team } from '../types';

interface HeaderProps {
  activeTab: 'standings' | 'fixtures' | 'teams' | 'settings';
  setActiveTab: (tab: 'standings' | 'fixtures' | 'teams' | 'settings') => void;
  settings: LeagueSettings;
  teamsCount: number;
  completedFixturesCount: number;
  totalFixturesCount: number;
  isGenerated: boolean;
  onGenerateFixtures: () => void;
  onResetLeague: () => void;
  onQuickSimulateAll: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  teamsCount,
  completedFixturesCount,
  totalFixturesCount,
  isGenerated,
  onGenerateFixtures,
  onResetLeague,
  onQuickSimulateAll,
  onExportData,
  onImportData,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const progressPercent = totalFixturesCount > 0 ? Math.round((completedFixturesCount / totalFixturesCount) * 100) : 0;

  return (
    <header className="bg-[#0F1115] border-b border-slate-800 text-white sticky top-0 z-30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Banner with Editorial Serif Heading & Eyebrow */}
        <div className="flex flex-col md:flex-row md:items-end justify-between py-6 gap-6 border-b border-slate-800/60">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.3em] uppercase text-emerald-500 font-extrabold flex items-center gap-2">
              <span>Continental Circuit Simulator</span>
              <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 normal-case tracking-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Firestore Synced
              </span>
            </p>
            <h1 className="text-3xl sm:text-5xl serif italic text-slate-100 font-bold tracking-tight">
              {settings.leagueName || 'League Simulator'}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Season Progression Block */}
            <div className="text-left sm:text-right">
              <p className="text-2xl sm:text-3xl mono font-bold text-slate-200 leading-none">
                {settings.seasonName || '2025/26'}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">
                {teamsCount} Teams • {completedFixturesCount}/{totalFixturesCount} Played ({progressPercent}%)
              </p>
            </div>

            {/* Editorial Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {!isGenerated ? (
                <button
                  onClick={onGenerateFixtures}
                  disabled={teamsCount < 2}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-sm gap-2 cursor-pointer disabled:cursor-not-allowed flex items-center"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Generate Fixtures
                </button>
              ) : (
                <>
                  <button
                    onClick={onQuickSimulateAll}
                    disabled={completedFixturesCount === totalFixturesCount}
                    className="px-4 py-2 bg-white text-black hover:bg-slate-200 disabled:opacity-40 font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    title="Auto-simulate remaining unplayed matches"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Simulate All
                  </button>

                  <button
                    onClick={onResetLeague}
                    className="px-3.5 py-2 bg-[#161920] hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-sm transition-all border border-slate-800 flex items-center gap-1.5 cursor-pointer"
                    title="Reset all match scores"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={onImportData}
                accept=".json"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-[#161920] hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-sm transition-all cursor-pointer"
                title="Import League JSON"
              >
                <Upload className="w-4 h-4" />
              </button>

              <button
                onClick={onExportData}
                className="p-2 bg-[#161920] hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-sm transition-all cursor-pointer"
                title="Export League JSON Backup"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalFixturesCount > 0 && (
          <div className="w-full bg-[#161920] h-1 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Navigation Bar */}
        <div className="flex border-t border-slate-800 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-2 py-3.5 px-5 font-bold text-xs uppercase tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'standings'
                ? 'border-emerald-500 text-emerald-400 bg-[#161920]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161920]/50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Live Standings
          </button>

          <button
            onClick={() => setActiveTab('fixtures')}
            className={`flex items-center gap-2 py-3.5 px-5 font-bold text-xs uppercase tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fixtures'
                ? 'border-emerald-500 text-emerald-400 bg-[#161920]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161920]/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Fixtures & Bulk Entry
            {totalFixturesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] mono bg-[#0F1115] text-emerald-400 border border-emerald-500/30">
                {completedFixturesCount}/{totalFixturesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-2 py-3.5 px-5 font-bold text-xs uppercase tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'teams'
                ? 'border-emerald-500 text-emerald-400 bg-[#161920]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161920]/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Custom Teams
            <span className="ml-1 px-1.5 py-0.2 rounded text-[10px] mono bg-[#0F1115] text-slate-400 border border-slate-700">
              {teamsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3.5 px-5 font-bold text-xs uppercase tracking-widest border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-emerald-500 text-emerald-400 bg-[#161920]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161920]/50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Rules & Presets
          </button>
        </div>
      </div>
    </header>
  );
};
