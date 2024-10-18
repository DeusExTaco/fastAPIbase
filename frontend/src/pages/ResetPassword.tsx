import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async (token: string) => {
      try {
        const response = await fetch(`http://localhost:8000/verify-reset-token?token=${encodeURIComponent(token)}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (response.ok) {
          setIsTokenValid(true);
          setUserEmail(data.email);
          setMessage(''); // Clear any previous error messages
        } else {
          setMessage(data.detail || 'Invalid or expired token.');
          setIsTokenValid(false);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        setMessage('An error occurred. Please try again.');
        setIsTokenValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    (async () => {
      const searchParams = new URLSearchParams(location.search);
      const tokenFromUrl = searchParams.get('token');
      if (tokenFromUrl) {
        setToken(tokenFromUrl);
        await verifyToken(tokenFromUrl);
      } else {
        setMessage('Invalid or missing reset token.');
        setIsLoading(false);
      }
    })();
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    const passwordValidation = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{16,}$/;
    if (!passwordValidation.test(newPassword)) {
      setMessage('Password must be at least 16 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successful. You can now login with your new password.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setMessage(data.detail || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return <div>Verifying reset token...</div>;
  }

  if (!isTokenValid) {
    return <div>{message}</div>;
  }

  return (
    <div>
      <h2>Reset Password</h2>
      <p>Resetting password for: {userEmail}</p>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}

export default ResetPassword;
