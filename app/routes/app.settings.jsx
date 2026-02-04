/**
 * App Settings Page
 * Allows merchants to configure warehouse location, handling times, and FedEx credentials
 */

import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getAppSettings, saveAppSettings } from "../services/delivery-estimate.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await getAppSettings(session.shop);
  
  return {
    settings: settings || {
      warehouseCity: "",
      warehouseState: "",
      warehousePostalCode: "",
      warehouseCountryCode: "US",
      warehouseStreet: "",
      handlingTimeDays: 1,
      cutoffTime: "14:00",
      fedexApiKey: "",
      fedexSecretKey: "",
      fedexAccountNumber: "",
      isEnabled: true,
      showExactDates: true,
    },
    hasCredentials: !!(settings?.fedexApiKey && settings?.fedexSecretKey),
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "save") {
    const data = {
      warehouseStreet: formData.get("warehouseStreet") || null,
      warehouseCity: formData.get("warehouseCity"),
      warehouseState: formData.get("warehouseState"),
      warehousePostalCode: formData.get("warehousePostalCode"),
      warehouseCountryCode: formData.get("warehouseCountryCode") || "US",
      handlingTimeDays: parseInt(formData.get("handlingTimeDays") || "1", 10),
      cutoffTime: formData.get("cutoffTime") || "14:00",
      fedexApiKey: formData.get("fedexApiKey") || null,
      fedexSecretKey: formData.get("fedexSecretKey") || null,
      fedexAccountNumber: formData.get("fedexAccountNumber") || null,
      isEnabled: formData.get("isEnabled") === "true",
      showExactDates: formData.get("showExactDates") === "true",
    };

    await saveAppSettings(session.shop, data);
    return { success: true, message: "Settings saved successfully" };
  }

  return { success: false, message: "Unknown action" };
};

export default function Settings() {
  const { settings, hasCredentials } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  
  const [formData, setFormData] = useState(settings);
  const [showApiKeys, setShowApiKeys] = useState(false);

  const isSubmitting = fetcher.state === "submitting";

  // Show toast on successful save
  if (fetcher.data?.success) {
    shopify.toast.show(fetcher.data.message);
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const data = new FormData();
    data.append("intent", "save");
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, String(value ?? ""));
    });
    fetcher.submit(data, { method: "POST" });
  };

  return (
    <s-page heading="Delivery Estimate Settings">
      <s-button
        slot="primary-action"
        onClick={handleSubmit}
        {...(isSubmitting ? { loading: true } : {})}
      >
        Save Settings
      </s-button>

      {/* Warehouse Location Section */}
      <s-section heading="Warehouse Location">
        <s-paragraph>
          Enter your warehouse or fulfillment center address. This is where orders ship from.
        </s-paragraph>
        
        <s-box padding="none">
          <s-stack direction="block" gap="base">
            <s-text-field
              label="Street Address (Optional)"
              value={formData.warehouseStreet || ""}
              onInput={(e) => handleChange("warehouseStreet", e.target.value)}
              placeholder="123 Warehouse Way"
            />
            
            <s-stack direction="inline" gap="base">
              <s-text-field
                label="City"
                value={formData.warehouseCity}
                onInput={(e) => handleChange("warehouseCity", e.target.value)}
                placeholder="Charleston"
                required
              />
              
              <s-text-field
                label="State/Province"
                value={formData.warehouseState}
                onInput={(e) => handleChange("warehouseState", e.target.value)}
                placeholder="SC"
                required
              />
            </s-stack>
            
            <s-stack direction="inline" gap="base">
              <s-text-field
                label="Postal Code"
                value={formData.warehousePostalCode}
                onInput={(e) => handleChange("warehousePostalCode", e.target.value)}
                placeholder="29401"
                required
              />
              
              <s-select
                label="Country"
                value={formData.warehouseCountryCode}
                onInput={(e) => handleChange("warehouseCountryCode", e.target.value)}
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="MX">Mexico</option>
              </s-select>
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      {/* Handling Time Section */}
      <s-section heading="Processing & Handling">
        <s-paragraph>
          Configure how long it takes to process and ship an order after it's placed.
        </s-paragraph>
        
        <s-box padding="none">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" gap="base">
              <s-text-field
                label="Handling Time (Business Days)"
                type="number"
                value={String(formData.handlingTimeDays)}
                onInput={(e) => handleChange("handlingTimeDays", parseInt(e.target.value, 10) || 1)}
                min="0"
                max="14"
                helpText="Days needed to process an order before shipping"
              />
              
              <s-text-field
                label="Daily Cutoff Time"
                type="time"
                value={formData.cutoffTime}
                onInput={(e) => handleChange("cutoffTime", e.target.value)}
                helpText="Orders after this time ship the next business day"
              />
            </s-stack>
          </s-stack>
        </s-box>
      </s-section>

      {/* FedEx API Credentials Section */}
      <s-section heading="FedEx API Credentials">
        <s-paragraph>
          Enter your FedEx Developer API credentials. Get them from the{" "}
          <s-link href="https://developer.fedex.com/" target="_blank">
            FedEx Developer Portal
          </s-link>.
        </s-paragraph>
        
        {hasCredentials && !showApiKeys && (
          <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack direction="inline" gap="base" align="center">
              <s-text>✓ API credentials are configured</s-text>
              <s-button variant="tertiary" onClick={() => setShowApiKeys(true)}>
                Update Credentials
              </s-button>
            </s-stack>
          </s-box>
        )}
        
        {(!hasCredentials || showApiKeys) && (
          <s-box padding="none">
            <s-stack direction="block" gap="base">
              <s-text-field
                label="FedEx API Key"
                value={formData.fedexApiKey || ""}
                onInput={(e) => handleChange("fedexApiKey", e.target.value)}
                placeholder="Your FedEx API Key"
                type="password"
              />
              
              <s-text-field
                label="FedEx Secret Key"
                value={formData.fedexSecretKey || ""}
                onInput={(e) => handleChange("fedexSecretKey", e.target.value)}
                placeholder="Your FedEx Secret Key"
                type="password"
              />
              
              <s-text-field
                label="FedEx Account Number"
                value={formData.fedexAccountNumber || ""}
                onInput={(e) => handleChange("fedexAccountNumber", e.target.value)}
                placeholder="Your FedEx Account Number"
              />
            </s-stack>
          </s-box>
        )}
      </s-section>

      {/* Display Options Section */}
      <s-section heading="Display Options">
        <s-box padding="none">
          <s-stack direction="block" gap="base">
            <s-checkbox
              checked={formData.isEnabled}
              onInput={(e) => handleChange("isEnabled", e.target.checked)}
            >
              Enable delivery estimates on product pages
            </s-checkbox>
            
            <s-checkbox
              checked={formData.showExactDates}
              onInput={(e) => handleChange("showExactDates", e.target.checked)}
            >
              Show exact dates (e.g., "Feb 10 - 12") instead of transit days (e.g., "3-5 business days")
            </s-checkbox>
          </s-stack>
        </s-box>
      </s-section>

      {/* Help Section */}
      <s-section slot="aside" heading="Setup Guide">
        <s-unordered-list>
          <s-list-item>
            <s-text>Step 1:</s-text> Enter your warehouse address
          </s-list-item>
          <s-list-item>
            <s-text>Step 2:</s-text> Set your processing/handling time
          </s-list-item>
          <s-list-item>
            <s-text>Step 3:</s-text> Add FedEx API credentials
          </s-list-item>
          <s-list-item>
            <s-text>Step 4:</s-text> Add the app block to your theme
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Need FedEx API Access?">
        <s-paragraph>
          Visit the{" "}
          <s-link href="https://developer.fedex.com/" target="_blank">
            FedEx Developer Portal
          </s-link>{" "}
          to create an account and get your API credentials.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
