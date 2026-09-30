// Mints a short-lived Moxo SDK session token for a given user email.
// The PAT never leaves the server.
const MOXO_API = "https://api.moxo.com";
const PAT = process.env.MOXO_PAT;

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(event) };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors(event), body: "Method not allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: cors(event), body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { email } = body;
  if (!email) {
    return { statusCode: 400, headers: cors(event), body: JSON.stringify({ error: "email required" }) };
  }

  const origin = event.headers.origin || event.headers.Origin || "https://mygentic-moxo.netlify.app";

  const res = await fetch(`${MOXO_API}/sdk/auth/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      statusCode: res.status,
      headers: cors(event),
      body: JSON.stringify({ error: data.error?.message || "Failed to mint session", code: data.error?.code }),
    };
  }

  return {
    statusCode: 200,
    headers: { ...cors(event), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
};

function cors(event) {
  const origin = event.headers.origin || event.headers.Origin || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
