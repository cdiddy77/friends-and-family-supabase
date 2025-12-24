import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Database } from "@/types/supabase";

export async function POST(request: Request) {
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  // Create Admin Client
  // Note: We need SUPABASE_SERVICE_ROLE_KEY environment variable.
  const adminClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );

  const { data: invite, error } = await adminClient
    .from("invites")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !invite) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Explicitly typing invite as Row to avoid 'never' inference if generic fails
  const inviteData = invite as Database["public"]["Tables"]["invites"]["Row"];

  // Validate
  if (inviteData.redeemed_at) {
    return NextResponse.json(
      { error: "Invite already redeemed" },
      { status: 400 }
    );
  }
  if (inviteData.denied) {
    return NextResponse.json({ error: "Invite denied" }, { status: 400 });
  }
  if (new Date(inviteData.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite expired" }, { status: 400 });
  }

  // Mark redeemed
  // We explicitly cast the client to 'any' for this operation because the
  // strict typing is inferring 'never' for the update payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (adminClient.from("invites") as any)
    .update({ redeemed_at: new Date().toISOString() })
    .eq("id", inviteData.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to redeem invite" },
      { status: 500 }
    );
  }

  // Generate JWT
  // Note: We need SUPABASE_JWT_SECRET environment variable.
  const secret = process.env.SUPABASE_JWT_SECRET!;
  if (!secret) {
    console.error("Missing SUPABASE_JWT_SECRET");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Supabase JWT payload structure
  const payload = {
    aud: "authenticated",
    role: "authenticated",
    sub: inviteData.user_id,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year
    app_metadata: {
      provider: "phone",
      providers: ["phone"],
    },
    user_metadata: {},
  };

  const token = jwt.sign(payload, secret);

  return NextResponse.json({ token });
}
