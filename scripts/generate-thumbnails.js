/* eslint-disable @typescript-eslint/no-require-imports */
// scripts/generate-thumbnails.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const sharp = require('sharp');
const fs = require('fs/promises');
const os = require('os');

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

if (!SUPABASE_URL || !SUPABASE_ADMIN_KEY) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY);

const BATCH_SIZE = 10; // Process 10 images at a time
const SOURCE_BUCKET = 'location-images';
const THUMBNAIL_BUCKET = 'location-images-thumbnails';
const THUMBNAIL_SIZE = 120;
const TEMP_DIR = path.join(os.tmpdir(), 'thumbnail-processing');

async function blobToBuffer(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function downloadImage(locationId) {
  const { data, error } = await supabase.storage
    .from(SOURCE_BUCKET)
    .download(`${locationId}.jpg`);

  if (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }

  // Convert Blob to Buffer
  return await blobToBuffer(data);
}

async function generateThumbnail(imageBuffer) {
  return await sharp(imageBuffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
      fit: 'cover',
      position: 'centre'
    })
    .jpeg({
      quality: 80,
      progressive: true
    })
    .toBuffer();
}

async function uploadThumbnail(thumbnailBuffer, locationId) {
  const fileName = `${locationId}.jpg`;
  
  const { data, error } = await supabase.storage
    .from(THUMBNAIL_BUCKET)
    .upload(fileName, thumbnailBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload thumbnail: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(THUMBNAIL_BUCKET)
    .getPublicUrl(fileName);

  return publicUrl;
}

async function processLocation(location) {
  try {
    console.log(`Processing thumbnail for location ${location.id}...`);
    
    // Download original image and convert to buffer
    const imageBuffer = await downloadImage(location.id);
    
    // Generate thumbnail
    const thumbnailBuffer = await generateThumbnail(imageBuffer);
    
    // Upload thumbnail and get public URL
    const thumbnailUrl = await uploadThumbnail(thumbnailBuffer, location.id);
    
    // Update database record
    await prismaClient.touristicLocation.update({
      where: { id: location.id },
      data: { thumbnailImage: thumbnailUrl },
    });

    console.log(`Successfully processed thumbnail for location ${location.id}`);
    return { success: true, id: location.id };
  } catch (error) {
    console.error(`Failed to process thumbnail for location ${location.id}:`, error);
    return { success: false, id: location.id, error: error.message };
  }
}

async function processBatch(locations) {
  const results = await Promise.all(
    locations.map(location => processLocation(location))
  );
  
  return results;
}

async function generateThumbnails() {
  try {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    // Create temp directory
    await fs.mkdir(TEMP_DIR, { recursive: true });
    
    const logFile = path.join(logsDir, `thumbnail-generation-${Date.now()}.log`);
    const errorLogFile = path.join(logsDir, `thumbnail-generation-errors-${Date.now()}.log`);

    let cursor;
    let totalProcessed = 0;
    let successCount = 0;
    let failureCount = 0;

    console.log('Starting thumbnail generation...');

    while (true) {
      // Get batch of locations that have images but no thumbnails
      const locations = await prismaClient.touristicLocation.findMany({
        where: {
          image: { not: null },
          thumbnailImage: null,
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
            `SUCCESS: Location ${result.id} thumbnail generated successfully\n`
          );
        } else {
          failureCount++;
          await fs.appendFile(errorLogFile, 
            `ERROR: Location ${result.id} failed: ${result.error}\n`
          );
        }
      }

      cursor = locations[locations.length - 1].id;

      console.log(`Processed ${totalProcessed} thumbnails. Success: ${successCount}, Failures: ${failureCount}`);
      
      // Add a small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\nThumbnail generation completed!');
    console.log(`Total processed: ${totalProcessed}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Logs saved to: ${logsDir}`);

  } catch (error) {
    console.error('Thumbnail generation failed:', error);
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(TEMP_DIR, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to clean up temp directory:', error);
    }
    await prismaClient.$disconnect();
  }
}

// Run the thumbnail generation
generateThumbnails().catch(console.error);