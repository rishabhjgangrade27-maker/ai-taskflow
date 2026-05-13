import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bfxwexxbrzugldocpfbe.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmeHdleHhicnp1Z2xkb2NwZmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MDEzODUsImV4cCI6MjA4NDA3NzM4NX0.WBVRS6uRkkHTeUXvhKqKCXbM-xlo0MRQ2eeZ46KQ4n8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export type Task = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  estimated_duration_minutes: number;
  is_completed: boolean;
  created_at: string;
};

export type AIResults = {
  priority?: Array<{ id?: string; priority?: string }>;
  summaries?: Array<{ id?: string; summary?: string }>;
  breakdowns?: Array<{ id?: string; steps?: string[] }>;
  deadlines?: Array<{ id?: string; suggested_deadline?: string }>;
  estimations?: Array<{ id?: string; minutes?: number }>;
  next_action?: { id?: string; reason?: string };
};
