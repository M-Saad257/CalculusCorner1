const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

// Helper to extract YouTube video ID
const getYoutubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const run = async () => {
  try {
    const jsonPath = path.join(__dirname, '..', 'accurate_categorized_only.json');
    if (!fs.existsSync(jsonPath)) {
      console.error(`JSON file not found at path: ${jsonPath}`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const videos = JSON.parse(fileContent);

    console.log(`Loaded ${videos.length} videos from JSON file.`);

    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const video of videos) {
      const videoId = getYoutubeVideoId(video.url);
      if (!videoId) {
        console.warn(`Could not extract videoId from URL: ${video.url} - Skipping.`);
        errorCount++;
        continue;
      }

      // Generate standard high-quality YouTube thumbnail
      const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      const category = video.category || 'Calculus';
      const subcategory = video.subcategory || null;

      try {
        // Use UPSERT query (INSERT ... ON DUPLICATE KEY UPDATE)
        const [result] = await db.query(
          `INSERT INTO videos (title, url, video_id, thumbnail, category, subcategory) 
           VALUES (?, ?, ?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE 
             title = VALUES(title), 
             url = VALUES(url), 
             thumbnail = VALUES(thumbnail), 
             category = VALUES(category), 
             subcategory = VALUES(subcategory)`,
          [video.title, video.url, videoId, thumbnail, category, subcategory]
        );

        if (result.affectedRows === 1) {
          insertedCount++;
        } else if (result.affectedRows === 2) {
          updatedCount++;
        } else {
          // No changes
          updatedCount++;
        }
      } catch (dbErr) {
        console.error(`Database error inserting video "${video.title}":`, dbErr.message);
        errorCount++;
      }
    }

    console.log('\n--- Seeding Process Finished ---');
    console.log(`Total loaded: ${videos.length}`);
    console.log(`Newly inserted: ${insertedCount}`);
    console.log(`Updated / Unchanged: ${updatedCount}`);
    console.log(`Errors/Skipped: ${errorCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Migration crashed:', err);
    process.exit(1);
  }
};

// Wait a second for database pool connection to establish
setTimeout(run, 1500);
