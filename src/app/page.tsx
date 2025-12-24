"use client";

import { useSupabase } from "@/hooks/use-supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, supabase } = useSupabase();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Friends & Family App</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <p>Welcome back!</p>
              <p className="text-sm text-gray-500">User ID: {user.id}</p>
              <p className="text-sm text-gray-500">
                Phone: {user.phone || "N/A"}
              </p>

              <Button
                className="w-full"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p>This is a private application.</p>
              <p className="text-sm text-gray-500">
                Please check your messages for an invitation link.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
