// src/components/dashboard/subscription-status.tsx
// Purpose: Subscription status display with upgrade/manage buttons
// Dependencies: react
// Test spec: qa/test-specs/full-integration.md

'use client';

interface SubscriptionStatusProps {
  status: string;
  tier: string;
  trialShredsUsed: number;
}

const STATUS_DISPLAY: Record<string, { color: string }> = {
  trial: { color: 'bg-yellow-100 text-yellow-700' },
  active: { color: 'bg-green-100 text-green-700' },
  canceled: { color: 'bg-red-100 text-red-700' },
  past_due: { color: 'bg-red-100 text-red-700' },
};

export function SubscriptionStatus({ status, tier, trialShredsUsed }: SubscriptionStatusProps) {
  function getLabel(): string {
    switch (status) {
      case 'trial':
        return `Free Trial (${Math.max(0, 1 - trialShredsUsed)} shred remaining)`;
      case 'active':
        return `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan — Active`;
      case 'canceled':
        return 'Canceled — Access until period end';
      case 'past_due':
        return 'Payment Past Due — Update payment method';
      default:
        return status;
    }
  }

  const display = STATUS_DISPLAY[status] || { color: 'bg-gray-100 text-gray-700' };

  async function handleCheckout() {
    const res = await fetch('/api/billing/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function handlePortal() {
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <span className={`text-xs font-medium px-3 py-1 rounded-full ${display.color}`}>
        {getLabel()}
      </span>
      <div>
        {(status === 'trial' || status === 'canceled') && (
          <button
            onClick={handleCheckout}
            className="text-sm font-medium text-white bg-brand-green hover:bg-brand-green-dark px-4 py-2 rounded-lg transition-colors"
          >
            Subscribe — $99/mo
          </button>
        )}
        {(status === 'active' || status === 'past_due') && (
          <button
            onClick={handlePortal}
            className="text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
          >
            Manage Subscription
          </button>
        )}
      </div>
    </div>
  );
}
