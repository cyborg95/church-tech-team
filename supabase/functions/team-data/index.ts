const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-team-passcode",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const collections = ["instructions", "schedule", "timetable", "members"] as const;
type Collection = (typeof collections)[number];
type StoredRow = { collection: string; id: string; payload: Record<string, unknown> };

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function matchesSecret(received: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(received);
  const right = encoder.encode(expected);
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

function isCollection(value: unknown): value is Collection {
  return typeof value === "string" && collections.includes(value as Collection);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createRow(collection: Collection, item: unknown): StoredRow | null {
  if (!isRecord(item) || typeof item.id !== "string" || item.id.length < 1 || item.id.length > 128) return null;
  return { collection, id: item.id, payload: item };
}

function groupRows(rows: StoredRow[]) {
  const data: Record<Collection, Record<string, unknown>[]> = {
    instructions: [],
    schedule: [],
    timetable: [],
    members: [],
  };
  for (const row of rows) {
    if (isCollection(row.collection)) data[row.collection].push(row.payload);
  }
  return data;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond(405, { error: "Method not allowed." });

  const expectedPasscode = Deno.env.get("TEAM_SHARED_PASSCODE");
  const receivedPasscode = request.headers.get("x-team-passcode") ?? "";
  if (!expectedPasscode || expectedPasscode.length < 12 || expectedPasscode.length > 256) {
    console.error("TEAM_SHARED_PASSCODE is missing or outside the allowed length.");
    return respond(503, { error: "Team access is not configured. Ask the site administrator." });
  }
  if (receivedPasscode.length > 256 || !matchesSecret(receivedPasscode, expectedPasscode)) {
    return respond(401, { error: "That passcode was not accepted." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("Supabase function secrets are not configured.");
    return respond(503, { error: "The shared database is not configured. Ask the site administrator." });
  }

  let body: Record<string, unknown>;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).length > 150_000) return respond(413, { error: "Request is too large." });
    const parsed: unknown = JSON.parse(rawBody);
    if (!isRecord(parsed)) return respond(400, { error: "Invalid request." });
    body = parsed;
  } catch {
    return respond(400, { error: "Invalid JSON request." });
  }

  const baseUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/team_data`;
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  async function readRows(): Promise<StoredRow[]> {
    const response = await fetch(`${baseUrl}?select=collection,id,payload`, { headers });
    if (!response.ok) throw new Error(`Database read failed (${response.status}).`);
    return await response.json() as StoredRow[];
  }

  async function writeRows(rows: StoredRow[]) {
    const response = await fetch(`${baseUrl}?on_conflict=collection,id`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
    if (!response.ok) throw new Error(`Database write failed (${response.status}).`);
  }

  try {
    if (body.action === "load") {
      let rows = await readRows();
      const initialized = rows.some((row) => row.collection === "system" && row.id === "initialized");
      if (!initialized) {
        const initialData = isRecord(body.seedData) ? body.seedData : {};
        const seedRows: StoredRow[] = [];
        for (const collection of collections) {
          const items = initialData[collection];
          if (!Array.isArray(items)) continue;
          for (const item of items) {
            const row = createRow(collection, item);
            if (!row) return respond(400, { error: "Initial team data contains an invalid item." });
            seedRows.push(row);
          }
        }
        seedRows.push({ collection: "system", id: "initialized", payload: { value: true } });
        await writeRows(seedRows);
        rows = await readRows();
      } else if (!rows.some((row) => row.collection === "system" && row.id === "guides-v1")) {
        const existingGuideIds = new Set(rows.filter((row) => row.collection === "instructions").map((row) => row.id));
        const initialGuides = isRecord(body.seedData) && Array.isArray(body.seedData.instructions)
          ? body.seedData.instructions
          : [];
        const missingGuides: StoredRow[] = [];
        for (const guide of initialGuides) {
          const row = createRow("instructions", guide);
          if (!row) return respond(400, { error: "Initial instructions contain an invalid item." });
          if (!existingGuideIds.has(row.id)) missingGuides.push(row);
        }
        missingGuides.push({ collection: "system", id: "guides-v1", payload: { value: true } });
        await writeRows(missingGuides);
        rows = await readRows();
      }
      return respond(200, { data: groupRows(rows) });
    }

    if (body.action === "upsert" && isCollection(body.collection)) {
      const row = createRow(body.collection, body.item);
      if (!row) return respond(400, { error: "Invalid item." });
      await writeRows([row]);
      return respond(200, { ok: true });
    }

    if (body.action === "delete" && isCollection(body.collection)
      && typeof body.id === "string" && body.id.length > 0 && body.id.length <= 128) {
      const query = new URLSearchParams({ collection: `eq.${body.collection}`, id: `eq.${body.id}` });
      const response = await fetch(`${baseUrl}?${query}`, { method: "DELETE", headers });
      if (!response.ok) throw new Error(`Database delete failed (${response.status}).`);
      return respond(200, { ok: true });
    }

    return respond(400, { error: "Unsupported request." });
  } catch (error) {
    console.error("Team data request failed:", error);
    return respond(500, { error: "Could not complete the database request. Try again shortly." });
  }
});
