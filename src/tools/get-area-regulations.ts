import { z } from 'zod';
import { nvvClient } from '@/clients/nvv-client';
import { withErrorHandling } from '@/lib/response';
import { DEFAULT_DECISION_STATUS } from '@/types/nvv-api';

export const getAreaRegulationsInputSchema = {
  areaId: z.string().min(1).describe('The unique NVR area identifier'),
  status: z.string().default('Gällande').optional().describe("Decision status. Default: 'Gällande'"),
};

export const getAreaRegulationsTool = {
  name: 'nvv_get_area_regulations',
  description:
    'Get the regulation zones (föreskriftsområden) for a protected area. ' +
    'Returns information about different regulation types and subtypes within the area.',
  inputSchema: getAreaRegulationsInputSchema,
};

type GetAreaRegulationsInput = {
  areaId: string;
  status?: string;
};

export const getAreaRegulationsHandler = withErrorHandling(async (args: GetAreaRegulationsInput) => {
  const { areaId, status = DEFAULT_DECISION_STATUS } = args;
  const regulations = await nvvClient.getAreaRegulations(areaId, status);

  return {
    areaId,
    status,
    count: regulations.length,
    regulations,
  };
});
