import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OtpInput } from './OtpInput';

describe('OtpInput Component', () => {
  it('renders 6 input boxes by default', () => {
    render(<OtpInput value="" onChange={() => {}} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('populates initial digits correctly', () => {
    render(<OtpInput value="123456" onChange={() => {}} />);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs[0].value).toBe('1');
    expect(inputs[1].value).toBe('2');
    expect(inputs[2].value).toBe('3');
    expect(inputs[3].value).toBe('4');
    expect(inputs[4].value).toBe('5');
    expect(inputs[5].value).toBe('6');
  });

  it('calls onChange with updated digit on input change', () => {
    const handleChange = vi.fn();
    render(<OtpInput value="" onChange={handleChange} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.change(inputs[0], { target: { value: '9' } });
    expect(handleChange).toHaveBeenCalledWith('9');
  });

  it('handles paste of 6 digits across inputs', () => {
    const handleChange = vi.fn();
    const handleComplete = vi.fn();
    render(<OtpInput value="" onChange={handleChange} onComplete={handleComplete} />);
    const inputs = screen.getAllByRole('textbox');

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => '654321'
      }
    });

    expect(handleChange).toHaveBeenCalledWith('654321');
    expect(handleComplete).toHaveBeenCalledWith('654321');
  });
});
