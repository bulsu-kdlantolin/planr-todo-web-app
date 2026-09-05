import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { FocusView } from './FocusView';
import { useTimerStore } from '../store/useTimerStore';

describe('FocusView Component', () => {
  beforeEach(() => {
    useTimerStore.getState().resetTimer();
    useTimerStore.getState().setPreset('pomodoro', 25);
  });

  it('renders timer presets and switches countdown display', () => {
    render(<FocusView />);

    expect(screen.getByText('Focus Timer')).toBeInTheDocument();
    expect(screen.getByText('25:00')).toBeInTheDocument();

    const shortBreakBtn = screen.getByText('5 Min Break');
    fireEvent.click(shortBreakBtn);
    expect(screen.getByText('05:00')).toBeInTheDocument();

    const deepFocusBtn = screen.getByText('50 Minutes');
    fireEvent.click(deepFocusBtn);
    expect(screen.getByText('50:00')).toBeInTheDocument();
  });

  it('renders soundscape toggles and timer control buttons', () => {
    render(<FocusView />);

    expect(screen.getByRole('button', { name: /start focus timer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rain/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forest/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ocean/i })).toBeInTheDocument();
  });

  it('allows setting custom focus timer with hours, minutes, and seconds', () => {
    render(<FocusView />);

    // Custom preset button exists
    const customBtn = screen.getByRole('button', { name: /custom/i });
    expect(customBtn).toBeInTheDocument();

    // Click Custom
    fireEvent.click(customBtn);
    expect(screen.getByText('Set Time:')).toBeInTheDocument();

    // Confirm -5m and +5m are removed
    expect(screen.queryByText('-5m')).not.toBeInTheDocument();
    expect(screen.queryByText('+5m')).not.toBeInTheDocument();

    // Verify hour, minute, and second inputs exist and have no-spinners class
    const hourInput = screen.getByLabelText('Custom focus duration hours');
    const minInput = screen.getByLabelText('Custom focus duration minutes');
    const secInput = screen.getByLabelText('Custom focus duration seconds');
    expect(hourInput).toHaveClass('no-spinners');
    expect(minInput).toHaveClass('no-spinners');
    expect(secInput).toHaveClass('no-spinners');

    // Click 1h quick preset
    const btn1h = screen.getByRole('button', { name: '1h' });
    fireEvent.click(btn1h);
    expect(screen.getByText('01:00:00')).toBeInTheDocument();

    // Change seconds to 30
    fireEvent.change(secInput, { target: { value: '30' } });
    expect(screen.getByText('01:00:30')).toBeInTheDocument();
  });

  it('does not render breathing guide or zen mode buttons in focus header', () => {
    render(<FocusView />);

    expect(screen.queryByText(/breathing guide/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/zen mode/i)).not.toBeInTheDocument();
  });
});
