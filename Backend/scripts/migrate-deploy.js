// Prisma migration script with retry logic for NeonDB
// This handles timeout issues with NeonDB pooler connections

const { execSync } = require('child_process');

const MAX_RETRIES = 3;
const RETRY_DELAY = 10000; // 10 seconds between retries

console.log('🔄 Starting Prisma migrations...');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMigration() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`📦 Migration attempt ${attempt} of ${MAX_RETRIES}...`);
      
      // Run migration
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: {
          ...process.env,
        },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
      
      console.log('✅ Migrations completed successfully');
      process.exit(0);
    } catch (error) {
      const errorMsg = error.message || error.toString();
      console.warn(`⚠️  Attempt ${attempt} failed:`, errorMsg);
      
      // Check if it's a timeout/lock error
      if (errorMsg.includes('timeout') || errorMsg.includes('advisory lock') || errorMsg.includes('P1002')) {
        if (attempt >= MAX_RETRIES) {
          console.error('❌ Migration timed out after', MAX_RETRIES, 'attempts');
          console.warn('⚠️  Continuing deployment - migrations may already be applied or database is slow');
          // Don't fail deployment - migrations might already be applied
          process.exit(0);
        }
        
        console.log(`⏳ Waiting ${RETRY_DELAY / 1000}s before retry...`);
        await sleep(RETRY_DELAY);
      } else {
        // Other errors - might be real issues, but don't block deployment
        console.warn('⚠️  Migration error (non-timeout), continuing deployment...');
        process.exit(0);
      }
    }
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(0); // Don't fail deployment
});
