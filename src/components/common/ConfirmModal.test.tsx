import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal Component', () => {
  it('renders title, description and triggers onConfirm and onClose', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Delete Reminder"
        description="Are you sure you want to delete this reminder?"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    );

    expect(screen.getByText('Delete Reminder')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this reminder?')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const deleteBtn = screen.getByRole('button', { name: /^delete$/i });
    fireEvent.click(deleteBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('does not render when isOpen is false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete Item"
        description="Are you sure?"
      />
    );

    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
  });
});
