import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import "dotenv/config"
import * as fs from 'fs'
import * as path from 'path'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in .env file")
}

const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Load player data from JSON file
const playersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'players.json'), 'utf-8'))

async function main() {
  console.log("Seeding database...")

  // Clear existing data
  await prisma.currentPlayer.deleteMany()
  await prisma.historicalPlayer.deleteMany()

  console.log("Seeding current players...")
  // Seed current players
  for (const player of playersData.current_players) {
    await prisma.currentPlayer.create({
      data: player,
    })
  }

  console.log("Seeding historical players...")
  // Seed historical players
  for (const player of playersData.historical_players) {
    await prisma.historicalPlayer.create({
      data: player,
    })
  }

  console.log(`✅ Seeded ${playersData.current_players.length} current players`)
  console.log(`✅ Seeded ${playersData.historical_players.length} historical players`)
  console.log(`✅ Total players seeded: ${playersData.current_players.length + playersData.historical_players.length}`)

  console.log("Database seeding completed successfully!")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })