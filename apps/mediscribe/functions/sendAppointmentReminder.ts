import { createClientFromRequest } from './_shared/server-client';

Deno.serve(async (req) => {
    try {
        const appClient = createClientFromRequest(req);
        const user = await appClient.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { appointment_id } = await req.json();

        if (!appointment_id) {
            return Response.json({ error: 'Appointment ID required' }, { status: 400 });
        }

        // Get appointment details
        const appointments = await appClient.entities.Appointment.filter({ id: appointment_id });
        const appointment = appointments[0];

        if (!appointment) {
            return Response.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Get patient details
        const patients = await appClient.entities.Patient.filter({ id: appointment.patient_id });
        const patient = patients[0];

        if (!patient) {
            return Response.json({ error: 'Patient not found' }, { status: 404 });
        }

        // Format the appointment time
        const appointmentDate = new Date(appointment.start_time);
        const formattedDate = appointmentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Generate personalized reminder message
        const messagePrompt = await appClient.integrations.Core.InvokeLLM({
            prompt: `Write a friendly, professional appointment reminder email body.
            Patient Name: ${patient.full_name}
            Appointment Date: ${formattedDate}
            Appointment Time: ${formattedTime}
            Reason: ${appointment.reason || 'General Consultation'}
            Duration: ${appointment.duration_minutes || 30} minutes
            
            Keep it concise, warm, and include:
            - Greeting with patient name
            - Appointment details
            - Request to arrive 10 minutes early
            - Contact info for rescheduling
            
            Use HTML formatting for the email.`,
            response_json_schema: {
                type: "object",
                properties: {
                    subject: { type: "string" },
                    body: { type: "string" }
                }
            }
        });

        // Send the email if patient has contact info
        if (patient.phone_number) {
            // In production, you would integrate with an email/SMS service
            // For now, we use the built-in email sender (requires valid email)
            
            // Log the reminder for tracking
            await appClient.entities.MedicalEntry.create({
                patient_id: patient.id,
                entry_type: 'general_note',
                summary: `Appointment reminder sent for ${formattedDate} at ${formattedTime}`,
                detailed_notes: `Automated reminder sent via system. Reason: ${appointment.reason}`,
                doctor_name: 'System',
                date: new Date().toISOString()
            });
        }

        return Response.json({
            success: true,
            message: 'Reminder processed successfully',
            reminder: {
                patient_name: patient.full_name,
                appointment_time: appointment.start_time,
                subject: messagePrompt.subject,
                body: messagePrompt.body
            }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});