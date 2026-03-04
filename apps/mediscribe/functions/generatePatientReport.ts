import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
    try {
        const appClient = createClientFromRequest(req);
        const user = await appClient.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { patient_id, report_type } = await req.json();

        if (!patient_id) {
            return Response.json({ error: 'Patient ID required' }, { status: 400 });
        }

        // Get patient details
        const patients = await appClient.entities.Patient.filter({ id: patient_id });
        const patient = patients[0];

        if (!patient) {
            return Response.json({ error: 'Patient not found' }, { status: 404 });
        }

        // Get patient's medical history
        const medicalEntries = await appClient.entities.MedicalEntry.filter(
            { patient_id: patient_id },
            "-date",
            50
        );

        // Get patient's clinical notes
        const clinicalNotes = await appClient.entities.ClinicalNote.filter(
            { patient_id: patient_id },
            "-created_date",
            20
        );

        // Get patient's appointments
        const appointments = await appClient.entities.Appointment.filter(
            { patient_id: patient_id },
            "-start_time",
            20
        );

        // Compile history for AI analysis
        const historyContext = medicalEntries.map(e => 
            `[${e.date || 'Unknown Date'}] ${e.entry_type}: ${e.summary} ${e.detailed_notes ? `- ${e.detailed_notes}` : ''}`
        ).join('\n');

        const notesContext = clinicalNotes.map(n =>
            `[${n.created_date}] ${n.category}: ${n.title || 'Untitled'} - ${n.summary || n.content?.substring(0, 200)}`
        ).join('\n');

        // Generate comprehensive report
        const report = await appClient.integrations.Core.InvokeLLM({
            prompt: `Generate a comprehensive medical summary report for the following patient:

PATIENT INFORMATION:
- Name: ${patient.full_name}
- Date of Birth: ${patient.date_of_birth || 'Not recorded'}
- Gender: ${patient.gender || 'Not specified'}
- Known Allergies: ${patient.allergies || 'None recorded'}
- Clinic ID: ${patient.clinic_id}

MEDICAL HISTORY (${medicalEntries.length} entries):
${historyContext || 'No medical history recorded'}

CLINICAL NOTES (${clinicalNotes.length} notes):
${notesContext || 'No clinical notes recorded'}

APPOINTMENTS: ${appointments.length} total appointments

Report Type: ${report_type || 'comprehensive'}

Generate a professional medical summary report with:
1. Patient Overview
2. Medical History Summary
3. Current Health Status (based on recent entries)
4. Key Diagnoses and Conditions
5. Medication History (if mentioned)
6. Recommendations for Future Care

Format the report in a clear, professional manner suitable for medical records.`,
            response_json_schema: {
                type: "object",
                properties: {
                    report_title: { type: "string" },
                    generated_date: { type: "string" },
                    patient_overview: { type: "string" },
                    medical_history_summary: { type: "string" },
                    current_health_status: { type: "string" },
                    key_diagnoses: {
                        type: "array",
                        items: { type: "string" }
                    },
                    medications: {
                        type: "array",
                        items: { type: "string" }
                    },
                    recommendations: {
                        type: "array",
                        items: { type: "string" }
                    },
                    full_report: { type: "string" }
                }
            }
        });

        return Response.json({
            success: true,
            patient: {
                id: patient.id,
                full_name: patient.full_name,
                date_of_birth: patient.date_of_birth,
                gender: patient.gender
            },
            report: {
                ...report,
                generated_date: new Date().toISOString(),
                entry_count: medicalEntries.length,
                notes_count: clinicalNotes.length,
                appointments_count: appointments.length
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});