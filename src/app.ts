import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { sanitizePayload } from './middlewares/sanitize';
import morgan from 'morgan';
import { randomUUID } from 'crypto';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import routes from './routes';
import { requestLogger } from './middlewares/requestLogger';
import i18nextMiddleware from "i18next-http-middleware";
import i18next from 'i18next';
import compression from 'compression';


const app: Application = express();

app.set('trust proxy', true);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizePayload);
app.use(i18nextMiddleware.handle(i18next));
// hpp is incompatible with Express 5 (mutates req.query which is now read-only)

// Correlation ID for tracing
app.use((req, _res, next) => {
  (req as any).correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
  next();
});

app.use(morgan('combined'));
app.use(requestLogger);

// Debug route
app.get('/api1', (req, res) => {
  console.log('hello');
  res.send('Hello from /api1');
});

// rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

app.use('/api', limiter);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

