export interface Team {
  id: string;
  name: string;
  shortName: string; // e.g. "ARS", "RMA"
  color: string; // Tailwind hex or class e.g. "#ef4444"
  secondaryColor?: string;
  logoEmoji: string; // e.g. "⚽", "🦁", "🦅", "⚡"
  stadium?: string;
  attackRating: number; // 1-99
  defenseRating: number; // 1-99
}

export interface Fixture {
  id: string;
  matchweek: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  isCompleted: boolean;
  date?: string;
}

export interface TeamSplitStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface StandingRow extends TeamSplitStats {
  team: Team;
  rank: number;
  form: Array<'W' | 'D' | 'L'>; // last 5 matches
  homeStats: TeamSplitStats;
  awayStats: TeamSplitStats;
}

export interface LeagueSettings {
  leagueName: string;
  seasonName: string;
  doubleRoundRobin: boolean; // true = Home & Away, false = Single round robin
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  topPositionsCount: number; // e.g. Champions League spots (4)
  relegationPositionsCount: number; // e.g. Relegation spots (3)
}

export interface LeagueState {
  settings: LeagueSettings;
  teams: Team[];
  fixtures: Fixture[];
  isGenerated: boolean;
}
