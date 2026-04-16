'use client';
import { toast } from 'sonner';

/**
 * Strictly handles an array of error message strings.
 * Use this when the calling function has already extracted the error list.
 */
export const toastValidation = (errors: unknown) => {
  if (!errors || !Array.isArray(errors)) return;

  errors.forEach((msg) => {
    // Standardizing the message: remove escaped quotes and trim whitespace
    const cleanMsg = msg.replace(/"/g, '').trim();

    if (cleanMsg) {
      toast.error(cleanMsg);
    }
  });
};