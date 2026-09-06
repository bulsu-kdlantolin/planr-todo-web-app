import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FirstSessionTourModal } from './FirstSessionTourModal';
import { useUIStore } from '../../store/useUIStore';

describe('FirstSessionTourModal', () => {
  beforeEach(() => {
    useUIStore.setState({ firstSessionTourOpen: true });
  });

  it('renders step 1 and advances to step 2', async () => {
    render(<FirstSessionTourModal />);

    expect(screen.getByText(/60-Second Kickoff Tour/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Set Your Intention/i)).toBeInTheDocument();

    const continueBtn = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueBtn);

    expect(await screen.findByText(/Step 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Identify Your 1 Big Task/i)).toBeInTheDocument();
  });
});
