import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePicker } from './DatePicker';
import { NumberStepper } from './NumberStepper';

describe('DatePicker Component', () => {
  it('renders placeholder when no date is selected', () => {
    render(<DatePicker value="" onChange={vi.fn()} placeholder="Choose due date..." />);
    expect(screen.getByText('Choose due date...')).toBeInTheDocument();
  });

  it('renders formatted date when value is provided and toggles calendar', () => {
    const handleChange = vi.fn();
    render(<DatePicker value="2026-08-30" onChange={handleChange} label="Due Date" />);

    expect(screen.getByText(/Aug 30, 2026/i)).toBeInTheDocument();

    const trigger = screen.getByRole('button', { name: /Aug 30, 2026/i });
    fireEvent.click(trigger);

    expect(screen.getByText('August 2026')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });
});

describe('NumberStepper Component', () => {
  it('renders value and handles increment/decrement', () => {
    const handleChange = vi.fn();
    render(<NumberStepper value={3} onChange={handleChange} min={1} max={10} unitLabel="blocks" />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('blocks')).toBeInTheDocument();

    const increaseBtn = screen.getByRole('button', { name: /Increase value/i });
    fireEvent.click(increaseBtn);
    expect(handleChange).toHaveBeenCalledWith(4);

    const decreaseBtn = screen.getByRole('button', { name: /Decrease value/i });
    fireEvent.click(decreaseBtn);
    expect(handleChange).toHaveBeenCalledWith(2);
  });
});
