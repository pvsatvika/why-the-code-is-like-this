import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { verifyConnection } from './services/graphService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: "ok", message: "Server running" });
});

// Mount consolidated API router under /api
app.use('/api', apiRouter);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await verifyConnection();
});
