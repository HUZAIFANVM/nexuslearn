import client from './client';

export const listHRs = (statusFilter) =>
  client.get('/admin/hrs', { params: statusFilter ? { status_filter: statusFilter } : {} });

export const listPendingHRs = () => client.get('/admin/hrs/pending');

export const approveHR = (userId) => client.post(`/admin/hrs/${userId}/approve`);

export const rejectHR = (userId, reason) =>
  client.post(`/admin/hrs/${userId}/reject`, { reason: reason || null });
