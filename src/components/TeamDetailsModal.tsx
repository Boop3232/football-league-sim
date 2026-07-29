import React from 'react';
import { Team, Fixture, StandingRow } from '../types';
import { X, Trophy, Shield, Flame, Check, Calendar, Landmark } from 'lucide-react';

interface TeamDetailsModalProps {
  team: Team | null;
  standing: StandingRow | null;
  fixtures: Fixture[];
  teams: Team[];
  onClose: () => void;
}

export const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  team,
  standing,
  fixtures,
  teams,
  onClose,
}) => {
  if (!team) return null;

  const teamMap = new Map<string, Team>();
  teams.forEach((t) => teamMap.set(t.id, t));

  const teamFixtures = fixtures.filter(
    (f) => f.homeTeamId === team.id || f.awayTeamId === team.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#161920] border border-slate-800 rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div
          className="p-6 border-b border-slate-800 flex items-center justify-between relative overflow-hidden"
          style={{
            background: `linear-gradient(to right, ${team.color || '#3b82f6'}33, rgba(22, 25, 32, 0.98))`,
          }}
        >
          <div className="flex items-center space-x-4">
            <div
              className="w-14 h-14 rounded-sm flex items-center justify-center text-3xl shadow-lg border border-white/20 shrink-0"
              style={{ backgroundColor: team.color || '#3b82f6' }}
            >
              {team.logoEmoji || '⚽'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-slate-100 serif italic">{team.name}</h3>
                <span className="text-xs mono font-bold px-2 py-0.5 rounded-sm bg-[#0F1115] text-slate-300 border border-slate-800">
                  {team.shortName}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                {team.stadium && <span>🏟️ {team.stadium}</span>}
                {standing && (
                  <span className="font-bold text-emerald-400 mono">Rank: #{standing.rank} ({standing.points} pts)</span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-sm bg-[#0F1115] hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Standing Quick Stats Bar */}
          {standing && (
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 bg-[#0F1115] p-3 rounded-sm border border-slate-800 text-center mono">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">MP</p>
                <p className="text-sm font-bold text-slate-200">{standing.played}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-400 font-bold uppercase">Won</p>
                <p className="text-sm font-bold text-emerald-400">{standing.won}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Drawn</p>
                <p className="text-sm font-bold text-slate-400">{standing.drawn}</p>
              </div>
              <div>
                <p className="text-[10px] text-rose-400 font-bold uppercase">Lost</p>
                <p className="text-sm font-bold text-rose-400">{standing.lost}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">GF</p>
                <p className="text-sm font-bold text-slate-200">{standing.goalsFor}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">GA</p>
                <p className="text-sm font-bold text-slate-400">{standing.goalsAgainst}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-400 font-bold uppercase">PTS</p>
                <p className="text-sm font-black text-emerald-300">{standing.points}</p>
              </div>
            </div>
          )}

          {/* Season Fixture Results History */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Season Schedule & Results ({teamFixtures.length})
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {teamFixtures.map((f) => {
                const isHome = f.homeTeamId === team.id;
                const oppId = isHome ? f.awayTeamId : f.homeTeamId;
                const opponent = teamMap.get(oppId);
                const isPlayed = f.isCompleted && f.homeScore !== null && f.awayScore !== null;

                const teamScore = isHome ? f.homeScore : f.awayScore;
                const oppScore = isHome ? f.awayScore : f.homeScore;

                let outcomeColor = 'border-slate-800';
                let outcomeBadge = '-';

                if (isPlayed && teamScore !== null && oppScore !== null) {
                  if (teamScore > oppScore) {
                    outcomeColor = 'border-emerald-500/40 bg-emerald-500/5';
                    outcomeBadge = 'W';
                  } else if (teamScore < oppScore) {
                    outcomeColor = 'border-rose-500/40 bg-rose-500/5';
                    outcomeBadge = 'L';
                  } else {
                    outcomeColor = 'border-slate-700 bg-slate-800/40';
                    outcomeBadge = 'D';
                  }
                }

                return (
                  <div
                    key={f.id}
                    className={`p-3 rounded-sm border text-xs flex items-center justify-between ${outcomeColor}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-400 mono">MW {f.matchweek}</span>
                      <span className="text-slate-400">{isHome ? '(H)' : '(A)'} vs</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-100">
                        <span>{opponent?.logoEmoji}</span>
                        <span>{opponent?.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mono font-bold">
                      {isPlayed ? (
                        <span className="text-sm text-slate-100">
                          {f.homeScore} - {f.awayScore}
                        </span>
                      ) : (
                        <span className="text-slate-500 uppercase text-[10px]">Scheduled</span>
                      )}

                      {isPlayed && (
                        <span
                          className={`w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-black text-white ${
                            outcomeBadge === 'W'
                              ? 'bg-emerald-600'
                              : outcomeBadge === 'D'
                              ? 'bg-slate-600'
                              : 'bg-rose-600'
                          }`}
                        >
                          {outcomeBadge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
