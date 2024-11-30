/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const { OpenAI } = require("openai");
const dotenv = require("dotenv");
const fs = require("fs").promises;
const path = require("path");

// Initialize dotenv
dotenv.config();

// Initialize Prisma
const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Constants
const BATCH_SIZE = 10; // Number of reviews to process in parallel
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches
const LOG_FILE = path.join(process.cwd(), "logs", "translation-progress.log");
const ERROR_LOG = path.join(process.cwd(), "logs", "translation-errors.log");
const PROGRESS_FILE = path.join(
  process.cwd(),
  "logs",
  "translation-progress.json"
);

async function ensureLogDirectory() {
  const logDir = path.join(process.cwd(), "logs");
  try {
    await fs.access(logDir);
  } catch {
    await fs.mkdir(logDir);
  }
}

async function loadProgress() {
  try {
    const data = await fs.readFile(PROGRESS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { lastProcessedId: null, totalProcessed: 0 };
  }
}

async function saveProgress(progress) {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function logError(locationId, error) {
  const timestamp = new Date().toISOString();
  const errorMessage = `${timestamp} - Error processing location ${locationId}: ${error.message}\n`;
  await fs.appendFile(ERROR_LOG, errorMessage);
}

async function logProgress(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  await fs.appendFile(LOG_FILE, logMessage);
}

async function translateText(text) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator. Translate the following English text to Spanish. Maintain the same tone and style. Only respond with the translation, no explanations or additional text.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content?.trim() || "";
  } catch (error) {
    throw new Error(`Translation API error: ${error.message}`);
  }
}

async function processBatch(locations) {
  return await Promise.all(
    locations.map(async (location) => {
      try {
        if (!location.summarizedReview) {
          await logProgress(
            `Skipping location ${location.id} - No summarized review`
          );
          return;
        }

        if (location.summarizedReviewEs) {
          await logProgress(
            `Skipping location ${location.id} - Already has Spanish translation`
          );
          return;
        }

        const translatedText = await translateText(location.summarizedReview);

        await prisma.touristicLocation.update({
          where: { id: location.id },
          data: { summarizedReviewEs: translatedText },
        });

        await logProgress(`Successfully translated location ${location.id}`);
      } catch (error) {
        await logError(location.id, error);
      }
    })
  );
}

async function main() {
  await ensureLogDirectory();
  const progress = await loadProgress();

  await logProgress(
    `Starting translation process. Continuing from ID: ${
      progress.lastProcessedId || "start"
    }`
  );

  try {
    while (true) {
      const locations = await prisma.touristicLocation.findMany({
        where: {
          id: progress.lastProcessedId
            ? {
                gt: progress.lastProcessedId,
              }
            : undefined,
          summarizedReview: {
            not: null,
          },
        },
        orderBy: {
          id: "asc",
        },
        take: BATCH_SIZE,
        select: {
          id: true,
          summarizedReview: true,
          summarizedReviewEs: true,
        },
      });

      if (locations.length === 0) {
        await logProgress("No more locations to process");
        break;
      }

      await processBatch(locations);

      progress.lastProcessedId = locations[locations.length - 1].id;
      progress.totalProcessed += locations.length;
      await saveProgress(progress);

      await logProgress(
        `Completed batch. Total processed: ${progress.totalProcessed}`
      );

      // Add delay between batches to avoid rate limiting
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_BATCHES)
      );
    }

    await logProgress("Translation process completed successfully");
  } catch (error) {
    await logError("GLOBAL", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error("Script failed:", error);
  await logError("SCRIPT_FAILURE", error);
  process.exit(1);
});
