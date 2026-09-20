/* =========================================================
   FINANCIAL MATH & CURRENCY UTILITIES (Paise & INR Safe Math)
   ========================================================= */

/**
 * Formats integer paise into a human-readable Indian Rupee string: e.g. 10500000 -> ₹1,05,000
 */
export function formatPaise(amountInPaise: number, currency = 'INR'): string {
  const safePaise = Math.round(Number(amountInPaise) || 0);
  const rupees = safePaise / 100;
  
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: safePaise % 100 === 0 ? 0 : 2,
      minimumFractionDigits: safePaise % 100 === 0 ? 0 : 2,
    }).format(rupees);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Converts integer paise to decimal rupees for input display
 */
export function paiseToRupees(amountInPaise: number): number {
  return (Math.round(amountInPaise || 0)) / 100;
}

/**
 * Converts human entered rupee string/number into safe integer paise
 */
export function rupeesToPaise(rupees: number | string): number {
  const parsed = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Format standard ISO date to clean readable date: "18 Sep 2026"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format relative time: "5 mins ago", "Yesterday", "2 days ago"
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}
