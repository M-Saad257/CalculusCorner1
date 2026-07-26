// Load environment variables from .env
require('dotenv').config();

const db = require('./src/config/db');
const https = require('https');
const fs = require('fs');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Helper to make HTTPS GET requests returning JSON
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse response JSON: ' + data));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Parse ISO 8601 Duration e.g. PT2H5M19S
function parseISO8601(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

// Format duration from seconds to YouTube style (H:MM:SS or M:SS)
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

async function run() {
  if (!YOUTUBE_API_KEY) {
    console.error('\nERROR: YOUTUBE_API_KEY is not defined in your .env file!');
    console.error('Please add the following line to your .env file in the backend directory:');
    console.error('YOUTUBE_API_KEY=your_google_youtube_api_key_here\n');
    process.exit(1);
  }

  try {
    console.log('Ensuring that the database schema is up to date...');
    
    // 1. Ensure table schema has duration column
    await db.query(`
      ALTER TABLE \`videos\` ADD COLUMN IF NOT EXISTS \`duration\` VARCHAR(50) DEFAULT NULL
    `).catch(() => {});
    try {
      await db.query('ALTER TABLE `videos` ADD COLUMN `duration` VARCHAR(50) DEFAULT NULL');
    } catch (e) { /* column already exists */ }

    // 2. Fetch all videos from database
    const [videos] = await db.query('SELECT id, video_id, title FROM videos');
    console.log(`Found ${videos.length} videos in database.`);

    let sqlUpdates = 'ALTER TABLE `videos` ADD COLUMN IF NOT EXISTS `duration` VARCHAR(50) DEFAULT NULL;\n\n';

    // Chunk videos into groups of 50 to minimize API requests
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < videos.length; i += chunkSize) {
      chunks.push(videos.slice(i, i + chunkSize));
    }

    console.log(`Processing in ${chunks.length} batches of up to 50 videos each...`);

    for (let c = 0; c < chunks.length; c++) {
      const chunk = chunks[c];
      const videoIds = chunk.map(v => v.video_id).join(',');
      
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
      console.log(`[Batch ${c + 1}/${chunks.length}] Fetching metadata from YouTube API...`);
      
      const response = await fetchJson(apiUrl);
      if (response.error) {
        throw new Error(`YouTube API Error: ${response.error.message}`);
      }

      if (!response.items || response.items.length === 0) {
        console.log(` -> No items returned for batch ${c + 1}.`);
        continue;
      }

      // Map response items by ID for quick lookup
      const durationMap = {};
      response.items.forEach(item => {
        const isoDuration = item.contentDetails?.duration;
        if (isoDuration) {
          const seconds = parseISO8601(isoDuration);
          durationMap[item.id] = formatDuration(seconds);
        }
      });

      // Update database and write queries
      for (const video of chunk) {
        const durationText = durationMap[video.video_id];
        if (durationText) {
          await db.query('UPDATE videos SET duration = ? WHERE id = ?', [durationText, video.id]);
          sqlUpdates += `UPDATE videos SET duration = '${durationText}' WHERE video_id = '${video.video_id}';\n`;
          console.log(` -> SUCCESS: "${video.title}" => ${durationText}`);
        } else {
          console.log(` -> WARNING: Could not find API duration for "${video.title}" (ID: ${video.video_id})`);
        }
      }
    }

    // Write all SQL updates to durations.sql
    fs.writeFileSync('durations.sql', sqlUpdates);
    console.log('\nAll video durations successfully updated in local database!');
    console.log('Generated "durations.sql" containing all update queries for VPS deployment.');
    process.exit(0);

  } catch (err) {
    console.error('\nMigration failed:', err.message);
    process.exit(1);
  }
}

run();
