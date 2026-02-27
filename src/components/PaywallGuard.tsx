import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-aria-components";
import { useSubscription } from "@/hooks/useSubscription";

interface PaywallGuardProps {
  children: ReactNode;
  /** Optional fallback shown to non-Pro users (defaults to upgrade prompt) */
  fallback?: ReactNode;
}

/**
 * Wrap any feature that requires a Pro subscription.
 * Shows children to Pro users, or an upgrade prompt to free users.
 */
export function PaywallGuard({ children, fallback }: PaywallGuardProps) {
  const navigate = useNavigate();
  const { isPro, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-blue-600 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Pro Feature
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-sm">
        Upgrade to Pro to unlock this feature and supercharge your productivity.
      </p>
      <Button
        onPress={() => navigate("/pricing")}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        View Pricing
      </Button>
    </div>
  );
}
