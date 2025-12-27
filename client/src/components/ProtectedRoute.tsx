import { useAuth, useUser } from '@clerk/clerk-react'
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string
  fallback?: ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback = <div>Access denied. You don't have permission to view this content.</div> 
}: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const location = useLocation()

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Redirect to sign in if not authenticated
  if (!isSignedIn) {
    // Save the attempted location for redirect after sign-in
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  // Check role if required
  if (requiredRole) {
    const userRole = user?.publicMetadata?.role as string
    if (userRole !== requiredRole) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}