'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate a URL preview, extracting title, description, and image from a given URL.
 *
 * - generateUrlPreview -  A function that takes a URL as input and returns a preview object with title, description, and image URL.
 * - GenerateUrlPreviewInput - The input type for the generateUrlPreview function.
 * - GenerateUrlPreviewOutput - The output type for the generateUrlPreview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUrlPreviewInputSchema = z.object({
  url: z.string().url().describe('The URL to generate a preview for.'),
});
export type GenerateUrlPreviewInput = z.infer<typeof GenerateUrlPreviewInputSchema>;

const GenerateUrlPreviewOutputSchema = z.object({
  title: z.string().describe('The title of the URL content.'),
  description: z.string().describe('A brief description of the URL content.'),
  imageUrl: z.string().url().describe('The URL of an image representing the content.'),
});
export type GenerateUrlPreviewOutput = z.infer<typeof GenerateUrlPreviewOutputSchema>;

export async function generateUrlPreview(input: GenerateUrlPreviewInput): Promise<GenerateUrlPreviewOutput> {
  return generateUrlPreviewFlow(input);
}

const generateUrlPreviewPrompt = ai.definePrompt({
  name: 'generateUrlPreviewPrompt',
  input: {schema: GenerateUrlPreviewInputSchema},
  output: {schema: GenerateUrlPreviewOutputSchema},
  prompt: `You are an expert web content summarizer. Given a URL, you will extract the title, a short description, and an image URL representing the content of the page.

URL: {{{url}}}

Ensure that the image URL is a direct link to the image and not a relative path.

Output the title, description, and imageUrl in the JSON format specified in the output schema.`,
});

const generateUrlPreviewFlow = ai.defineFlow(
  {
    name: 'generateUrlPreviewFlow',
    inputSchema: GenerateUrlPreviewInputSchema,
    outputSchema: GenerateUrlPreviewOutputSchema,
  },
  async input => {
    const {output} = await generateUrlPreviewPrompt(input);
    return output!;
  }
);
