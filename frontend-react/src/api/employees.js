import client from './client';

export const getEmployees = (params = {}) =>
  client.get('/employees', { params });

export const getEmployeeStats = () =>
  client.get('/employees/stats');

export const getEmployee = (id) =>
  client.get(`/employees/${id}`);

export const updateEmployee = (id, data) =>
  client.put(`/employees/${id}`, data);

export const deactivateEmployee = (id) =>
  client.put(`/employees/${id}/deactivate`);

export const activateEmployee = (id) =>
  client.put(`/employees/${id}/activate`);

export const resetPassword = (id) =>
  client.post(`/employees/${id}/reset-password`);

export const bulkAction = (employeeIds, action) =>
  client.post('/employees/bulk-action', { employee_ids: employeeIds, action });
