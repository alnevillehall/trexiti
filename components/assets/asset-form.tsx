"use client";

import { useMemo, useState } from "react";
import { Camera, Save } from "lucide-react";

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
  assetStatuses,
  formatCustomFieldValue,
  getAssetFieldDefinitions,
  warrantyStatuses,
  type AssetCustomerOption,
  type AssetCustomFieldDefinition,
  type AssetProfile,
  type AssetTypeOption,
} from "@/lib/service-os/assets";

type AssetFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  assetTypes: AssetTypeOption[];
  customers: AssetCustomerOption[];
  industryKey: string;
  submitLabel: string;
  initialAsset?: AssetProfile;
};

export function AssetForm({
  action,
  assetTypes,
  customers,
  industryKey,
  submitLabel,
  initialAsset,
}: AssetFormProps) {
  const initialCustomerId = initialAsset?.customerId ?? customers[0]?.id ?? "";
  const initialCustomer = customers.find((customer) => customer.id === initialCustomerId) ?? customers[0];
  const initialLocationId = initialAsset?.locationId ?? initialCustomer?.locations[0]?.id ?? "";
  const initialAssetType =
    initialAsset?.assetType ?? assetTypes[0]?.name ?? "Equipment";

  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId);
  const [selectedAssetType, setSelectedAssetType] = useState(initialAssetType);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) ?? customers[0],
    [customers, selectedCustomerId],
  );

  const fieldDefinitions = useMemo(
    () => getAssetFieldDefinitions(industryKey, selectedAssetType),
    [industryKey, selectedAssetType],
  );

  function handleCustomerChange(customerId: string) {
    const nextCustomer = customers.find((customer) => customer.id === customerId);
    setSelectedCustomerId(customerId);
    setSelectedLocationId(nextCustomer?.locations[0]?.id ?? "");
  }

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      {initialAsset ? <input type="hidden" name="assetId" value={initialAsset.id} /> : null}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer and location</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="customerId">Customer</Label>
                <Select
                  name="customerId"
                  value={selectedCustomerId}
                  onValueChange={handleCustomerChange}
                  disabled={!customers.length}
                >
                  <SelectTrigger id="customerId" className="w-full">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerLocationId">Location</Label>
                <Select
                  name="customerLocationId"
                  value={selectedLocationId}
                  onValueChange={setSelectedLocationId}
                  disabled={!selectedCustomer?.locations.length}
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="assetTypeName">Asset type</Label>
                <Select
                  name="assetTypeName"
                  value={selectedAssetType}
                  onValueChange={setSelectedAssetType}
                >
                  <SelectTrigger id="assetTypeName" className="w-full">
                    <SelectValue placeholder="Select asset type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((assetType) => (
                      <SelectItem key={assetType.slug} value={assetType.name}>
                        {assetType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name/label</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={initialAsset?.name}
                  placeholder="Lobby commercial AC"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="manufacturer">Brand</Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  defaultValue={initialAsset?.brand ?? ""}
                  placeholder="Carrier"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="modelNumber">Model number</Label>
                <Input
                  id="modelNumber"
                  name="modelNumber"
                  defaultValue={initialAsset?.modelNumber ?? ""}
                  placeholder="CAC-48000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serialNumber">Serial number</Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  defaultValue={initialAsset?.serialNumber ?? ""}
                  placeholder="SN-2048"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <DateField
                id="installedAt"
                label="Installation date"
                defaultValue={dateInputValue(initialAsset?.installedAt)}
              />
              <div className="grid gap-2">
                <Label htmlFor="warrantyStatus">Warranty status</Label>
                <Select
                  name="warrantyStatus"
                  defaultValue={initialAsset?.warrantyStatus ?? "Unknown"}
                >
                  <SelectTrigger id="warrantyStatus" className="w-full">
                    <SelectValue placeholder="Warranty" />
                  </SelectTrigger>
                  <SelectContent>
                    {warrantyStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DateField
                id="warrantyExpiresAt"
                label="Warranty expires"
                defaultValue={dateInputValue(initialAsset?.warrantyExpiresAt)}
              />
              <DateField
                id="lastServiceAt"
                label="Last service date"
                defaultValue={dateInputValue(initialAsset?.lastServiceAt)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={initialAsset?.status ?? "ACTIVE"}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notesSummary">Notes</Label>
                <Textarea
                  id="notesSummary"
                  name="notesSummary"
                  rows={4}
                  defaultValue={initialAsset?.notesSummary ?? ""}
                  placeholder="Known condition, service constraints, warranty notes"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom fields for {selectedAssetType}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fields are selected from the active industry template and asset type.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {fieldDefinitions.map((field) => (
              <CustomField
                key={field.key}
                field={field}
                value={initialAsset?.customFields[field.key]}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid h-fit gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="size-4" />
              Photos/attachments
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="attachmentFileName">Attachment label</Label>
              <Input
                id="attachmentFileName"
                name="attachmentFileName"
                placeholder="asset-label.jpg"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="attachmentUrl">Attachment URL</Label>
              <Input
                id="attachmentUrl"
                name="attachmentUrl"
                placeholder="https://..."
              />
            </div>
            <Separator />
            <Button type="submit" disabled={!customers.length}>
              <Save className="size-4" />
              {submitLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

function DateField({
  id,
  label,
  defaultValue,
}: {
  id: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type="date" defaultValue={defaultValue} />
    </div>
  );
}

function CustomField({
  field,
  value,
}: {
  field: AssetCustomFieldDefinition;
  value?: unknown;
}) {
  const name = `custom.${field.key}`;
  const stringValue = formatCustomFieldValue(value);
  const defaultValue = stringValue === "Not captured" ? "" : stringValue;

  if (field.type === "SELECT") {
    return (
      <div className="grid gap-2">
        <Label htmlFor={name}>{field.label}</Label>
        <Select name={name} defaultValue={defaultValue || undefined}>
          <SelectTrigger id={name} className="w-full">
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "BOOLEAN") {
    return (
      <div className="grid gap-2">
        <Label htmlFor={name}>{field.label}</Label>
        <Select name={name} defaultValue={defaultValue || "No"}>
          <SelectTrigger id={name} className="w-full">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Yes">Yes</SelectItem>
            <SelectItem value="No">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{field.label}</Label>
      <Input
        id={name}
        name={name}
        type={field.type === "DATE" ? "date" : field.type === "NUMBER" ? "number" : "text"}
        defaultValue={field.type === "DATE" ? dateInputValue(value) : defaultValue}
        placeholder={field.placeholder}
        required={field.required}
      />
    </div>
  );
}

function dateInputValue(value?: unknown) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const parsed = new Date(String(value));

  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString().slice(0, 10);
}
