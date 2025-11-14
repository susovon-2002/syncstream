"use server";

import { generateUrlPreview, type GenerateUrlPreviewOutput } from '@/ai/flows/generate-url-preview';
import { z } from 'zod';

const schema = z.object({
  url: z.string().url('Please enter a valid URL.'),
});

export type FormState = {
  success: boolean;
  message: string;
  preview?: GenerateUrlPreviewOutput;
};

export async function generatePreviewAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = schema.safeParse({
    url: formData.get('url'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.errors[0].message,
    };
  }
  
  try {
    const preview = await generateUrlPreview(validatedFields.data);
    if (preview.error) {
      return {
        success: false,
        message: preview.error,
      };
    }
    return {
      success: true,
      message: 'Preview generated successfully.',
      preview,
    };
  } catch (error: any) {
    console.error(error);
    const message = error.message || 'Failed to generate preview. The URL might not be accessible or supported.';
    return {
      success: false,
      message,
    };
  }
}
