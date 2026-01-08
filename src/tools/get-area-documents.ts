import { z } from 'zod';
import { nvvClient } from '@/clients/nvv-client';
import { withErrorHandling } from '@/lib/response';
import { DEFAULT_DECISION_STATUS } from '@/types/nvv-api';

export const getAreaDocumentsInputSchema = {
  areaId: z.string().min(1).describe('The unique NVR area identifier'),
  status: z.string().default('Gällande').optional().describe("Decision status. Default: 'Gällande'"),
};

export const getAreaDocumentsTool = {
  name: 'nvv_get_area_documents',
  description:
    'Get decision documents (beslutsdokument) for a protected area. ' +
    'Returns PDF links for official decisions and management plans (skötselplaner).',
  inputSchema: getAreaDocumentsInputSchema,
};

type GetAreaDocumentsInput = {
  areaId: string;
  status?: string;
};

export const getAreaDocumentsHandler = withErrorHandling(async (args: GetAreaDocumentsInput) => {
  const { areaId, status = DEFAULT_DECISION_STATUS } = args;
  const documents = await nvvClient.getAreaDocuments(areaId, status);

  return {
    areaId,
    status,
    count: documents.length,
    documents,
  };
});
