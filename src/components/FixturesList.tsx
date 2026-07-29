import React, { useState, useMemo } from 'react';
import { Fixture, Team } from '../types';
import { simulateMatch } from '../utils/leagueEngine';
import { 
  Check, 
  Sparkles, 
  RotateCcw, 
  Save, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  SlidersHorizontal,
  Plus,
  Minus
} from 'lucide-react';

interface FixturesListProps {
  fixtures: Fixture[];
  teams: Team[];
  onUpdateFixtureScores: (updates: Array<{ id: string; homeScore: number | null; awayScore: number | null }>) => void;
  onSimulateFixtures: (fixtureIds: string[]) => void;
  onResetFixtures: (fixtureIds: string[]) => void;
  onCreateFixture?: (fixture: Omit<Fixture, 'id' | 'homeScore' | 'awayScore' | 'isCompleted'>) => void;
}

export const FixturesList: React.FC<FixturesListProps> = ({
  fixtures,
  teams,
  onUpdateFixtureScores,
  onSimulateFixtures,
  onResetFixtures,
  onCreateFixture,
}) => {
  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, [teams]);

  // Group fixtures by matchweek
  const matchweeks = useMemo(() => {
    const weeksMap = new Map<number, Fixture[]>();
    fixtures.forEach((f) => {
      const list = weeksMap.get(f.matchweek) || [];
      list.push(f);
      weeksMap.set(f.matchweek, list);
    });
    return Array.from(weeksMap.entries()).sort(([a], [b]) => a - b);
  }, [fixtures]);

  const totalMatchweeks = matchweeks.length;

  const [selectedMatchweek, setSelectedMatchweek] = useState<number>(1);
  const [showAllMatchweeks, setShowAllMatchweeks] = useState<boolean>(false);
  const [filterTeamId, setFilterTeamId] = useState<string>('ALL');

  // New fixture creation state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newMatchweek, setNewMatchweek] = useState<number>(1);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newHomeTeamId, setNewHomeTeamId] = useState<string>('');
  const [newAwayTeamId, setNewAwayTeamId] = useState<string>('');
  const [createError, setCreateError] = useState<string>('');

  // Draft score edits for batch submission: key = fixtureId -> { home: number | '', away: number | '' }
  const [draftScores, setDraftScores] = useState<Record<string, { home: number | ''; away: number | '' }>>({});
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);

  // Initialize draft scores when switching matchweek or fixtures change
  React.useEffect(() => {
    const currentFixtures = showAllMatchweeks
      ? fixtures
      : fixtures.filter((f) => f.matchweek === selectedMatchweek);

    const initialDrafts: Record<string, { home: number | ''; away: number | '' }> = {};
    currentFixtures.forEach((f) => {
      initialDrafts[f.id] = {
        home: f.homeScore !== null ? f.homeScore : '',
        away: f.awayScore !== null ? f.awayScore : '',
      };
    });
    setDraftScores(initialDrafts);
  }, [selectedMatchweek, showAllMatchweeks, fixtures]);

  const handleScoreChange = (fixtureId: string, side: 'home' | 'away', val: string) => {
    const num = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    setDraftScores((prev) => ({
      ...prev,
      [fixtureId]: {
        ...prev[fixtureId],
        [side]: num,
      },
    }));
  };

  const adjustScore = (fixtureId: string, side: 'home' | 'away', delta: number) => {
    setDraftScores((prev) => {
      const currentVal = prev[fixtureId]?.[side];
      const currentNum = typeof currentVal === 'number' ? currentVal : 0;
      const nextNum = Math.max(0, currentNum + delta);
      return {
        ...prev,
        [fixtureId]: {
          ...prev[fixtureId],
          [side]: nextNum,
        },
      };
    });
  };

  // Bulk save draft scores for current view
  const handleSaveBulkScores = () => {
    const activeFixtures = showAllMatchweeks
      ? fixtures
      : fixtures.filter((f) => f.matchweek === selectedMatchweek);

    const updates = activeFixtures.map((f) => {
      const draft = draftScores[f.id];
      const h = draft?.home !== undefined && draft.home !== '' ? Number(draft.home) : null;
      const a = draft?.away !== undefined && draft.away !== '' ? Number(draft.away) : null;
      return {
        id: f.id,
        homeScore: h,
        awayScore: a,
      };
    });

    onUpdateFixtureScores(updates);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  // Bulk simulate active matchweek
  const handleSimulateActiveWeek = () => {
    const activeFixtures = showAllMatchweeks
      ? fixtures
      : fixtures.filter((f) => f.matchweek === selectedMatchweek);

    const unplayedIds = activeFixtures.map((f) => f.id);
    onSimulateFixtures(unplayedIds);
  };

  // Reset active matchweek
  const handleResetActiveWeek = () => {
    const activeFixtures = showAllMatchweeks
      ? fixtures
      : fixtures.filter((f) => f.matchweek === selectedMatchweek);

    const ids = activeFixtures.map((f) => f.id);
    onResetFixtures(ids);
  };

  const handleCreateFixtureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHomeTeamId || !newAwayTeamId) {
      setCreateError('Please select both home and away teams.');
      return;
    }
    if (newHomeTeamId === newAwayTeamId) {
      setCreateError('Home and Away teams must be different.');
      return;
    }
    setCreateError('');
    if (onCreateFixture) {
      onCreateFixture({
        matchweek: Number(newMatchweek) || 1,
        date: newDate,
        homeTeamId: newHomeTeamId,
        awayTeamId: newAwayTeamId,
      });
    }
    setIsCreateModalOpen(false);
  };

  if (fixtures.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center my-6 shadow-sm">
        <Calendar className="w-16 h-16 mx-auto text-slate-700 mb-4" />
        <h3 className="text-xl font-bold text-slate-200 mb-2">No Fixtures Generated</h3>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          Head to the "Custom Teams" tab to add your teams, then click "Generate Fixtures" in the header!
        </p>
      </div>
    );
  }

  // Filtered list of fixtures for display
  const displayFixtures = (
    showAllMatchweeks
      ? fixtures
      : fixtures.filter((f) => f.matchweek === selectedMatchweek)
  ).filter((f) => {
    if (filterTeamId === 'ALL') return true;
    return f.homeTeamId === filterTeamId || f.awayTeamId === filterTeamId;
  });

  return (
    <div className="space-y-6">
      {/* Top Matchweek Controls & Quick Actions Bar */}
      <div className="bg-[#161920] border border-slate-800 rounded-sm p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Matchweek Pagination / Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setShowAllMatchweeks(false);
                setSelectedMatchweek((prev) => Math.max(1, prev - 1));
              }}
              disabled={showAllMatchweeks || selectedMatchweek === 1}
              className="p-2 bg-[#0F1115] hover:bg-slate-800 disabled:opacity-40 text-slate-300 transition-all cursor-pointer border border-slate-800 rounded-sm disabled:cursor-not-allowed"
              title="Previous Matchweek"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Matchweek:</span>
              <select
                value={showAllMatchweeks ? 'ALL' : selectedMatchweek}
                onChange={(e) => {
                  if (e.target.value === 'ALL') {
                    setShowAllMatchweeks(true);
                  } else {
                    setShowAllMatchweeks(false);
                    setSelectedMatchweek(Number(e.target.value));
                  }
                }}
                className="bg-[#0F1115] border border-slate-800 text-slate-100 font-bold text-xs mono rounded-sm px-3 py-2 focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                {matchweeks.map(([mw]) => (
                  <option key={mw} value={mw}>
                    Matchweek {mw}
                  </option>
                ))}
                <option value="ALL">Show All ({totalMatchweeks} Matchweeks)</option>
              </select>
            </div>

            <button
              onClick={() => {
                setShowAllMatchweeks(false);
                setSelectedMatchweek((prev) => Math.min(totalMatchweeks, prev + 1));
              }}
              disabled={showAllMatchweeks || selectedMatchweek === totalMatchweeks}
              className="p-2 bg-[#0F1115] hover:bg-slate-800 disabled:opacity-40 text-slate-300 transition-all cursor-pointer border border-slate-800 rounded-sm disabled:cursor-not-allowed"
              title="Next Matchweek"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Team Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <select
              value={filterTeamId}
              onChange={(e) => setFilterTeamId(e.target.value)}
              className="bg-[#0F1115] border border-slate-800 text-slate-200 text-xs rounded-sm px-3 py-2 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Filter by Team (All Teams)</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.logoEmoji} {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Batch Action Toolbar */}
        <div className="p-3 bg-[#0F1115] rounded-sm border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {showAllMatchweeks ? 'Bulk Score Entry (All Weeks)' : `Bulk Score Entry — Matchweek ${selectedMatchweek}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveBulkScores}
              className={`inline-flex items-center px-4 py-2 rounded-sm font-black text-xs uppercase tracking-wider transition-all shadow-md gap-2 cursor-pointer ${
                isSavedFeedback
                  ? 'bg-emerald-500 text-slate-950 scale-105'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isSavedFeedback ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Scores Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Scores
                </>
              )}
            </button>

            <button
              onClick={handleSimulateActiveWeek}
              className="inline-flex items-center px-3.5 py-2 rounded-sm bg-white text-black hover:bg-slate-200 font-bold text-xs uppercase tracking-wider transition-all gap-1.5 cursor-pointer"
              title="Auto simulate all matches in this matchweek"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Simulate Week
            </button>

            <button
              onClick={handleResetActiveWeek}
              className="inline-flex items-center px-3 py-2 rounded-sm bg-[#161920] hover:bg-slate-800 text-slate-400 font-bold text-xs uppercase tracking-wider transition-all gap-1.5 cursor-pointer border border-slate-800"
              title="Clear scores for this matchweek"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Week
            </button>

            {onCreateFixture && (
              <button
                onClick={() => {
                  setNewMatchweek(selectedMatchweek || 1);
                  setNewHomeTeamId(teams[0]?.id || '');
                  setNewAwayTeamId(teams[1]?.id || '');
                  setCreateError('');
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center px-3.5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Fixture
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fixtures List Grid */}
      <div className="space-y-3">
        {displayFixtures.length === 0 ? (
          <div className="bg-[#161920] border border-slate-800 rounded-sm p-8 text-center text-slate-400 text-sm">
            No fixtures found matching your criteria.
          </div>
        ) : (
          displayFixtures.map((fixture) => {
            const homeTeam = teamMap.get(fixture.homeTeamId);
            const awayTeam = teamMap.get(fixture.awayTeamId);

            if (!homeTeam || !awayTeam) return null;

            const draft = draftScores[fixture.id] || {
              home: fixture.homeScore !== null ? fixture.homeScore : '',
              away: fixture.awayScore !== null ? fixture.awayScore : '',
            };

            const homeVal = draft.home;
            const awayVal = draft.away;

            const isPlayed = fixture.isCompleted && fixture.homeScore !== null && fixture.awayScore !== null;
            const isHomeWinner = typeof homeVal === 'number' && typeof awayVal === 'number' && homeVal > awayVal;
            const isAwayWinner = typeof homeVal === 'number' && typeof awayVal === 'number' && awayVal > homeVal;

            return (
              <div
                key={fixture.id}
                className={`bg-[#161920] border-t border-r border-b border-slate-800/80 rounded-sm p-4 sm:p-5 transition-all shadow-md ${
                  isPlayed
                    ? 'border-l-4 border-l-emerald-500'
                    : 'border-l-4 border-l-slate-700 hover:border-l-emerald-400'
                }`}
              >
                {/* Top Match Header */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400 bg-[#0F1115] px-2 py-0.5 rounded-sm border border-emerald-500/30 mono">
                      MW {fixture.matchweek}
                    </span>
                    {fixture.date && (
                      <span className="text-[11px] mono text-slate-300 bg-[#0F1115] px-2 py-0.5 rounded-sm border border-slate-800">
                        📅 {fixture.date}
                      </span>
                    )}
                    {homeTeam.stadium && (
                      <span className="hidden sm:inline text-slate-500 italic">📍 {homeTeam.stadium}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isPlayed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/30">
                        <Check className="w-3 h-3" /> Played
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-sm border border-amber-500/30">
                        Pending
                      </span>
                    )}

                    <button
                      onClick={() => {
                        const { homeScore, awayScore } = simulateMatch(homeTeam, awayTeam);
                        handleScoreChange(fixture.id, 'home', homeScore.toString());
                        handleScoreChange(fixture.id, 'away', awayScore.toString());
                      }}
                      className="p-1 rounded-sm hover:bg-slate-800 text-emerald-400 transition-colors"
                      title="Quick Auto-Simulate this single match"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Match Score Input Row */}
                <div className="grid grid-cols-1 md:grid-cols-11 items-center gap-4">
                  {/* Home Team */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-end space-x-3">
                    <div className="text-left md:text-right">
                      <div className="flex items-center md:flex-row-reverse gap-2">
                        <span className={`font-bold text-base sm:text-lg ${isHomeWinner ? 'text-amber-400 font-extrabold' : 'text-slate-100'}`}>
                          {homeTeam.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#0F1115] text-slate-400 mono font-bold border border-slate-800">
                          {homeTeam.shortName}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Home</span>
                    </div>

                    <div
                      className="w-9 h-9 rounded-sm flex items-center justify-center text-lg shrink-0 border border-white/10 shadow-sm"
                      style={{ backgroundColor: homeTeam.color || '#3b82f6' }}
                    >
                      {homeTeam.logoEmoji || '⚽'}
                    </div>
                  </div>

                  {/* Score Steppers / Inputs */}
                  <div className="md:col-span-3 flex items-center justify-center gap-3 bg-[#0F1115] p-2.5 rounded-sm border border-slate-800">
                    {/* Home Score Stepper */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => adjustScore(fixture.id, 'home', -1)}
                        className="w-7 h-7 rounded-sm bg-[#161920] hover:bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer font-bold border border-slate-700 active:scale-95 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={homeVal}
                        placeholder="-"
                        onChange={(e) => handleScoreChange(fixture.id, 'home', e.target.value)}
                        className={`w-11 h-10 text-center text-lg font-bold mono rounded-sm bg-[#161920] border border-slate-700 focus:border-emerald-500 focus:outline-none transition-colors ${
                          isHomeWinner ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      />
                      <button
                        onClick={() => adjustScore(fixture.id, 'home', 1)}
                        className="w-7 h-7 rounded-sm bg-[#161920] hover:bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer font-bold border border-slate-700 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-slate-500 serif italic text-lg px-1">vs</span>

                    {/* Away Score Stepper */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => adjustScore(fixture.id, 'away', -1)}
                        className="w-7 h-7 rounded-sm bg-[#161920] hover:bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer font-bold border border-slate-700 active:scale-95 transition-all"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={awayVal}
                        placeholder="-"
                        onChange={(e) => handleScoreChange(fixture.id, 'away', e.target.value)}
                        className={`w-11 h-10 text-center text-lg font-bold mono rounded-sm bg-[#161920] border border-slate-700 focus:border-emerald-500 focus:outline-none transition-colors ${
                          isAwayWinner ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      />
                      <button
                        onClick={() => adjustScore(fixture.id, 'away', 1)}
                        className="w-7 h-7 rounded-sm bg-[#161920] hover:bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer font-bold border border-slate-700 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-start space-x-3">
                    <div
                      className="w-9 h-9 rounded-sm flex items-center justify-center text-lg shrink-0 border border-white/10 shadow-sm"
                      style={{ backgroundColor: awayTeam.color || '#3b82f6' }}
                    >
                      {awayTeam.logoEmoji || '⚽'}
                    </div>

                    <div className="text-right md:text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-base sm:text-lg ${isAwayWinner ? 'text-amber-400 font-extrabold' : 'text-slate-100'}`}>
                          {awayTeam.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#0F1115] text-slate-400 mono font-bold border border-slate-800">
                          {awayTeam.shortName}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Away</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Save Bar at Bottom */}
      {displayFixtures.length > 0 && (
        <div className="sticky bottom-4 z-20 flex justify-center">
          <button
            onClick={handleSaveBulkScores}
            className={`px-6 py-3 rounded-sm font-black text-xs uppercase tracking-widest transition-all shadow-2xl flex items-center gap-3 cursor-pointer border ${
              isSavedFeedback
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 scale-105 shadow-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/50'
            }`}
          >
            {isSavedFeedback ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Standings Updated!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Update Standings Table
              </>
            )}
          </button>
        </div>
      )}

      {/* Create Fixture Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#161920] border border-slate-800 rounded-sm w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Create Custom Fixture
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-sm text-xs text-rose-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateFixtureSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">
                    Matchweek
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newMatchweek}
                    onChange={(e) => setNewMatchweek(Number(e.target.value))}
                    className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm mono font-bold focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">
                    Match Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">
                  Home Team
                </label>
                <select
                  value={newHomeTeamId}
                  onChange={(e) => setNewHomeTeamId(e.target.value)}
                  className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                  required
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.logoEmoji} {t.name} ({t.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">
                  Away Team
                </label>
                <select
                  value={newAwayTeamId}
                  onChange={(e) => setNewAwayTeamId(e.target.value)}
                  className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none cursor-pointer"
                  required
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.logoEmoji} {t.name} ({t.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-sm bg-[#0F1115] hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider border border-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-md"
                >
                  Create Fixture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
