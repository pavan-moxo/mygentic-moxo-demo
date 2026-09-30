// Lists flows for a user OR creates a new flow from a template.
const MOXO_API = "https://api.moxo.com";
const PAT = process.env.MOXO_PAT;

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(event) };
  }

  const headers = {
    Authorization: `Bearer ${PAT}`,
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "GET") {
    const params = event.queryStringParameters || {};
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${MOXO_API}/v1/flows${qs ? "?" + qs : ""}`, { headers });
    const data = await res.json();
    return { statusCode: res.status, headers: { ...cors(event), "Content-Type": "application/json" }, body: JSON.stringify(data) };
  }

  if (event.httpMethod === "POST") {
    let body;
    try { body = JSON.parse(event.body || "{}"); } catch { return { statusCode: 400, headers: cors(event), body: "Invalid JSON" }; }

    // Create a flow from a template, injected with brain data
    const { templateId, participantEmail, brainData } = body;
    if (!templateId || !participantEmail) {
      return { statusCode: 400, headers: cors(event), body: JSON.stringify({ error: "templateId and participantEmail required" }) };
    }

    const payload = {
      templateId,
      participants: [{ email: participantEmail }],
      // Brain data injected as flow metadata / pre-fill values
      metadata: brainData || {},
    };

    const res = await fetch(`${MOXO_API}/v1/flows`, { method: "POST", headers, body: JSON.stringify(payload) });
    const data = await res.json();
    return { statusCode: res.status, headers: { ...cors(event), "Content-Type": "application/json" }, body: JSON.stringify(data) };
  }

  return { statusCode: 405, headers: cors(event), body: "Method not allowed" };
};

function cors(event) {
  const origin = event.headers.origin || event.headers.Origin || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}
