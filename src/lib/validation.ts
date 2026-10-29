import { z } from 'zod';
export const registrationSchema = z.object({
  first: z.string().trim().min(1, 'Enter your first name.').max(60),
  last: z.string().trim().min(1, 'Enter your last name.').max(60),
  email: z.email('Enter a valid email address.').max(254),
  password: z.string().min(12, 'Use at least 12 characters.').max(128),
  category: z.enum(['general', 'vip', 'speaker']),
  code: z.string().max(100).default(''),
  company: z.string().trim().max(120).default(''),
  title: z.string().trim().max(120).default(''),
  interests: z.string().max(300).default(''),
  preferences: z.string().trim().max(1000).default(''),
  consent: z.literal('on', { error: 'Please agree to the registration terms.' }),
});
