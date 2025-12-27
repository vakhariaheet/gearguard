import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <main className="main-content">
      <div className="landing-section">
        <h2>Welcome to Our Hackathon Project</h2>
        <p>Please sign in to access the application.</p>
        <div className="landing-buttons">
          <Link to="/sign-in" className="landing-btn primary">
            Sign In
          </Link>
          <Link to="/sign-up" className="landing-btn secondary">
            Create Account
          </Link>
        </div>
      </div>
    </main>
  )
}