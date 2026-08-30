import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select, SelectOption } from './Select';

describe('Select Component', () => {
  const options: SelectOption[] = [
    { value: 'opt-1', label: 'Option Alpha' },
    { value: 'opt-2', label: 'Option Beta' },
    { value: 'opt-3', label: 'Option Gamma' }
  ];

  it('renders trigger button with current value or placeholder', () => {
    const handleChange = vi.fn();
    render(
      <Select
        value="opt-1"
        onChange={handleChange}
        options={options}
        placeholder="Pick an option"
        label="Test Select"
      />
    );

    expect(screen.getByText('Test Select')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('Option Alpha');
  });

  it('opens dropdown on click and triggers onChange on option selection', () => {
    const handleChange = vi.fn();
    render(
      <Select
        value="opt-1"
        onChange={handleChange}
        options={options}
      />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const betaOption = screen.getByText('Option Beta');
    fireEvent.click(betaOption);

    expect(handleChange).toHaveBeenCalledWith('opt-2');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('navigates options via keyboard ArrowDown and Enter', () => {
    const handleChange = vi.fn();
    render(
      <Select
        value="opt-1"
        onChange={handleChange}
        options={options}
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith('opt-2');
  });

  it('closes dropdown when Escape key is pressed', () => {
    const handleChange = vi.fn();
    render(
      <Select
        value="opt-1"
        onChange={handleChange}
        options={options}
      />
    );

    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
