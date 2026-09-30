// Moxo flow management: list flows for a user, or start a new flow from a template.
// The PAT never leaves the server.
const MOXO_API = "https://api.moxo.com";
const PAT = process.env.MOXO_PAT;

// Template IDs and their role mappings (keyed by scene name)
const TEMPLATES = {
  rockstar: {
    id: "31cc564d-a688-4c77-96de-c618b4c68d27",
    roles: [
      { roleId: "role-54886ba054a2", roleName: "Expert" },
      { roleId: "role-abcd157317b2", roleName: "MyGentic Reviewer", defaultEmail: "pavan.prasad@moxo.com" },
    ],
    nameTemplate: (email) => `Industry Rockstar Onboarding — ${email}`,
  },
  member: {
    id: "57484144-0f7d-4d3a-befe-07ae7b5894db",
    roles: [
      { roleId: "role-f1b451376cce", roleName: "New Member" },
    ],
    nameTemplate: (email) => `Professional Brain Setup — ${email}`,
  },
  coach: {
    id: "23a406c9-bb89-43ea-ac37-a29d24039559",
    roles: [
      { roleId: "role-932b0b600194", roleName: "Client" },
      { roleId: "role-614ffe191375", roleName: "Coach", defaultEmail: "pavan.prasad@moxo.com" },
    ],
    nameTemplate: (email) => `Coach Onboarding — ${email}`,
  },
  marketplace: {
    id: "fcccc92a-9561-4590-9173-ae93cc4714bb",
    roles: [
      { roleId: "role-5eba870747ec", roleName: "Brain Builder" },
      { roleId: "role-77f197199107", roleName: "Curation Reviewer", defaultEmail: "pavan.prasad@moxo.com" },
    ],
    nameTemplate: (email) => `Brain Marketplace Submission — ${email}`,
  },
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors(event) };
  }

  const headers = { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" };

  // GET /api/moxo-flows?scene=rockstar — list flows for the given template
  if (event.httpMethod === "GET") {
    const scene = event.queryStringParameters?.scene;
    const tmpl = TEMPLATES[scene];
    if (!tmpl) {
      return json(event, 400, { error: `Unknown scene: ${scene}. Valid: ${Object.keys(TEMPLATES).join(", ")}` });
    }
    const res = await fetch(`${MOXO_API}/v1/flows?templateId=${tmpl.id}&limit=10`, { headers });
    const data = await res.json();
    return json(event, res.status, data);
  }

  // POST /api/moxo-flows — start a new flow for a user
  if (event.httpMethod === "POST") {
    let body;
    try { body = JSON.parse(event.body || "{}"); } catch { return json(event, 400, { error: "Invalid JSON" }); }

    const { scene, userEmail, brainData } = body;
    const tmpl = TEMPLATES[scene];
    if (!tmpl || !userEmail) {
      return json(event, 400, { error: "scene and userEmail required" });
    }

    // Build role assignments — user fills primary role, defaults fill internal roles
    const roleAssignments = tmpl.roles.map(r => ({
      roleId: r.roleId,
      email: r.defaultEmail || userEmail,
    }));

    const payload = {
      name: tmpl.nameTemplate(userEmail),
      roleAssignments,
      ...(brainData && Object.keys(brainData).length > 0 ? { customFields: [] } : {}),
    };

    const res = await fetch(`${MOXO_API}/v1/templates/${tmpl.id}/start`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return json(event, res.status, data);
  }

  return json(event, 405, { error: "Method not allowed" });
};

function json(event, status, body) {
  return { statusCode: status, headers: { ...cors(event), "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
function cors(event) {
  const origin = event.headers.origin || event.headers.Origin || "*";
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
}
