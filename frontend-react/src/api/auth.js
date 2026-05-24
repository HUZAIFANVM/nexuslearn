import client from './client';

export const login = (email, password) =>
  client.post('/login', { email, password });

export const signup = (data) => {
  const formData = new FormData();
  formData.append('email', data.email);
  formData.append('password', data.password);
  formData.append('full_name', data.full_name);
  formData.append('role', data.role);
  if (data.department) {
    formData.append('department', data.department);
  }
  if (data.profile_picture) {
    formData.append('profile_picture', data.profile_picture);
  }
  return client.post('/signup', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getMe = () =>
  client.get('/me');

export const getDepartments = () =>
  client.get('/departments');

// Email verification
export const verifyEmail = (token) =>
  client.post('/verify-email', { token });

export const resendVerification = (email) =>
  client.post('/resend-verification', { email });

// Password reset
export const forgotPassword = (email) =>
  client.post('/forgot-password', { email });

export const resetPassword = (token, newPassword) =>
  client.post('/reset-password', { token, new_password: newPassword });

// Google OAuth
export const googleAuth = (idToken) =>
  client.post('/auth/google', { id_token: idToken });

export const googleCompleteSignup = (data) =>
  client.post('/auth/google/complete', data);

// Avatar
export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteAvatar = () =>
  client.delete('/me/avatar');

export const getAvatarUrl = (userId) => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${baseUrl}/avatar/${userId}`;
};
