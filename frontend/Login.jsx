import { useEffect, useState } from 'react';

function Login({ role, roleName, children, socket }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const savedKey = sessionStorage.getItem(`${role}_key`);
    
    socket.disconnect();
    
    if (savedKey) {
      attemptLogin(savedKey);
    } else {
      setIsAuthenticated(false);
    }
    
    socket.on('connect', () => {
      console.log(`✅ Connected as ${role}`);
      setIsAuthenticated(true);
      setIsConnecting(false);
      setError('');
    });

    socket.on('connect_error', (err) => {
      console.log('❌ Auth failed:', err.message);
      setError('Invalid access key or server unavailable');
      setIsAuthenticated(false);
      setIsConnecting(false);
      socket.disconnect();
      sessionStorage.removeItem(`${role}_key`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Disconnected from ${role}:`, reason);
      setIsAuthenticated(false);
      setIsConnecting(false);
      
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setError('Server connection lost');
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [role, socket]);

  const attemptLogin = (key) => {
    setIsConnecting(true);
    setError('');
    sessionStorage.setItem(`${role}_key`, key);
    socket.auth = { key, role };
    socket.connect();
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      setError('Please enter an access key');
      return;
    }
    attemptLogin(accessKey);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(`${role}_key`);
    socket.auth = {};
    socket.disconnect();
    setIsAuthenticated(false);
    setAccessKey('');
    setError('');
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
        <h1>{roleName} - Login</h1>
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            placeholder="Enter access key"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            disabled={isConnecting}
            autoFocus
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <button 
            type="submit" 
            disabled={isConnecting}
            style={{ padding: '10px 20px' }}>
            {isConnecting ? 'Connecting...' : 'Login'}
          </button>
        </form>
        {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button 
        onClick={handleLogout} 
        style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          padding: '8px 16px',
          zIndex: 1000
        }}>
        Logout
      </button>
      {children}
    </div>
  );
}

export default Login;