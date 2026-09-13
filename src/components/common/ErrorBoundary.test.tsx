import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

const BadComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test crash in component');
  }
  return <div>Everything is calm and functional.</div>;
};

describe('ErrorBoundary Component', () => {
  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <BadComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Everything is calm and functional.')).toBeInTheDocument();
  });

  it('renders fallback UI when child component throws', () => {
    // Suppress console.error output during deliberate test error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BadComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went quiet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload application/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download backup/i })).toBeInTheDocument();

    spy.mockRestore();
  });

  it('expands technical details when requested', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BadComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    const toggleBtn = screen.getByRole('button', { name: /view technical details/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText(/Test crash in component/i)).toBeInTheDocument();

    spy.mockRestore();
  });
});
