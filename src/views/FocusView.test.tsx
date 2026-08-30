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
});
