// Headless SDK proxy — forwards SDK calls using the caller's session token.
// The session token comes from /api/moxo-session and is short-lived (15 min).
// This proxy adds CORS headers so the browser can call SDK endpoints.
const MOXO_API = "https://api.moxo.com";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(event) };
  }

  // Session token comes from the client (it's already short-lived and scoped)
  const sessionToken = event.headers.authorization?.replace("Bearer ", "");
  if (!sessionToken) {
    return json(event, 401, { error: "Session token required in Authorization header" });
  }

  const sdkHeaders = {
    Authorization: `Bearer ${sessionToken}`,
    "Content-Type": "application/json",
  };

  // Route: /api/moxo-sdk?path=/sdk/v1/dashboard
  const path = event.queryStringParameters?.path;
  if (!path || !path.startsWith("/sdk/")) {
    return json(event, 400, { error: "path query param required, must start with /sdk/" });
  }

  const url = `${MOXO_API}${path}`;

  if (event.httpMethod === "GET") {
    const res = await fetch(url, { headers: sdkHeaders });
    const data = await res.json();
    return json(event, res.status, data);
  }

  if (event.httpMethod === "POST") {
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch { /* ignore */ }
    const res = await fetch(url, { method: "POST", headers: sdkHeaders, body: JSON.stringify(body) });
    const data = await res.json();
    return json(event, res.status, data);
  }

  return json(event, 405, { error: "Method not allowed" });
};

function json(event, status, body) {
  return {
    statusCode: status,
    headers: { ...cors(event), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
function cors(event) {
  const origin = event.headers.origin || event.headers.Origin || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}
