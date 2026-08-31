import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  onResend?: () => Promise<void> | void;
  disabled?: boolean;
  isSubmitting?: boolean;
  resendCooldownSec?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  onResend,
  disabled = false,
  isSubmitting = false,
  resendCooldownSec = 30
}) => {
  const [cooldown, setCooldown] = useState(resendCooldownSec);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of single characters
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const char = rawVal.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join('');
    onChange(combined);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (combined.length === length && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasteData) return;

    onChange(pasteData);

    const nextFocusIndex = Math.min(pasteData.length, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();

    if (pasteData.length === length && onComplete) {
      onComplete(pasteData);
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0 || !onResend || disabled) return;
    setCooldown(resendCooldownSec);
    await onResend();
  };

  return (
    <div className="space-y-4">
      {/* 6-Digit OTP Box Grid */}
      <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoFocus={i === 0}
            disabled={disabled || isSubmitting}
            value={digits[i] || ''}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            aria-label={`Verification code digit ${i + 1} of ${length}`}
            className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold bg-surface-low border border-outline-variant rounded-xl text-on-surface focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 focus:outline-none transition-all shadow-xs disabled:opacity-50"
          />
        ))}
      </div>

      {/* Resend Cooldown Action */}
      {onResend && (
        <div className="flex items-center justify-between text-xs text-secondary pt-1">
          <span>Didn't receive a code?</span>
          <button
            type="button"
            onClick={handleResendClick}
            disabled={cooldown > 0 || disabled || isSubmitting}
            className="font-semibold text-primary hover:text-primary-container disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${cooldown > 0 ? '' : 'text-primary'}`} aria-hidden="true" />
            <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
