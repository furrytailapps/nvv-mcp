import { z } from "zod";
import { nvvClient } from "@/clients/nvv-client";
import { withErrorHandling } from "@/lib/response";

export const getAreaLandCoverInputSchema = {
  areaId: z.string()
    .min(1)
    .describe("The unique NVR area identifier"),
  status: z.string()
    .default("Gällande")
    .optional()
    .describe("Decision status. Default: 'Gällande'")
};

export const getAreaLandCoverTool = {
  name: "nvv_get_area_land_cover",
  description:
    "Get NMD (Nationella Marktäckedata) land cover classification for a protected area. " +
    "Returns breakdown of land types (forest, water, wetland, etc.) with area in hectares.",
  inputSchema: getAreaLandCoverInputSchema
};

type GetAreaLandCoverInput = {
  areaId: string;
  status?: string;
};

export const getAreaLandCoverHandler = withErrorHandling(
  async (args: GetAreaLandCoverInput) => {
    const { areaId, status = "Gällande" } = args;
    const landCover = await nvvClient.getAreaLandCover(areaId, status);

    return {
      areaId,
      status,
      count: landCover.length,
      land_cover: landCover
    };
  }
);
