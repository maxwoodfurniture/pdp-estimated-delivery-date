/**
 * Public API endpoint for delivery estimates
 * Called by the theme app extension to get delivery date estimates
 * 
 * This endpoint is public (no auth required) to allow storefront access
 */

import { getDeliveryEstimate } from "../services/delivery-estimate.js";
import { getClientIP } from "../services/geolocation.js";

/**
 * Handle GET request for delivery estimate
 * Query params:
 *   - shop: Shopify shop domain (required)
 *   - postalCode: Override postal code (optional)
 */
export const loader = async ({ request }) => {
  // Set CORS headers for storefront access
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=300", // Cache for 5 minutes
  };

  // Handle preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const postalCode = url.searchParams.get("postalCode");

    if (!shop) {
      return new Response(
        JSON.stringify({ success: false, error: "Shop parameter required" }),
        { status: 400, headers }
      );
    }

    // Get client IP for geolocation
    const clientIP = getClientIP(request);

    // Get delivery estimate
    const estimate = await getDeliveryEstimate(shop, clientIP, postalCode);

    return new Response(JSON.stringify(estimate), {
      status: estimate.success ? 200 : 400,
      headers,
    });
  } catch (error) {
    console.error("Delivery estimate API error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers }
    );
  }
};

/**
 * Handle POST request for delivery estimate with custom location
 * Body:
 *   - shop: Shopify shop domain (required)
 *   - postalCode: Customer postal code (optional)
 *   - city: Customer city (optional)
 *   - state: Customer state (optional)
 */
export const action = async ({ request }) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const body = await request.json();
    const { shop, postalCode } = body;

    if (!shop) {
      return new Response(
        JSON.stringify({ success: false, error: "Shop parameter required" }),
        { status: 400, headers }
      );
    }

    // Get client IP as fallback
    const clientIP = getClientIP(request);

    // Get delivery estimate
    const estimate = await getDeliveryEstimate(shop, clientIP, postalCode);

    return new Response(JSON.stringify(estimate), {
      status: estimate.success ? 200 : 400,
      headers,
    });
  } catch (error) {
    console.error("Delivery estimate API error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers }
    );
  }
};
