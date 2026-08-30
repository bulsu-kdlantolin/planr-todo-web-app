import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal Component', () => {
  it('renders modal content when open', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Dialog">
        <div>Modal Body Content</div>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Test Dialog')).toBeDefined();
    expect(screen.getByText('Modal Body Content')).toBeDefined();
  });

  it('does not render when isOpen is false', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={false} onClose={handleClose} title="Closed Dialog">
        <div>Hidden Content</div>
      </Modal>
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Escape Test">
        <button type="button">Inside Button</button>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
