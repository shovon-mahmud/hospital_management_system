export const ok = (res, data = null, message = 'OK') => res.status(200).json({ success: true, message, data });
export const created = (res, data = null, message = 'Created') => res.status(201).json({ success: true, message, data });
export const fail = (res, status = 400, message = 'Bad request', data = null) => res.status(status).json({ success: false, message, data });
