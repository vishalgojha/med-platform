import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
    try {
        const appClient = createClientFromRequest(req);
        const user = await appClient.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { file_url, document_type } = await req.json();

        if (!file_url) {
            return Response.json({ error: 'file_url is required' }, { status: 400 });
        }

        const result = await appClient.integrations.Core.InvokeLLM({
            prompt: `Analyze this medical document (${document_type || 'medical report'}). 

Extract and summarize:
- Patient name (if visible)
- Document type (lab report, prescription, imaging, etc.)
- Key test results or findings
- Critical/abnormal values (highlight these)
- Date of report
- Doctor recommendations or notes
- Any urgent findings that need immediate attention

Format as a clear, structured summary that a triage nurse can quickly review.`,
            file_urls: [file_url]
        });

        return Response.json({ 
            summary: result,
            document_type: document_type || 'medical document',
            processed: true 
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});