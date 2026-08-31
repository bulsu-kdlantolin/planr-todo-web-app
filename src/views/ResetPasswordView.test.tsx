import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResetPasswordView } from './ResetPasswordView';
import { AuthProvider } from '../context/AuthContext';

describe('ResetPasswordView Component', () => {
  it('renders reset password inputs and buttons', () => {
    render(
      <AuthProvider>
        <ResetPasswordView />
      </AuthProvider>
    );

    expect(screen.getByText('Reset your password')).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirm New Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save New Password & Continue/i })).toBeInTheDocument();
  });

  it('validates password mismatch before submit', async () => {
    render(
      <AuthProvider>
        <ResetPasswordView />
      </AuthProvider>
    );

    const newPass = screen.getByLabelText(/^New Password/i);
    const confirmPass = screen.getByLabelText(/^Confirm New Password/i);
    const submitBtn = screen.getByRole('button', { name: /Save New Password & Continue/i });

    fireEvent.change(newPass, { target: { value: 'password123' } });
    fireEvent.change(confirmPass, { target: { value: 'different123' } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
  });
});
