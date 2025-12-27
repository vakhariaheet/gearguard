import { SignIn } from '@clerk/clerk-react'
import { useLocation } from 'react-router-dom'

export function SignInPage() {
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  return (
    <div className="auth-page">
      <div className="auth-container">
        <SignIn 
          routing="path" 
          path="/sign-in" 
          signUpUrl="/sign-up"
          redirectUrl={from}
        />
      </div>
    </div>
  )
}