
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/', (_req, res) => {
  res.redirect('http://localhost:5173');
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// Basic routes without database
app.get('/restaurants', (_req, res) => {
  res.json([
    { id: '1', name: 'Demo Restaurant 1', slug: 'demo-1' },
    { id: '2', name: 'Demo Restaurant 2', slug: 'demo-2' }
  ]);
});

app.post('/auth/login', (req, res) => {
  res.json({ token: 'demo-token', user: { id: '1', email: 'demo@example.com' } });
});

app.post('/auth/register', (req, res) => {
  res.json({ token: 'demo-token', user: { id: '1', email: 'demo@example.com' } });
});

app.listen(PORT, () => {
  console.log(`Hogu API listening on http://localhost:${PORT}`);
});
