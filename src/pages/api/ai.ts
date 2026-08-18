import type { NextApiRequest, NextApiResponse } from 'next';
import { handleAiRequest, handleAiStatus } from '../../ai/server/handle-ai-request';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'GET') {
    res.status(200).json(handleAiStatus());
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ success: false, error: 'method_not_allowed', fallbackUsed: true });
    return;
  }

  const result = await handleAiRequest(req.body);
  res.status(200).json(result);
}
