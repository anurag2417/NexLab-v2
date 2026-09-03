import { Request, Response } from 'express';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { redisClient } from '../../config/redis.js';

const execAsync = promisify(exec);

// ✅ Only JavaScript
const executeSchema = z.object({
  language: z.enum(['javascript']),
  code: z.string().max(50000, 'Code exceeds 50KB limit'),
  stdin: z.string().optional().default(''),
  args: z.array(z.string()).optional().default([]),
  version: z.string().optional(),
});

// ✅ JavaScript config for local execution
const LANGUAGE_CONFIG: Record<string, { 
  extension: string;
  executeCmd: (filePath: string) => string;
}> = {
  javascript: {
    extension: 'js',
    executeCmd: (filePath) => `node "${filePath}" 2>&1`
  }
};

// ✅ JavaScript sample code
export const SAMPLE_CODE: Record<string, string> = {
  javascript: `// Welcome to NexLab JavaScript Sandbox!
// Write your JavaScript code here

console.log("Hello, World!");
console.log("This is JavaScript running in NexLab!");

// Try a simple calculation
const x = 10;
const y = 20;
console.log(\`Sum: \${x + y}\`);`
};

export class SandboxController {
  static async execute(req: Request, res: Response) {
    const tempDir = path.join(process.cwd(), 'temp');
    
    try {
      console.log('🏖️ Sandbox execute called');
      console.log('👤 req.userId:', req.userId);
      console.log('📦 req.body:', req.body);

      if (!req.userId) {
        console.warn('⚠️ No userId found - authentication failed');
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in again.',
        });
      }

      const { language, code, stdin } = executeSchema.parse(req.body);
      const userId = req.userId;

      console.log(`📝 Executing ${language} code for user ${userId}`);

      // Rate Limiting (Redis)
      const rateKey = `sandbox:rate:${userId}`;
      if (redisClient.isReady) {
        const current = await redisClient.incr(rateKey);
        if (current === 1) await redisClient.expire(rateKey, 60);
        if (current > 5) {
          return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded. 5 executions per minute allowed.',
          });
        }
      }

      // Get language config
      const config = LANGUAGE_CONFIG[language];
      if (!config) {
        return res.status(400).json({
          success: false,
          message: `Unsupported language: ${language}`,
        });
      }

      // Create temp directory
      await fs.mkdir(tempDir, { recursive: true });

      // Create temp file
      const fileId = randomUUID();
      const fileName = `code_${fileId}.${config.extension}`;
      const filePath = path.join(tempDir, fileName);

      // Write code to file
      await fs.writeFile(filePath, code, 'utf-8');
      console.log(`📄 Created temp file: ${filePath}`);

      let output = '';
      let error = '';
      let exitCode = 0;

      // Execute code
      try {
        console.log(`🚀 Executing JavaScript...`);
        const { stdout, stderr } = await execAsync(
          config.executeCmd(filePath),
          {
            timeout: 5000,
            env: { ...process.env, PATH: process.env.PATH },
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
          }
        );
        output = stdout || '';
        error = stderr || '';
        exitCode = 0;
      } catch (execError: any) {
        console.error('Execution error:', execError);
        output = execError.stdout || '';
        error = execError.stderr || execError.message || 'Execution failed';
        exitCode = execError.code || 1;
      }

      // Cleanup temp files
      try {
        await fs.rm(filePath, { force: true });
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError);
      }

      // Return response
      return res.status(200).json({
        success: exitCode === 0,
        output: output || '',
        error: error || '',
        executed: true,
        exitCode: exitCode,
        language: 'javascript',
        executionTime: '0.1',
      });

    } catch (error: any) {
      console.error('❌ Sandbox execution error:', error);

      // Cleanup temp directory if possible
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) { /* ignore */ }

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Invalid request',
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to execute code',
      });
    }
  }

  // ✅ Only JavaScript languages
  static async getLanguages(req: Request, res: Response) {
    try {
      const languages = Object.keys(LANGUAGE_CONFIG).map((key) => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        extension: LANGUAGE_CONFIG[key].extension,
        sample: SAMPLE_CODE[key] || `// Write your ${key} code here`,
      }));

      res.status(200).json({
        success: true,
        data: languages,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch languages',
      });
    }
  }
}