# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that wraps the Swedish Environmental Protection Agency (Naturvårdsverket) API for querying protected nature areas in Sweden. Built with Next.js and TypeScript.

## Build and Development

### Common Commands

- **Type checking**: `npm run typecheck`
- **Linting**: `npm run lint`
- **Development server**: `npm run dev`
- **Build**: `npm run build`
- **Production server**: `npm run start`

## Code Quality Checks

**CRITICAL: After making any code changes, ALWAYS run these checks in order:**

1. **Type checking** - Verify TypeScript types:

   ```bash
   npm run typecheck
   ```

2. **Linting** - Check code quality:

   ```bash
   npm run lint
   ```

**When to run these checks:**

- ✅ **After making any code changes** - Before proposing a commit
- ✅ **After code generation** - Before presenting code to user
- ✅ **Before committing** - As final verification
- ✅ **After fixing issues** - To verify the fix worked

**Workflow:**

1. Make code changes
2. Run typecheck to verify types
3. Run lint to check for issues
4. Fix any errors
5. Run tests if applicable
6. Only then commit

Type and lint errors will cause CI failures, so catching them locally is critical.

## Clean Code Principles

**Follow Clean Code practices when writing and refactoring code.**

### Small, Focused Functions

- Each function should do one thing and do it well
- Extract functions when a block of code can be given a meaningful name
- If a function needs a comment to explain what it does, extract it into a named function instead

```typescript
// ❌ Bad - long function with inline comments
async function processData(data: string): Promise<Result> {
  // Validate input
  if (!data || data.trim().length === 0) {
    throw new Error('Empty data');
  }

  // Parse the data
  const parsed = JSON.parse(data);

  // Transform to our format
  const transformed = { ...parsed, processed: true };

  // ... more processing
  return transformed;
}

// ✅ Good - small functions with descriptive names
async function processData(data: string): Promise<Result> {
  validateInput(data);
  const parsed = parseData(data);
  return transformToResult(parsed);
}

function validateInput(data: string): void {
  if (isEmpty(data)) {
    throw new Error('Empty data');
  }
}

function isEmpty(data: string): boolean {
  return !data || data.trim().length === 0;
}
```

### Constants Over Magic Values

- Extract magic strings and numbers into named constants
- Place constants at the top of the file or in a dedicated constants file

```typescript
// ❌ Bad - magic values
if (status === 'Gällande') { ... }
const timeout = 30000;

// ✅ Good - named constants
const DEFAULT_STATUS = 'Gällande';
const REQUEST_TIMEOUT_MS = 30000;

if (status === DEFAULT_STATUS) { ... }
const client = createClient({ timeout: REQUEST_TIMEOUT_MS });
```

### Self-Documenting Code

- Use descriptive names that explain intent
- Function names should describe what they do, not how they do it
- Reduce comments by making code self-explanatory

```typescript
// ❌ Bad - unclear names, needs comments
// Check if user can search
function check(p: any): boolean { ... }

// ✅ Good - self-documenting
function hasRequiredSearchParameters(params: SearchParams): boolean { ... }
```

### Reduce Duplication (DRY)

- Extract repeated logic into reusable functions
- Use helper functions for common patterns
- But avoid premature abstraction - wait until you have 2-3 similar cases

```typescript
// ❌ Bad - duplicated pattern
const purposes = data.map(s => ({
  name: s.namn,
  description: s.beskrivning
}));

const goals = data.map(m => ({
  name: m.namn,
  description: m.beskrivning
}));

// ✅ Good - extracted helper (if truly reused 3+ times)
function transformToNameDescription<T extends { namn: string; beskrivning?: string }>(
  items: T[]
): Array<{ name: string; description?: string }> {
  return items.map(item => ({
    name: item.namn,
    description: item.beskrivning
  }));
}
```

### Single Level of Abstraction

- Keep functions at a consistent level of abstraction
- High-level functions should call other functions, not mix high and low-level details

```typescript
// ❌ Bad - mixed abstraction levels
async function getAreaDetails(id: string): Promise<AreaDetails> {
  const area = await client.request(`/omrade/${id}`);
  const purposes = area.syften.map(s => ({ name: s.namn })); // Low-level detail
  await validateArea(area);
  return formatArea(area, purposes);
}

// ✅ Good - consistent abstraction
async function getAreaDetails(id: string): Promise<AreaDetails> {
  const area = await fetchArea(id);
  const purposes = await fetchPurposes(id);
  await validateArea(area);
  return formatAreaDetails(area, purposes);
}
```

### Comments

- **Don't comment what** - the code should be self-explanatory
- **Do comment why** - explain non-obvious decisions, workarounds, or business rules
- JSDoc for public APIs to explain purpose and usage

```typescript
// ❌ Bad - commenting the what
// Loop through areas and return names
return areas.map(a => a.name);

// ✅ Good - commenting the why
// We default to "Gällande" (Current) status because historical data
// requires explicit opt-in to prevent confusion with outdated boundaries
async getAreaWkt(areaId: string, status = "Gällande"): Promise<string> { ... }
```

## Project Structure

### Directory Layout

```
src/
├── app/              # Next.js app routes
│   └── [transport]/  # MCP transport endpoint
├── clients/          # API clients
│   └── nvv-client.ts # NVV API client
├── lib/              # Shared utilities
│   ├── errors.ts     # Error classes
│   ├── http-client.ts # HTTP wrapper
│   ├── response.ts   # Response helpers
│   └── search-helpers.ts # Search utilities
├── tools/            # MCP tool definitions
│   ├── index.ts      # Tool registry
│   ├── list-protected-areas.ts
│   ├── get-area-*.ts # Area detail tools
│   └── lookup-*.ts   # Lookup tools
└── types/            # TypeScript type definitions
    └── nvv-api.ts    # NVV API types
tests/                # Test files
```

### TypeScript Configuration

- **Module imports**: Use `@/` path alias for src imports
  - ✅ `import { nvvClient } from "@/clients/nvv-client"`
  - ❌ `import { nvvClient } from "../clients/nvv-client"`
- **Next.js specific**: Uses `bundler` module resolution
- **Strict mode enabled**: All TypeScript strict checks are on

### Type Safety

**CRITICAL: Always use proper TypeScript types. NEVER use `any` type.**

- ✅ **Use explicit types**: Define types for all variables, parameters, and return values
- ❌ **Avoid `any`**: Using `any` defeats TypeScript's type checking and can hide bugs
- ✅ **Import proper types**: Import types from `@/types/nvv-api`
- ✅ **Use Zod schemas**: All tool inputs are validated with Zod
- ✅ **Type transformations**: Transform raw API responses to clean types

**Examples:**

```typescript
// ❌ Bad - using 'any'
let areas: any[];
function processData(data: any): any { ... }

// ✅ Good - using proper types
let areas: ProtectedArea[];
function processData(data: NvvArea): ProtectedArea { ... }
```

**Benefits of proper typing:**

- Catches bugs at compile time instead of runtime
- Provides better IDE autocomplete and refactoring support
- Makes code more maintainable and self-documenting
- Prevents type-related runtime errors

## MCP Tool Patterns

All tools in `src/tools/` follow this standard pattern:

### Tool Structure

```typescript
import { z } from "zod";
import { nvvClient } from "@/clients/nvv-client";
import { withErrorHandling } from "@/lib/response";

// 1. Define Zod input schema
export const myToolInputSchema = {
  param1: z.string()
    .describe("Description for Claude"),
  param2: z.number()
    .optional()
    .default(100)
    .describe("Optional parameter with default")
};

// 2. Define tool metadata
export const myTool = {
  name: "nvv_my_tool",  // Always prefix with nvv_
  description: "Clear description of what this tool does",
  inputSchema: myToolInputSchema
};

// 3. Define TypeScript input type
type MyToolInput = {
  param1: string;
  param2?: number;
};

// 4. Implement handler with error handling wrapper
export const myToolHandler = withErrorHandling(
  async (args: MyToolInput) => {
    // Validate input
    if (!args.param1) {
      throw new ValidationError("param1 is required");
    }

    // Call API client
    const result = await nvvClient.someMethod(args);

    // Return clean response
    return {
      count: result.length,
      data: result
    };
  }
);
```

### Tool Guidelines

- **Naming**: Always prefix tool names with `nvv_`
- **Error handling**: Always wrap handlers with `withErrorHandling()`
- **Validation**: Use Zod schemas for input validation
- **Descriptions**: Provide clear descriptions in both schema and tool metadata
- **Client usage**: All API calls go through `nvvClient`
- **Response format**: Return clean, typed objects (not raw API responses)

### Error Handling

Use custom error classes from `@/lib/errors`:

```typescript
import { ValidationError, NotFoundError } from "@/lib/errors";

// Validation errors
if (!requiredParam) {
  throw new ValidationError("param is required");
}

// Not found errors
if (!result) {
  throw new NotFoundError(`Area with ID ${id} not found`);
}
```

The `withErrorHandling` wrapper automatically catches and formats errors for MCP.

## NVV API Client

The `nvvClient` in `@/clients/nvv-client.ts` is the single interface to the NVV API:

- **Base URL**: `https://geodata.naturvardsverket.se/naturvardsregistret/rest/v3`
- **Response transformation**: All methods transform raw API responses to clean types
- **Default parameters**: Status defaults to `"Gällande"` (current) for area queries
- **Error handling**: HTTP errors are handled by the underlying http-client

### Client Methods

```typescript
// List areas by location
await nvvClient.listAreas({ kommun: "0180", limit: 50 });

// Get area geometry as WKT
await nvvClient.getAreaWkt(areaId);

// Get area details
await nvvClient.getAreaPurposes(areaId);
await nvvClient.getAreaLandCover(areaId);
await nvvClient.getAreaEnvironmentalGoals(areaId);
await nvvClient.getAreaRegulations(areaId);

// Get bounding box for multiple areas
await nvvClient.getAreasExtent(["123", "456"]);
```

## Testing

- Test files are in `tests/` directory
- Tests use CommonJS format (`.cjs`)
- Run tests to verify MCP tool functionality
- Test files include:
  - `basic.cjs` - Basic tool testing
  - `comprehensive.cjs` - Full tool suite tests
  - `edge-cases.cjs` - Edge case scenarios
  - `verify-all-tools.cjs` - Verify all tools work

### Testing Guidelines

When making changes:

1. Run type checking and linting first
2. Test manually if needed using the test scripts
3. Verify MCP integration if tool signatures changed

## Git Workflow

- Always check `git status` before committing
- Use descriptive commit messages
- Run type checking and linting before committing
- Keep commits focused and atomic
- Write commit messages that explain the "why" not just the "what"

### Pre-commit Checklist

Before every commit:

```bash
# 1. Type check
npm run typecheck

# 2. Lint
npm run lint

# 3. Review changes
git status
git diff

# 4. Commit
git add <files>
git commit -m "descriptive message"
```

## Additional Guidelines

### Avoid Over-engineering

- Only make changes that are directly requested or clearly necessary
- Don't add features, refactor code, or make "improvements" beyond what was asked
- A bug fix doesn't need surrounding code cleaned up
- Don't add error handling for scenarios that can't happen
- Don't create helpers or abstractions for one-time operations
- Three similar lines of code is better than a premature abstraction

### Code Simplicity

- Keep it simple and focused
- Use the existing patterns in the codebase
- Follow the structure of similar tools when adding new ones
- Don't introduce new patterns unless absolutely necessary
