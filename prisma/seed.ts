import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import "dotenv/config"

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in .env file")
}

const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const currentPlayers = [
  { name: "LeBron James", position: "SF", team: "LAL", ppg: 25.7, rpg: 7.3, apg: 8.3, bpg: 0.5, rank: 2 },
  { name: "Kevin Durant", position: "SF", team: "PHX", ppg: 27.1, rpg: 6.7, apg: 5.0, bpg: 1.2, rank: 11 },
  { name: "Stephen Curry", position: "PG", team: "GSW", ppg: 26.4, rpg: 4.5, apg: 5.1, bpg: 0.4, rank: 12 },
  { name: "Nikola Jokic", position: "C", team: "DEN", ppg: 26.4, rpg: 12.4, apg: 9.0, bpg: 0.9, rank: 13 },
  { name: "Giannis Antetokounmpo", position: "PF", team: "MIL", ppg: 31.1, rpg: 11.6, apg: 6.1, bpg: 1.2, rank: 14 },
  { name: "Luka Doncic", position: "PG", team: "LAL", ppg: 28.1, rpg: 8.7, apg: 8.3, bpg: 0.5, rank: 25 },
  { name: "Joel Embiid", position: "C", team: "PHI", ppg: 34.7, rpg: 11.0, apg: 5.6, bpg: 1.7, rank: 30 },
  { name: "Shai Gilgeous-Alexander", position: "SG", team: "OKC", ppg: 30.1, rpg: 5.5, apg: 6.2, bpg: 0.9, rank: 41 },
  { name: "Jayson Tatum", position: "SF", team: "BOS", ppg: 26.9, rpg: 8.1, apg: 4.9, bpg: 0.6, rank: 42 },
  { name: "Anthony Edwards", position: "SG", team: "MIN", ppg: 25.9, rpg: 5.4, apg: 5.1, bpg: 0.5, rank: 43 },
  { name: "Anthony Davis", position: "PF", team: "LAL", ppg: 24.7, rpg: 12.6, apg: 3.5, bpg: 2.0, rank: 44 },
  { name: "Kawhi Leonard", position: "SF", team: "LAC", ppg: 23.7, rpg: 6.1, apg: 3.6, bpg: 0.6, rank: 45 },
  { name: "Donovan Mitchell", position: "SG", team: "CLE", ppg: 26.6, rpg: 5.1, apg: 6.1, bpg: 0.4, rank: 46 },
  { name: "Damian Lillard", position: "PG", team: "MIL", ppg: 24.3, rpg: 4.4, apg: 7.0, bpg: 0.3, rank: 47 },
  { name: "Jimmy Butler", position: "SF", team: "MIA", ppg: 20.8, rpg: 5.3, apg: 5.0, bpg: 0.5, rank: 48 },
  { name: "Kyrie Irving", position: "PG", team: "DAL", ppg: 25.6, rpg: 5.0, apg: 5.2, bpg: 0.5, rank: 49 },
  { name: "James Harden", position: "PG", team: "LAC", ppg: 16.6, rpg: 5.1, apg: 8.5, bpg: 0.8, rank: 50 },
  { name: "Devin Booker", position: "SG", team: "PHX", ppg: 27.1, rpg: 4.5, apg: 6.9, bpg: 0.5, rank: 51 },
  { name: "Trae Young", position: "PG", team: "ATL", ppg: 25.7, rpg: 2.8, apg: 10.8, bpg: 0.2, rank: 52 },
  { name: "Ja Morant", position: "PG", team: "MEM", ppg: 25.1, rpg: 5.6, apg: 8.1, bpg: 0.3, rank: 53 },
  { name: "Jaylen Brown", position: "SG", team: "BOS", ppg: 23.0, rpg: 5.5, apg: 3.6, bpg: 0.5, rank: 54 },
  { name: "Paul George", position: "SF", team: "PHI", ppg: 22.6, rpg: 5.2, apg: 3.5, bpg: 0.5, rank: 55 },
  { name: "Karl-Anthony Towns", position: "C", team: "NYK", ppg: 24.9, rpg: 10.8, apg: 3.2, bpg: 1.3, rank: 56 },
  { name: "Victor Wembanyama", position: "C", team: "SAS", ppg: 21.4, rpg: 10.6, apg: 3.9, bpg: 3.6, rank: 57 },
  { name: "Jalen Brunson", position: "PG", team: "NYK", ppg: 28.7, rpg: 3.6, apg: 6.7, bpg: 0.2, rank: 58 },
  { name: "Bam Adebayo", position: "C", team: "MIA", ppg: 19.3, rpg: 10.4, apg: 3.9, bpg: 1.1, rank: 59 },
  { name: "Tyrese Haliburton", position: "PG", team: "IND", ppg: 20.1, rpg: 3.9, apg: 10.9, bpg: 0.7, rank: 60 },
  { name: "De'Aaron Fox", position: "PG", team: "SAC", ppg: 26.6, rpg: 4.6, apg: 6.0, bpg: 0.4, rank: 61 },
  { name: "Tyrese Maxey", position: "SG", team: "PHI", ppg: 25.9, rpg: 3.7, apg: 6.2, bpg: 0.5, rank: 62 },
  { name: "DeMar DeRozan", position: "SF", team: "SAC", ppg: 24.0, rpg: 4.3, apg: 5.3, bpg: 0.6, rank: 63 },
  { name: "Domantas Sabonis", position: "C", team: "SAC", ppg: 19.4, rpg: 13.7, apg: 8.2, bpg: 0.6, rank: 64 },
  { name: "Zion Williamson", position: "PF", team: "NOP", ppg: 22.9, rpg: 5.7, apg: 5.1, bpg: 0.6, rank: 65 },
  { name: "Paolo Banchero", position: "PF", team: "ORL", ppg: 22.6, rpg: 6.9, apg: 5.4, bpg: 0.7, rank: 66 },
  { name: "Lauri Markkanen", position: "PF", team: "UTA", ppg: 23.2, rpg: 8.2, apg: 2.0, bpg: 0.6, rank: 67 },
  { name: "Scottie Barnes", position: "SF", team: "TOR", ppg: 19.9, rpg: 8.2, apg: 6.1, bpg: 1.5, rank: 68 },
  { name: "Alperen Sengun", position: "C", team: "HOU", ppg: 21.1, rpg: 9.3, apg: 5.0, bpg: 1.6, rank: 69 },
  { name: "Chet Holmgren", position: "PF", team: "OKC", ppg: 16.5, rpg: 7.9, apg: 2.5, bpg: 2.3, rank: 70 },
  { name: "Mikal Bridges", position: "SF", team: "NYK", ppg: 19.6, rpg: 4.5, apg: 3.6, bpg: 1.1, rank: 71 },
  { name: "Jalen Williams", position: "SG", team: "OKC", ppg: 19.1, rpg: 4.0, apg: 4.5, bpg: 1.0, rank: 72 },
  { name: "Nikola Vucevic", position: "C", team: "CHI", ppg: 18.0, rpg: 10.5, apg: 3.3, bpg: 0.7, rank: 73 },
]

const historicalPlayers = [
  { name: "Michael Jordan", position: "SG", team: "CHI", ppg: 30.1, rpg: 6.2, apg: 5.3, bpg: 0.8, rank: 1 },
  { name: "Kareem Abdul-Jabbar", position: "C", team: "LAL", ppg: 24.6, rpg: 11.2, apg: 3.6, bpg: 2.6, rank: 3 },
  { name: "Magic Johnson", position: "PG", team: "LAL", ppg: 19.5, rpg: 7.2, apg: 11.2, bpg: 0.4, rank: 4 },
  { name: "Larry Bird", position: "SF", team: "BOS", ppg: 24.3, rpg: 10.0, apg: 6.3, bpg: 0.8, rank: 5 },
  { name: "Wilt Chamberlain", position: "C", team: "PHI", ppg: 30.1, rpg: 22.9, apg: 4.4, bpg: 2.0, rank: 6 },
  { name: "Bill Russell", position: "C", team: "BOS", ppg: 15.1, rpg: 22.5, apg: 4.3, bpg: 3.5, rank: 7 },
  { name: "Tim Duncan", position: "PF", team: "SAS", ppg: 19.0, rpg: 10.8, apg: 3.0, bpg: 2.2, rank: 8 },
  { name: "Kobe Bryant", position: "SG", team: "LAL", ppg: 25.0, rpg: 5.2, apg: 4.7, bpg: 0.5, rank: 9 },
  { name: "Shaquille O'Neal", position: "C", team: "LAL", ppg: 23.7, rpg: 10.9, apg: 2.5, bpg: 2.3, rank: 10 },
  { name: "Hakeem Olajuwon", position: "C", team: "HOU", ppg: 21.8, rpg: 11.1, apg: 2.5, bpg: 3.1, rank: 15 },
  { name: "Oscar Robertson", position: "PG", team: "CIN", ppg: 25.7, rpg: 7.5, apg: 9.5, bpg: 0.3, rank: 16 },
  { name: "Karl Malone", position: "PF", team: "UTA", ppg: 25.0, rpg: 10.1, apg: 3.6, bpg: 0.8, rank: 17 },
  { name: "Julius Erving", position: "SF", team: "PHI", ppg: 22.0, rpg: 6.7, apg: 3.9, bpg: 1.5, rank: 18 },
  { name: "Moses Malone", position: "C", team: "PHI", ppg: 20.6, rpg: 12.2, apg: 1.4, bpg: 1.3, rank: 19 },
  { name: "Charles Barkley", position: "PF", team: "PHX", ppg: 22.1, rpg: 11.7, apg: 3.9, bpg: 0.8, rank: 20 },
  { name: "Dirk Nowitzki", position: "PF", team: "DAL", ppg: 20.7, rpg: 7.5, apg: 2.4, bpg: 0.8, rank: 21 },
  { name: "David Robinson", position: "C", team: "SAS", ppg: 21.1, rpg: 10.6, apg: 2.5, bpg: 3.0, rank: 22 },
  { name: "Allen Iverson", position: "SG", team: "PHI", ppg: 26.7, rpg: 3.7, apg: 6.2, bpg: 0.2, rank: 23 },
  { name: "Dwyane Wade", position: "SG", team: "MIA", ppg: 22.0, rpg: 4.7, apg: 5.4, bpg: 0.8, rank: 24 },
  { name: "Kevin Garnett", position: "PF", team: "MIN", ppg: 17.8, rpg: 10.0, apg: 3.7, bpg: 1.4, rank: 26 },
  { name: "Scottie Pippen", position: "SF", team: "CHI", ppg: 16.1, rpg: 6.4, apg: 5.2, bpg: 0.8, rank: 27 },
  { name: "John Stockton", position: "PG", team: "UTA", ppg: 13.1, rpg: 2.7, apg: 10.5, bpg: 0.2, rank: 28 },
  { name: "Jerry West", position: "SG", team: "LAL", ppg: 27.0, rpg: 5.8, apg: 6.7, bpg: 0.7, rank: 29 },
  { name: "Elgin Baylor", position: "SF", team: "LAL", ppg: 27.4, rpg: 13.5, apg: 4.3, bpg: 0.9, rank: 31 },
  { name: "Patrick Ewing", position: "C", team: "NYK", ppg: 21.0, rpg: 9.8, apg: 1.9, bpg: 2.4, rank: 32 },
  { name: "Isiah Thomas", position: "PG", team: "DET", ppg: 19.2, rpg: 3.6, apg: 9.3, bpg: 0.3, rank: 33 },
  { name: "Bob Pettit", position: "PF", team: "ATL", ppg: 26.4, rpg: 16.2, apg: 3.0, bpg: 1.8, rank: 34 },
  { name: "George Gervin", position: "SG", team: "SAS", ppg: 25.1, rpg: 5.3, apg: 2.6, bpg: 0.9, rank: 35 },
  { name: "Rick Barry", position: "SF", team: "GSW", ppg: 23.2, rpg: 6.5, apg: 5.1, bpg: 0.9, rank: 36 },
  { name: "Chris Paul", position: "PG", team: "NOH", ppg: 18.5, rpg: 4.5, apg: 9.5, bpg: 0.1, rank: 37 },
  { name: "Russell Westbrook", position: "PG", team: "OKC", ppg: 23.2, rpg: 7.0, apg: 8.4, bpg: 0.3, rank: 38 },
  { name: "Pete Maravich", position: "SG", team: "ATL", ppg: 24.2, rpg: 4.2, apg: 5.4, bpg: 0.2, rank: 39 },
  { name: "Clyde Drexler", position: "SG", team: "POR", ppg: 20.4, rpg: 6.1, apg: 5.6, bpg: 0.7, rank: 40 },
  { name: "Tracy McGrady", position: "SG", team: "ORL", ppg: 19.6, rpg: 5.6, apg: 4.4, bpg: 0.8, rank: 74 },
  { name: "Bob Cousy", position: "PG", team: "BOS", ppg: 18.4, rpg: 5.2, apg: 7.5, bpg: 0.2, rank: 75 },
  { name: "Walt Frazier", position: "PG", team: "NYK", ppg: 18.9, rpg: 5.9, apg: 6.1, bpg: 0.3, rank: 76 },
  { name: "Ray Allen", position: "SG", team: "MIL", ppg: 18.9, rpg: 4.1, apg: 3.4, bpg: 0.3, rank: 77 },
  { name: "Reggie Miller", position: "SG", team: "IND", ppg: 18.2, rpg: 3.0, apg: 3.0, bpg: 0.3, rank: 78 },
  { name: "Gary Payton", position: "PG", team: "SEA", ppg: 16.3, rpg: 3.9, apg: 6.7, bpg: 0.2, rank: 79 },
  { name: "Dennis Rodman", position: "PF", team: "CHI", ppg: 7.3, rpg: 13.1, apg: 1.8, bpg: 0.6, rank: 80 },
]

async function main() {
  console.log("Seeding database...")

  // Clear existing data
  await prisma.currentPlayer.deleteMany()
  await prisma.historicalPlayer.deleteMany()

  // Seed current players
  for (const player of currentPlayers) {
    await prisma.currentPlayer.create({
      data: player,
    })
  }

  // Seed historical players
  for (const player of historicalPlayers) {
    await prisma.historicalPlayer.create({
      data: player,
    })
  }

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
