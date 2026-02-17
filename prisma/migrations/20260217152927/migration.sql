-- CreateTable
CREATE TABLE "current_players" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "ppg" DOUBLE PRECISION NOT NULL,
    "rpg" DOUBLE PRECISION NOT NULL,
    "apg" DOUBLE PRECISION NOT NULL,
    "bpg" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "current_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historical_players" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "ppg" DOUBLE PRECISION NOT NULL,
    "rpg" DOUBLE PRECISION NOT NULL,
    "apg" DOUBLE PRECISION NOT NULL,
    "bpg" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "historical_players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "current_players_rank_key" ON "current_players"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "historical_players_rank_key" ON "historical_players"("rank");
