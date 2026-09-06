import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ProUpgradeModal } from './ProUpgradeModal';
import { useUIStore } from '../../store/useUIStore';

describe('ProUpgradeModal', () => {
  beforeEach(() => {
    useUIStore.setState({ proUpgradeModalOpen: true });
  });

  it('renders plan comparisons and toggles billing cycles', () => {
    render(<ProUpgradeModal />);

    expect(screen.getAllByText('Planr Pro').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Free Vault')).toBeInTheDocument();
    expect(screen.getByText(/Yearly \(Save 25%\)/i)).toBeInTheDocument();

    const monthlyBtn = screen.getByText(/Monthly • \$4\/mo/i);
    fireEvent.click(monthlyBtn);

    expect(screen.getByText(/\$4 \/ mo/i)).toBeInTheDocument();
  });
});
