import { ok } from '../middleware/envelope.js';
import { deleteUserAccount, formatUser, updateUserProfile } from '../services/users.service.js';

export async function getMe(req, res) {
  return ok(res, { user: formatUser(req.user) });
}

export async function patchMe(req, res) {
  const user = await updateUserProfile(req.user._id, req.body);
  return ok(res, { user });
}

export function createDeleteMe(deleteAuthUser) {
  return async function deleteMe(req, res) {
    const deletion = await deleteUserAccount(req.user._id, req.user.supabaseId, deleteAuthUser);
    return ok(res, deletion);
  };
}
