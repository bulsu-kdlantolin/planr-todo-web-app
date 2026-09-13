import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SettingsView } from './SettingsView';
import { AuthProvider } from '../context/AuthContext';

describe('SettingsView Component', () => {
  it('does not render Plan & Subscription concepts or Pro upgrade', async () => {
    render(
      <AuthProvider>
        <SettingsView />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Plan & Subscription/i)).toBeNull();
    });
    expect(screen.queryByText(/Upgrade to Pro/i)).toBeNull();
    expect(screen.queryByText(/Free Vault/i)).toBeNull();
  });

  it('does not render Tour button or tour fields', async () => {
    render(
      <AuthProvider>
        <SettingsView />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Tour$/i })).toBeNull();
    });
  });

  it('renders Audio & Notifications controls with test chime and volume slider', async () => {
    render(
      <AuthProvider>
        <SettingsView />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Audio & Notifications')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /test chime/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/sound volume slider/i)).toBeInTheDocument();
    expect(screen.getByText(/desktop notifications/i)).toBeInTheDocument();
  });

  it('renders Focus & Timer Preferences with session durations and break auto-start', async () => {
    render(
      <AuthProvider>
        <SettingsView />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Focus & Timer Preferences')).toBeInTheDocument();
    });
    expect(screen.getByText('Focus Session')).toBeInTheDocument();
    expect(screen.getByText('Short Break')).toBeInTheDocument();
    expect(screen.getByText('Long Break')).toBeInTheDocument();
    expect(screen.getByText('Break Auto-Start')).toBeInTheDocument();
  });
});

