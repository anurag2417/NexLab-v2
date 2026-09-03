import { Request, Response } from 'express';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { redisClient } from '../../config/redis.js';

const execAsync = promisify(exec);

// Validation schema for code execution - ONLY 4 LANGUAGES
const executeSchema = z.object({
  language: z.enum(['python', 'javascript', 'java', 'cpp']),
  code: z.string().max(50000, 'Code exceeds 50KB limit'),
  stdin: z.string().optional().default(''),
  args: z.array(z.string()).optional().default([]),
  version: z.string().optional(),
});

// Language configurations - ONLY 4 LANGUAGES
const LANGUAGE_CONFIG: Record<string, {
  extension: string;
  executeCmd: (filePath: string) => string;
  compileCmd?: (filePath: string) => string;
}> = {
  python: {
    extension: 'py',
    executeCmd: (filePath) => `python3 "${filePath}"`
  },
  javascript: {
    extension: 'js',
    executeCmd: (filePath) => `node "${filePath}"`
  },
  java: {
    extension: 'java',
    compileCmd: (filePath) => `javac "${filePath}"`,
    executeCmd: (filePath) => {
      const dir = path.dirname(filePath);
      const className = path.basename(filePath, '.java');
      return `cd "${dir}" && java "${className}"`;
    }
  },
  cpp: {
    extension: 'cpp',
    compileCmd: (filePath) => {
      const outputPath = filePath.replace('.cpp', '');
      return `g++ "${filePath}" -o "${outputPath}"`;
    },
    executeCmd: (filePath) => `"${filePath.replace('.cpp', '')}"`
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
    const tempDir = path.join(process.cwd(), 'temp');

    try {
      //console.log('🏖️ Sandbox execute called');
      //console.log('👤 req.userId:', req.userId);
      //console.log('📦 req.body:', req.body);

      if (!req.userId) {
        console.warn('⚠️ No userId found - authentication failed');
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in again.',
        });
      }

      const { language, code, stdin } = executeSchema.parse(req.body);
      const userId = req.userId;

      //console.log(`📝 Executing ${language} code for user ${userId}`);

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

      // Create Temp Directory
      await fs.mkdir(tempDir, { recursive: true });

      // Create Temp File
      const fileId = randomUUID();
      const config = LANGUAGE_CONFIG[language];
      if (!config) {
        return res.status(400).json({
          success: false,
          message: `Unsupported language: ${language}`,
        });
      }

      const fileName = `code_${fileId}.${config.extension}`;
      const filePath = path.join(tempDir, fileName);

      // For Java, always use "Main" as the class name
      let finalCode = code;
      if (language === 'java') {
        // Ensure the class is named "Main"
        finalCode = code.replace(/public\s+class\s+\w+/g, 'public class Main');
      }

      await fs.writeFile(filePath, finalCode, 'utf-8');
      //(`📄 Created temp file: ${filePath}`);

      let output = '';
      let error = '';
      let exitCode = 0;

      // Compile if needed
      if (config.compileCmd) {
        try {
          //console.log(`🔨 Compiling ${language}...`);
          await execAsync(config.compileCmd(filePath), { timeout: 10000 });
        } catch (compileError: any) {
          console.error('Compilation error:', compileError);
          return res.status(200).json({
            success: false,
            output: '',
            error: compileError.stderr || compileError.message || 'Compilation failed',
            executed: false,
            isCompileError: true,
          });
        }
      }

      // Execute Code
      try {
        //console.log(`🚀 Executing ${language}...`);
        const execOptions = {
          timeout: 5000,
          env: { ...process.env, PATH: process.env.PATH },
        };

        let cmd = config.executeCmd(filePath);
        if (language === 'java') {
          const javaDir = path.dirname(filePath);
          cmd = `cd "${javaDir}" && java Main`;
        }

        const { stdout, stderr } = await execAsync(cmd, execOptions);
        output = stdout || '';
        error = stderr || '';
        exitCode = 0;
      } catch (execError: any) {
        console.error('Execution error:', execError);
        output = execError.stdout || '';
        error = execError.stderr || execError.message || 'Execution failed';
        exitCode = execError.code || 1;
      }

      // Cleanup Temp Files
      try {
        await fs.rm(filePath, { force: true });
        if (config.compileCmd) {
          const basePath = filePath.replace(`.${config.extension}`, '');
          const extensions = ['.class', '.jar', '.exe', '.out', ''];
          for (const ext of extensions) {
            try {
              await fs.rm(`${basePath}${ext}`, { force: true });
            } catch (e) { /* ignore */ }
          }
        }
      } catch (cleanupError) {
        console.warn('Cleanup warning:', cleanupError);
      }

      // Return Response
      return res.status(200).json({
        success: exitCode === 0,
        output: output || '',
        error: error || '',
        executed: true,
        exitCode: exitCode,
        language: language,
      });

    } catch (error: any) {
      console.error('❌ Sandbox execution error:', error);

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