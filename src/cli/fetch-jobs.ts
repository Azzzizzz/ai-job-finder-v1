import { connectDB, disconnectDB } from '../db/connection';
import { Aggregator } from '../pipeline/aggregator';

const run = async () => {
  await connectDB();
  console.log('--- FETCHING JOBS ---');
  const aggregator = new Aggregator();
  const result = await aggregator.run();
  console.log('Result:', result);
  await disconnectDB();
  process.exit(0);
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
