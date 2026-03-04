import test from "node:test";
import assert from "node:assert/strict";
import { AddressInfo } from "node:net";
import { StubAIClient } from "../ai/client.js";
import { resetConfigForTests } from "../config.js";
import { StubMessagingAdapter } from "../messaging/stub.js";
import { createServer } from "../server.js";
import { setupTestDb, teardownTestDb } from "./test-helpers.js";

async function startTestServer() {
  delete process.env.API_TOKEN;
  delete process.env.API_TOKEN_READ;
  delete process.env.API_TOKEN_WRITE;
  delete process.env.API_TOKEN_ADMIN;
  resetConfigForTests();
  const app = createServer({
    aiClient: new StubAIClient(() => JSON.stringify([])),
    messaging: new StubMessagingAdapter()
  });
  const server = await new Promise<import("node:http").Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as AddressInfo).port;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  };
}

async function onboardTwilioTenant(baseUrl: string): Promise<{ id: string }> {
  const response = await fetch(`${baseUrl}/api/wa/tenants`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      displayName: "Clinic One",
      provider: "twilio",
      whatsappNumber: "+919900001111",
      twilioFromNumber: "+919900001111",
      twilioAccountSid: "AC_test",
      twilioAuthToken: "auth_test",
      anthropicApiKey: "anthropic_test",
      defaultLanguage: "hi",
      defaultSpecialtyId: "family_medicine",
      defaultWorkflow: "triage_intake"
    })
  });
  assert.equal(response.status, 201);
  const body = (await response.json()) as {
    ok: boolean;
    data: { id: string };
  };
  assert.equal(body.ok, true);
  return { id: body.data.id };
}

async function onboardWebTenant(baseUrl: string): Promise<{ id: string }> {
  const response = await fetch(`${baseUrl}/api/wa/tenants`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      displayName: "Clinic Web",
      provider: "whatsapp_web",
      whatsappNumber: "+919900001112",
      anthropicApiKey: "anthropic_test",
      defaultLanguage: "en",
      defaultSpecialtyId: "family_medicine",
      defaultWorkflow: "triage_intake"
    })
  });
  assert.equal(response.status, 201);
  const body = (await response.json()) as {
    ok: boolean;
    data: { id: string };
  };
  assert.equal(body.ok, true);
  return { id: body.data.id };
}

test("api wa tenant onboarding creates connected worker state", async () => {
  const dbPath = setupTestDb("wa-agentic-onboard");
  const svc = await startTestServer();
  try {
    const tenant = await onboardTwilioTenant(svc.baseUrl);

    const workersRes = await fetch(`${svc.baseUrl}/api/wa/workers`);
    assert.equal(workersRes.status, 200);
    const workersBody = (await workersRes.json()) as {
      ok: boolean;
      data: Array<{ tenantId: string; status: string; running: boolean }>;
    };
    assert.equal(workersBody.ok, true);
    assert.equal(workersBody.data.length, 1);
    assert.equal(workersBody.data[0].tenantId, tenant.id);
    assert.equal(workersBody.data[0].status, "connected");
    assert.equal(workersBody.data[0].running, true);
  } finally {
    await svc.close();
    teardownTestDb(dbPath);
  }
});

test("api wa tenant connect and disconnect updates worker lifecycle", async () => {
  const dbPath = setupTestDb("wa-agentic-connect-disconnect");
  const svc = await startTestServer();
  try {
    const tenant = await onboardTwilioTenant(svc.baseUrl);

    const disconnectRes = await fetch(`${svc.baseUrl}/api/wa/tenants/${tenant.id}/disconnect`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    assert.equal(disconnectRes.status, 200);
    const disconnectBody = (await disconnectRes.json()) as {
      ok: boolean;
      data: { status: string; worker: { running: boolean } };
    };
    assert.equal(disconnectBody.ok, true);
    assert.equal(disconnectBody.data.status, "disconnected");
    assert.equal(disconnectBody.data.worker.running, false);

    const connectRes = await fetch(`${svc.baseUrl}/api/wa/tenants/${tenant.id}/connect`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    assert.equal(connectRes.status, 200);
    const connectBody = (await connectRes.json()) as {
      ok: boolean;
      data: { status: string; worker: { running: boolean } };
    };
    assert.equal(connectBody.ok, true);
    assert.equal(connectBody.data.status, "connected");
    assert.equal(connectBody.data.worker.running, true);
  } finally {
    await svc.close();
    teardownTestDb(dbPath);
  }
});

test("webhooks whatsapp inbound routes connect command and dedupes repeated sid", async () => {
  const dbPath = setupTestDb("wa-agentic-webhook-dedupe");
  const svc = await startTestServer();
  try {
    await onboardTwilioTenant(svc.baseUrl);

    const formOne = new URLSearchParams({
      MessageSid: "SM_CONNECT_001",
      Body: "Connect me with cardiology",
      From: "whatsapp:+919811112222",
      To: "whatsapp:+919900001111",
      ProfileName: "Vishal"
    });
    const firstRes = await fetch(`${svc.baseUrl}/webhooks/whatsapp/twilio/inbound`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: formOne.toString()
    });
    assert.equal(firstRes.status, 200);
    const firstBody = (await firstRes.json()) as {
      ok: boolean;
      data: { applied: boolean; deduped: boolean; replyBody?: string };
    };
    assert.equal(firstBody.ok, true);
    assert.equal(firstBody.data.applied, true);
    assert.equal(firstBody.data.deduped, false);
    assert.equal(firstBody.data.replyBody?.toLowerCase().includes("cardiology"), true);

    const secondRes = await fetch(`${svc.baseUrl}/webhooks/whatsapp/twilio/inbound`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: formOne.toString()
    });
    assert.equal(secondRes.status, 200);
    const secondBody = (await secondRes.json()) as {
      ok: boolean;
      data: { applied: boolean; deduped: boolean };
      meta: { deduped: boolean; applied: boolean; ignoredReason?: string };
    };
    assert.equal(secondBody.ok, true);
    assert.equal(secondBody.data.applied, false);
    assert.equal(secondBody.data.deduped, true);
    assert.equal(secondBody.meta.ignoredReason, "duplicate_inbound_event");
  } finally {
    await svc.close();
    teardownTestDb(dbPath);
  }
});

test("webhooks whatsapp inbound processes triage flow reply", async () => {
  const dbPath = setupTestDb("wa-agentic-webhook-triage");
  const svc = await startTestServer();
  try {
    await onboardTwilioTenant(svc.baseUrl);
    const form = new URLSearchParams({
      MessageSid: "SM_TRIAGE_001",
      Body: "I have fever and cough since yesterday",
      From: "whatsapp:+919822223333",
      To: "whatsapp:+919900001111",
      ProfileName: "Patient One"
    });
    const res = await fetch(`${svc.baseUrl}/webhooks/whatsapp/twilio/inbound`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as {
      ok: boolean;
      data: {
        applied: boolean;
        deduped: boolean;
        conversationId?: string;
        providerReplyId?: string;
        replyBody?: string;
      };
    };
    assert.equal(body.ok, true);
    assert.equal(body.data.applied, true);
    assert.equal(body.data.deduped, false);
    assert.equal(typeof body.data.conversationId, "string");
    assert.equal(typeof body.data.providerReplyId, "string");
    assert.equal(typeof body.data.replyBody, "string");
    assert.equal((body.data.replyBody ?? "").length > 0, true);
  } finally {
    await svc.close();
    teardownTestDb(dbPath);
  }
});

test("api wa tenant onboarding for whatsapp_web starts disconnected worker state", async () => {
  const dbPath = setupTestDb("wa-agentic-web-onboard");
  const svc = await startTestServer();
  try {
    const tenant = await onboardWebTenant(svc.baseUrl);

    const tenantRes = await fetch(`${svc.baseUrl}/api/wa/tenants/${tenant.id}`);
    assert.equal(tenantRes.status, 200);
    const tenantBody = (await tenantRes.json()) as {
      ok: boolean;
      data: {
        provider: string;
        status: string;
        worker: { running: boolean; status: string } | null;
      };
    };
    assert.equal(tenantBody.ok, true);
    assert.equal(tenantBody.data.provider, "whatsapp_web");
    assert.equal(tenantBody.data.status, "disconnected");
    assert.equal(tenantBody.data.worker?.running, false);
    assert.equal(tenantBody.data.worker?.status, "disconnected");
  } finally {
    await svc.close();
    teardownTestDb(dbPath);
  }
});

test("webhooks whatsapp twilio inbound rejects whatsapp_web transport tenant", async () => {
  const dbPath = setupTestDb("wa-agentic-webhook-provider-guard");
  const svc = await startTestServer();
  try {
    await onboardWebTenant(svc.baseUrl);
    const form = new URLSearchParams({
      MessageSid: "SM_WEB_PROVIDER_001",
      Body: "I have headache",
      From: "whatsapp:+919833334444",
      To: "whatsapp:+919900001112",
      ProfileName: "Patient Web"
    });
    const res = await fetch(`${svc.baseUrl}/webhooks/whatsapp/twilio/inbound`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });
    assert.equal(res.status, 422);
    const body = (await res.json()) as {
      ok: boolean;
      code: string;
      message: string;
    };
    assert.equal(body.ok, false);
    assert.equal(body.code, "VALIDATION_ERROR");
    assert.equal(body.message.includes("not configured for Twilio webhook transport"), true);
  } finally {
    await svc.close();
    teardownTestDb(dbPath);
  }
});
