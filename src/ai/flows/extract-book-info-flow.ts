'use server';
/**
 * @fileOverview An AI flow for extracting book information from an image.
 *
 * - extractBookInfoFromImage - A function that handles the book info extraction process.
 * - ExtractBookInfoInput - The input type for the extractBookInfoFromImage function.
 * - ExtractBookInfoOutput - The return type for the extractBookInfoFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractBookInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a book cover, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractBookInfoInput = z.infer<typeof ExtractBookInfoInputSchema>;

const ExtractBookInfoOutputSchema = z.object({
  title: z.string().describe('The title of the book.'),
  author: z.string().describe('The author of the book. If multiple, separate with commas.'),
  year: z.string().describe('The publication year or full publication date.'),
  description: z.string().describe('A brief description or synopsis of the book. If not present on the cover, generate a plausible one based on the title and author.'),
});
export type ExtractBookInfoOutput = z.infer<typeof ExtractBookInfoOutputSchema>;

export async function extractBookInfoFromImage(input: ExtractBookInfoInput): Promise<ExtractBookInfoOutput> {
  return extractBookInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractBookInfoPrompt',
  input: {schema: ExtractBookInfoInputSchema},
  output: {schema: ExtractBookInfoOutputSchema},
  prompt: `You are an expert librarian and book cover analyst. Your task is to extract information about a book from the provided image of its cover.

  Analyze the image carefully to identify the following details:
  - Book Title
  - Author(s)
  - Publication Year or Date (if visible)

  If a synopsis or description is present on the cover, extract it. If not, generate a plausible, brief description based on the title, author, and cover art. The description should be about 2-3 sentences.

  If a detail like the year is not visible, make an educated guess based on the author and title, or state "Not found".

  Return the data in the specified JSON format.

  Image to analyze: {{media url=photoDataUri}}`,
});

const extractBookInfoFlow = ai.defineFlow(
  {
    name: 'extractBookInfoFlow',
    inputSchema: ExtractBookInfoInputSchema,
    outputSchema: ExtractBookInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
