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
  error: z.string().optional().describe('An error message if the preview could not be generated.'),
});
export type GenerateUrlPreviewOutput = z.infer<typeof GenerateUrlPreviewOutputSchema>;


const fetchUrlContent = ai.defineTool(
    {
      name: 'fetchUrlContent',
      description: 'Fetches the text content of a given URL.',
      inputSchema: z.object({ url: z.string().url() }),
      outputSchema: z.object({ content: z.string() }),
    },
    async ({ url }) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
            return { content: `Error: Failed to fetch URL. Status: ${response.status}` };
        }
        // For simplicity, we are only fetching text content.
        // A more robust solution would parse the HTML and extract relevant text.
        const text = await response.text();
        return { content: text.substring(0, 5000) }; // Limit content size
      } catch (e: any) {
        return { content: `Error: ${e.message}` };
      }
    }
  );


export async function generateUrlPreview(input: GenerateUrlPreviewInput): Promise<GenerateUrlPreviewOutput> {
  return generateUrlPreviewFlow(input);
}

const generateUrlPreviewPrompt = ai.definePrompt({
  name: 'generateUrlPreviewPrompt',
  input: {schema: GenerateUrlPreviewInputSchema},
  output: {schema: GenerateUrlPreviewOutputSchema},
  tools: [fetchUrlContent],
  prompt: `You are an expert web content summarizer. A user has provided a URL.
  
  URL: {{{url}}}
  
  Use the 'fetchUrlContent' tool to get the content of the page. From that content, you will extract the title, a short description, and an image URL representing the content of the page.
  
  - The image URL MUST be an absolute URL. If you find a relative path (e.g., /images/foo.png), you must convert it to an absolute URL based on the original URL provided.
  - If you cannot access the URL, or if the content is not HTML, or if you cannot extract the required information for any reason, you MUST set the 'error' field in the output with a descriptive message explaining the issue. Do not try to make up information.

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
