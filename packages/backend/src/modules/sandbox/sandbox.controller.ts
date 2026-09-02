import { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { redisClient } from '../../config/redis.js';

// Validation schema for code execution - ONLY 4 LANGUAGES
const executeSchema = z.object({
  language: z.enum(['python', 'javascript', 'java', 'cpp']),
  code: z.string().max(50000, 'Code exceeds 50KB limit'),
  stdin: z.string().optional().default(''),
  args: z.array(z.string()).optional().default([]),
  version: z.string().optional(),
});

// Language configurations for Piston API
const LANGUAGE_CONFIG: Record<string, { 
  pistonLanguage: string; 
  pistonVersion: string;
  extension: string;
}> = {
  python: {
    pistonLanguage: 'python',
    pistonVersion: '3.10.0',
    extension: 'py'
  },
  javascript: {
    pistonLanguage: 'javascript',
    pistonVersion: '18.15.0',
    extension: 'js'
  },
  java: {
    pistonLanguage: 'java',
    pistonVersion: '17.0.1',
    extension: 'java'
  },
  cpp: {
    pistonLanguage: 'cpp',
    pistonVersion: '10.2.0',
    extension: 'cpp'
  }
};

// Sample code snippets for 4 languages
export const SAMPLE_CODE: Record<string, string> = {
  python: `# Welcome to NexLab Python Sandbox!
# Write your Python code here

print("Hello, World!")
print("This is Python running in NexLab!")

# Try a simple calculation
x = 10
y = 20
print(f"Sum: {x + y}")`,

  javascript: `// Welcome to NexLab JavaScript Sandbox!
// Write your JavaScript code here

console.log("Hello, World!");
console.log("This is JavaScript running in NexLab!");

// Try a simple calculation
const x = 10;
const y = 20;
console.log(\`Sum: \${x + y}\`);`,

  java: `// Welcome to NexLab Java Sandbox!
// Write your Java code here

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("This is Java running in NexLab!");
        
        // Try a simple calculation
        int x = 10;
        int y = 20;
        System.out.println("Sum: " + (x + y));
    }
}`,

  cpp: `// Welcome to NexLab C++ Sandbox!
// Write your C++ code here

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "This is C++ running in NexLab!" << endl;
    
    // Try a simple calculation
    int x = 10;
    int y = 20;
    cout << "Sum: " << x + y << endl;
    
    return 0;
}`
};

export class SandboxController {
  static async execute(req: Request, res: Response) {
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

      // For Java, ensure class is named "Main"
      let finalCode = code;
      if (language === 'java') {
        finalCode = code.replace(/public\s+class\s+\w+/g, 'public class Main');
      }

      // Prepare payload for Piston API
      const payload = {
        language: config.pistonLanguage,
        version: config.pistonVersion,
        files: [
          {
            name: `main.${config.extension}`,
            content: finalCode,
          },
        ],
        stdin: stdin || '',
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
        compile_memory_limit: 256,
        run_memory_limit: 128,
      };

      console.log(`🚀 Sending request to Piston API for ${language}`);

      // Call Piston API
      const response = await axios.post(
        'https://emkc.org/api/v2/piston/execute',
        payload,
        {
          timeout: 12000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const { run, compile, language: lang, version: ver } = response.data;

      // Check for Compilation Errors
      if (compile && compile.stderr) {
        return res.status(200).json({
          success: false,
          output: '',
          error: compile.stderr,
          executed: false,
          isCompileError: true,
          language: lang,
          version: ver,
        });
      }

      // Success Response
      return res.status(200).json({
        success: true,
        output: run.stdout || '',
        error: run.stderr || '',
        executed: true,
        exitCode: run.code || 0,
        language: lang,
        version: ver,
        executionTime: run.time || 'N/A',
      });

    } catch (error: any) {
      console.error('❌ Sandbox execution error:', error);

      // Handle Axios timeout
      if (error.code === 'ECONNABORTED') {
        return res.status(408).json({
          success: false,
          message: 'Code execution timed out. Please optimize your code.',
        });
      }

      // Handle Piston API errors
      if (error.response?.data) {
        return res.status(error.response.status || 500).json({
          success: false,
          message: error.response.data.message || 'Sandbox service error',
        });
      }

      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Invalid request',
        });
      }

      // Generic error
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to execute code',
      });
    }
  }

  // Get available languages - ONLY 4 LANGUAGES
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