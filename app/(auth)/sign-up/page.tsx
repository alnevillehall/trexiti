import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { notFound } from "next/navigation";

import { createOrganizationOnboarding } from "@/app/(auth)/sign-up/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { industryTemplates } from "@/lib/service-os/industry-templates";
import { isWorkspaceDemoMode } from "@/lib/auth/config";

export default function SignUpPage() {
  if (!isWorkspaceDemoMode()) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <div className="mb-3 grid size-11 place-items-center rounded-md border bg-muted">
              <Building2 className="size-5 text-muted-foreground" />
            </div>
            <CardTitle>Create a service company tenant</CardTitle>
            <p className="text-sm text-muted-foreground">
              New companies become organizations. Their settings and all future
              data stay scoped to that organization.
            </p>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Industry templates only set defaults. The product remains one
              shared service-business operating system.
            </p>
            <p className="mt-4">
              Already have a tenant?{" "}
              <Link href="/sign-in" className="font-medium text-foreground">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization onboarding</CardTitle>
            <p className="text-sm text-muted-foreground">
              Company profile, tax defaults, business hours, and starting team
              capacity.
            </p>
          </CardHeader>
          <CardContent>
            <form action={createOrganizationOnboarding} className="grid gap-6">
              <section className="grid gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Company</h2>
                  <p className="text-sm text-muted-foreground">
                    Basic tenant identity and selected service industry template.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="companyName">Company name</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder="Island Cooling & Appliance"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="industryTemplate">Industry template</Label>
                    <Select name="industryTemplate" defaultValue={industryTemplates[0].key}>
                      <SelectTrigger id="industryTemplate" className="w-full">
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {industryTemplates.map((template) => (
                          <SelectItem key={template.key} value={template.key}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="businessPhone">Business phone</Label>
                    <Input
                      id="businessPhone"
                      name="businessPhone"
                      placeholder="+1 (876) 555-0101"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="businessEmail">Business email</Label>
                    <Input
                      id="businessEmail"
                      name="businessEmail"
                      type="email"
                      placeholder="ops@company.com"
                      required
                    />
                  </div>
                </div>
              </section>

              <Separator />

              <section className="grid gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Address</h2>
                  <p className="text-sm text-muted-foreground">
                    Main office or dispatch location.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="addressLine1">Address</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    placeholder="15 Hope Road"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="addressLine2">Address line 2</Label>
                  <Input id="addressLine2" name="addressLine2" placeholder="Suite or unit" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" placeholder="Kingston" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="parish">Parish</Label>
                    <Input id="parish" name="parish" placeholder="St. Andrew" />
                  </div>
                </div>
              </section>

              <Separator />

              <section className="grid gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Financial defaults</h2>
                  <p className="text-sm text-muted-foreground">
                    Currency and tax settings used by quotes and invoices.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" name="currency" defaultValue="JMD" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxLabel">Tax label</Label>
                    <Input id="taxLabel" name="taxLabel" defaultValue="GCT" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="taxRate">Tax rate</Label>
                    <Input
                      id="taxRate"
                      name="taxRate"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue="15"
                      required
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                  <Checkbox name="taxEnabled" defaultChecked />
                  <span>Enable tax collection by default</span>
                </label>
              </section>

              <Separator />

              <section className="grid gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Operations</h2>
                  <p className="text-sm text-muted-foreground">
                    Default working hours and initial technician capacity.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="weekdayOpen">Weekday open</Label>
                    <Input id="weekdayOpen" name="weekdayOpen" type="time" defaultValue="08:00" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="weekdayClose">Weekday close</Label>
                    <Input id="weekdayClose" name="weekdayClose" type="time" defaultValue="17:00" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="saturdayOpen">Saturday open</Label>
                    <Input id="saturdayOpen" name="saturdayOpen" type="time" defaultValue="09:00" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="saturdayClose">Saturday close</Label>
                    <Input id="saturdayClose" name="saturdayClose" type="time" defaultValue="13:00" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="numberOfTechnicians">Number of technicians</Label>
                    <Input
                      id="numberOfTechnicians"
                      name="numberOfTechnicians"
                      type="number"
                      min="0"
                      defaultValue="3"
                      required
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                    <Checkbox name="emergencyAfterHours" />
                    <span>Offer emergency after-hours dispatch</span>
                  </label>
                </div>
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" asChild>
                  <Link href="/sign-in">Cancel</Link>
                </Button>
                <Button type="submit">
                  Create organization
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
