import { Router } from 'express';
import { query } from '../config/db.js';
import { httpError } from '../utils/httpError.js';

export const componentsRouter = Router();

componentsRouter.get('/', async (req, res, next) => {
  try {
    const type = req.query.type ? Number(req.query.type) : null;
    const params = [];
    let sql = `
      SELECT id, name, type, img_url, price, stock
      FROM components
      WHERE stock > 0
    `;

    if (type) {
      if (![1, 2, 3].includes(type)) {
        throw httpError(400, '组件类型不合法');
      }
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY type ASC, id ASC';

    const rows = await query(sql, params);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});
