import { z } from 'zod';

export const uploadAvatarSchema = z.object({
  imageData: z.string().startsWith('data:image/'),
});
