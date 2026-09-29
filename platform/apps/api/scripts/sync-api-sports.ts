/**
 * Standalone CLI script to run API-Sports MMA ingestion.
 *
 * Usage:
 *   pnpm --filter @notifica-fight/api sync:api-sports
 *   pnpm --filter @notifica-fight/api sync:api-sports --season=2024 --project
 *   pnpm --filter @notifica-fight/api sync:api-sports --days=30
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaService } from "../src/infrastructure/database/prisma.service";
import { ApiSportsClient } from "../src/modules/ingestion/api-sports.client";
import { IngestionService } from "../src/modules/ingestion/ingestion.service";

async function main(): Promise<void> {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run the sync script");
  }

  const apiKey = process.env["API_SPORTS_KEY"];
  if (!apiKey) {
    throw new Error("API_SPORTS_KEY is required to run the sync script");
  }

  // Create minimal config mock for ApiSportsClient
  const mockConfig = {
    get: (key: string) => {
      if (key === "API_SPORTS_KEY") return apiKey;
      if (key === "DATABASE_URL") return databaseUrl;
      return "";
    },
  } as any;

  const prisma = new PrismaService(mockConfig);
  const apiSports = new ApiSportsClient(mockConfig);
  const service = new IngestionService(apiSports, prisma);

  const seasonArg = process.argv.find((a) => a.startsWith("--season="));
  const daysArg = process.argv.find((a) => a.startsWith("--days="));
  const projectArg = process.argv.includes("--project");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));

  try {
    if (seasonArg) {
      const season = parseInt(seasonArg.split("=")[1] ?? "2024", 10);
      const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "20", 10) : 20;

      console.log(`\n==============================================`);
      console.log(`Syncing API-Sports MMA season ${season}...`);
      console.log(`Project to upcoming: ${projectArg}`);
      console.log(`Limit events: ${limit}`);
      console.log(`==============================================\n`);

      const result = await service.syncSeason(season, {
        projectToUpcoming: projectArg,
        limitEvents: limit,
      });

      printResult(result);
    } else if (daysArg) {
      const days = parseInt(daysArg.split("=")[1] ?? "60", 10);

      console.log(`\n==============================================`);
      console.log(`Syncing API-Sports MMA upcoming fights (${days} days)...`);
      console.log(`==============================================\n`);

      const result = await service.syncUpcoming(days);
      printResult(result);
    } else {
      // Default: sync season 2024 with projection to upcoming so the user can test immediately in the app!
      console.log(`\n==============================================`);
      console.log(`Syncing API-Sports MMA season 2024 (projected to upcoming for testing)...`);
      console.log(`==============================================\n`);

      const result = await service.syncSeason(2024, {
        projectToUpcoming: true,
        limitEvents: 15,
      });

      printResult(result);
    }
  } finally {
    await prisma.onModuleDestroy();
  }
}

function printResult(result: {
  organizationsUpserted: number;
  eventsUpserted: number;
  fightsUpserted: number;
  errors: string[];
}): void {
  console.log("\n--- Sync Summary ---");
  console.log(`  Organizations upserted: ${result.organizationsUpserted}`);
  console.log(`  Events upserted:        ${result.eventsUpserted}`);
  console.log(`  Fights upserted:        ${result.fightsUpserted}`);

  if (result.errors.length > 0) {
    console.log(`  Errors (${result.errors.length}):`);
    for (const error of result.errors) {
      console.log(`    - ${error}`);
    }
  }
  console.log("--------------------\n");
}

main().catch((error: unknown) => {
  console.error("Sync failed:", error);
  process.exitCode = 1;
});
