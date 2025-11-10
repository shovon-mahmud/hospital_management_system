import createError from 'http-errors';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { ok } from '../utils/response.js';

export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    if (!roleId) throw createError(400, 'roleId is required');
    const role = await Role.findById(roleId);
    if (!role) throw createError(404, 'Role not found');
    const user = await User.findByIdAndUpdate(id, { role: role._id }, { new: true }).populate('role');
    if (!user) throw createError(404, 'User not found');
    ok(res, { id: user._id, role: user.role.name }, 'Role updated');
  } catch (e) { next(e); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, isEmailVerified } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (isEmailVerified !== undefined) update.isEmailVerified = isEmailVerified;
    const user = await User.findByIdAndUpdate(id, update, { new: true }).populate('role');
    if (!user) throw createError(404, 'User not found');
    ok(res, { id: user._id, name: user.name, email: user.email, role: user.role.name }, 'Profile updated');
  } catch (e) { next(e); }
};
