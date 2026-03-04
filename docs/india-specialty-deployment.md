# India-First Multilingual Specialty Coverage

This monorepo is prepared for hospital and clinic deployment across all core and advanced specialties through shared multi-agent orchestration.

## Supported Languages

- `en` (English)
- `hi` (Hindi)

Extend by adding labels to `packages/clinical-specialties/src/catalog.ts` and including language support in `packages/agent-orchestrator/src/routing.ts`.

## Specialty Coverage (Current)

- Family Medicine
- Internal Medicine
- Pediatrics
- Obstetrics & Gynecology
- Dermatology
- Psychiatry
- Orthopedics
- ENT
- Ophthalmology
- Dental & Oral Health
- Cardiology
- Neurology
- Nephrology
- Urology
- Gastroenterology
- Endocrinology
- Pulmonology
- Rheumatology
- Infectious Disease
- Hematology
- Medical Oncology
- Radiation Oncology
- Surgical Oncology
- General Surgery
- Neurosurgery
- Cardiothoracic Surgery
- Plastic & Reconstructive Surgery
- Vascular Surgery
- Anesthesiology
- Emergency Medicine
- Critical Care
- Radiology
- Pathology
- Nuclear Medicine
- PM&R
- Physiotherapy
- Dietetics & Nutrition
- Pain Medicine
- Geriatrics
- Palliative Medicine
- Neonatology
- Fertility & Reproductive Medicine
- Community Medicine
- Telemedicine

## Multi-Agent Roles

- Intake & Triage Agent
- Specialist Copilot Agent
- Clinical Documentation Agent
- Diagnostics Agent
- Care Coordination Agent
- ABDM Compliance Agent
- Revenue Cycle Agent
- Patient Engagement Agent

These are defined in `packages/agent-orchestrator` and can be executed through `services/doctor-agent`.

## Hospitals and Clinics

- Clinics: uses triage, specialist copilot, documentation, and patient engagement for OPD-first workflows.
- Hospitals: adds diagnostics, care coordination, compliance, and revenue cycle agents for IPD/OT/ER workflows.
