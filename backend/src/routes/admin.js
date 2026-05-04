import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { requireAdmin } from '../middleware/auth.js';
import { httpError } from '../utils/httpError.js';

export const adminRouter = Router();

adminRouter.post('/login', (req, res, next) => {
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return next(httpError(401, '管理员账号或密码错误'));
  }

  const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  return res.json({ data: { token } });
});

adminRouter.get('/orders', requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, order_no, diy_snapshot, address_snapshot, total_price, status, tracking_no, created_at, updated_at
      FROM orders
      ORDER BY created_at DESC
    `);

    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/components', requireAdmin, async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, type, img_url, price, stock, created_at, updated_at
      FROM components
      ORDER BY type ASC, id ASC
    `);

    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/orders/:id/ship', requireAdmin, async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const trackingNo = String(req.body.tracking_no || req.body.trackingNo || '').trim();

    if (!orderId) {
      throw httpError(400, '订单 ID 不合法');
    }

    if (!trackingNo) {
      throw httpError(400, '请填写快递单号');
    }

    const [result] = await pool.query(
      'UPDATE orders SET status = 2, tracking_no = ? WHERE id = ? AND status = 1',
      [trackingNo, orderId]
    );

    if (result.affectedRows === 0) {
      throw httpError(400, '仅待发货订单可发货');
    }

    res.json({ data: { id: orderId, status: 2, trackingNo } });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/components/:id/stock', requireAdmin, async (req, res, next) => {
  try {
    const componentId = Number(req.params.id);
    const stock = Number(req.body.stock);

    if (!componentId || !Number.isInteger(stock) || stock < 0) {
      throw httpError(400, '库存参数不合法');
    }

    const [result] = await pool.query(
      'UPDATE components SET stock = ? WHERE id = ?',
      [stock, componentId]
    );

    if (result.affectedRows === 0) {
      throw httpError(404, '组件不存在');
    }

    res.json({ data: { id: componentId, stock } });
  } catch (error) {
    next(error);
  }
});
