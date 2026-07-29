import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Team, Fixture, LeagueSettings } from '../types';

const TEAMS_COLLECTION = 'teams';
const FIXTURES_COLLECTION = 'fixtures';
const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'league_settings';

export function listenToLeague(
  onData: (data: {
    teams: Team[];
    fixtures: Fixture[];
    settings: LeagueSettings;
    isGenerated: boolean;
    isEmpty: boolean;
  }) => void,
  onError?: (err: Error) => void
) {
  let teams: Team[] = [];
  let fixtures: Fixture[] = [];
  let settings: LeagueSettings | null = null;
  let teamsLoaded = false;
  let fixturesLoaded = false;
  let settingsLoaded = false;

  const checkLoaded = () => {
    if (teamsLoaded && fixturesLoaded && settingsLoaded) {
      const isEmpty = teams.length === 0 && fixtures.length === 0 && !settings;
      onData({
        teams,
        fixtures,
        settings: settings || {
          leagueName: 'Premier League',
          seasonName: '2026/27',
          doubleRoundRobin: true,
          pointsForWin: 3,
          pointsForDraw: 1,
          pointsForLoss: 0,
          topPositionsCount: 4,
          relegationPositionsCount: 3,
        },
        isGenerated: fixtures.length > 0,
        isEmpty,
      });
    }
  };

  const unsubTeams = onSnapshot(
    collection(db, TEAMS_COLLECTION),
    (snapshot) => {
      teams = snapshot.docs.map((docSnap) => docSnap.data() as Team);
      teamsLoaded = true;
      checkLoaded();
    },
    (err) => onError?.(err)
  );

  const unsubFixtures = onSnapshot(
    collection(db, FIXTURES_COLLECTION),
    (snapshot) => {
      fixtures = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: d.id,
          matchweek: d.matchweek,
          homeTeamId: d.homeTeamId,
          awayTeamId: d.awayTeamId,
          homeScore: d.homeScore !== undefined ? d.homeScore : null,
          awayScore: d.awayScore !== undefined ? d.awayScore : null,
          isCompleted: Boolean(d.isCompleted),
          date: d.date || '',
        } as Fixture;
      });
      fixtures.sort((a, b) => a.matchweek - b.matchweek);
      fixturesLoaded = true;
      checkLoaded();
    },
    (err) => onError?.(err)
  );

  const unsubSettings = onSnapshot(
    doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID),
    (docSnap) => {
      if (docSnap.exists()) {
        settings = docSnap.data() as LeagueSettings;
      }
      settingsLoaded = true;
      checkLoaded();
    },
    (err) => onError?.(err)
  );

  return () => {
    unsubTeams();
    unsubFixtures();
    unsubSettings();
  };
}

export async function seedInitialLeagueData(
  initialSettings: LeagueSettings,
  initialTeams: Team[],
  initialFixtures: Fixture[]
) {
  const batch = writeBatch(db);

  const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  batch.set(settingsRef, { ...initialSettings, isGenerated: true });

  for (const team of initialTeams) {
    const teamRef = doc(db, TEAMS_COLLECTION, team.id);
    batch.set(teamRef, team);
  }

  for (const fix of initialFixtures) {
    const fixRef = doc(db, FIXTURES_COLLECTION, fix.id);
    batch.set(fixRef, {
      id: fix.id,
      matchweek: fix.matchweek,
      homeTeamId: fix.homeTeamId,
      awayTeamId: fix.awayTeamId,
      homeScore: fix.homeScore,
      awayScore: fix.awayScore,
      isCompleted: fix.isCompleted,
      date: fix.date || '',
    });
  }

  await batch.commit();
}

export async function updateBatchFixturesInFirestore(
  updates: Array<{ id: string; homeScore: number | null; awayScore: number | null; isCompleted?: boolean }>
) {
  const batch = writeBatch(db);
  for (const u of updates) {
    const fixRef = doc(db, FIXTURES_COLLECTION, u.id);
    const isCompleted = u.isCompleted ?? (u.homeScore !== null && u.awayScore !== null);
    batch.update(fixRef, {
      homeScore: u.homeScore,
      awayScore: u.awayScore,
      isCompleted,
    });
  }
  await batch.commit();
}

export async function saveAllFixturesInFirestore(fixtures: Fixture[]) {
  const existingDocs = await getDocs(collection(db, FIXTURES_COLLECTION));
  const batch = writeBatch(db);
  existingDocs.forEach((d) => batch.delete(d.ref));

  for (const fix of fixtures) {
    const fixRef = doc(db, FIXTURES_COLLECTION, fix.id);
    batch.set(fixRef, {
      id: fix.id,
      matchweek: fix.matchweek,
      homeTeamId: fix.homeTeamId,
      awayTeamId: fix.awayTeamId,
      homeScore: fix.homeScore,
      awayScore: fix.awayScore,
      isCompleted: fix.isCompleted,
      date: fix.date || '',
    });
  }
  await batch.commit();
}

export async function addOrUpdateFixtureInFirestore(fix: Fixture) {
  const fixRef = doc(db, FIXTURES_COLLECTION, fix.id);
  await setDoc(fixRef, {
    id: fix.id,
    matchweek: fix.matchweek,
    homeTeamId: fix.homeTeamId,
    awayTeamId: fix.awayTeamId,
    homeScore: fix.homeScore,
    awayScore: fix.awayScore,
    isCompleted: fix.isCompleted,
    date: fix.date || '',
  });
}

export async function saveTeamInFirestore(team: Team) {
  const teamRef = doc(db, TEAMS_COLLECTION, team.id);
  await setDoc(teamRef, team);
}

export async function deleteTeamFromFirestore(teamId: string) {
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  await deleteDoc(teamRef);
}

export async function saveSettingsInFirestore(settings: LeagueSettings) {
  const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  await setDoc(settingsRef, settings, { merge: true });
}

export async function replaceAllLeagueDataInFirestore(
  settings: LeagueSettings,
  teams: Team[],
  fixtures: Fixture[]
) {
  const oldTeams = await getDocs(collection(db, TEAMS_COLLECTION));
  const oldFixtures = await getDocs(collection(db, FIXTURES_COLLECTION));

  const batch = writeBatch(db);
  oldTeams.forEach((d) => batch.delete(d.ref));
  oldFixtures.forEach((d) => batch.delete(d.ref));

  const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  batch.set(settingsRef, { ...settings, isGenerated: true });

  for (const team of teams) {
    const teamRef = doc(db, TEAMS_COLLECTION, team.id);
    batch.set(teamRef, team);
  }

  for (const fix of fixtures) {
    const fixRef = doc(db, FIXTURES_COLLECTION, fix.id);
    batch.set(fixRef, {
      id: fix.id,
      matchweek: fix.matchweek,
      homeTeamId: fix.homeTeamId,
      awayTeamId: fix.awayTeamId,
      homeScore: fix.homeScore,
      awayScore: fix.awayScore,
      isCompleted: fix.isCompleted,
      date: fix.date || '',
    });
  }

  await batch.commit();
}
