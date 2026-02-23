// src/components/dashboard/settings/subscription-card.tsx
// Purpose: Current plan info with subscribe/manage subscription button
// Dependencies: billing API routes (checkout, portal)

'use client';

import { useState } from 'react';

interface SubscriptionCardProps {
  status: string;
  tier: string;
  hasStripeCustomer: boolean;
}

const statusLabels: Record<string, string> = {
  trial: 'Free Trial',
  active: 'Active',
  canceled: 'Canceled',
  past_due: 'Past Due',
};

export function SubscriptionCard({ status, tier, hasStripeCustomer }: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    const res = await fetch('/api/billing/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  async function handlePortal() {
    setLoading(true);
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  const planName = status === 'active'
    ? `${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan`
    : 'Free Trial';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Subscription</h3>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{planName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {status === 'active' ? '$99/month' : status === 'trial' ? '1 free shred included' : statusLabels[status] ?? status}
          </p>
        </div>
        {(status === 'trial' || status === 'canceled') && (
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="px-4 py-2 bg-[#10B981] text-white text-sm font-medium rounded-md hover:bg-[#0D9668] transition-colors disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Subscribe — $99/mo'}
          </button>
        )}
        {(status === 'active' || status === 'past_due') && hasStripeCustomer && (
          <button
            onClick={handlePortal}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Manage Subscription'}
          </button>
        )}
      </div>
    </div>
  );
}
