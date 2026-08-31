/**
 * Human-friendly error translation helper.
 * Eliminates raw system / network error messages (e.g. "Failed to fetch", "TypeError", "CORS")
 * and converts them into helpful, clean explanations for the user.
 */
export function formatFriendlyAuthError(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  const message = (err.message || String(err)).toLowerCase();

  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Your email address is not verified yet. Please check your inbox for the confirmation link.';
  }

  if (
    message.includes('invalid email') ||
    message.includes('unable to validate email') ||
    message.includes('email_address_invalid') ||
    message.includes('is invalid') ||
    message.includes('validation_failed')
  ) {
    return 'Please enter a valid email address.';
  }

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials') ||
    message.includes('invalid_grant') ||
    message.includes('wrong password')
  ) {
    return 'Incorrect email or password. Please verify and try again.';
  }

  if (
    message.includes('user already registered') ||
    message.includes('already exists') ||
    message.includes('user_already_exists') ||
    message.includes('email already in use')
  ) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  if (
    message.includes('password should be at least') ||
    message.includes('password is too short') ||
    message.includes('weak_password') ||
    message.includes('at least 6 characters')
  ) {
    return 'Password must be at least 6 characters long.';
  }

  if (message.includes('signup requires a valid password')) {
    return 'Please provide a valid password to secure your account.';
  }

  if (
    message.includes('token has expired') ||
    message.includes('token is expired') ||
    message.includes('otp_expired') ||
    message.includes('expired token') ||
    message.includes('link has expired')
  ) {
    return 'The verification link or code has expired. Please request a new one.';
  }

  if (
    message.includes('token is invalid') ||
    message.includes('invalid token') ||
    message.includes('otp_invalid') ||
    message.includes('bad token') ||
    message.includes('token not found')
  ) {
    return 'Invalid or incorrect verification link. Please check your email or request a new one.';
  }

  if (
    message.includes('over_email_send_rate_limit') ||
    message.includes('email rate limit') ||
    message.includes('for security purposes, you can only request')
  ) {
    return 'Email rate limit reached. Please wait a moment before requesting another email.';
  }

  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('over_request_rate_limit')
  ) {
    return 'Too many attempts. Please wait a minute before trying again.';
  }

  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('load failed') ||
    message.includes('cors') ||
    message.includes('connection refused')
  ) {
    return 'Unable to reach the server. Please check your internet connection and try again.';
  }

  if (message.includes('user not found') || message.includes('no user found')) {
    return 'No account found with this email address. Please create an account first.';
  }

  if (message.includes('same_password') || message.includes('new password should be different')) {
    return 'New password must be different from your old password.';
  }

  // Fallback cleanly without exposing technical stack traces
  return err.message || 'Unable to complete request. Please try again.';
}
