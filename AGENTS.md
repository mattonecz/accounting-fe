# Project Guidelines

## Build And Verify

- `npm run dev` starts the Rsbuild dev server.
- `npm run build` is the primary verification command for code changes in this repo.
- `npm run preview` serves the production build locally.
- `npm run format` runs Prettier across the workspace.
- `npm run lint` exists, but it currently fails before linting source because the ESLint 9 flat-config migration is incomplete. Do not treat lint failure as evidence that your change is broken until the config is fixed.

## Architecture

- This is a React + TypeScript frontend built with Rsbuild, React Router, TanStack Query, Tailwind, and shadcn/ui primitives.
- The application shell is defined in `src/App.tsx` with providers at the top level and a persistent sidebar layout for authenticated routes.
- API hooks and DTOs in `src/api/` are generated from the OpenAPI spec. Treat `src/api/model/` and generated endpoint files as generated artifacts unless the task is specifically about API generation.
- Authentication and axios base URL setup live in `src/contexts/AuthContext.tsx`.

## Conventions

- Prefer the existing `@/` import alias for internal modules.
- Reuse shadcn/ui primitives from `src/components/ui/` before introducing new low-level UI building blocks.
- When a page pattern repeats, extract or extend a shared component instead of recreating styled wrappers inline.
- Start creating and using general shared components for repeated page structure. If multiple pages need the same outer layout, header block, section wrapper, table framing, or recurring text treatment, add a reusable component in `src/components/` and consume that instead of repeating `div` containers with Tailwind classes on each page.
- The repeated page shell pattern today is the `flex-1 space-y-6 p-8` container used across several pages. Treat that as a candidate for a shared page-layout component rather than copying it into new pages.
- The repeated data-table pattern should build on `src/components/ui/table.tsx`. If pages keep reusing the same surrounding `Card`, title, spacing, or empty-state structure, extract a shared table wrapper component instead of duplicating that composition.
- Keep shared text and heading presentation consistent. If the same heading, subtitle, or helper-text block appears across pages, move it behind a reusable component rather than retyping styled typography markup.
- Use `cn()` from `src/lib/utils.ts` for class composition.
- Follow existing React Query usage patterns on pages: call generated hooks directly in the page or a focused feature component, then render loading, empty, and error states close to the relevant UI.
- Prefer generated API DTO contracts from `src/api/model/` for form typing and payload shaping. Do not introduce local Zod schemas for forms when the API contract already defines the data shape.
- Preserve the current mixed Czech and English product language unless the task explicitly standardizes copy.
- Invoice terminology and finance-domain behavior are documented in `docs/adr/0001-frontend-orientation-log.md`. Read that document before changing invoice, VAT, or simple-invoice flows.

### Shared Reusable Components

Use these shared components instead of writing raw `div` containers with Tailwind classes:

| Component | Location | Purpose |
|---|---|---|
| `PageLayout` | `src/components/PageLayout.tsx` | Page shell wrapper (`flex-1 space-y-6 p-4 md:p-8`). Use on every page instead of a raw `<div>`. |
| `PageHeader` | `src/components/PageHeader.tsx` | Page title, description, optional back button, optional action slot. |
| `DataTableCard` | `src/components/DataTableCard.tsx` | Card-wrapped table with column definitions, loading/empty/error states, and optional row click. |
| `FormCard` | `src/components/FormCard.tsx` | Card wrapper for form sections with title and optional action slot. |
| `InputController` | `src/components/InputController/index.tsx` | Typed react-hook-form input with label, validation, and customizable className/step/onChange. |
| `SelectController` | `src/components/SelectController/index.tsx` | Typed react-hook-form select with label, options array, validation, and customizable trigger width. |

When building a new page:
1. Wrap in `<PageLayout>`.
2. Use `<PageHeader>` for the title block.
3. For data listing pages, use `<DataTableCard>` with column definitions.
4. For form pages, use `<FormCard>` for each section and `InputController`/`SelectController` for fields.
5. Extract page-specific logic (form setup, API calls, calculations) into a custom hook inside `src/components/<feature>/`.
6. Keep the page file as a thin orchestrator that composes sub-components.

## Docs

- See `docs/adr/0001-frontend-orientation-log.md` for invoice terminology, VAT behavior, and simple-invoice details.
- Rsbuild reference: <https://rsbuild.rs/llms.txt>
- Rspack reference: <https://rspack.rs/llms.txt>
