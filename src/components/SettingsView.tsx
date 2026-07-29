import React from 'react';
import { LeagueSettings, Team } from '../types';
import { PRESET_LEAGUES, PresetLeague } from '../data/presets';
import { Settings, RefreshCw, Layers, CheckCircle, Shield, AlertTriangle } from 'lucide-react';

interface SettingsViewProps {
  settings: LeagueSettings;
  onUpdateSettings: (newSettings: LeagueSettings) => void;
  onLoadPreset: (preset: PresetLeague) => void;
  onResetAll: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onLoadPreset,
  onResetAll,
}) => {
  const handleChange = (field: keyof LeagueSettings, value: any) => {
    onUpdateSettings({
      ...settings,
      [field]: value,
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Quick Preset Leagues Section */}
      <div className="bg-[#161920] border border-slate-800 rounded-sm p-6 shadow-2xl space-y-4">
        <div>
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span className="serif italic text-2xl">Preset Circuits</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Load pre-configured leagues with custom teams and rules in one click.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_LEAGUES.map((preset) => (
            <div
              key={preset.id}
              className="bg-[#0F1115] border border-slate-800 rounded-sm p-4 flex flex-col justify-between hover:border-emerald-500/50 transition-all space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-100 text-base serif">{preset.name}</h4>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mono">
                    {preset.teams.length} Clubs
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{preset.description}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {preset.teams.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center text-[10px] mono px-2 py-0.5 rounded-sm bg-[#161920] border border-slate-800 text-slate-300"
                    >
                      {t.logoEmoji} {t.shortName}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onLoadPreset(preset)}
                className="w-full py-2.5 rounded-sm bg-white text-black hover:bg-emerald-500 hover:text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Load Preset Circuit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rules & Parameters Form */}
      <div className="bg-[#161920] border border-slate-800 rounded-sm p-6 shadow-2xl space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wider">
            <Settings className="w-5 h-5 text-emerald-400" />
            League Configuration & Mechanics
          </h3>
          <p className="text-xs text-slate-400 mt-1">Customize tournament format and standings scoring mechanics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* League & Season Name */}
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">League Name</label>
            <input
              type="text"
              value={settings.leagueName}
              onChange={(e) => handleChange('leagueName', e.target.value)}
              className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">Season Name</label>
            <input
              type="text"
              value={settings.seasonName}
              onChange={(e) => handleChange('seasonName', e.target.value)}
              className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm mono font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Fixture Format */}
          <div className="md:col-span-2 bg-[#0F1115] p-4 rounded-sm border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-100">Double Round-Robin Format</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Enabled = Home & Away matches (2 matches per pair). Disabled = Single match per pair.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.doubleRoundRobin}
                onChange={(e) => handleChange('doubleRoundRobin', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-sm peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-sm after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Scoring Rules */}
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">Points for Win</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.pointsForWin}
              onChange={(e) => handleChange('pointsForWin', Number(e.target.value))}
              className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm mono font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">Points for Draw</label>
            <input
              type="number"
              min="0"
              max="10"
              value={settings.pointsForDraw}
              onChange={(e) => handleChange('pointsForDraw', Number(e.target.value))}
              className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm mono font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Table Highlight Thresholds */}
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">Top Qualification Spots</label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.topPositionsCount}
              onChange={(e) => handleChange('topPositionsCount', Number(e.target.value))}
              className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm mono font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-slate-300 mb-1">Relegation Zone Spots</label>
            <input
              type="number"
              min="0"
              max="10"
              value={settings.relegationPositionsCount}
              onChange={(e) => handleChange('relegationPositionsCount', Number(e.target.value))}
              className="w-full bg-[#0F1115] border border-slate-800 rounded-sm px-3.5 py-2.5 text-slate-100 text-sm mono font-bold focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-950/10 border border-rose-900/40 rounded-sm p-6 shadow-2xl space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Factory Reset
        </h3>
        <p className="text-xs text-rose-300/80">
          This will wipe all custom teams, fixtures, and scores back to a clean initial state.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset all teams and league data?')) {
              onResetAll();
            }
          }}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-sm transition-all shadow-md cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Simulator
        </button>
      </div>
    </div>
  );
};
