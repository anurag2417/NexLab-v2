import { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { redisClient } from '../../config/redis.js';

const executeSchema = z.object({
  language: z.enum(['python', 'javascript', 'typescript', 'java', 'cpp']),
  code: z.string().max(50000),
  stdin: z.string().optional(),
  version: z.string().optional(),
});

const LANGUAGE_VERSIONS: Record<string, string> = {
  python: '3.10.0',
  javascript: '18.15.0',
  typescript: '5.0.3',
  java: '17.0.1',
  cpp: '10.2.0',
};

export class SandboxController {
  static async execute(req: Request, res: Response) {
    const { language, code, stdin, version } = executeSchema.parse(req.body);

    // Rate limiting per user using Redis
    const userId = req.userId;
    const key = `rate:sandbox:${userId}`;
    const current = await redisClient.incr(key);
    if (current === 1) await redisClient.expire(key, 60);
    if (current > 10) {
      return res.status(429).json({ success: false, message: 'Rate limit exceeded. 10/min.' });
    }

    const payload = {
      language,
      version: version || LANGUAGE_VERSIONS[language],
      files: [{ name: `main.${language === 'python' ? 'py' : 'js'}`, content: code }],
      stdin: stdin || '',
      compile_timeout: 10000,
      run_timeout: 5000,
    };

    try {
      const response = await axios.post('https://emkc.org/api/v2/piston/execute', payload, {
        timeout: 12000,
      });

      const { run, compile } = response.data;

      if (compile?.stderr) {
        return res.status(200).json({ success: false, error: compile.stderr, isCompileError: true });
      }

      return res.status(200).json({
        success: true,
        output: run.stdout || '',
        error: run.stderr || '',
        exitCode: run.code,
      });
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        return res.status(408).json({ success: false, message: 'Execution timed out.' });
      }
      return res.status(500).json({ success: false, message: 'Sandbox service error.' });
    }
  }
}