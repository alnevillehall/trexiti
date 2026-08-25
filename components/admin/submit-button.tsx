"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function SubmitButton({ children, pendingLabel = "Saving…", variant = "default", name, value }: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return <Button disabled={pending} name={name} type="submit" value={value} variant={variant}>{pending ? pendingLabel : children}</Button>;
}
