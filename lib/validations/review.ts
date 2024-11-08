import { z } from 'zod'

export const reviewSchema = z.object({
  locationId: z.string().min(1, "Location ID is required"),
  rating: z.number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must not exceed 5"),
  body: z.string()
    .min(10, "Review must be at least 10 characters long")
    .max(1000, "Review must not exceed 1000 characters")
})

export type ReviewInput = z.infer<typeof reviewSchema>