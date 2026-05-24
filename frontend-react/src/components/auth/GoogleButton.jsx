import { GoogleLogin } from '@react-oauth/google';
import { Box, Alert } from '@mui/material';
import { useState } from 'react';
import { googleAuth } from '../../api/auth';

export default function GoogleButton({ onSuccess, onPendingSignup, onError, mode = 'login' }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await googleAuth(credentialResponse.credential);

      if (res.data.status === 'logged_in') {
        onSuccess(res.data.access_token, res.data.user_info);
      } else if (res.data.status === 'pending_signup') {
        onPendingSignup({
          email: res.data.email,
          name: res.data.name,
          picture: res.data.picture,
          google_id: res.data.google_id,
        });
      }
    } catch (err) {
      console.error('Google auth error:', err);
      onError(err.response?.data?.detail || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => onError('Google sign-in was cancelled')}
        text={mode === 'signup' ? 'signup_with' : 'signin_with'}
        shape="rectangular"
        theme="outline"
        size="large"
        width="100%"
        useOneTap={false}
      />
    </Box>
  );
}
