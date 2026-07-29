import { Team, Fixture, StandingRow, LeagueSettings, TeamSplitStats } from '../types';

/**
 * Generate round-robin fixtures using the Berger rotation algorithm.
 * If number of teams is odd, a dummy "BYE" team is used internally.
 */
export function generateFixtures(teams: Team[], doubleRoundRobin: boolean): Fixture[] {
  if (teams.length < 2) return [];

  const teamIds = teams.map((t) => t.id);
  const isOdd = teamIds.length % 2 !== 0;
  
  if (isOdd) {
    teamIds.push('BYE');
  }

  const numTeams = teamIds.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  const firstHalfFixtures: Fixture[] = [];

  // Berger tables rotation
  for (let round = 0; round < numRounds; round++) {
    const matchweek = round + 1;

    for (let match = 0; match < matchesPerRound; match++) {
      let home = (round + match) % (numTeams - 1);
      let away = (numTeams - 1 - match + round) % (numTeams - 1);

      if (match === 0) {
        away = numTeams - 1;
      }

      // Alternate home and away for the fixed team
      const homeId = round % 2 === 0 ? teamIds[home] : teamIds[away];
      const awayId = round % 2 === 0 ? teamIds[away] : teamIds[home];

      // Skip BYE matches
      if (homeId !== 'BYE' && awayId !== 'BYE') {
        const baseDate = new Date('2026-08-15');
        baseDate.setDate(baseDate.getDate() + (matchweek - 1) * 7);
        const dateStr = baseDate.toISOString().split('T')[0];

        firstHalfFixtures.push({
          id: `fw-${matchweek}-${homeId}-vs-${awayId}`,
          matchweek,
          homeTeamId: homeId,
          awayTeamId: awayId,
          homeScore: null,
          awayScore: null,
          isCompleted: false,
          date: dateStr,
        });
      }
    }
  }

  if (!doubleRoundRobin) {
    return firstHalfFixtures;
  }

  // Reverse fixtures for 2nd half of season
  const secondHalfFixtures: Fixture[] = firstHalfFixtures.map((fix) => {
    const mw = fix.matchweek + numRounds;
    const baseDate = new Date('2026-08-15');
    baseDate.setDate(baseDate.getDate() + (mw - 1) * 7);
    return {
      id: `fw-${mw}-${fix.awayTeamId}-vs-${fix.homeTeamId}`,
      matchweek: mw,
      homeTeamId: fix.awayTeamId,
      awayTeamId: fix.homeTeamId,
      homeScore: null,
      awayScore: null,
      isCompleted: false,
      date: baseDate.toISOString().split('T')[0],
    };
  });

  return [...firstHalfFixtures, ...secondHalfFixtures];
}

/**
 * Calculate standing stats for each team based on completed fixtures.
 */
export function calculateStandings(
  teams: Team[],
  fixtures: Fixture[],
  settings: LeagueSettings
): StandingRow[] {
  const statsMap = new Map<string, StandingRow>();

  // Initialize empty stats for every team
  teams.forEach((t) => {
    const emptySplit = (): TeamSplitStats => ({
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });

    statsMap.set(t.id, {
      team: t,
      rank: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
      homeStats: emptySplit(),
      awayStats: emptySplit(),
    });
  });

  // Sort completed fixtures by matchweek to accurately compute recent form
  const completedFixtures = fixtures
    .filter((f) => f.isCompleted && f.homeScore !== null && f.awayScore !== null)
    .sort((a, b) => a.matchweek - b.matchweek);

  // Track match results chronological order per team for form guide
  const matchHistoryMap = new Map<string, Array<'W' | 'D' | 'L'>>();
  teams.forEach((t) => matchHistoryMap.set(t.id, []));

  completedFixtures.forEach((f) => {
    const homeStats = statsMap.get(f.homeTeamId);
    const awayStats = statsMap.get(f.awayTeamId);

    if (!homeStats || !awayStats) return;

    const hs = f.homeScore!;
    const as = f.awayScore!;

    // Home team stats update
    homeStats.played += 1;
    homeStats.goalsFor += hs;
    homeStats.goalsAgainst += as;
    homeStats.goalDifference += hs - as;

    homeStats.homeStats.played += 1;
    homeStats.homeStats.goalsFor += hs;
    homeStats.homeStats.goalsAgainst += as;
    homeStats.homeStats.goalDifference += hs - as;

    // Away team stats update
    awayStats.played += 1;
    awayStats.goalsFor += as;
    awayStats.goalsAgainst += hs;
    awayStats.goalDifference += as - hs;

    awayStats.awayStats.played += 1;
    awayStats.awayStats.goalsFor += as;
    awayStats.awayStats.goalsAgainst += hs;
    awayStats.awayStats.goalDifference += as - hs;

    if (hs > as) {
      // Home Win
      homeStats.won += 1;
      homeStats.points += settings.pointsForWin;
      homeStats.homeStats.won += 1;
      homeStats.homeStats.points += settings.pointsForWin;

      awayStats.lost += 1;
      awayStats.points += settings.pointsForLoss;
      awayStats.awayStats.lost += 1;
      awayStats.awayStats.points += settings.pointsForLoss;

      matchHistoryMap.get(f.homeTeamId)?.push('W');
      matchHistoryMap.get(f.awayTeamId)?.push('L');
    } else if (hs < as) {
      // Away Win
      homeStats.lost += 1;
      homeStats.points += settings.pointsForLoss;
      homeStats.homeStats.lost += 1;
      homeStats.homeStats.points += settings.pointsForLoss;

      awayStats.won += 1;
      awayStats.points += settings.pointsForWin;
      awayStats.awayStats.won += 1;
      awayStats.awayStats.points += settings.pointsForWin;

      matchHistoryMap.get(f.homeTeamId)?.push('L');
      matchHistoryMap.get(f.awayTeamId)?.push('W');
    } else {
      // Draw
      homeStats.drawn += 1;
      homeStats.points += settings.pointsForDraw;
      homeStats.homeStats.drawn += 1;
      homeStats.homeStats.points += settings.pointsForDraw;

      awayStats.drawn += 1;
      awayStats.points += settings.pointsForDraw;
      awayStats.awayStats.drawn += 1;
      awayStats.awayStats.points += settings.pointsForDraw;

      matchHistoryMap.get(f.homeTeamId)?.push('D');
      matchHistoryMap.get(f.awayTeamId)?.push('D');
    }
  });

  // Attach last 5 matches form
  teams.forEach((t) => {
    const row = statsMap.get(t.id);
    if (row) {
      const history = matchHistoryMap.get(t.id) || [];
      row.form = history.slice(-5);
    }
  });

  // Convert to array and sort according to football rules:
  // Points DESC -> Goal Difference DESC -> Goals For DESC -> Wins DESC -> Alphabetical
  const standings = Array.from(statsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    return a.team.name.localeCompare(b.team.name);
  });

  // Assign 1-based ranks
  return standings.map((row, idx) => ({
    ...row,
    rank: idx + 1,
  }));
}

/**
 * Realistic Football score simulation given attack/defense ratings and home advantage.
 */
export function simulateMatch(homeTeam: Team, awayTeam: Team): { homeScore: number; awayScore: number } {
  // Base expected goals ~ 1.45 for home, 1.15 for away
  const homeAttack = homeTeam.attackRating || 75;
  const homeDef = homeTeam.defenseRating || 75;
  const awayAttack = awayTeam.attackRating || 75;
  const awayDef = awayTeam.defenseRating || 75;

  const homeExpGoals = Math.max(0.2, (homeAttack / awayDef) * 1.5 + 0.25); // home advantage
  const awayExpGoals = Math.max(0.1, (awayAttack / homeDef) * 1.2);

  const poissonRandom = (lambda: number) => {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L && k < 10);
    return k - 1;
  };

  const homeScore = poissonRandom(homeExpGoals);
  const awayScore = poissonRandom(awayExpGoals);

  return { homeScore, awayScore };
}
