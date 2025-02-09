import FirecrawlApp, { SearchResponse } from '@mendable/firecrawl-js';
import { generateObject } from 'ai';
import { compact } from 'lodash-es';
import pLimit from 'p-limit';
import { z } from 'zod';

import { o3MiniModel, trimPrompt } from '../ai/providers';
import { systemPrompt } from './prompt';

type ResearchResult = {
  learnings: string[];
  visitedUrls: string[];
};

// increase this if you have higher API rate limits
const ConcurrencyLimit = 2;

// Initialize Firecrawl with optional API key and optional base url

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_KEY ?? '',
  apiUrl: process.env.FIRECRAWL_BASE_URL,
});

// take en user query, return a list of SERP queries
async function generateSerpQueries({
  query,
  numQueries = 3,
  learnings,
}: {
  query: string;
  numQueries?: number;
  learnings?: string[];
}) {
  const res = await generateObject({
    model: o3MiniModel,
    system: systemPrompt(),
    prompt: `Given the following prompt from the user, generate a list of SERP queries to research the topic. Return a maximum of ${numQueries} queries, but feel free to return less if the original prompt is clear. Make sure each query is unique and not similar to each other: <prompt>${query}</prompt>\n\n${
      learnings ? `Here are some learnings from previous research, use them to generate more specific queries: ${learnings.join('\n')}` : ''
    }`,
    schema: z.object({
      queries: z
        .array(
          z.object({
            query: z.string().describe('The SERP query'),
            researchGoal: z.string().describe('Research goal for this query.'),
          }),
        )
        .describe(`List of SERP queries, max of ${numQueries}`),
    }),
  });
  console.log("[deep-research.ts][generateSerpQueries] Created", res.object.queries.length, "queries:", res.object.queries);
  return res.object.queries.slice(0, numQueries);
}


async function processSerpResult({
  query,
  result,
  numLearnings = 5,
  numFollowUpQuestions = 3,
}: {
  query: string;
  result: SearchResponse;
  numLearnings?: number;
  numFollowUpQuestions?: number;
}): Promise<{ learnings: string[]; followUpQuestions: string[] }> {
  // Extract the markdown content from search results and remove any falsey values.
  const rawContents = compact(result.data.map(item => item.markdown));
  
  // Trim each content to a maximum of 35,000 characters and log the trimmed length.
  const trimmedContents = rawContents.map(content => {
    const trimmed = trimPrompt(content, 35_000);
    console.log(`[deep-research.ts][processSerpResult] Trimmed content length: ${trimmed.length}`);
    return trimmed;
  });
  
  console.log(`[deep-research.ts][processSerpResult] Ran query: "${query}", found ${trimmedContents.length} contents`);

  // Construct a prompt for the LLM that instructs it to generate detailed learnings.
  const promptStr = `Given the following contents from a SERP search for the query <query>${query}</query>, generate a detailed list of learnings. For each learning, provide an in-depth explanation that includes context, technical details, relevant metrics, and implications. Return up to ${numLearnings} learnings. Ensure that each learning is comprehensive and spans at least a few paragraphs if possible.\n\n<contents>\n${trimmedContents.map(content => `<content>\n${content}\n</content>`).join('\n')}\n</contents>`;
  
  console.log("[deep-research.ts][processSerpResult] Prompt sent to LLM:", promptStr);

  // Call the LLM provider with the constructed prompt.
  const res = await generateObject({
    model: o3MiniModel,
    abortSignal: AbortSignal.timeout(60_000),
    system: systemPrompt(),
    prompt: promptStr,
    schema: z.object({
      learnings: z.array(z.string()).describe(`List of learnings, max of ${numLearnings}`),
      followUpQuestions: z.array(z.string()).describe(`List of follow-up questions, max of ${numFollowUpQuestions}`),
    }),
  });

  console.log("[deep-research.ts][processSerpResult] LLM response:", res.object);
  console.log(`[deep-research.ts][processSerpResult] Created ${res.object.learnings.length} learnings:`, res.object.learnings);

  return res.object;
}

export { processSerpResult };



export async function writeFinalReport({
  query,
  prompt,
  learnings,
  visitedUrls,
}: {
  query: string;
  prompt: string;
  learnings: string[];
  visitedUrls: string[];
}) {
  const learningsString = trimPrompt(
    learnings.map(learning => `<learning>\n${learning}\n</learning>`).join('\n'),
    175_000,
  );

  // Updated prompt: instruct the LLM to generate a much longer report (at least 5 pages)

  const finalPrompt = `Given the following prompt from the user, write an extremely detailed final report on the topic using the learnings from research. The report should be highly comprehensive—aim for at least 5 pages of detailed analysis when formatted. For each learning provided below, elaborate on its implications with extended discussions that include multiple case studies, data analysis, and, where applicable, citations or references to support the findings. Provide an in-depth executive summary at the top that reiterates the original query and addresses any follow-up questions, provide a table of contents if required, then expand and provide detailed sub sections.  Include detailed technical analysis, comparisons, and examples throughout the report. Reference case studies and provide citations if appropriate\n\n<prompt>${prompt}</prompt>\n\nHere are all the learnings from previous research:\n\n<learnings>\n${learningsString}\n</learnings>\n\nEnsure that you include the original query as follows:\n\n<query>\n${query}\n</query>\n\nTake into account the original intent of the primary query and the follow-up questions. More detail is better.`;


  console.log("[deep-research.ts][writeFinalReport] Prompt sent to LLM:", finalPrompt);

  const res = await generateObject({
    model: o3MiniModel,
    system: systemPrompt(),
    prompt: finalPrompt,
    schema: z.object({
      reportMarkdown: z.string().describe('Final report on the topic in Markdown'),
    }),
  });

  console.log("[deep-research.ts][writeFinalReport] LLM response:", res.object);

  // Append the visited URLs section to the report
  const urlsSection = `\n\n## Sources\n\n${visitedUrls.map(url => `- ${url}`).join('\n')}`;
  return res.object.reportMarkdown + urlsSection;
}
export async function deepResearch({
  query,
  breadth,
  depth,
  learnings = [],
  visitedUrls = [],
}: {
  query: string;
  breadth: number;
  depth: number;
  learnings?: string[];
  visitedUrls?: string[];
}): Promise<ResearchResult> {
  const serpQueries = await generateSerpQueries({ query, learnings, numQueries: breadth });
  const limit = pLimit(ConcurrencyLimit);

  const results = await Promise.all(
    serpQueries.map(serpQuery =>
      limit(async () => {
        try {
          const result = await firecrawl.search(serpQuery.query, {
            timeout: 15000,
            limit: 5,
            scrapeOptions: { 
		formats: ['markdown'],        // We're currently extracting Markdown
		onlyMainContent: true,          // Focus on main content only
		//mobile: false,                  // Set to true if mobile pages are preferred
    		waitFor: 3000,                  // Wait 3 seconds for dynamic content to load
    		removeBase64Images: true,       // Optional: remove embedded images to reduce clutter
    		//actions: [{ type: 'scroll', direction: 'down' }],
	    },
          });

          // Collect URLs from this search
          const newUrls = compact(result.data.map(item => item.url));
          const newBreadth = Math.ceil(breadth / 2);
          const newDepth = depth - 1;

          // Use (5) as the number of learnings to request.
          const newLearnings = await processSerpResult({
            query: serpQuery.query,
            result,
            numLearnings: 5, // Updated to use 5
            numFollowUpQuestions: newBreadth,
          });
          const allLearnings = [...learnings, ...newLearnings.learnings];
          const allUrls = [...visitedUrls, ...newUrls];

          if (newDepth > 0) {
            console.log(
              `[deep-research.ts] Researching deeper for query "${serpQuery.query}", breadth: ${newBreadth}, depth: ${newDepth}`
            );
            const nextQuery = `Previous research goal: ${serpQuery.researchGoal}\nFollow-up research directions: ${newLearnings.followUpQuestions.join('\n')}`;
            return deepResearch({
              query: nextQuery,
              breadth: newBreadth,
              depth: newDepth,
              learnings: allLearnings,
              visitedUrls: allUrls,
            });
          } else {
            return { learnings: allLearnings, visitedUrls: allUrls };
          }
        } catch (e: any) {
          if (e.message && e.message.includes('Timeout')) {
            console.error(`[deep-research.ts] Timeout error running query: "${serpQuery.query}":`, e);
          } else {
            console.error(`[deep-research.ts] Error running query: "${serpQuery.query}":`, e);
          }
          return { learnings: [], visitedUrls: [] };
        }
      })
    )
  );

  return {
    learnings: [...new Set(results.flatMap(r => r.learnings))],
    visitedUrls: [...new Set(results.flatMap(r => r.visitedUrls))],
  };
}
