import { z } from 'zod';
import { nvvClient } from '@/clients/nvv-client';
import { withErrorHandling } from '@/lib/response';
import { ValidationError } from '@/lib/errors';

export const listProtectedAreasInputSchema = {
  kommun: z
    .string()
    .optional()
    .describe(
      "Swedish municipality code (4 digits, e.g., '0180' for Stockholm). " +
        'Using kommun alone is sufficient for most searches.',
    ),
  lan: z
    .string()
    .optional()
    .describe(
      "Swedish county code (1-2 letters, e.g., 'AB' for Stockholms län, 'M' for Skåne). " +
        'Use län when searching across an entire region, or when the specific municipality is unknown.',
    ),
  namn: z.string().optional().describe('Search by area name (partial match supported)'),
  limit: z.number().optional().describe('Max areas to return (1-500, default: 100)'),
};

export const listProtectedAreasTool = {
  name: 'nvv_list_protected_areas',
  description:
    'List protected nature areas (skyddade områden) in Sweden. ' +
    'Search by municipality code (kommun), county code (län), or area name (namn). ' +
    'At least one parameter is required. ' +
    'Prefer kommun for specific locations; use län for broader regional searches. ' +
    'Returns basic metadata for each area including ID, name, type, status, and area measurements.',
  inputSchema: listProtectedAreasInputSchema,
};

type ListProtectedAreasInput = {
  kommun?: string;
  lan?: string;
  namn?: string;
  limit?: number;
};

export const listProtectedAreasHandler = withErrorHandling(async (args: ListProtectedAreasInput) => {
  // Validate at least one search parameter is provided
  if (!args.kommun && !args.lan && !args.namn) {
    throw new ValidationError('At least one search parameter must be provided: kommun, lan, or namn');
  }

  const areas = await nvvClient.listAreas(args);

  return {
    count: areas.length,
    areas,
  };
});
