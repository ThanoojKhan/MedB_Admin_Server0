require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('morgan');
const cookieParser = require('cookie-parser');

const dbConnection = require('./config/connection');
const AppError = require('./util/appError');
const auth = require('./routes/authentication');
const dataManager = require('./routes/dataManager');
const errorHandler = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/authMiddleware');
const rateLimiter = require('./util/rateLimiter');
const env = require('./util/validateEnv');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Set trust proxy to handle proxy headers
app.set('trust proxy', parseInt(env.NUMBER_OF_PROXIES) || 1);

// Apply the rate limiting middleware to all requests
app.use(rateLimiter);

app.use(
  cors({
    origin: env.NODE_ENV === 'development' ? env.DEV_URL : env.PRODUCTION_URL.split(','),
    methods: ['GET', 'POST', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Fixing "413 Request Entity Too Large" errors
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false, parameterLimit: 50000 }));
app.use(cookieParser());
app.use(logger('dev'));

// Health check
app.get('/', (_req, res) => {
  res.status(200).json({ message: 'OK' });
  res.end();
});

// API endpoints
app.use('/api/admin/auth', auth);
app.use(authMiddleware);
app.use('/api/admin/dataManager', dataManager);

// Error Handler
app.use(() => {
  throw new AppError({ statusCode: 404, message: 'Route not found!' });
});
app.use(errorHandler);

dbConnection().then(() => {
  const port = env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
});
