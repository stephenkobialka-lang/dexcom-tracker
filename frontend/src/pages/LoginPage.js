import { api } from '../utils/api';
import '../styles/LoginPage.css';

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-icon">💙</span>
        </div>
        <h1 className="login-title">Glucose Tracker</h1>
        <p className="login-subtitle">
          Real-time monitoring for your daughter's Dexcom G7
        </p>

        <a href={api.getLoginUrl()} className="login-btn">
          Connect Dexcom Account
        </a>

        <p className="login-note">
          You'll be redirected to Dexcom to securely authorize access.
          No passwords are stored on this app.
        </p>
      </div>
    </div>
  );
}
