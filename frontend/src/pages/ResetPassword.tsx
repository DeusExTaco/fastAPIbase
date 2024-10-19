import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('No reset token provided.');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error and message when the user submits
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      // Clear the password fields when there's an error
      setNewPassword('');
      setConfirmPassword('');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (response.ok) {
        setMessage('Password reset successful. You can now login with your new password.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to reset password. Please try again.');
        // Clear the password fields if there's an error from the server
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      // Clear the password fields if there's an error during fetch
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error above the form */}
      {message && <p style={{ color: 'green' }}>{message}</p>} {/* Display success message */}
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