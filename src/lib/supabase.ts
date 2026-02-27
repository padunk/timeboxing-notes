import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Timebox {
  id: string;
  user_id: string;
  note_id: string;
  start_time: string;
  end_time: string;
  date: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  lemon_squeezy_id: string | null;
  order_id: string | null;
  customer_id: string | null;
  product_id: string | null;
  variant_id: string | null;
  plan: "free" | "pro";
  status:
    | "active"
    | "cancelled"
    | "expired"
    | "past_due"
    | "paused"
    | "on_trial"
    | "unpaid";
  card_brand: string | null;
  card_last_four: string | null;
  renews_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  update_payment_method_url: string | null;
  created_at: string;
  updated_at: string;
}
