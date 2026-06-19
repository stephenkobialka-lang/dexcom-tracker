import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import { api } from './utils/api';
import './App.css';

function App() {
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
const fullUrl = window.location.href;
    const hashStart = fullUrl.indexOf('#');
    const params = hashStart !== -1
      ? new URLSearchParams(fullUrl.substring(hashStart + 1))
      : new URLSearchParams(window.location.search);

    const authResult = params.get('auth');
    const returnedUserId = params.get('userId');

    if (authResult === 'success' && returnedUserId) {
      localStorage.setItem('userId', returnedUserId);
      setUserId(returnedUserId);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const storedId = returnedUserId || userId;
    if (storedId) {
      api.checkAuthStatus(storedId)
        .then(({ authenticated }) => {
          setAuthenticated(authenticated);
          if (!authenticated) {
            localStorage.removeItem('userId');
            setUserId(null);
          }
        })
        .catch(() => setAuthenticated(false))
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setUserId(null);
    setAuthenticated(false);
  };

  if (checking) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!authenticated || !userId) {
    return <LoginPage />;
  }

  return <Dashboard userId={userId} onLogout={handleLogout} />;
}

export default App;
