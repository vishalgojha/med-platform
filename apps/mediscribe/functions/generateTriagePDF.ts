import { createClientFromRequest } from './_shared/server-client';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
    try {
        const appClient = createClientFromRequest(req);
        const user = await appClient.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { triageReportId } = await req.json();

        if (!triageReportId) {
            return Response.json({ error: 'Triage report ID required' }, { status: 400 });
        }

        // Fetch the triage report
        const reports = await appClient.asServiceRole.entities.TriageReport.filter(
            { id: triageReportId },
            '-created_date',
            1
        );

        if (!reports || reports.length === 0) {
            return Response.json({ error: 'Triage report not found' }, { status: 404 });
        }

        const report = reports[0];

        // Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;
        let yPos = 20;

        // Header
        doc.setFillColor(37, 99, 235);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('MediScribe Triage Report', margin, 25);

        // Reset text color
        doc.setTextColor(0, 0, 0);
        yPos = 55;

        // Patient Info Section
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Patient Information', margin, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        if (report.patient_name) {
            doc.text(`Name: ${report.patient_name}`, margin, yPos);
            yPos += 7;
        }
        doc.text(`Date: ${new Date(report.created_date).toLocaleString()}`, margin, yPos);
        yPos += 7;
        doc.text(`Report ID: ${report.id}`, margin, yPos);
        yPos += 15;

        // Severity Badge
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        const severityColors = {
            low: [34, 197, 94],
            medium: [234, 179, 8],
            high: [239, 68, 68],
            critical: [220, 38, 38]
        };
        const color = severityColors[report.severity] || [107, 114, 128];
        doc.setFillColor(color[0], color[1], color[2]);
        doc.setTextColor(255, 255, 255);
        doc.roundedRect(margin, yPos, 40, 10, 2, 2, 'F');
        doc.text(report.severity.toUpperCase(), margin + 5, yPos + 7);
        doc.setTextColor(0, 0, 0);
        yPos += 20;

        // Symptoms Section
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Reported Symptoms', margin, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const symptomsLines = doc.splitTextToSize(report.symptoms, contentWidth);
        doc.text(symptomsLines, margin, yPos);
        yPos += symptomsLines.length * 7 + 10;

        // Action Recommended Section
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Recommended Action', margin, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const actionText = report.action_recommended.replace(/_/g, ' ').toUpperCase();
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(margin, yPos, contentWidth, 12, 2, 2, 'F');
        doc.text(actionText, margin + 5, yPos + 8);
        yPos += 20;

        // AI Summary Section
        if (yPos > 230) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Detailed Assessment', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const summaryLines = doc.splitTextToSize(report.ai_summary, contentWidth);
        
        summaryLines.forEach(line => {
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, margin, yPos);
            yPos += 6;
        });

        yPos += 10;

        // Disclaimer
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFillColor(254, 243, 199);
        doc.rect(margin, yPos, contentWidth, 30, 'F');
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('IMPORTANT DISCLAIMER', margin + 5, yPos + 7);
        doc.setFont(undefined, 'normal');
        const disclaimerText = 'This triage assessment is AI-generated and NOT a medical diagnosis. Always consult with a qualified healthcare professional for proper medical advice, diagnosis, and treatment.';
        const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 10);
        doc.text(disclaimerLines, margin + 5, yPos + 14);

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(107, 114, 128);
            doc.text(
                `MediScribe Triage System - Page ${i} of ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // Generate PDF
        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=triage-report-${report.id}.pdf`
            }
        });
    } catch (error) {
        console.error('PDF generation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});