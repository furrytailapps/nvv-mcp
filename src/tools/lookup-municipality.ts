import { z } from 'zod';
import { withErrorHandling } from '@/lib/response';
import { searchAndSort } from '@/lib/search-helpers';
import type { Municipality } from '@/types/nvv-api';
import kommunerData from '@/data/kommuner.json';

const kommuner = kommunerData as Municipality[];

export const lookupMunicipalityInputSchema = {
  query: z.string().min(1).describe('Search query - municipality name (partial match, case-insensitive)'),
};

export const lookupMunicipalityTool = {
  name: 'nvv_lookup_municipality',
  description:
    'Search for Swedish municipality codes (kommunkoder). ' +
    'Useful for finding the correct code to use with nvv_list_protected_areas. ' +
    'Supports fuzzy search by municipality name.',
  inputSchema: lookupMunicipalityInputSchema,
};

type LookupMunicipalityInput = {
  query: string;
};

export const lookupMunicipalityHandler = withErrorHandling(async (args: LookupMunicipalityInput) => {
  const matches = searchAndSort(kommuner, args.query);

  return {
    query: args.query,
    count: matches.length,
    municipalities: matches.slice(0, 20), // Return max 20 results
  };
});
