const db = require('./src/config/db');

async function run() {
  try {
    console.log('Running quick migrations...');
    // 1. payment_screenshot
    await db.query('ALTER TABLE `enrollments` ADD COLUMN `payment_screenshot` VARCHAR(255) DEFAULT NULL').catch(err => console.log('payment_screenshot already exists or error:', err.message));
    
    // 2. books
    await db.query('ALTER TABLE `books` ADD COLUMN `views` INT NOT NULL DEFAULT 0').catch(err => console.log('books.views already exists or error:', err.message));
    await db.query('ALTER TABLE `books` ADD COLUMN `downloads` INT NOT NULL DEFAULT 0').catch(err => console.log('books.downloads already exists or error:', err.message));
    
    // 3. resources
    await db.query('ALTER TABLE `resources` ADD COLUMN `views` INT NOT NULL DEFAULT 0').catch(err => console.log('resources.views already exists or error:', err.message));
    await db.query('ALTER TABLE `resources` ADD COLUMN `downloads` INT NOT NULL DEFAULT 0').catch(err => console.log('resources.downloads already exists or error:', err.message));
    
    // 4. videos
    await db.query('ALTER TABLE `videos` ADD COLUMN `views` INT NOT NULL DEFAULT 0').catch(err => console.log('videos.views already exists or error:', err.message));
    
    // 5. students_profile.class
    await db.query('ALTER TABLE `students_profile` ADD COLUMN `class` VARCHAR(50) DEFAULT NULL').catch(err => console.log('students_profile.class already exists or error:', err.message));
    
    console.log('Database columns migration check done!');
    process.exit(0);
  } catch (err) {
    console.error('Migration execution failed:', err);
    process.exit(1);
  }
}

run();

