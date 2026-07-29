/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Team, Fixture, LeagueSettings, StandingRow } from './types';
import { PRESET_LEAGUES, PresetLeague } from './data/presets';
import { generateFixtures, calculateStandings, simulateMatch } from './utils/leagueEngine';
import { Header } from './components/Header';
import { StandingsTable } from './components/StandingsTable';
import { FixturesList } from './components/FixturesList';
import { TeamManager } from './components/TeamManager';
import { SettingsView } from './components/SettingsView';
import { TeamDetailsModal } from './components/TeamDetailsModal';
import {
  listenToLeague,
  seedInitialLeagueData,
  updateBatchFixturesInFirestore,
  saveAllFixturesInFirestore,
  addOrUpdateFixtureInFirestore,
  saveTeamInFirestore,
  deleteTeamFromFirestore,
  saveSettingsInFirestore,
  replaceAllLeagueDataInFirestore,
} from './services/firestoreLeague';

const LOCAL_STORAGE_KEY = 'football_sim_league_v1';

export default function App() {
  const defaultPreset = PRESET_LEAGUES[0];

  // Primary League State
  const [settings, setSettings] = useState<LeagueSettings>(defaultPreset.settings);
  const [teams, setTeams] = useState<Team[]>(defaultPreset.teams);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);

  // Active UI Navigation Tab
  const [activeTab, setActiveTab] = useState<'standings' | 'fixtures' | 'teams' | 'settings'>('standings');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Subscribe to Firestore for real-time live persistence
  useEffect(() => {
    const unsubscribe = listenToLeague(({ teams: remoteTeams, fixtures: remoteFixtures, settings: remoteSettings, isEmpty }) => {
      if (isEmpty) {
        // Seed initial default preset into Firestore if collection is empty
        const initialFix = generateFixtures(defaultPreset.teams, defaultPreset.settings.doubleRoundRobin);
        seedInitialLeagueData(defaultPreset.settings, defaultPreset.teams, initialFix).catch(console.error);
        setSettings(defaultPreset.settings);
        setTeams(defaultPreset.teams);
        setFixtures(initialFix);
        setIsGenerated(true);
      } else {
        setSettings(remoteSettings);
        setTeams(remoteTeams);
        setFixtures(remoteFixtures);
        setIsGenerated(remoteFixtures.length > 0);
      }
    });

    return () => unsubscribe();
  }, []);

  // Compute live auto-calculated standings
  const standings: StandingRow[] = useMemo(() => {
    return calculateStandings(teams, fixtures, settings);
  }, [teams, fixtures, settings]);

  const completedCount = useMemo(() => {
    return fixtures.filter((f) => f.isCompleted && f.homeScore !== null && f.awayScore !== null).length;
  }, [fixtures]);

  // Action: Generate / Regenerate Schedule
  const handleGenerateFixtures = () => {
    if (teams.length < 2) return;
    const newFixtures = generateFixtures(teams, settings.doubleRoundRobin);
    setFixtures(newFixtures);
    setIsGenerated(true);
    saveAllFixturesInFirestore(newFixtures).catch(console.error);
    saveSettingsInFirestore({ ...settings, isGenerated: true }).catch(console.error);
  };

  // Action: Update batch scores (User manually enters scores for 1 or multiple fixtures)
  const handleUpdateFixtureScores = (
    updates: Array<{ id: string; homeScore: number | null; awayScore: number | null }>
  ) => {
    setFixtures((prev) => {
      const updateMap = new Map(updates.map((u) => [u.id, u]));
      return prev.map((fix) => {
        if (updateMap.has(fix.id)) {
          const u = updateMap.get(fix.id)!;
          const isComp = u.homeScore !== null && u.awayScore !== null;
          return {
            ...fix,
            homeScore: u.homeScore,
            awayScore: u.awayScore,
            isCompleted: isComp,
          };
        }
        return fix;
      });
    });
    updateBatchFixturesInFirestore(updates).catch(console.error);
  };

  // Action: Auto-simulate a specific subset of fixture IDs
  const handleSimulateFixtures = (fixtureIds: string[]) => {
    const teamMap = new Map<string, Team>();
    teams.forEach((t) => teamMap.set(t.id, t));

    const idSet = new Set(fixtureIds);
    const updatesToPersist: Array<{ id: string; homeScore: number; awayScore: number; isCompleted: boolean }> = [];

    setFixtures((prev) =>
      prev.map((fix) => {
        if (idSet.has(fix.id)) {
          const homeT = teamMap.get(fix.homeTeamId);
          const awayT = teamMap.get(fix.awayTeamId);
          if (homeT && awayT) {
            const { homeScore, awayScore } = simulateMatch(homeT, awayT);
            updatesToPersist.push({ id: fix.id, homeScore, awayScore, isCompleted: true });
            return {
              ...fix,
              homeScore,
              awayScore,
              isCompleted: true,
            };
          }
        }
        return fix;
      })
    );

    if (updatesToPersist.length > 0) {
      updateBatchFixturesInFirestore(updatesToPersist).catch(console.error);
    }
  };

  // Action: Auto-simulate ALL unplayed matches in league
  const handleQuickSimulateAll = () => {
    const unplayedIds = fixtures.filter((f) => !f.isCompleted).map((f) => f.id);
    handleSimulateFixtures(unplayedIds);
  };

  // Action: Reset scores for specific fixture IDs
  const handleResetFixtures = (fixtureIds: string[]) => {
    const idSet = new Set(fixtureIds);
    const updatesToPersist: Array<{ id: string; homeScore: null; awayScore: null; isCompleted: boolean }> = [];

    setFixtures((prev) =>
      prev.map((fix) => {
        if (idSet.has(fix.id)) {
          updatesToPersist.push({ id: fix.id, homeScore: null, awayScore: null, isCompleted: false });
          return {
            ...fix,
            homeScore: null,
            awayScore: null,
            isCompleted: false,
          };
        }
        return fix;
      })
    );

    if (updatesToPersist.length > 0) {
      updateBatchFixturesInFirestore(updatesToPersist).catch(console.error);
    }
  };

  // Action: Create Single Custom Fixture
  const handleCreateFixture = (
    newFixtureData: Omit<Fixture, 'id' | 'homeScore' | 'awayScore' | 'isCompleted'>
  ) => {
    const newFix: Fixture = {
      ...newFixtureData,
      id: `fix-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      homeScore: null,
      awayScore: null,
      isCompleted: false,
    };
    setFixtures((prev) => [...prev, newFix]);
    setIsGenerated(true);
    addOrUpdateFixtureInFirestore(newFix).catch(console.error);
  };

  // Action: Reset all scores in the season
  const handleResetLeagueScores = () => {
    const updates = fixtures.map((f) => ({ id: f.id, homeScore: null, awayScore: null, isCompleted: false }));
    setFixtures((prev) =>
      prev.map((fix) => ({
        ...fix,
        homeScore: null,
        awayScore: null,
        isCompleted: false,
      }))
    );
    updateBatchFixturesInFirestore(updates).catch(console.error);
  };

  // Action: Add Custom Team
  const handleAddTeam = (newTeamData: Omit<Team, 'id'>) => {
    const newTeam: Team = {
      ...newTeamData,
      id: `team-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    const nextTeams = [...teams, newTeam];
    setTeams(nextTeams);
    saveTeamInFirestore(newTeam).catch(console.error);

    // Auto regenerate fixtures if schedule was already built
    if (isGenerated && nextTeams.length >= 2) {
      const nextFixtures = generateFixtures(nextTeams, settings.doubleRoundRobin);
      setFixtures(nextFixtures);
      saveAllFixturesInFirestore(nextFixtures).catch(console.error);
    }
  };

  // Action: Update Team Details
  const handleUpdateTeam = (updatedTeam: Team) => {
    setTeams((prev) => prev.map((t) => (t.id === updatedTeam.id ? updatedTeam : t)));
    saveTeamInFirestore(updatedTeam).catch(console.error);
  };

  // Action: Delete Team
  const handleDeleteTeam = (id: string) => {
    const nextTeams = teams.filter((t) => t.id !== id);
    setTeams(nextTeams);
    deleteTeamFromFirestore(id).catch(console.error);

    if (isGenerated && nextTeams.length >= 2) {
      const nextFixtures = generateFixtures(nextTeams, settings.doubleRoundRobin);
      setFixtures(nextFixtures);
      saveAllFixturesInFirestore(nextFixtures).catch(console.error);
    } else if (nextTeams.length < 2) {
      setFixtures([]);
      setIsGenerated(false);
      saveAllFixturesInFirestore([]).catch(console.error);
    }
  };

  // Action: Load Preset League
  const handleLoadPreset = (preset: PresetLeague) => {
    setSettings(preset.settings);
    setTeams(preset.teams);
    const newFix = generateFixtures(preset.teams, preset.settings.doubleRoundRobin);
    setFixtures(newFix);
    setIsGenerated(true);
    setActiveTab('standings');
    replaceAllLeagueDataInFirestore(preset.settings, preset.teams, newFix).catch(console.error);
  };

  // Action: Factory Reset
  const handleResetAll = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setTeams([]);
    setFixtures([]);
    setIsGenerated(false);
    setActiveTab('teams');
    replaceAllLeagueDataInFirestore(defaultPreset.settings, [], []).catch(console.error);
  };

  // Backup JSON Export & Import
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ settings, teams, fixtures, isGenerated }));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${settings.leagueName.toLowerCase().replace(/\s+/g, '-')}-sim.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.teams && parsed.settings) {
            setSettings(parsed.settings);
            setTeams(parsed.teams);
            setFixtures(parsed.fixtures || []);
            setIsGenerated(parsed.isGenerated || false);
            replaceAllLeagueDataInFirestore(parsed.settings, parsed.teams, parsed.fixtures || []).catch(console.error);
          }
        } catch (err) {
          alert('Invalid league backup JSON file.');
        }
      };
    }
  };

  const selectedTeamStanding = useMemo(() => {
    if (!selectedTeam) return null;
    return standings.find((s) => s.team.id === selectedTeam.id) || null;
  }, [selectedTeam, standings]);

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        teamsCount={teams.length}
        completedFixturesCount={completedCount}
        totalFixturesCount={fixtures.length}
        isGenerated={isGenerated}
        onGenerateFixtures={handleGenerateFixtures}
        onResetLeague={handleResetLeagueScores}
        onQuickSimulateAll={handleQuickSimulateAll}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'standings' && (
          <StandingsTable
            standings={standings}
            settings={settings}
            onSelectTeam={(t) => setSelectedTeam(t)}
          />
        )}

        {activeTab === 'fixtures' && (
          <FixturesList
            fixtures={fixtures}
            teams={teams}
            onUpdateFixtureScores={handleUpdateFixtureScores}
            onSimulateFixtures={handleSimulateFixtures}
            onResetFixtures={handleResetFixtures}
            onCreateFixture={handleCreateFixture}
          />
        )}

        {activeTab === 'teams' && (
          <TeamManager
            teams={teams}
            onAddTeam={handleAddTeam}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
            onGenerateFixtures={handleGenerateFixtures}
            isGenerated={isGenerated}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newSettings) => {
              setSettings(newSettings);
              saveSettingsInFirestore(newSettings).catch(console.error);
              if (isGenerated && teams.length >= 2) {
                const newFix = generateFixtures(teams, newSettings.doubleRoundRobin);
                setFixtures(newFix);
                saveAllFixturesInFirestore(newFix).catch(console.error);
              }
            }}
            onLoadPreset={handleLoadPreset}
            onResetAll={handleResetAll}
          />
        )}
      </main>

      {/* Team Details Modal */}
      {selectedTeam && (
        <TeamDetailsModal
          team={selectedTeam}
          standing={selectedTeamStanding}
          fixtures={fixtures}
          teams={teams}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}
