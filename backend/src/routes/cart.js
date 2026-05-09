import { Router } from 'express';
import { pool } from '../config/db.js';
import { getSnapshotFromBody, prepareDiySnapshot } from '../utils/diySnapshot.js';
import { httpError } from '../utils/httpError.js';

export const cartRouter = Router();

cartRouter.get('/items', async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, diy_snapshot, total_price, created_at, updated_at
      FROM cart_items
      ORDER BY updated_at DESC
    `);

    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

cartRouter.post('/items', async (req, res, next) => {
  try {
    const diySnapshot = getSnapshotFromBody(req.body);
    const { serverSnapshot, totalPrice } = await prepareDiySnapshot(pool, diySnapshot);

    const [result] = await pool.query(
      `
        INSERT INTO cart_items (diy_snapshot, total_price)
        VALUES (?, ?)
      `,
      [JSON.stringify(serverSnapshot), totalPrice]
    );

    res.status(201).json({
      data: {
        id: result.insertId,
        diySnapshot: serverSnapshot,
        totalPrice
      }
    });
  } catch (error) {
    next(error);
  }
});

cartRouter.delete('/items/:id', async (req, res, next) => {
  try {
    const cartItemId = Number(req.params.id);

    if (!cartItemId) {
      throw httpError(400, '购物车项 ID 不合法');
    }

    const [result] = await pool.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);

    if (result.affectedRows === 0) {
      throw httpError(404, '购物车项不存在');
    }

    res.json({ data: { id: cartItemId } });
  } catch (error) {
    next(error);
  }
});
