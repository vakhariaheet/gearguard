/**
 * WebSocket Test Page
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { WebSocketTest } from '../components/WebSocketTest';

export const WebSocketTestPage: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const isAdmin = (user?.publicMetadata?.role as string) === 'admin';

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
        <WebSocketTest />
      </main>
    </>
  );
};