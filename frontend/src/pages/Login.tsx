import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface LoginProps {
  onLogin: (userId: number, username: string, roles: string[]) => void;
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.user_id, username, data.roles);
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Login failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <Link to="/password-recovery">Forgot Password?</Link>
    </div>
  );
}

export default Login;



// import React, { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import PasswordRecovery from '../components/PasswordRecovery';
//
// interface LoginProps {
//   onLogin: (userId: number, username: string, roles: string[]) => void;
// }
//
// function Login({ onLogin }: LoginProps) {
//   const [username, setUsername] = useState('')
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState('')
//   const [showRecovery, setShowRecovery] = useState(false);
//   const navigate = useNavigate()
//
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setError('')
//
//     try {
//       const response = await fetch('http://localhost:8000/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ username, password }),
//       })
//
//       if (response.ok) {
//         const data = await response.json()
//         onLogin(data.user_id, username, data.roles)
//         navigate('/dashboard')
//       } else {
//         const errorData = await response.json()
//         setError(errorData.detail || 'Login failed')
//       }
//     } catch (error) {
//       setError('An error occurred. Please try again.')
//     }
//   }
//
//   if (showRecovery) {
//   return <PasswordRecovery onBack={() => setShowRecovery(false)} />;
//   }
// //
// return (
//     <form onSubmit={handleSubmit}>
//       <h2>Login</h2>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//       <div>
//         <label htmlFor="username">Username:</label>
//         <input
//           type="text"
//           id="username"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           required
//         />
//       </div>
//       <div>
//         <label htmlFor="password">Password:</label>
//         <input
//           type="password"
//           id="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//       </div>
//       <button type="submit">Login</button>
//       <button type="button" onClick={() => setShowRecovery(true)}>
//         Forgot Password?
//       </button>
//     </form>
//   );
// }
//

// export default Login