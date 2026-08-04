import { getSupabaseClient } from "@/lib/supabase/client";
import { anonymousDisplayNameFromUserId } from "../domain/anonymousName";

export type AnonymousIdentity = {
  userId: string;
  displayName: string;
};

async function resolveIdentity(userId: string): Promise<AnonymousIdentity> {
  const supabase = getSupabaseClient();
  const fallbackName = anonymousDisplayNameFromUserId(userId);
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (profile) {
    return { userId, displayName: profile.display_name };
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: userId,
    display_name: fallbackName,
  });

  if (insertError && insertError.code !== "23505") {
    throw insertError;
  }

  return { userId, displayName: fallbackName };
}

export async function getExistingAnonymousIdentity() {
  const supabase = getSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session ? resolveIdentity(session.user.id) : null;
}

export async function ensureAnonymousIdentity() {
  const existingIdentity = await getExistingAnonymousIdentity();

  if (existingIdentity) {
    return existingIdentity;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.user) {
    throw error ?? new Error("Could not create an anonymous session.");
  }

  return resolveIdentity(data.user.id);
}
