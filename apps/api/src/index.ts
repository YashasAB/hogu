import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import discoverRoutes from './routes/discover';
import reservationRoutes from './routes/reservations';
import restaurantRoutes from './routes/restaurants';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

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
app.use('/auth', authRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/reservations', reservationRoutes);
app.use('/discover', discoverRoutes);

// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../../web/dist');
  app.use(express.static(buildPath));

  // Catch all handler: send back React's index.html file for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hogu API listening on http://0.0.0.0:${PORT}`);
});