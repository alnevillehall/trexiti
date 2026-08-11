"use client";

import type { ChangeEventHandler } from "react";
import { useMemo, useState } from "react";
import {
  CalendarClock,
  FileImage,
  MapPin,
  Save,
  UserPlus,
  Wrench,
} from "lucide-react";

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
import { customerTypes } from "@/lib/service-os/customers";
import {
  jobSourceOptions,
  paymentStatusOptions,
  priorityOptions,
  type JobFormOptions,
} from "@/lib/service-os/jobs";

const CREATE_CUSTOMER_VALUE = "__new_customer";
const CREATE_LOCATION_VALUE = "__new_location";
const CREATE_ASSET_VALUE = "__new_asset";
const NONE_VALUE = "__none";

type JobFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  options: JobFormOptions;
  submitLabel?: string;
};

export function JobForm({
  action,
  options,
  submitLabel = "Create job",
}: JobFormProps) {
  const initialCustomerId = options.customers[0]?.id ?? CREATE_CUSTOMER_VALUE;
  const initialCustomer = options.customers.find(
    (customer) => customer.id === initialCustomerId,
  );
  const initialLocationId = initialCustomer?.locations[0]?.id ?? CREATE_LOCATION_VALUE;
  const initialJobType = options.jobTypes[0]?.name ?? "Diagnostic visit";
  const initialDuration = options.jobTypes[0]?.defaultDurationMin ?? 90;

  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId);
  const [selectedAssetId, setSelectedAssetId] = useState(NONE_VALUE);
  const [selectedJobType, setSelectedJobType] = useState(initialJobType);
  const [duration, setDuration] = useState(String(initialDuration));

  const selectedCustomer = useMemo(
    () => options.customers.find((customer) => customer.id === selectedCustomerId),
    [options.customers, selectedCustomerId],
  );
  const selectedLocation = useMemo(
    () => selectedCustomer?.locations.find((location) => location.id === selectedLocationId),
    [selectedCustomer, selectedLocationId],
  );
  const locationAssets = useMemo(() => {
    if (!selectedCustomer || selectedLocationId === CREATE_LOCATION_VALUE) {
      return [];
    }

    return selectedCustomer.assets.filter((asset) => asset.locationId === selectedLocationId);
  }, [selectedCustomer, selectedLocationId]);

  const isNewCustomer = selectedCustomerId === CREATE_CUSTOMER_VALUE;
  const isNewLocation = isNewCustomer || selectedLocationId === CREATE_LOCATION_VALUE;
  const isNewAsset = selectedAssetId === CREATE_ASSET_VALUE;

  function handleCustomerChange(customerId: string) {
    const nextCustomer = options.customers.find((customer) => customer.id === customerId);
    setSelectedCustomerId(customerId);
    setSelectedLocationId(nextCustomer?.locations[0]?.id ?? CREATE_LOCATION_VALUE);
    setSelectedAssetId(NONE_VALUE);
  }

  function handleLocationChange(locationId: string) {
    setSelectedLocationId(locationId);
    setSelectedAssetId(NONE_VALUE);
  }

  function handleJobTypeChange(jobTypeName: string) {
    setSelectedJobType(jobTypeName);
    const jobType = options.jobTypes.find((item) => item.name === jobTypeName);

    if (jobType?.defaultDurationMin) {
      setDuration(String(jobType.defaultDurationMin));
    }
  }

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-4" />
              Customer and location
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="customerId">Customer</Label>
                <Select
                  name="customerId"
                  value={selectedCustomerId}
                  onValueChange={handleCustomerChange}
                >
                  <SelectTrigger id="customerId" className="w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                    <SelectItem value={CREATE_CUSTOMER_VALUE}>
                      Create customer from this request
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customerLocationId">Location</Label>
                <Select
                  name="customerLocationId"
                  value={selectedLocationId}
                  onValueChange={handleLocationChange}
                  disabled={isNewCustomer}
                >
                  <SelectTrigger id="customerLocationId" className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCustomer?.locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.label} - {location.address}
                      </SelectItem>
                    ))}
                    <SelectItem value={CREATE_LOCATION_VALUE}>
                      Add new location
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isNewCustomer ? (
              <div className="rounded-md border bg-muted/25 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField id="newCustomerName" label="Company/customer name" required />
                  <TextField id="newCustomerContactName" label="Primary contact" />
                  <TextField id="newCustomerPhone" label="Phone" placeholder="+1 (876) 555-0123" />
                  <TextField id="newCustomerWhatsApp" label="WhatsApp" placeholder="+1 (876) 555-0123" />
                  <TextField id="newCustomerEmail" label="Email" type="email" />
                  <div className="grid gap-2">
                    <Label htmlFor="newCustomerType">Customer type</Label>
                    <Select name="newCustomerType" defaultValue="RESIDENTIAL">
                      <SelectTrigger id="newCustomerType" className="w-full">
                        <SelectValue placeholder="Customer type" />
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
                </div>
                <div className="mt-4 grid gap-2">
                  <Label htmlFor="newCustomerNotes">Customer notes</Label>
                  <Textarea
                    id="newCustomerNotes"
                    name="newCustomerNotes"
                    rows={3}
                    placeholder="Preferred contact method, account notes, or intake context"
                  />
                </div>
              </div>
            ) : null}

            {isNewLocation ? (
              <div className="rounded-md border bg-muted/25 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField id="newLocationLabel" label="Location label" placeholder="Home, office, villa" />
                  <TextField id="newLocationAddressLine1" label="Address" required />
                  <TextField id="newLocationAddressLine2" label="Address line 2" />
                  <TextField id="newLocationCity" label="City/town" placeholder="Kingston" />
                  <TextField id="newLocationParish" label="Parish/region" placeholder="St. Andrew" />
                  <TextField id="newLocationCountry" label="Country" placeholder="Jamaica" />
                  <TextField id="newLocationContactName" label="Site contact" />
                  <TextField id="newLocationContactPhone" label="Site contact phone" />
                  <TextField id="newLocationMapUrl" label="GPS/map link" type="url" />
                  <TextField id="newLocationPreferredTimes" label="Preferred service times" />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <TextAreaField id="newLocationAccessNotes" label="Access instructions" />
                  <TextAreaField id="newLocationSecurityNotes" label="Gate/security notes" />
                </div>
              </div>
            ) : (
              <div className="rounded-md border bg-muted/25 p-4 text-sm text-muted-foreground">
                <MapPin className="mb-2 size-4" />
                {selectedLocation?.address ?? "Select a location to show address details."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="size-4" />
              Job details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="serviceCategoryName">Service category</Label>
                <Select name="serviceCategoryName" defaultValue={options.serviceCategories[0]?.name}>
                  <SelectTrigger id="serviceCategoryName" className="w-full">
                    <SelectValue placeholder="Select service category" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.serviceCategories.map((category) => (
                      <SelectItem key={category.slug} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="jobType">Job type</Label>
                <Select
                  name="jobType"
                  value={selectedJobType}
                  onValueChange={handleJobTypeChange}
                >
                  <SelectTrigger id="jobType" className="w-full">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.jobTypes.map((jobType) => (
                      <SelectItem key={jobType.slug} value={jobType.name}>
                        {jobType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextField id="title" label="Job title" placeholder="AC not cooling" />
              <div className="grid gap-2">
                <Label htmlFor="assetId">Asset/equipment</Label>
                <Select
                  name="assetId"
                  value={selectedAssetId}
                  onValueChange={setSelectedAssetId}
                >
                  <SelectTrigger id="assetId" className="w-full">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>No asset selected</SelectItem>
                    {locationAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name}
                        {asset.assetType ? ` - ${asset.assetType}` : ""}
                      </SelectItem>
                    ))}
                    <SelectItem value={CREATE_ASSET_VALUE}>
                      Create asset from this job
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isNewAsset ? (
              <div className="rounded-md border bg-muted/25 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField id="newAssetName" label="Asset name/label" placeholder="Kitchen refrigerator" required />
                  <TextField id="newAssetTypeName" label="Asset type" placeholder="Refrigerator, Water pump, Breaker panel" required />
                  <TextField id="newAssetManufacturer" label="Brand" />
                  <TextField id="newAssetModelNumber" label="Model number" />
                  <TextField id="newAssetSerialNumber" label="Serial number" />
                </div>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="customerComplaint">Customer complaint/request</Label>
              <Textarea
                id="customerComplaint"
                name="customerComplaint"
                rows={5}
                placeholder="Capture exactly what the customer says is happening."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="internalNotes">Internal notes</Label>
              <Textarea
                id="internalNotes"
                name="internalNotes"
                rows={4}
                placeholder="Dispatch notes, access risks, quote context, or technician reminders"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid h-fit gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4" />
              Dispatch
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="NORMAL">
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source">Job source</Label>
              <Select name="source" defaultValue="PHONE">
                <SelectTrigger id="source" className="w-full">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {jobSourceOptions.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="technicianProfileId">Assign technician</Label>
              <Select name="technicianProfileId" defaultValue={NONE_VALUE}>
                <SelectTrigger id="technicianProfileId" className="w-full">
                  <SelectValue placeholder="Leave unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Leave unassigned</SelectItem>
                  {options.technicians.map((technician) => (
                    <SelectItem key={technician.id} value={technician.id}>
                      {technician.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid gap-4">
              <TextField id="preferredDate" label="Preferred date" type="date" />
              <div className="grid gap-2">
                <Label htmlFor="preferredWindow">Preferred window</Label>
                <Select name="preferredWindow" defaultValue="morning">
                  <SelectTrigger id="preferredWindow" className="w-full">
                    <SelectValue placeholder="Preferred window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="8-12">8 AM - 12 PM</SelectItem>
                    <SelectItem value="12-4">12 PM - 4 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TextField id="scheduledDate" label="Scheduled date" type="date" />
              <TextField id="scheduledTime" label="Scheduled time" type="time" />
              <TextField
                id="estimatedDurationMin"
                label="Estimated duration"
                type="number"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="size-4" />
              Attachments and billing
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="paymentStatus">Payment state</Label>
              <Select name="paymentStatus" defaultValue="NOT_INVOICED">
                <SelectTrigger id="paymentStatus" className="w-full">
                  <SelectValue placeholder="Payment state" />
                </SelectTrigger>
                <SelectContent>
                  {paymentStatusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TextField id="attachmentFileName" label="Attachment label" placeholder="customer-photo.jpg" />
            <TextField id="attachmentUrl" label="Attachment URL" type="url" placeholder="https://..." />
            <Separator />
            <Button type="submit" className="w-full">
              <Save className="size-4" />
              {submitLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function TextField({
  id,
  label,
  type = "text",
  placeholder,
  required,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function TextAreaField({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} name={id} rows={3} />
    </div>
  );
}
