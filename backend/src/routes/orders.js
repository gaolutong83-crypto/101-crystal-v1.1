import { Router } from 'express';
import { pool } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

export const ordersRouter = Router();

function getSnapshotFromBody(body) {
  return body.diy_snapshot || body.diySnapshot;
}

function normalizeDiySnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw httpError(400, 'DIY方案不能为空');
  }

  const rope = snapshot?.rope || null;
  const beads = Array.isArray(snapshot?.beads) ? snapshot.beads : [];
  const pendant = snapshot?.pendant || null;

  if (!rope || beads.length === 0) {
    throw httpError(400, '请选择绳结并至少添加一颗主珠');
  }

  const parts = [
    { key: 'rope', expectedType: 1, id: Number(rope.id) },
    ...beads.map((bead) => ({ key: 'beads', expectedType: 2, id: Number(bead.id) })),
    ...(pendant ? [{ key: 'pendant', expectedType: 3, id: Number(pendant.id) }] : [])
  ];

  if (parts.some((part) => !Number.isInteger(part.id) || part.id <= 0)) {
    throw httpError(400, 'DIY方案中存在无效组件');
  }

  return parts;
}

function buildCountMap(parts) {
  return parts.reduce((map, part) => {
    map.set(part.id, (map.get(part.id) || 0) + 1);
    return map;
  }, new Map());
}

function assertComponentTypes(parts, componentMap) {
  for (const part of parts) {
    const component = componentMap.get(part.id);

    if (!component) {
      throw httpError(400, '存在不可用的水晶组件');
    }

    if (component.type !== part.expectedType) {
      throw httpError(400, `${component.name} 组件类型不匹配`);
    }
  }
}

function buildServerSnapshot(parts, componentMap) {
  const snapshot = {
    rope: null,
    beads: [],
    pendant: null
  };

  for (const part of parts) {
    const component = componentMap.get(part.id);
    const item = {
      id: component.id,
      name: component.name,
      type: component.type,
      img_url: component.img_url,
      price: component.price
    };

    if (part.key === 'rope') {
      snapshot.rope = item;
    } else if (part.key === 'beads') {
      snapshot.beads.push(item);
    } else {
      snapshot.pendant = item;
    }
  }

  return snapshot;
}

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
  const parts = normalizeDiySnapshot(diySnapshot);
  const countMap = buildCountMap(parts);
  const uniqueIds = [...countMap.keys()];
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [components] = await connection.query(
      `
        SELECT id, name, type, img_url, price, stock
        FROM components
        WHERE id IN (?)
        FOR UPDATE
      `,
      [uniqueIds]
    );

    if (components.length !== uniqueIds.length) {
      throw httpError(400, '存在不可用的水晶组件');
    }

    const componentMap = new Map(components.map((component) => [component.id, component]));
    assertComponentTypes(parts, componentMap);

    let totalCents = 0;

    for (const component of components) {
      const count = countMap.get(component.id);

      if (component.stock < count) {
        throw httpError(409, `${component.name} 库存不足`);
      }

      totalCents += Math.round(Number(component.price) * 100) * count;

      await connection.query(
        'UPDATE components SET stock = stock - ? WHERE id = ?',
        [count, component.id]
      );
    }

    const serverSnapshot = buildServerSnapshot(parts, componentMap);
    const totalPrice = (totalCents / 100).toFixed(2);
    const orderNo = `C${Date.now()}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;

    const [result] = await connection.query(
      `
        INSERT INTO orders (order_no, diy_snapshot, address_snapshot, total_price, status)
        VALUES (?, ?, ?, ?, 0)
      `,
      [
        orderNo,
        JSON.stringify(serverSnapshot),
        JSON.stringify(addressSnapshot),
        totalPrice
      ]
    );

    await connection.commit();
    res.status(201).json({
      data: {
        id: result.insertId,
        orderNo,
        diySnapshot: serverSnapshot,
        totalPrice,
        status: 0
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
