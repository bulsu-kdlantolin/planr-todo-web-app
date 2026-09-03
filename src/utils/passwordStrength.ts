export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordStrength {
  metCount: number; // 0 to 5
  percentage: number; // 0 to 100
  label: 'Weak' | 'Medium' | 'Good' | 'Strong';
  headline: string;
  barColorClass: string;
  requirements: PasswordRequirement[];
}

/**
 * Evaluates password strength against 5 specific criteria:
 * 1. At least 8 characters
 * 2. At least 1 number
 * 3. At least 1 lowercase letter
 * 4. At least 1 uppercase letter
 * 5. At least 1 special character
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const hasLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const requirements: PasswordRequirement[] = [
    { id: 'length', label: 'At least 8 characters', met: hasLength },
    { id: 'number', label: 'At least 1 number', met: hasNumber },
    { id: 'lowercase', label: 'At least 1 lowercase letter', met: hasLowercase },
    { id: 'uppercase', label: 'At least 1 uppercase letter', met: hasUppercase },
    { id: 'special', label: 'At least 1 special character', met: hasSpecial }
  ];

  const metCount = requirements.filter((r) => r.met).length;
  const percentage = Math.round((metCount / requirements.length) * 100);

  let label: PasswordStrength['label'] = 'Weak';
  let headline = 'Weak password. Must contain:';
  let barColorClass = 'bg-red-500';

  if (metCount === 5) {
    label = 'Strong';
    headline = 'Strong password.';
    barColorClass = 'bg-emerald-500';
  } else if (metCount === 4) {
    label = 'Good';
    headline = 'Good password. Must contain:';
    barColorClass = 'bg-blue-500';
  } else if (metCount === 2 || metCount === 3) {
    label = 'Medium';
    headline = 'Medium password. Must contain:';
    barColorClass = 'bg-amber-500';
  } else {
    label = 'Weak';
    headline = 'Weak password. Must contain:';
    barColorClass = 'bg-red-500';
  }

  return {
    metCount,
    percentage,
    label,
    headline,
    barColorClass,
    requirements
  };
}
