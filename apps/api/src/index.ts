import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import restaurantRouter from './routes/restaurants';
import reservationsRouter from './routes/reservations';
import discoverRouter from './routes/discover';

const app = express();
const PORT = Number(process.env.PORT) || 3002;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hogu API is running', status: 'healthy' });
});

// Routes
app.use('/auth', authRouter);
app.use('/restaurants', restaurantRouter);
app.use('/reservations', reservationsRouter);
app.use('/discover', discoverRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hogu API listening on http://0.0.0.0:${PORT}`);
});