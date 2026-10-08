import { z } from "zod";

export const createFarmerProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
  farmName: z.string().min(1).max(120).optional(),
  location: z.string().min(1).max(200).optional(),
});

export const updateFarmerProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  farmName: z.string().min(1).max(120).nullable().optional(),
  location: z.string().min(1).max(200).nullable().optional(),
});

export const uploadProfileImageSchema = z.object({
  // multer handles file
  // (we keep this so controller can validate other metadata in future)
});

export type CreateFarmerProfileBody = z.infer<typeof createFarmerProfileSchema>;
export type UpdateFarmerProfileBody = z.infer<typeof updateFarmerProfileSchema>;

