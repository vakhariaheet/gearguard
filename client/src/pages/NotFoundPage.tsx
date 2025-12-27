import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'

export function NotFoundPage() {
  const { isSignedIn } = useAuth()

  return (
    <main className="main-content">
      <div className="not-found-section">
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">Page Not Found</h2>
          <p className="not-found-description">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="not-found-actions">
            <Link 
              to={isSignedIn ? "/dashboard" : "/"} 
              className="not-found-btn primary"
            >
              {isSignedIn ? "Go to Dashboard" : "Go Home"}
            </Link>
            {!isSignedIn && (
              <Link to="/sign-in" className="not-found-btn secondary">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}