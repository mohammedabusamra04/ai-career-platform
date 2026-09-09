import 'dotenv/config';

/**
 * Standalone connectivity test for the JSearch (RapidAPI) endpoint used by
 * LinkedinJobSource. Run with:
 *
 *   npx tsx src/scripts/test-jsearch.ts
 *
 * Requires RAPIDAPI_KEY to be set (in .env or the shell environment).
 * Uses "AI Engineer" as the query since it's currently one of the most
 * in-demand tech roles on the market.
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

async function main(): Promise<void> {
  if (!RAPIDAPI_KEY) {
    console.error('❌ RAPIDAPI_KEY is not set. Add it to your .env file or export it first.');
    process.exit(1);
  }

  const query = 'AI Engineer in Remote';
  const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(
    query,
  )}&page=1&num_pages=1&date_posted=today`;

  console.log(`🔍 Testing JSearch API with query: "${query}"`);
  console.log(`📡 URL: ${url}\n`);

  const start = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        Accept: 'application/json',
      },
    });

    const elapsed = Date.now() - start;

    console.log(`⏱  Response time: ${elapsed}ms`);
    console.log(`📶 HTTP status: ${response.status} ${response.statusText}`);

    // Useful for spotting rate-limit issues on the free RapidAPI tier
    const rateLimitHeaders = [
      'x-ratelimit-requests-limit',
      'x-ratelimit-requests-remaining',
      'x-ratelimit-requests-reset',
    ];

    for (const header of rateLimitHeaders) {
      const value = response.headers.get(header);
      if (value) {
        console.log(`   ${header}: ${value}`);
      }
    }

    if (!response.ok) {
      const body = await response.text();
      console.error(`\n❌ Request failed.\n${body}`);
      process.exit(1);
    }

    const data = (await response.json()) as {
      status?: string;
      data?: Array<{
        job_title?: string;
        employer_name?: string;
        job_city?: string;
        job_is_remote?: boolean;
        job_posted_at_datetime_utc?: string;
        job_apply_link?: string;
      }>;
    };

    const jobs = data.data ?? [];

    console.log(`\n✅ API is working. status="${data.status}", jobs returned: ${jobs.length}\n`);

    jobs.slice(0, 5).forEach((job, i) => {
      console.log(`${i + 1}. ${job.job_title ?? 'N/A'} — ${job.employer_name ?? 'N/A'}`);
      console.log(
        `   📍 ${job.job_is_remote ? 'Remote' : job.job_city ?? 'N/A'} | 🕒 ${
          job.job_posted_at_datetime_utc ?? 'N/A'
        }`,
      );
      console.log(`   🔗 ${job.job_apply_link ?? 'N/A'}`);
    });

    if (jobs.length === 0) {
      console.log('⚠️  No jobs returned for this query/date filter — try removing date_posted=today.');
    }
  } catch (error) {
    console.error(
      `\n❌ Request threw an error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

void main();