// scripts/migrate-images.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const fs = require('fs/promises');

// Initialize dotenv
dotenv.config();

// Initialize Prisma
const prismaClient = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Validate environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ADMIN_KEY = process.env.SUPABAE_ADMIN;
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ADMIN_KEY || !GOOGLE_API_KEY) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY);

const BATCH_SIZE = 10; // Process 10 images at a time
const BUCKET_NAME = 'location-images';

async function fetchImageFromGoogle(imagePath) {
  const response = await fetch(
    `https://places.googleapis.com/v1/${imagePath}/media?max_height_px=500`,
    {
      headers: {
        'X-Goog-Api-Key': GOOGLE_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToSupabase(imageBuffer, locationId) {
  const fileName = `${locationId}.jpg`;
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicUrl;
}

async function processLocation(location) {
  try {
    console.log(`Processing location ${location.id}...`);
    
    const imageBuffer = await fetchImageFromGoogle(location.image);
    const newImageUrl = await uploadToSupabase(imageBuffer, location.id);
    
    await prismaClient.touristicLocation.update({
      where: { id: location.id },
      data: { image: newImageUrl },
    });

    console.log(`Successfully processed location ${location.id}`);
    return { success: true, id: location.id };
  } catch (error) {
    console.error(`Failed to process location ${location.id}:`, error);
    return { success: false, id: location.id, error };
  }
}

async function processBatch(locations) {
  const results = await Promise.all(
    locations.map(location => processLocation(location))
  );
  
  return results;
}

async function migrateImages() {
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    const logFile = path.join(logsDir, `image-migration-${Date.now()}.log`);
    const errorLogFile = path.join(logsDir, `image-migration-errors-${Date.now()}.log`);

    let cursor;
    let totalProcessed = 0;
    let successCount = 0;
    let failureCount = 0;

    console.log('Starting image migration...');

    while (true) {
      // Get batch of locations
      const locations = await prismaClient.touristicLocation.findMany({
        where: {
          image: { not: null },
          AND: {
            image: { not: { startsWith: 'https://' } }, // Skip already processed images
          },
        },
        select: {
          id: true,
          image: true,
        },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });

      if (locations.length === 0) break;

      const results = await processBatch(locations);
      
      // Update statistics and log results
      for (const result of results) {
        totalProcessed++;
        if (result.success) {
          successCount++;
          await fs.appendFile(logFile, 
            `SUCCESS: Location ${result.id} processed successfully\n`
          );
        } else {
          failureCount++;
          await fs.appendFile(errorLogFile, 
            `ERROR: Location ${result.id} failed: ${result.error}\n`
          );
        }
      }

      cursor = locations[locations.length - 1].id;

      console.log(`Processed ${totalProcessed} locations. Success: ${successCount}, Failures: ${failureCount}`);
      
      // Add a small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\nMigration completed!');
    console.log(`Total processed: ${totalProcessed}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Logs saved to: ${logsDir}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prismaClient.$disconnect();
  }
}

// Run the migration
migrateImages().catch(console.error);