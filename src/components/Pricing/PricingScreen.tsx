import { useNavigate } from "react-router-dom";
import {
  Button,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
} from "react-aria-components";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Check, ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    id: "cancel",
    q: "Can I cancel anytime?",
    a: "Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
  },
  {
    id: "payment",
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, PayPal, and Apple Pay through our payment partner Lemon Squeezy.",
  },
  {
    id: "trial",
    q: "Is there a free trial?",
    a: "We don't offer a free trial at this time, but you can cancel anytime within your billing period.",
  },
  {
    id: "data",
    q: "What happens to my data if I cancel?",
    a: "Your data is never deleted. If you resubscribe later, everything will be right where you left it.",
  },
];

const CHECKOUT_URL = import.meta.env.VITE_LEMONSQUEEZY_CHECKOUT_URL;

function openCheckout(userEmail?: string, userId?: string) {
  const url = new URL(CHECKOUT_URL);

  // Pre-fill user info & pass user_id as custom data
  if (userEmail) url.searchParams.set("checkout[email]", userEmail);
  if (userId) url.searchParams.set("checkout[custom][user_id]", userId);

  // Use overlay if available, otherwise redirect
  url.searchParams.set("embed", "1");

  if (window.LemonSqueezy) {
    window.LemonSqueezy.Url.Open(url.toString());
  } else {
    window.open(url.toString(), "_blank");
  }
}

export function PricingScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro, isLoading } = useSubscription();

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Timeboxing Notes
          </span>
        </button>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button
            onPress={() => navigate(user ? "/dashboard" : "/auth")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            {user ? "Dashboard" : "Sign In"}
          </Button>
        </div>
      </header>

      {/* Pricing Header */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          One plan, everything included. No hidden fees, cancel anytime.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-lg mx-auto">
          {/* Pro Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border-2 border-blue-600 relative">
            {/* <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <h3 className="text-lg font-semibold text-blue-600 uppercase tracking-wide mb-2">
              Pro
            </h3> */}
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">
                $2.99
              </span>
              <span className="text-gray-500 dark:text-gray-400">/month</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              For power users who need unlimited productivity.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited notes",
                "Advanced rich text editor",
                "Unlimited time-block schedules",
                "Dark mode",
                "Priority support",
                "Export to PDF",
                "Calendar integrations",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                >
                  <Check className="w-5 h-5 text-blue-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            {isLoading ? (
              <div className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse h-12" />
            ) : isPro ? (
              <Button
                onPress={() => navigate("/dashboard")}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg cursor-default"
                isDisabled
              >
                Current Plan
              </Button>
            ) : (
              <Button
                onPress={() => {
                  if (!user) {
                    navigate("/auth", { state: { from: "/pricing" } });
                    return;
                  }
                  openCheckout(user.email, user.id);
                }}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Frequently Asked Questions
        </h2>
        <DisclosureGroup allowsMultipleExpanded className="space-y-4">
          {FAQ_ITEMS.map(({ id, q, a }) => (
            <Disclosure
              key={id}
              id={id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 group"
            >
              <Heading level={3}>
                <Button
                  slot="trigger"
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-lg font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  <span>{q}</span>
                  <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 group-data-expanded:rotate-180 shrink-0 ml-4" />
                </Button>
              </Heading>
              <DisclosurePanel className="px-6 text-gray-600 dark:text-gray-300">
                <div className="py-4">{a}</div>
              </DisclosurePanel>
            </Disclosure>
          ))}
        </DisclosureGroup>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2026 Timeboxing Notes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
