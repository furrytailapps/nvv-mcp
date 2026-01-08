import { z } from 'zod';
import { nvvClient } from '@/clients/nvv-client';
import { withErrorHandling } from '@/lib/response';
import { DEFAULT_DECISION_STATUS } from '@/types/nvv-api';

/**
 * Types of area details that can be retrieved
 */
const INCLUDE_TYPES = ['geometry', 'purposes', 'land_cover', 'regulations', 'env_goals', 'documents', 'all'] as const;

type IncludeType = (typeof INCLUDE_TYPES)[number];

export const getAreaDetailInputSchema = {
  areaId: z.string().describe('Area ID from nvv_list_protected_areas'),
  status: z.string().optional().describe("Decision status: 'Gällande' (default), 'Överklagat', 'Beslutat'"),
  include: z
    .enum(INCLUDE_TYPES)
    .optional()
    .describe(
      'What to include: ' +
        'geometry (WKT polygon), ' +
        'purposes (protection reasons), ' +
        'land_cover (NMD classification), ' +
        'regulations (föreskrifter), ' +
        'env_goals (miljömål), ' +
        'documents (PDF links), ' +
        'all (everything). Default: all',
    ),
};

export const getAreaDetailTool = {
  name: 'nvv_get_area_detail',
  description:
    'Get detailed information about a protected nature area. ' +
    'Returns geometry, protection purposes, land cover, regulations, environmental goals, and documents. ' +
    'Use include parameter to fetch specific data or all at once.',
  inputSchema: getAreaDetailInputSchema,
};

type GetAreaDetailInput = {
  areaId: string;
  status?: string;
  include?: IncludeType;
};

export const getAreaDetailHandler = withErrorHandling(async (args: GetAreaDetailInput) => {
  const { areaId, status = DEFAULT_DECISION_STATUS, include = 'all' } = args;

  const result: Record<string, unknown> = {
    areaId,
    status,
    coordinate_system: 'EPSG:3006 (SWEREF99 TM)',
  };

  // Fetch requested data types
  if (include === 'all' || include === 'geometry') {
    result.geometry = await nvvClient.getAreaWkt(areaId, status);
  }
  if (include === 'all' || include === 'purposes') {
    result.purposes = await nvvClient.getAreaPurposes(areaId, status);
  }
  if (include === 'all' || include === 'land_cover') {
    result.land_cover = await nvvClient.getAreaLandCover(areaId, status);
  }
  if (include === 'all' || include === 'regulations') {
    result.regulations = await nvvClient.getAreaRegulations(areaId, status);
  }
  if (include === 'all' || include === 'env_goals') {
    result.env_goals = await nvvClient.getAreaEnvironmentalGoals(areaId, status);
  }
  if (include === 'all' || include === 'documents') {
    result.documents = await nvvClient.getAreaDocuments(areaId, status);
  }

  return result;
});
