import type { MatchedJob } from '../../matching/matching.service.js';

export function formatJobMessage(matchedJob: MatchedJob): string {
  const { job, score } = matchedJob;

  const location = job.location ? `🌍 ${job.location}` : '';
  const country = job.country ? `📍 ${job.country}` : '';

  return `💼 ${job.title}

🏢 Company: ${job.company}

${location}
${country}

🌐 Source: ${job.source}

🎯 Match: ${score}%`;
}
