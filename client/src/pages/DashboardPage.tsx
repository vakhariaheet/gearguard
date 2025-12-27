import { Link, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

export function DashboardPage() {
  const { user } = useUser()
  const location = useLocation()
  const isAdmin = (user?.publicMetadata?.role as string) === 'admin'

  return (
    <>
      <nav className="navigation">
        <Link 
          to="/dashboard"
          className={`nav-btn ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </Link>
        <Link 
          to="/websocket-test"
          className={`nav-btn ${location.pathname === '/websocket-test' ? 'active' : ''}`}
        >
          WebSocket Test
        </Link>
        {isAdmin && (
          <Link 
            to="/admin"
            className={`nav-btn ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            Admin Panel
          </Link>
        )}
      </nav>

      <main className="main-content">
        <div className="dashboard">
          <h2>Dashboard</h2>
          <p>You're successfully signed in!</p>
          <div className="user-info">
            <h3>User Information:</h3>
            <p><strong>Email:</strong> {user?.emailAddresses[0]?.emailAddress}</p>
            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
            <p><strong>Role:</strong> {(user?.publicMetadata?.role as string) || 'user'}</p>
          </div>
        </div>
      </main>
    </>
  )
}