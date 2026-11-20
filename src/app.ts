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
import { swaggerUiServe, swaggerUiSetup } from './config/swagger';
import * as i18nextMiddleware from 'i18next-http-middleware';
import i18next from './i18n.config';
import compression from 'compression';


const app: Application = express();

const trustedProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
if (Number.isSafeInteger(trustedProxyHops) && trustedProxyHops > 0) {
  app.set('trust proxy', trustedProxyHops);
}

app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
  .split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
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

// rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

app.use('/api', limiter);

// API documentation (Swagger)
app.use('/api-docs', swaggerUiServe, swaggerUiSetup);

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

