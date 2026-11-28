/**
 * HTTP controller for `/v1/me` profile reads, updates, and account deletion.
 */
import { ok } from '../middleware/envelope.js';
import { deleteUserAccount, formatUser, updateUserProfile } from '../services/users.service.js';

/**
 * Handles GET `/v1/me` returning the authenticated user's profile.
 *
 * @param {object} req - Express request with populated `req.user`.
 * @param {object} res - Express response.
 * @returns {object} JSON envelope containing `user`.
 */
export function getMe(req, res) {
  return ok(res, { user: formatUser(req.user) });
}

/**
 * Handles PATCH `/v1/me` updating preferences, localization, and quiet hours.
 *
 * @param {object} req - Express request with `req.user` and validated `req.body`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing updated `user`.
 */
export async function patchMe(req, res) {
  const user = await updateUserProfile(req.user._id, req.body);
  return ok(res, { user });
}

/**
 * Builds the DELETE `/v1/me` handler using an optional Supabase admin deletion callback.
 *
 * @param {Function} [deleteAuthUser] - Optional Supabase user-deletion override.
 * @returns {Function} Express request handler.
 */
export function createDeleteMe(deleteAuthUser) {
  return async function deleteMe(req, res) {
    const deletion = await deleteUserAccount(req.user._id, req.user.supabaseId, deleteAuthUser);
    return ok(res, deletion);
  };
}
