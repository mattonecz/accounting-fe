# Project Notes

## API Client Generation

`api.json` is **auto-generated from the backend** — never edit it manually.

When the backend updates its OpenAPI spec, a new `api.json` will be provided. After replacing it, regenerate the TypeScript client by running orval:

```bash
npx orval
```

This regenerates all files under `src/api/model/` and the API client files (`src/api/invoices/invoices.ts`, `src/api/simple-invoice/simple-invoice.ts`, etc.). Do not manually edit those generated files either — changes will be overwritten on the next regeneration.
