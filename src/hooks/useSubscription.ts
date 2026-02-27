import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Subscription } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function useSubscription() {
  const { user } = useAuth();

  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      // PGRST116 = no rows found — user has no subscription yet (free tier)
      if (error && error.code !== "PGRST116") throw error;
      return (data as Subscription) ?? null;
    },
    enabled: !!user,
  });

  const isPro =
    subscription?.plan === "pro" &&
    (subscription?.status === "active" || subscription?.status === "on_trial");

  return { subscription, isPro, isLoading, error };
}
