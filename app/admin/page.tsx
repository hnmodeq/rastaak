'use client';

import React, { useEffect, useState } from 'react';
import '@/components/admin/admin.css';

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.admin = 'true';
  }

  useEffect(() => {
    document.documentElement.dataset.admin = 'true';
    fetch('/api/admin/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          window.location.replace('/');
          return;
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      setError('Wrong username or password.');
      return;
    }
    window.location.replace('/');
  };

  if (!ready) return <div className="admin-login" />;

  return (
    <div className="admin-login">
      <form onSubmit={(event) => void login(event)}>
        <h1>Admin</h1>
        <p>Sign in to open 3D Studio on the live homepage. Visitors will not see the panels.</p>
        <label className="admin-field">
          <span>Username</span>
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
        </label>
        <label className="admin-field">
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </label>
        {error ? <p>{error}</p> : null}
        <button type="submit">Enter</button>
      </form>
    </div>
  );
}
