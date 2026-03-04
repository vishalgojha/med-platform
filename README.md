# Med Platform (Monorepo)

Unified TypeScript monorepo for India-first hospital and clinic deployment:

- `apps/medisuite`
- `apps/mediscribe`
- `apps/medipal`
- `apps/gluco-vital`
- `packages/clinical-specialties` (all-specialty catalog with multilingual labels)
- `packages/agent-orchestrator` (multi-agent routing and staffing defaults)
- `services/doctor-agent` (backend agent runtime)

## Prerequisites

- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

## Run Apps

```bash
npm run dev:medisuite
npm run dev:mediscribe
npm run dev:medipal
npm run dev:gluco-vital
npm run dev:doctor-agent
```

Or run all:

```bash
npm run dev:all
```

Run full stack including backend agent:

```bash
npm run dev:stack
```

## Validation

```bash
npm run typecheck
npm run build
```

## India-First Specialty Coverage

`packages/clinical-specialties` contains:

- canonical specialty IDs for OPD/IPD workflows
- multilingual labels (`en`, `hi`)
- care setting coverage (`clinic`, `hospital`)
- deployment priority for phased rollout

`packages/agent-orchestrator` provides:

- multi-agent role definitions
- specialty-to-agent capability map
- language-aware routing defaults for English and Hindi

See deployment details in `docs/india-specialty-deployment.md`.
