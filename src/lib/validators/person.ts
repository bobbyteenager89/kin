import { z } from 'zod';

export const childSchema = z.object({
  id: z.string().uuid().optional(), // present on update
  name: z.string().min(1),
  birthday: z.string().nullable().optional(),
});

export const personSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nickname: z.string().nullable().optional(),
  relation: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  partnerName: z.string().nullable().optional(),
  weddingAnniversary: z.string().nullable().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    })
    .nullable()
    .optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().nullable().optional(),
  tier: z.enum(['everyone', 'friends', 'inner_circle']).default('everyone'),
  children: z.array(childSchema).optional().default([]),
});

export type PersonInput = z.infer<typeof personSchema>;
