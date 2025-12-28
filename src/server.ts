import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectToDatabase } from './utils/db';
import logger from './utils/logger';

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

async function start() {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

