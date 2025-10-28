import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { listsRouter } from './routes/lists.js';
import { WheelStoreError } from './store.js';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/lists', listsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  if (err instanceof WheelStoreError && err.code === 'DATA_CORRUPT') {
    res.status(500).json({ message: 'Stored wheel data is temporarily unavailable. Please try again later.' });
    return;
  }

  res.status(500).json({ message: 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`Wheel picker API listening on http://localhost:${PORT}`);
});
