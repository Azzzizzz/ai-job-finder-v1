import { connectDB, disconnectDB } from '../db/connection';
import { RankingEngine } from '../matching/ranking.engine';
import { EmailService } from '../notifications/email.service';

const run = async () => {
  await connectDB();
  console.log('--- SENDING ALERTS ---');
  
  const rankingEngine = new RankingEngine();
  const topJobs = await rankingEngine.getTopJobs();
  
  if (topJobs.length === 0) {
    console.log('No top matching jobs found to send alerts for.');
  } else {
    console.log(`Sending alerts for ${topJobs.length} top matches...`);
    const emailService = new EmailService();
    await emailService.sendDailyDigest(topJobs);
    console.log('Alerts sent.');
  }
  
  await disconnectDB();
  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
