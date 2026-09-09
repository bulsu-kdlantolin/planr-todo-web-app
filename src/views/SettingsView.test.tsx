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

  it('renders Audio & Notifications controls with test chime and volume slider', () => {
    render(
      <AuthProvider>
        <SettingsView />
      </AuthProvider>
    );

    expect(screen.getByText('Audio & Notifications')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test chime/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/sound volume slider/i)).toBeInTheDocument();
    expect(screen.getByText(/desktop notifications/i)).toBeInTheDocument();
  });

  it('renders Focus & Timer Preferences with session durations and break auto-start', () => {
    render(
      <AuthProvider>
        <SettingsView />
      </AuthProvider>
    );

    expect(screen.getByText('Focus & Timer Preferences')).toBeInTheDocument();
    expect(screen.getByText('Focus Session')).toBeInTheDocument();
    expect(screen.getByText('Short Break')).toBeInTheDocument();
    expect(screen.getByText('Long Break')).toBeInTheDocument();
    expect(screen.getByText('Break Auto-Start')).toBeInTheDocument();
  });
});
