import React, { useState } from 'react';
import { Team } from '../types';
import { Plus, Trash2, Edit2, Shield, Sparkles, Check, RefreshCw, Play, Info } from 'lucide-react';

interface TeamManagerProps {
  teams: Team[];
  onAddTeam: (team: Omit<Team, 'id'>) => void;
  onUpdateTeam: (team: Team) => void;
  onDeleteTeam: (id: string) => void;
  onGenerateFixtures: () => void;
  isGenerated: boolean;
}

const DEFAULT_EMOJIS = ['⚽', '🦁', '🦅', '⚡', '👑', '🛡️', '⚔️', '🔥', '🐉', '🌟', '🏆', '🐺', '🦈', '🐯', '🚀', '🐎'];

const COLOR_PRESETS = [
  '#ef4444', // Red
  '#2563eb', // Blue
  '#16a34a', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#09090b', // Dark Black
  '#eab308', // Gold
  '#64748b', // Slate
];

export const TeamManager: React.FC<TeamManagerProps> = ({
  teams,
  onAddTeam,
  onUpdateTeam,
  onDeleteTeam,
  onGenerateFixtures,
  isGenerated,
}) => {
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [color, setColor] = useState('#ef4444');
  const [logoEmoji, setLogoEmoji] = useState('⚽');
  const [stadium, setStadium] = useState('');
  const [attackRating, setAttackRating] = useState(80);
  const [defenseRating, setDefenseRating] = useState(80);

  const resetForm = () => {
    setEditingTeamId(null);
    setName('');
    setShortName('');
    setColor('#ef4444');
    setLogoEmoji('⚽');
    setStadium('');
    setAttackRating(80);
    setDefenseRating(80);
  };

  const handleStartEdit = (t: Team) => {
    setEditingTeamId(t.id);
    setName(t.name);
    setShortName(t.shortName);
    setColor(t.color || '#ef4444');
    setLogoEmoji(t.logoEmoji || '⚽');
    setStadium(t.stadium || '');
    setAttackRating(t.attackRating || 80);
    setDefenseRating(t.defenseRating || 80);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedShort = (shortName.trim() || name.substring(0, 3)).toUpperCase();

    if (editingTeamId) {
      onUpdateTeam({
        id: editingTeamId,
        name: name.trim(),
        shortName: formattedShort,
        color,
        logoEmoji,
        stadium: stadium.trim(),
        attackRating,
        defenseRating,
      });
    } else {
      onAddTeam({
        name: name.trim(),
        shortName: formattedShort,
        color,
        logoEmoji,
        stadium: stadium.trim(),
        attackRating,
        defenseRating,
      });
    }

    resetForm();
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Fixture Warning */}
      <div className="bg-[#161920] border border-slate-800 rounded-sm p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <span className="serif italic">League Teams Directory</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm bg-[#0F1115] text-emerald-400 border border-slate-700">
              {teams.length} Registered
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add custom club names, badges, colors, and stadium names. Minimum 2 teams required to generate fixtures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGenerateFixtures}
            disabled={teams.length < 2}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isGenerated ? 'Regenerate Schedule' : 'Generate League Fixtures'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Add / Edit Team Form */}
        <div className="lg:col-span-5 bg-[#161920] border border-slate-800 rounded-sm p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider">
              <Shield className="w-4 h-4 text-emerald-400" />
              {editingTeamId ? 'Edit Team Details' : 'Add Custom Team'}
            </h3>
            {editingTeamId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Team Name */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">
                Team Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Real Madrid, Arsenal, Custom FC"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!shortName && e.target.value.length >= 3) {
                    setShortName(e.target.value.substring(0, 3).toUpperCase());
                  }
                }}
                className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Short Code & Stadium */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">
                  Short Code (3-4)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. RMA"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">
                  Home Stadium
                </label>
                <input
                  type="text"
                  placeholder="e.g. Camp Nou"
                  value={stadium}
                  onChange={(e) => setStadium(e.target.value)}
                  className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Emblem Emoji Selector */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                Badge Emblem / Emoji
              </label>
              <div className="flex flex-wrap gap-2 p-2.5 bg-[#0F1115] rounded-sm border border-slate-800">
                {DEFAULT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setLogoEmoji(emoji)}
                    className={`w-8 h-8 rounded-sm flex items-center justify-center text-base transition-all cursor-pointer ${
                      logoEmoji === emoji
                        ? 'bg-emerald-500/20 border border-emerald-500 scale-105'
                        : 'hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Swatches */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                Primary Team Color
              </label>
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-[#0F1115] rounded-sm border border-slate-800">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-sm transition-all cursor-pointer border ${
                      color === c ? 'ring-2 ring-emerald-400 scale-105 border-white' : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-6 h-6 rounded-sm border-0 bg-transparent cursor-pointer"
                  title="Custom Color Picker"
                />
              </div>
            </div>

            {/* Strength Ratings */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Ratings (Auto-Sim)</span>
                <span className="text-[10px] text-slate-500 mono">1 - 99 scale</span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Attack Strength</span>
                  <span className="font-bold text-emerald-400 mono">{attackRating}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="99"
                  value={attackRating}
                  onChange={(e) => setAttackRating(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Defense Strength</span>
                  <span className="font-bold text-blue-400 mono">{defenseRating}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="99"
                  value={defenseRating}
                  onChange={(e) => setDefenseRating(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <Plus className="w-4 h-4" />
              {editingTeamId ? 'Update Team Details' : 'Add Team to League'}
            </button>
          </form>
        </div>

        {/* Existing Teams Grid */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center justify-between uppercase tracking-wider">
            <span>Registered Clubs ({teams.length})</span>
            {isGenerated && (
              <span className="text-[11px] font-normal text-amber-400 flex items-center gap-1 normal-case">
                <Info className="w-3.5 h-3.5" /> Modifying teams resets current schedule
              </span>
            )}
          </h3>

          {teams.length === 0 ? (
            <div className="bg-[#161920] border border-slate-800 rounded-sm p-8 text-center text-slate-400 text-sm">
              No custom teams added yet. Use the form on the left or load a preset in settings!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#161920] border border-slate-800/80 rounded-sm p-4 flex items-center justify-between hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-sm flex items-center justify-center text-lg shrink-0 shadow-sm border border-white/10"
                      style={{ backgroundColor: t.color || '#3b82f6' }}
                    >
                      {t.logoEmoji || '⚽'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-100 truncate text-sm">{t.name}</h4>
                        <span className="text-[10px] mono font-bold px-1.5 py-0.5 rounded-sm bg-[#0F1115] text-slate-400 border border-slate-800">
                          {t.shortName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 mono">
                        Att: <span className="text-emerald-400 font-bold">{t.attackRating || 80}</span> • Def:{' '}
                        <span className="text-blue-400 font-bold">{t.defenseRating || 80}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => handleStartEdit(t)}
                      className="p-2 rounded-sm bg-[#0F1115] hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer border border-slate-800"
                      title="Edit team"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTeam(t.id)}
                      className="p-2 rounded-sm bg-[#0F1115] hover:bg-rose-900/40 text-rose-400 transition-colors cursor-pointer border border-slate-800"
                      title="Delete team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
