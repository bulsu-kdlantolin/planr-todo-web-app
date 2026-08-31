import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoogleButton } from './GoogleButton';

describe('GoogleButton Component', () => {
  it('renders with default label', () => {
    render(<GoogleButton onClick={() => {}} />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<GoogleButton onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('displays loading state and is disabled during auth', () => {
    render(<GoogleButton onClick={() => {}} isLoading={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Connecting to Google...')).toBeInTheDocument();
  });
});
