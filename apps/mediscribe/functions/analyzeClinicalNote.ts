import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
    try {
        const appClient = createClientFromRequest(req);
        const user = await appClient.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { note_content } = await req.json();

        if (!note_content || note_content.trim().length < 20) {
            return Response.json({ error: 'Note content too short for analysis' }, { status: 400 });
        }

        // Analyze the clinical note using AI
        const analysis = await appClient.integrations.Core.InvokeLLM({
            prompt: `You are an expert medical coding and documentation specialist. Analyze the following clinical note and provide accurate medical coding suggestions.

CLINICAL NOTE:
"""
${note_content}
"""

Provide the following analysis:

1. CATEGORY: Classify into ONE of: patient_history, diagnosis, prescription, lab_results, follow_up, procedure, consultation, other

2. ICD-10 CODES: Suggest up to 5 relevant ICD-10 diagnosis codes. For each code provide:
   - The exact ICD-10 code (e.g., J06.9)
   - Brief description
   Format: "CODE - Description"

3. CPT CODES: Suggest up to 3 relevant CPT procedure/billing codes. For each:
   - The exact CPT code (e.g., 99213)
   - Brief description
   Format: "CODE - Description"

4. SUMMARY: A concise 2-3 sentence clinical summary suitable for quick chart review.

5. KEY_FINDINGS: List of 3-5 key clinical findings or observations.

6. RECOMMENDATIONS: Any follow-up actions or recommendations mentioned.

Be accurate and use real, valid medical codes based on the clinical content.`,
            response_json_schema: {
                type: "object",
                properties: {
                    category: {
                        type: "string",
                        enum: ["patient_history", "diagnosis", "prescription", "lab_results", "follow_up", "procedure", "consultation", "other"]
                    },
                    icd10_codes: {
                        type: "array",
                        items: { type: "string" }
                    },
                    cpt_codes: {
                        type: "array",
                        items: { type: "string" }
                    },
                    summary: { type: "string" },
                    key_findings: {
                        type: "array",
                        items: { type: "string" }
                    },
                    recommendations: {
                        type: "array",
                        items: { type: "string" }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            analysis: {
                category: analysis.category,
                icd10_codes: analysis.icd10_codes || [],
                cpt_codes: analysis.cpt_codes || [],
                summary: analysis.summary,
                key_findings: analysis.key_findings || [],
                recommendations: analysis.recommendations || []
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});