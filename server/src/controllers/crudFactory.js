import createError from 'http-errors';
import { ok, created } from '../utils/response.js';

export const crudFactory = (Model, populate = []) => ({
  list: async (req, res, next) => {
    try {
      const { page = 1, limit = 20, q } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const filter = q ? { $text: { $search: q } } : {};
      let query = Model.find(filter).skip(skip).limit(Number(limit));
      populate.forEach((p) => (query = query.populate(p)));
      const data = await query;
      ok(res, data);
    } catch (e) { next(e); }
  },
  get: async (req, res, next) => {
    try {
      let query = Model.findById(req.params.id);
      populate.forEach((p) => (query = query.populate(p)));
      const doc = await query;
      if (!doc) throw createError(404, 'Not found');
      ok(res, doc);
    } catch (e) { next(e); }
  },
  create: async (req, res, next) => {
    try {
      const doc = await Model.create(req.body);
      created(res, doc);
    } catch (e) { next(e); }
  },
  update: async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!doc) throw createError(404, 'Not found');
      ok(res, doc, 'Updated');
    } catch (e) { next(e); }
  },
  remove: async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) throw createError(404, 'Not found');
      ok(res, doc, 'Deleted');
    } catch (e) { next(e); }
  }
});
