import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { formatFriendlyAuthError } from '../utils/errors';

const TestComponent = () => {
  const { isOnline, syncStatus } = useAuth();
  return (
    <div>
      <span data-testid="online-status">{isOnline ? 'online' : 'offline'}</span>
      <span data-testid="sync-status">{syncStatus}</span>
    </div>
  );
};

describe('AuthContext & Error Translations', () => {
  it('renders AuthProvider and provides initial state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('online-status')).toBeDefined();
    expect(screen.getByTestId('sync-status').textContent).toBe('idle');
  });

  it('translates network and rate-limit errors to friendly user messages', () => {
    expect(formatFriendlyAuthError({ message: 'Failed to fetch' })).toContain(
      'Unable to reach the cloud server'
    );
    expect(formatFriendlyAuthError({ message: 'over_email_send_rate_limit' })).toContain(
      'Email rate limit reached'
    );
    expect(formatFriendlyAuthError({ message: 'Invalid login credentials' })).toContain(
      'Incorrect email or password'
    );
    expect(formatFriendlyAuthError({ message: 'User already registered' })).toContain(
      'An account with this email address already exists'
    );
  });
});
