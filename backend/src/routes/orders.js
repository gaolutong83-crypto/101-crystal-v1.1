import { Router } from 'express';
import { pool } from '../config/db.js';
import { getSnapshotFromBody, prepareDiySnapshot } from '../utils/diySnapshot.js';
import { httpError } from '../utils/httpError.js';

export const ordersRouter = Router();

ordersRouter.get('/', async (req, res, next) => {
  try {
    const status = req.query.status === undefined ? null : Number(req.query.status);

    if (status !== null && ![0, 1, 2].includes(status)) {
      throw httpError(400, '订单状态不合法');
    }

    const params = [];
    let sql = `
      SELECT id, order_no, diy_snapshot, address_snapshot, total_price, status, tracking_no, created_at, updated_at
      FROM orders
    `;

    if (status !== null) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

ordersRouter.patch('/:id/pay', async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);

    if (!orderId) {
      throw httpError(400, '订单 ID 不合法');
    }

    const [result] = await pool.query(
      'UPDATE orders SET status = 1 WHERE id = ? AND status = 0',
      [orderId]
    );

    if (result.affectedRows === 0) {
      throw httpError(400, '仅待付款订单可确认付款');
    }

    res.json({ data: { id: orderId, status: 1 } });
  } catch (error) {
    next(error);
  }
});

async function createOrder(req, res, next) {
  const diySnapshot = getSnapshotFromBody(req.body);
  const addressSnapshot = req.body.address_snapshot || req.body.addressSnapshot || null;
  const cartItemId = Number(req.body.cart_item_id || req.body.cartItemId || 0);
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const { countMap, components, serverSnapshot, totalPrice } = await prepareDiySnapshot(
      connection,
      diySnapshot,
      { forUpdate: true }
    );

    for (const component of components) {
      const count = countMap.get(component.id);

      await connection.query(
        'UPDATE components SET stock = stock - ? WHERE id = ?',
        [count, component.id]
      );
    }

    const orderNo = `C${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;

    const [result] = await connection.query(
      `
        INSERT INTO orders (order_no, diy_snapshot, address_snapshot, total_price, status)
        VALUES (?, ?, ?, ?, 1)
      `,
      [
        orderNo,
        JSON.stringify(serverSnapshot),
        JSON.stringify(addressSnapshot),
        totalPrice
      ]
    );

    if (cartItemId > 0) {
      await connection.query('DELETE FROM cart_items WHERE id = ?', [cartItemId]);
    }

    await connection.commit();
    res.status(201).json({
      data: {
        id: result.insertId,
        orderNo,
        diySnapshot: serverSnapshot,
        totalPrice,
        status: 1
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

ordersRouter.post('/create', createOrder);
