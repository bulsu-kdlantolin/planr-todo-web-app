/**
 * Human-friendly error translation helper.
 * Eliminates raw system / network error messages (e.g. "Failed to fetch", "TypeError", "CORS")
 * and converts them into helpful, clean explanations for the user.
 */
export function formatFriendlyAuthError(err: any): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  const message = (err.message || String(err)).toLowerCase();

  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Please check your email inbox to confirm your account, or continue in local mode.';
  }

  if (message.includes('invalid email') || message.includes('unable to validate email') || message.includes('email_address_invalid') || message.includes('is invalid')) {
    return 'Please enter a valid email address.';
  }

  if (message.includes('invalid login credentials') || message.includes('invalid credentials') || message.includes('invalid_grant')) {
    return 'Incorrect email or password. Please verify and try again.';
  }

  if (message.includes('user already registered') || message.includes('already exists') || message.includes('user_already_exists')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  if (message.includes('password should be at least') || message.includes('password is too short') || message.includes('weak_password')) {
    return 'Password must be at least 6 characters long.';
  }

  if (message.includes('signup requires a valid password')) {
    return 'Please provide a valid password to secure your account.';
  }

  if (message.includes('over_email_send_rate_limit') || message.includes('email rate limit')) {
    return 'Email rate limit reached. You can continue instantly in private local mode or try again later.';
  }

  if (message.includes('rate limit') || message.includes('too many requests') || message.includes('over_request_rate_limit')) {
    return 'Too many attempts. Please wait a minute before trying again, or continue in local mode.';
  }

  if (message.includes('failed to fetch') || message.includes('network') || message.includes('load failed') || message.includes('cors')) {
    return 'Unable to reach the cloud server. Please check your internet connection or continue in local mode.';
  }

  // Fallback cleanly without exposing technical stack traces
  return err.message || 'Unable to complete request. Please try again.';
}
