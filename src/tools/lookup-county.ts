import { z } from 'zod';
import { withErrorHandling } from '@/lib/response';
import { searchAndSort } from '@/lib/search-helpers';
import type { County } from '@/types/nvv-api';
import lanData from '@/data/lan.json';

const lan = lanData as County[];

export const lookupCountyInputSchema = {
  query: z.string().min(1).describe('Search query - county name (partial match, case-insensitive)'),
};

export const lookupCountyTool = {
  name: 'nvv_lookup_county',
  description:
    'Search for Swedish county codes (länskoder). ' +
    "Returns letter codes (e.g., 'AB' for Stockholm, 'M' for Skåne, 'O' for Västra Götaland). " +
    'Use this when you need to search a broad region with nvv_list_protected_areas.',
  inputSchema: lookupCountyInputSchema,
};

type LookupCountyInput = {
  query: string;
};

export const lookupCountyHandler = withErrorHandling(async (args: LookupCountyInput) => {
  const matches = searchAndSort(lan, args.query);

  return {
    query: args.query,
    count: matches.length,
    counties: matches,
  };
});
