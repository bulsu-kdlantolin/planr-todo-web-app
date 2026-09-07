import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettingsView } from './SettingsView';
import { AuthProvider } from '../context/AuthContext';
import { useUIStore } from '../store/useUIStore';

describe('SettingsView Component', () => {
  it('does not render Plan & Subscription concepts or Pro upgrade', () => {
    render(
      <AuthProvider>
        <SettingsView />
      </AuthProvider>
    );

    expect(screen.queryByText(/Plan & Subscription/i)).toBeNull();
    expect(screen.queryByText(/Upgrade to Pro/i)).toBeNull();
    expect(screen.queryByText(/Free Vault/i)).toBeNull();
  });

  it('does not render Tour button or tour fields', () => {
    render(
      <AuthProvider>
        <SettingsView />
      </AuthProvider>
    );

    expect(screen.queryByRole('button', { name: /^Tour$/i })).toBeNull();
  });
});
