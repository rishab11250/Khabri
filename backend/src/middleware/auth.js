import { verifySupabaseJwt } from '../config/supabase.js';
import { User } from '../models/User.js';
import { AppError } from './envelope.js';

export function createAuthMiddleware(options = {}) {
  const verifyJwt = options.verifyJwt ?? verifySupabaseJwt;

  return async function requireAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Missing bearer token'));
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Missing bearer token'));
    }

    let payload;
    try {
      payload = await verifyJwt(token);
    } catch {
      return next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
    }

    const supabaseId = typeof payload?.sub === 'string' ? payload.sub : '';
    if (!supabaseId) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Token missing subject'));
    }

    const email = typeof payload?.email === 'string' ? payload.email : undefined;

    const user = await User.findOneAndUpdate(
      { supabaseId },
      {
        $setOnInsert: {
          supabaseId,
          ...(email ? { email } : {}),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    req.auth = { supabaseId, email };
    req.user = user;
    return next();
  };
}

export const requireAuth = createAuthMiddleware();
