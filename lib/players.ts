export type Position = "PG" | "SG" | "SF" | "PF" | "C"

export type PlayerSet = "current" | "historical" | "all"

export interface Player {
  id: number
  name: string
  position: Position
  team: string
  ppg: number
  rpg: number
  apg: number
  bpg: number
  rank: number
  era: "current" | "historical"
}

export const CURRENT_PLAYERS: Player[] = [
  { id: 10, name: "LeBron James", position: "SF", team: "LAL", ppg: 25.7, rpg: 7.3, apg: 8.3, bpg: 0.5, rank: 2, era: "current" },
  { id: 8, name: "Kevin Durant", position: "SF", team: "PHX", ppg: 27.1, rpg: 6.7, apg: 5.0, bpg: 1.2, rank: 11, era: "current" },
  { id: 6, name: "Stephen Curry", position: "PG", team: "GSW", ppg: 26.4, rpg: 4.5, apg: 5.1, bpg: 0.4, rank: 12, era: "current" },
  { id: 1, name: "Nikola Jokic", position: "C", team: "DEN", ppg: 26.4, rpg: 12.4, apg: 9.0, bpg: 0.9, rank: 13, era: "current" },
  { id: 4, name: "Giannis Antetokounmpo", position: "PF", team: "MIL", ppg: 31.1, rpg: 11.6, apg: 6.1, bpg: 1.2, rank: 14, era: "current" },
  { id: 2, name: "Luka Doncic", position: "PG", team: "LAL", ppg: 28.1, rpg: 8.7, apg: 8.3, bpg: 0.5, rank: 25, era: "current" },
  { id: 9, name: "Joel Embiid", position: "C", team: "PHI", ppg: 34.7, rpg: 11.0, apg: 5.6, bpg: 1.7, rank: 30, era: "current" },
  { id: 3, name: "Shai Gilgeous-Alexander", position: "SG", team: "OKC", ppg: 30.1, rpg: 5.5, apg: 6.2, bpg: 0.9, rank: 41, era: "current" },
  { id: 5, name: "Jayson Tatum", position: "SF", team: "BOS", ppg: 26.9, rpg: 8.1, apg: 4.9, bpg: 0.6, rank: 42, era: "current" },
  { id: 7, name: "Anthony Edwards", position: "SG", team: "MIN", ppg: 25.9, rpg: 5.4, apg: 5.1, bpg: 0.5, rank: 43, era: "current" },
  { id: 11, name: "Anthony Davis", position: "PF", team: "LAL", ppg: 24.7, rpg: 12.6, apg: 3.5, bpg: 2.0, rank: 44, era: "current" },
  { id: 18, name: "Kawhi Leonard", position: "SF", team: "LAC", ppg: 23.7, rpg: 6.1, apg: 3.6, bpg: 0.6, rank: 45, era: "current" },
  { id: 12, name: "Donovan Mitchell", position: "SG", team: "CLE", ppg: 26.6, rpg: 5.1, apg: 6.1, bpg: 0.4, rank: 46, era: "current" },
  { id: 19, name: "Damian Lillard", position: "PG", team: "MIL", ppg: 24.3, rpg: 4.4, apg: 7.0, bpg: 0.3, rank: 47, era: "current" },
  { id: 15, name: "Jimmy Butler", position: "SF", team: "MIA", ppg: 20.8, rpg: 5.3, apg: 5.0, bpg: 0.5, rank: 48, era: "current" },
  { id: 30, name: "Kyrie Irving", position: "PG", team: "DAL", ppg: 25.6, rpg: 5.0, apg: 5.2, bpg: 0.5, rank: 49, era: "current" },
  { id: 37, name: "James Harden", position: "PG", team: "LAC", ppg: 16.6, rpg: 5.1, apg: 8.5, bpg: 0.8, rank: 50, era: "current" },
  { id: 14, name: "Devin Booker", position: "SG", team: "PHX", ppg: 27.1, rpg: 4.5, apg: 6.9, bpg: 0.5, rank: 51, era: "current" },
  { id: 16, name: "Trae Young", position: "PG", team: "ATL", ppg: 25.7, rpg: 2.8, apg: 10.8, bpg: 0.2, rank: 52, era: "current" },
  { id: 17, name: "Ja Morant", position: "PG", team: "MEM", ppg: 25.1, rpg: 5.6, apg: 8.1, bpg: 0.3, rank: 53, era: "current" },
  { id: 26, name: "Jaylen Brown", position: "SG", team: "BOS", ppg: 23.0, rpg: 5.5, apg: 3.6, bpg: 0.5, rank: 54, era: "current" },
  { id: 32, name: "Paul George", position: "SF", team: "PHI", ppg: 22.6, rpg: 5.2, apg: 3.5, bpg: 0.5, rank: 55, era: "current" },
  { id: 25, name: "Karl-Anthony Towns", position: "C", team: "NYK", ppg: 24.9, rpg: 10.8, apg: 3.2, bpg: 1.3, rank: 56, era: "current" },
  { id: 21, name: "Victor Wembanyama", position: "C", team: "SAS", ppg: 21.4, rpg: 10.6, apg: 3.9, bpg: 3.6, rank: 57, era: "current" },
  { id: 22, name: "Jalen Brunson", position: "PG", team: "NYK", ppg: 28.7, rpg: 3.6, apg: 6.7, bpg: 0.2, rank: 58, era: "current" },
  { id: 24, name: "Bam Adebayo", position: "C", team: "MIA", ppg: 19.3, rpg: 10.4, apg: 3.9, bpg: 1.1, rank: 59, era: "current" },
  { id: 13, name: "Tyrese Haliburton", position: "PG", team: "IND", ppg: 20.1, rpg: 3.9, apg: 10.9, bpg: 0.7, rank: 60, era: "current" },
  { id: 23, name: "De'Aaron Fox", position: "PG", team: "SAC", ppg: 26.6, rpg: 4.6, apg: 6.0, bpg: 0.4, rank: 61, era: "current" },
  { id: 34, name: "Tyrese Maxey", position: "SG", team: "PHI", ppg: 25.9, rpg: 3.7, apg: 6.2, bpg: 0.5, rank: 62, era: "current" },
  { id: 36, name: "DeMar DeRozan", position: "SF", team: "SAC", ppg: 24.0, rpg: 4.3, apg: 5.3, bpg: 0.6, rank: 63, era: "current" },
  { id: 28, name: "Domantas Sabonis", position: "C", team: "SAC", ppg: 19.4, rpg: 13.7, apg: 8.2, bpg: 0.6, rank: 64, era: "current" },
  { id: 31, name: "Zion Williamson", position: "PF", team: "NOP", ppg: 22.9, rpg: 5.7, apg: 5.1, bpg: 0.6, rank: 65, era: "current" },
  { id: 20, name: "Paolo Banchero", position: "PF", team: "ORL", ppg: 22.6, rpg: 6.9, apg: 5.4, bpg: 0.7, rank: 66, era: "current" },
  { id: 29, name: "Lauri Markkanen", position: "PF", team: "UTA", ppg: 23.2, rpg: 8.2, apg: 2.0, bpg: 0.6, rank: 67, era: "current" },
  { id: 33, name: "Scottie Barnes", position: "SF", team: "TOR", ppg: 19.9, rpg: 8.2, apg: 6.1, bpg: 1.5, rank: 68, era: "current" },
  { id: 38, name: "Alperen Sengun", position: "C", team: "HOU", ppg: 21.1, rpg: 9.3, apg: 5.0, bpg: 1.6, rank: 69, era: "current" },
  { id: 27, name: "Chet Holmgren", position: "PF", team: "OKC", ppg: 16.5, rpg: 7.9, apg: 2.5, bpg: 2.3, rank: 70, era: "current" },
  { id: 39, name: "Mikal Bridges", position: "SF", team: "NYK", ppg: 19.6, rpg: 4.5, apg: 3.6, bpg: 1.1, rank: 71, era: "current" },
  { id: 40, name: "Jalen Williams", position: "SG", team: "OKC", ppg: 19.1, rpg: 4.0, apg: 4.5, bpg: 1.0, rank: 72, era: "current" },
  { id: 35, name: "Nikola Vucevic", position: "C", team: "CHI", ppg: 18.0, rpg: 10.5, apg: 3.3, bpg: 0.7, rank: 73, era: "current" },
]

export const HISTORICAL_PLAYERS: Player[] = [
  { id: 101, name: "Michael Jordan", position: "SG", team: "CHI", ppg: 30.1, rpg: 6.2, apg: 5.3, bpg: 0.8, rank: 1, era: "historical" },
  { id: 102, name: "Kareem Abdul-Jabbar", position: "C", team: "LAL", ppg: 24.6, rpg: 11.2, apg: 3.6, bpg: 2.6, rank: 3, era: "historical" },
  { id: 103, name: "Magic Johnson", position: "PG", team: "LAL", ppg: 19.5, rpg: 7.2, apg: 11.2, bpg: 0.4, rank: 4, era: "historical" },
  { id: 104, name: "Larry Bird", position: "SF", team: "BOS", ppg: 24.3, rpg: 10.0, apg: 6.3, bpg: 0.8, rank: 5, era: "historical" },
  { id: 105, name: "Wilt Chamberlain", position: "C", team: "PHI", ppg: 30.1, rpg: 22.9, apg: 4.4, bpg: 2.0, rank: 6, era: "historical" },
  { id: 106, name: "Bill Russell", position: "C", team: "BOS", ppg: 15.1, rpg: 22.5, apg: 4.3, bpg: 3.5, rank: 7, era: "historical" },
  { id: 107, name: "Tim Duncan", position: "PF", team: "SAS", ppg: 19.0, rpg: 10.8, apg: 3.0, bpg: 2.2, rank: 8, era: "historical" },
  { id: 108, name: "Kobe Bryant", position: "SG", team: "LAL", ppg: 25.0, rpg: 5.2, apg: 4.7, bpg: 0.5, rank: 9, era: "historical" },
  { id: 109, name: "Shaquille O'Neal", position: "C", team: "LAL", ppg: 23.7, rpg: 10.9, apg: 2.5, bpg: 2.3, rank: 10, era: "historical" },
  { id: 110, name: "Hakeem Olajuwon", position: "C", team: "HOU", ppg: 21.8, rpg: 11.1, apg: 2.5, bpg: 3.1, rank: 15, era: "historical" },
  { id: 111, name: "Oscar Robertson", position: "PG", team: "CIN", ppg: 25.7, rpg: 7.5, apg: 9.5, bpg: 0.3, rank: 16, era: "historical" },
  { id: 112, name: "Karl Malone", position: "PF", team: "UTA", ppg: 25.0, rpg: 10.1, apg: 3.6, bpg: 0.8, rank: 17, era: "historical" },
  { id: 113, name: "Julius Erving", position: "SF", team: "PHI", ppg: 22.0, rpg: 6.7, apg: 3.9, bpg: 1.5, rank: 18, era: "historical" },
  { id: 114, name: "Moses Malone", position: "C", team: "PHI", ppg: 20.6, rpg: 12.2, apg: 1.4, bpg: 1.3, rank: 19, era: "historical" },
  { id: 115, name: "Charles Barkley", position: "PF", team: "PHX", ppg: 22.1, rpg: 11.7, apg: 3.9, bpg: 0.8, rank: 20, era: "historical" },
  { id: 121, name: "Dirk Nowitzki", position: "PF", team: "DAL", ppg: 20.7, rpg: 7.5, apg: 2.4, bpg: 0.8, rank: 21, era: "historical" },
  { id: 117, name: "David Robinson", position: "C", team: "SAS", ppg: 21.1, rpg: 10.6, apg: 2.5, bpg: 3.0, rank: 22, era: "historical" },
  { id: 122, name: "Allen Iverson", position: "SG", team: "PHI", ppg: 26.7, rpg: 3.7, apg: 6.2, bpg: 0.2, rank: 23, era: "historical" },
  { id: 123, name: "Dwyane Wade", position: "SG", team: "MIA", ppg: 22.0, rpg: 4.7, apg: 5.4, bpg: 0.8, rank: 24, era: "historical" },
  { id: 126, name: "Kevin Garnett", position: "PF", team: "MIN", ppg: 17.8, rpg: 10.0, apg: 3.7, bpg: 1.4, rank: 26, era: "historical" },
  { id: 116, name: "Scottie Pippen", position: "SF", team: "CHI", ppg: 16.1, rpg: 6.4, apg: 5.2, bpg: 0.8, rank: 27, era: "historical" },
  { id: 118, name: "John Stockton", position: "PG", team: "UTA", ppg: 13.1, rpg: 2.7, apg: 10.5, bpg: 0.2, rank: 28, era: "historical" },
  { id: 124, name: "Jerry West", position: "SG", team: "LAL", ppg: 27.0, rpg: 5.8, apg: 6.7, bpg: 0.7, rank: 29, era: "historical" },
  { id: 125, name: "Elgin Baylor", position: "SF", team: "LAL", ppg: 27.4, rpg: 13.5, apg: 4.3, bpg: 0.9, rank: 31, era: "historical" },
  { id: 120, name: "Patrick Ewing", position: "C", team: "NYK", ppg: 21.0, rpg: 9.8, apg: 1.9, bpg: 2.4, rank: 32, era: "historical" },
  { id: 119, name: "Isiah Thomas", position: "PG", team: "DET", ppg: 19.2, rpg: 3.6, apg: 9.3, bpg: 0.3, rank: 33, era: "historical" },
  { id: 134, name: "Bob Pettit", position: "PF", team: "ATL", ppg: 26.4, rpg: 16.2, apg: 3.0, bpg: 1.8, rank: 34, era: "historical" },
  { id: 132, name: "George Gervin", position: "SG", team: "SAS", ppg: 25.1, rpg: 5.3, apg: 2.6, bpg: 0.9, rank: 35, era: "historical" },
  { id: 135, name: "Rick Barry", position: "SF", team: "GSW", ppg: 23.2, rpg: 6.5, apg: 5.1, bpg: 0.9, rank: 36, era: "historical" },
  { id: 127, name: "Chris Paul", position: "PG", team: "NOH", ppg: 18.5, rpg: 4.5, apg: 9.5, bpg: 0.1, rank: 37, era: "historical" },
  { id: 128, name: "Russell Westbrook", position: "PG", team: "OKC", ppg: 23.2, rpg: 7.0, apg: 8.4, bpg: 0.3, rank: 38, era: "historical" },
  { id: 131, name: "Pete Maravich", position: "SG", team: "ATL", ppg: 24.2, rpg: 4.2, apg: 5.4, bpg: 0.2, rank: 39, era: "historical" },
  { id: 136, name: "Clyde Drexler", position: "SG", team: "POR", ppg: 20.4, rpg: 6.1, apg: 5.6, bpg: 0.7, rank: 40, era: "historical" },
  { id: 133, name: "Tracy McGrady", position: "SG", team: "ORL", ppg: 19.6, rpg: 5.6, apg: 4.4, bpg: 0.8, rank: 74, era: "historical" },
  { id: 129, name: "Bob Cousy", position: "PG", team: "BOS", ppg: 18.4, rpg: 5.2, apg: 7.5, bpg: 0.2, rank: 75, era: "historical" },
  { id: 130, name: "Walt Frazier", position: "PG", team: "NYK", ppg: 18.9, rpg: 5.9, apg: 6.1, bpg: 0.3, rank: 76, era: "historical" },
  { id: 139, name: "Ray Allen", position: "SG", team: "MIL", ppg: 18.9, rpg: 4.1, apg: 3.4, bpg: 0.3, rank: 77, era: "historical" },
  { id: 140, name: "Reggie Miller", position: "SG", team: "IND", ppg: 18.2, rpg: 3.0, apg: 3.0, bpg: 0.3, rank: 78, era: "historical" },
  { id: 137, name: "Gary Payton", position: "PG", team: "SEA", ppg: 16.3, rpg: 3.9, apg: 6.7, bpg: 0.2, rank: 79, era: "historical" },
  { id: 138, name: "Dennis Rodman", position: "PF", team: "CHI", ppg: 7.3, rpg: 13.1, apg: 1.8, bpg: 0.6, rank: 80, era: "historical" },
]

export function getPlayerSet(set: PlayerSet): Player[] {
  switch (set) {
    case "current":
      return CURRENT_PLAYERS
    case "historical":
      return HISTORICAL_PLAYERS
    case "all":
      // Merge and sort by unified rank (1-80)
      return [...CURRENT_PLAYERS, ...HISTORICAL_PLAYERS].sort((a, b) => a.rank - b.rank)
  }
}

export const POSITION_COLORS: Record<Position, string> = {
  PG: "bg-sky-600 text-sky-50",
  SG: "bg-emerald-600 text-emerald-50",
  SF: "bg-amber-600 text-amber-50",
  PF: "bg-rose-600 text-rose-50",
  C: "bg-indigo-600 text-indigo-50",
}
