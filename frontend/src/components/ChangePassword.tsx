import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface ChangePasswordProps {
  userId: number;
  onPasswordChanged: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ userId, onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const validatePassword = (password: string): boolean => {
    const passwordValidation = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{16,}$/;
    return passwordValidation.test(password);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError('Password must be at least 16 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    try {
      console.log('Sending request to change password with userId:', userId);
      const response = await fetch('http://localhost:8000/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onPasswordChanged();

        if (data.require_relogin) {
          setSuccess((prev) => prev + ' You will be logged out.');
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 2000);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to change password');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Change Password</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <div>
        <label htmlFor="currentPassword">Current Password:</label>
        <input
          type="password"
          id="currentPassword"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
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
      <button type="submit">Change Password</button>
    </form>
  );
};

export default ChangePassword;