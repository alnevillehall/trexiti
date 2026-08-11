import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { ArrowRight, Building2 } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdminAuthConfigured } from "@/lib/admin/auth";
import { isWorkspaceDemoMode } from "@/lib/auth/config";

export default function SignInPage() {
  if (isAdminAuthConfigured()) {
    return (
      <main className="grid min-h-screen place-items-center px-4 py-10">
        <SignIn
          routing="hash"
          fallbackRedirectUrl="/admin"
          signUpUrl="/sign-up"
        />
      </main>
    );
  }

  if (!isWorkspaceDemoMode()) {
    notFound();
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 grid size-11 place-items-center rounded-md border bg-muted">
            <Building2 className="size-5 text-muted-foreground" />
          </div>
          <CardTitle>Sign in to Trexiti Service OS</CardTitle>
          <p className="text-sm text-muted-foreground">
            This scaffold is ready for a managed auth provider with organization claims.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="password" />
          </div>
          <Button asChild>
            <Link href="/dashboard">
              Continue to demo tenant
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New company?{" "}
            <Link href="/sign-up" className="font-medium text-foreground">
              Set up tenant
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
