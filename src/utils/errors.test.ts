import { describe, it, expect } from 'vitest';
import { formatFriendlyAuthError } from './errors';

describe('formatFriendlyAuthError', () => {
  it('translates email not confirmed errors', () => {
    expect(formatFriendlyAuthError(new Error('Email not confirmed'))).toContain('Your email address is not verified yet');
    expect(formatFriendlyAuthError(new Error('email_not_confirmed'))).toContain('Your email address is not verified yet');
  });

  it('translates duplicate user errors', () => {
    expect(formatFriendlyAuthError(new Error('User already registered'))).toBe(
      'An account with this email address already exists. Please sign in instead.'
    );
    expect(formatFriendlyAuthError(new Error('user_already_exists'))).toBe(
      'An account with this email address already exists. Please sign in instead.'
    );
  });

  it('translates invalid credentials errors', () => {
    expect(formatFriendlyAuthError(new Error('Invalid login credentials'))).toBe(
      'Incorrect email or password. Please verify and try again.'
    );
    expect(formatFriendlyAuthError(new Error('invalid_grant'))).toBe(
      'Incorrect email or password. Please verify and try again.'
    );
  });

  it('translates invalid email errors', () => {
    expect(formatFriendlyAuthError(new Error('unable to validate email address'))).toBe(
      'Please enter a valid email address.'
    );
    expect(formatFriendlyAuthError(new Error('email_address_invalid'))).toBe(
      'Please enter a valid email address.'
    );
  });

  it('translates password length errors', () => {
    expect(formatFriendlyAuthError(new Error('Password should be at least 6 characters'))).toBe(
      'Password must be at least 6 characters long.'
    );
  });

  it('translates expired token errors', () => {
    expect(formatFriendlyAuthError(new Error('Token has expired'))).toBe(
      'The verification link or code has expired. Please request a new one.'
    );
  });

  it('translates rate limit errors', () => {
    expect(formatFriendlyAuthError(new Error('over_email_send_rate_limit'))).toBe(
      'Email rate limit reached. Please wait a moment before requesting another email.'
    );
    expect(formatFriendlyAuthError(new Error('For security purposes, you can only request this once every 60 seconds'))).toBe(
      'Email rate limit reached. Please wait a moment before requesting another email.'
    );
  });

  it('translates network errors gracefully', () => {
    expect(formatFriendlyAuthError(new Error('Failed to fetch'))).toBe(
      'Unable to reach the server. Please check your internet connection and try again.'
    );
  });

  it('returns default fallback for null or unknown errors', () => {
    expect(formatFriendlyAuthError(null)).toBe('An unexpected error occurred. Please try again.');
  });
});
