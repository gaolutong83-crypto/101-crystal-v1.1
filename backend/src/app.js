import cors from 'cors';
import express from 'express';
import { adminRouter } from './routes/admin.js';
import { componentsRouter } from './routes/components.js';
import { ordersRouter } from './routes/orders.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/components', componentsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

app.use((req, _res, next) => {
  const error = new Error(`接口不存在: ${req.method} ${req.path}`);
  error.status = 404;
  next(error);
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  res.status(status).json({
    message: status === 500 ? '服务器内部错误' : error.message
  });
});
