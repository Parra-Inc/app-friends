"use server";

import { signIn } from "@/auth";

export async function emailSignIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  if (!email) return;
  await signIn("nodemailer", { email, redirectTo: "/dashboard" });
}

export async function providerSignIn(provider: string) {
  await signIn(provider, { redirectTo: "/dashboard" });
}
