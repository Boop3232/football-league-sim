import React, { useState } from 'react';
import { StandingRow, LeagueSettings, Team } from '../types';
import { Trophy, Award, ShieldAlert, TrendingUp, Flame, ShieldCheck, ChevronRight } from 'lucide-react';

interface StandingsTableProps {
  standings: StandingRow[];
  settings: LeagueSettings;
  onSelectTeam?: (team: Team) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  settings,
  onSelectTeam,
}) => {
  const [viewSplit, setViewSplit] = useState<'overall' | 'home' | 'away'>('overall');

  if (standings.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center my-6 shadow-sm">
        <Trophy className="w-16 h-16 mx-auto text-slate-700 mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-slate-200 mb-2">No Standings Available</h3>
        <p className="text-slate-400 max-w-md mx-auto text-sm mb-6">
          Add at least 2 teams and generate your league schedule to see live automatic standings update!
        </p>
      </div>
    );
  }

  // Calculate summary stats
  const leader = standings[0];
  const topScoringTeam = [...standings].sort((a, b) => b.goalsFor - a.goalsFor)[0];
  const bestDefenseTeam = [...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];

  return (
    <div className="space-y-6">
      {/* Overview Highlight Cards in Editorial Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* League Leader Card */}
        <div className="bg-[#161920] border-l-4 border-amber-500 border-t border-r border-b border-slate-800/80 rounded-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-bold text-amber-400 tracking-widest">League Leader</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg">{leader.team.logoEmoji}</span>
              <h4 className="text-base font-bold text-slate-100 truncate serif">{leader.team.name}</h4>
            </div>
            <p className="text-xs text-slate-400 mt-1 mono">
              <span className="font-bold text-amber-300">{leader.points} Pts</span> • GD: {leader.goalDifference > 0 ? `+${leader.goalDifference}` : leader.goalDifference}
            </p>
          </div>
        </div>

        {/* Top Scorer Team Card */}
        <div className="bg-[#161920] border-l-4 border-emerald-500 border-t border-r border-b border-slate-800/80 rounded-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">Most Goals</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg">{topScoringTeam.team.logoEmoji}</span>
              <h4 className="text-base font-bold text-slate-100 truncate serif">{topScoringTeam.team.name}</h4>
            </div>
            <p className="text-xs text-slate-400 mt-1 mono">
              <span className="font-bold text-emerald-400">{topScoringTeam.goalsFor} Goals</span> Scored
            </p>
          </div>
        </div>

        {/* Best Defense Card */}
        <div className="bg-[#161920] border-l-4 border-blue-500 border-t border-r border-b border-slate-800/80 rounded-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-bold text-blue-400 tracking-widest">Best Defense</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg">{bestDefenseTeam.team.logoEmoji}</span>
              <h4 className="text-base font-bold text-slate-100 truncate serif">{bestDefenseTeam.team.name}</h4>
            </div>
            <p className="text-xs text-slate-400 mt-1 mono">
              <span className="font-bold text-blue-400">{bestDefenseTeam.goalsAgainst} Goals</span> Conceded
            </p>
          </div>
        </div>
      </div>

      {/* Main Standings Table Container */}
      <div className="bg-[#161920] border border-slate-800 rounded-sm overflow-hidden shadow-2xl">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F1115]">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
              <span className="serif italic text-2xl">{settings.leagueName}</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm bg-slate-800 text-emerald-400 border border-slate-700 tracking-widest">
                Official Table
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 mono">
              Win = {settings.pointsForWin}pts • Draw = {settings.pointsForDraw}pt • Loss = {settings.pointsForLoss}pts
            </p>
          </div>

          {/* View Split Filters (Overall / Home / Away) */}
          <div className="flex p-1 bg-[#0F1115] rounded-sm border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setViewSplit('overall')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
                viewSplit === 'overall'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => setViewSplit('home')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
                viewSplit === 'home'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setViewSplit('away')}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
                viewSplit === 'away'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Away
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F1115]/80 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800">
                <th className="py-3.5 px-3 text-center w-12">Pos</th>
                <th className="py-3.5 px-4 min-w-[180px]">Club</th>
                <th className="py-3.5 px-2 text-center w-10">MP</th>
                <th className="py-3.5 px-2 text-center w-10">W</th>
                <th className="py-3.5 px-2 text-center w-10">D</th>
                <th className="py-3.5 px-2 text-center w-10">L</th>
                <th className="py-3.5 px-2 text-center w-12 hidden sm:table-cell">GF</th>
                <th className="py-3.5 px-2 text-center w-12 hidden sm:table-cell">GA</th>
                <th className="py-3.5 px-2 text-center w-12">GD</th>
                <th className="py-3.5 px-3 text-center w-16 font-black text-white">PTS</th>
                <th className="py-3.5 px-4 text-center min-w-[130px] hidden md:table-cell">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {standings.map((row) => {
                const stats =
                  viewSplit === 'home'
                    ? row.homeStats
                    : viewSplit === 'away'
                    ? row.awayStats
                    : row;

                const isChampion = row.rank === 1;
                const isTopTier = row.rank <= settings.topPositionsCount;
                const isRelegation = row.rank > standings.length - settings.relegationPositionsCount;

                return (
                  <tr
                    key={row.team.id}
                    onClick={() => onSelectTeam && onSelectTeam(row.team)}
                    className={`group hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      isChampion ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-4 px-3 text-center font-bold mono">
                      <div className="flex items-center justify-center gap-1">
                        {isChampion ? (
                          <span className="w-6 h-6 rounded-sm bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                            1
                          </span>
                        ) : isTopTier ? (
                          <span className="w-6 h-6 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center justify-center text-xs">
                            {row.rank}
                          </span>
                        ) : isRelegation ? (
                          <span className="w-6 h-6 rounded-sm bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold flex items-center justify-center text-xs">
                            {row.rank}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold">{row.rank}</span>
                        )}
                      </div>
                    </td>

                    {/* Team Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-sm flex items-center justify-center text-base shadow-sm shrink-0 border border-white/10"
                          style={{ backgroundColor: row.team.color || '#3b82f6' }}
                        >
                          <span>{row.team.logoEmoji || '⚽'}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                              {row.team.name}
                            </span>
                            <span className="text-[10px] mono font-bold px-1.5 py-0.5 rounded-sm bg-[#0F1115] text-slate-400 border border-slate-800 uppercase">
                              {row.team.shortName}
                            </span>
                          </div>
                          {row.team.stadium && (
                            <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                              {row.team.stadium}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Stats columns */}
                    <td className="py-4 px-2 text-center text-slate-300 font-bold mono">{stats.played}</td>
                    <td className="py-4 px-2 text-center text-emerald-400 font-bold mono">{stats.won}</td>
                    <td className="py-4 px-2 text-center text-slate-400 font-medium mono">{stats.drawn}</td>
                    <td className="py-4 px-2 text-center text-rose-400 font-medium mono">{stats.lost}</td>
                    <td className="py-4 px-2 text-center text-slate-300 hidden sm:table-cell mono">{stats.goalsFor}</td>
                    <td className="py-4 px-2 text-center text-slate-400 hidden sm:table-cell mono">{stats.goalsAgainst}</td>
                    
                    {/* Goal Difference */}
                    <td className="py-4 px-2 text-center font-bold mono">
                      <span
                        className={
                          stats.goalDifference > 0
                            ? 'text-emerald-400'
                            : stats.goalDifference < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }
                      >
                        {stats.goalDifference > 0 ? `+${stats.goalDifference}` : stats.goalDifference}
                      </span>
                    </td>

                    {/* Points */}
                    <td className="py-4 px-3 text-center mono">
                      <span className="inline-block px-2.5 py-1 rounded-sm bg-emerald-500/20 text-emerald-300 font-extrabold text-sm border border-emerald-500/30">
                        {stats.points}
                      </span>
                    </td>

                    {/* Last 5 Matches Form */}
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="flex items-center justify-center gap-1">
                        {row.form.length === 0 ? (
                          <span className="text-xs text-slate-600">-</span>
                        ) : (
                          row.form.map((res, i) => (
                            <span
                              key={i}
                              className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-black text-white shadow-xs mono ${
                                res === 'W'
                                  ? 'bg-emerald-600'
                                  : res === 'D'
                                  ? 'bg-slate-700'
                                  : 'bg-rose-600'
                              }`}
                              title={res === 'W' ? 'Win' : res === 'D' ? 'Draw' : 'Loss'}
                            >
                              {res}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend Footer */}
        <div className="p-4 bg-[#0F1115] border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm"></span>
              <span>1st: Champion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500/40 border border-emerald-500 rounded-sm"></span>
              <span>Top {settings.topPositionsCount}: Qualified Zone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500/40 border border-rose-500 rounded-sm"></span>
              <span>Bottom {settings.relegationPositionsCount}: Relegation Zone</span>
            </div>
          </div>
          <span className="text-slate-500 italic">Tip: Click any team row to inspect full match log</span>
        </div>
      </div>
    </div>
  );
};
