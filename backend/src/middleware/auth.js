import jwt from 'jsonwebtoken';
import { httpError } from '../utils/httpError.js';

export function requireAdmin(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return next(httpError(401, '缺少登录凭证'));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (_error) {
    return next(httpError(401, '登录凭证无效或已过期'));
  }
}
