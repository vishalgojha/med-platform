import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
    try {
        const appClient = createClientFromRequest(req);

        // Generate WhatsApp URLs for all specialist agents
        const cardiacUrl = appClient.agents.getWhatsAppConnectURL('patient_triage');
        const neuroUrl = appClient.agents.getWhatsAppConnectURL('neuro_triage');
        const oncologyUrl = appClient.agents.getWhatsAppConnectURL('oncology_triage');

        return Response.json({
            cardiac: cardiacUrl,
            neuro: neuroUrl,
            oncology: oncologyUrl,
            allLinks: {
                cardiac: cardiacUrl,
                neuro: neuroUrl,
                oncology: oncologyUrl
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});