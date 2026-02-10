"use server";

import { createClient } from "@/lib/supabase/server";
import { validateUsername } from "@/lib/validation/profanity";

export async function updateUsername(newUsername: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to change your username" };
  }

  // Validate
  const validationError = validateUsername(newUsername);
  if (validationError) {
    return { error: validationError };
  }

  // Check availability
  const { data: existing } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", newUsername)
    .neq("id", user.id)
    .single();

  if (existing) {
    return { error: "Username is already taken" };
  }

  // Update
  const { error } = await supabase
    .from("profiles")
    .update({ username: newUsername })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to update username. Please try again." };
  }

  return { success: true };
}
