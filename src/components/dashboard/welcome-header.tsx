// src/components/dashboard/welcome-header.tsx
// Purpose: Personalized greeting with subscription status badge
// Dependencies: subscription-status component

import { SubscriptionStatus } from './subscription-status';

interface WelcomeHeaderProps {
  fullName: string | null;
  status: string;
  tier: string;
  trialShredsUsed: number;
}

export function WelcomeHeader({ fullName, status, tier, trialShredsUsed }: WelcomeHeaderProps) {
  const firstName = fullName ? fullName.split(' ')[0] : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back{firstName ? `, ${firstName}` : ''}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Your RFP processing overview
        </p>
      </div>
      <SubscriptionStatus
        status={status}
        tier={tier}
        trialShredsUsed={trialShredsUsed}
      />
    </div>
  );
}
