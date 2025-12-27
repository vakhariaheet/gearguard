import { SignUp } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'

export function SignUpPage() {
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  return (
    <div className="auth-page">
      <div className="auth-container">
        <SignUp 
          routing="path" 
          path="/sign-up" 
          signInUrl="/sign-in"
          redirectUrl={from}
        />
      </div>
    </div>
  )
}