import Link from "next/link";
import { ArrowLeft, Building2, MapPin, Save, StickyNote, UserRound } from "lucide-react";

import { createCustomer } from "@/app/(workspace)/customers/actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  customerStatuses,
  customerTypes,
  locationLabels,
} from "@/lib/service-os/customers";
import { requireTenantContext } from "@/lib/tenant/guard";

export default async function NewCustomerPage() {
  const { session } = await requireTenantContext([
    "PLATFORM_OWNER",
    "COMPANY_ADMIN",
    "DISPATCHER",
    "SALES",
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Create customer"
        badge={session.organization.currency}
        description="Add a tenant-scoped customer record with contact details, customer type, first location, and service notes."
        actions={
          <Button variant="outline" asChild>
            <Link href="/customers">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form action={createCustomer} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4" />
                Basic info
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Customer name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    placeholder="Mona Heights Villas"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="primaryName">Primary contact</Label>
                  <Input
                    id="primaryName"
                    name="primaryName"
                    placeholder="Marsha Lewis"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="type">Customer type</Label>
                  <Select name="type" defaultValue="RESIDENTIAL">
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="ACTIVE">
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="source">Lead/source</Label>
                <Input
                  id="source"
                  name="source"
                  placeholder="Referral, website, walk-in, WhatsApp"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-4" />
                Contact details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+1 (876) 555-0101"
                    inputMode="tel"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    placeholder="+1 (876) 555-0101"
                    inputMode="tel"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contact@customer.com"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Jamaican numbers are displayed in +1 area-code format when possible.
                International numbers can be stored as entered.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4" />
                First location
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="locationLabel">Location type</Label>
                  <Select name="locationLabel" defaultValue="Home">
                    <SelectTrigger id="locationLabel" className="w-full">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationLabels.map((label) => (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="addressLine1">Address</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    placeholder="42 Skyline Drive"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="addressLine2">Address line 2</Label>
                  <Input
                    id="addressLine2"
                    name="addressLine2"
                    placeholder="Apartment, suite, floor"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" placeholder="Kingston" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="parish">Parish/region</Label>
                  <Input id="parish" name="parish" placeholder="St. Andrew" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" defaultValue="Jamaica" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mapUrl">GPS/map link</Label>
                  <Input
                    id="mapUrl"
                    name="mapUrl"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="contactName">Contact at location</Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    placeholder="Site supervisor"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactPhone">Location contact phone</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    placeholder="+1 (876) 555-0199"
                    inputMode="tel"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="accessNotes">Access instructions</Label>
                  <Textarea
                    id="accessNotes"
                    name="accessNotes"
                    rows={4}
                    placeholder="Call before arrival, use side entrance"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="securityNotes">Gate/security notes</Label>
                  <Textarea
                    id="securityNotes"
                    name="securityNotes"
                    rows={4}
                    placeholder="Gate code, guardhouse, visitor ID"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="preferredTimes">Preferred service times</Label>
                  <Textarea
                    id="preferredTimes"
                    name="preferredTimes"
                    rows={4}
                    placeholder="Weekdays 9 AM to 3 PM"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid h-fit gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="size-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="notesSummary">Customer notes</Label>
                <Textarea
                  id="notesSummary"
                  name="notesSummary"
                  rows={8}
                  placeholder="Preferred contact method, billing notes, recurring service context"
                />
              </div>
              <Button type="submit">
                <Save className="size-4" />
                Create customer
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </>
  );
}
