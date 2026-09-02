import { Request, Response } from 'express';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { redisClient } from '../../config/redis.js';

const execAsync = promisify(exec);

// Validation schema for code execution
const executeSchema = z.object({
  language: z.enum([
    'python', 'javascript', 'typescript', 'java', 'cpp', 
    'c', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin'
  ]),
  code: z.string().max(50000, 'Code exceeds 50KB limit'),
  stdin: z.string().optional().default(''),
  args: z.array(z.string()).optional().default([]),
  version: z.string().optional(),
});

// Language file extensions and execution commands
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
  typescript: { 
    extension: 'ts', 
    executeCmd: (filePath) => `npx ts-node "${filePath}"` 
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
  },
  c: { 
    extension: 'c', 
    compileCmd: (filePath) => {
      const outputPath = filePath.replace('.c', '');
      return `gcc "${filePath}" -o "${outputPath}"`;
    },
    executeCmd: (filePath) => `"${filePath.replace('.c', '')}"`
  },
  go: { 
    extension: 'go', 
    executeCmd: (filePath) => `go run "${filePath}"` 
  },
  rust: { 
    extension: 'rs', 
    compileCmd: (filePath) => {
      const outputPath = filePath.replace('.rs', '');
      return `rustc "${filePath}" -o "${outputPath}"`;
    },
    executeCmd: (filePath) => `"${filePath.replace('.rs', '')}"`
  },
  ruby: { 
    extension: 'rb', 
    executeCmd: (filePath) => `ruby "${filePath}"` 
  },
  php: { 
    extension: 'php', 
    executeCmd: (filePath) => `php "${filePath}"` 
  },
  swift: { 
    extension: 'swift', 
    executeCmd: (filePath) => `swift "${filePath}"` 
  },
  kotlin: { 
    extension: 'kt', 
    compileCmd: (filePath) => `kotlinc "${filePath}" -include-runtime -d "${filePath.replace('.kt', '.jar')}"`,
    executeCmd: (filePath) => `java -jar "${filePath.replace('.kt', '.jar')}"`
  },
};

// Sample code snippets
export const SAMPLE_CODE: Record<string, string> = {
  python: `# Welcome to NexLab Python Sandbox!
# Write your Python code here

print("Hello, World!")
print("This is a Python program running in NexLab!")`,

  javascript: `// Welcome to NexLab JavaScript Sandbox!
// Write your JavaScript code here

console.log("Hello, World!");
console.log("This is JavaScript running in NexLab!");`,

  typescript: `// Welcome to NexLab TypeScript Sandbox!
// Write your TypeScript code here

const message: string = "Hello, World!";
console.log(message);
console.log("TypeScript is working in NexLab!");`,

  java: `// Welcome to NexLab Java Sandbox!
// Write your Java code here

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Java is working in NexLab!");
    }
}`,

  cpp: `// Welcome to NexLab C++ Sandbox!
// Write your C++ code here

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "C++ is working in NexLab!" << endl;
    return 0;
}`,

  c: `// Welcome to NexLab C Sandbox!
// Write your C code here

#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    printf("C is working in NexLab!\\n");
    return 0;
}`,

  go: `// Welcome to NexLab Go Sandbox!
// Write your Go code here

package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    fmt.Println("Go is working in NexLab!");
}`,

  rust: `// Welcome to NexLab Rust Sandbox!
// Write your Rust code here

fn main() {
    println!("Hello, World!");
    println!("Rust is working in NexLab!");
}`,

  ruby: `# Welcome to NexLab Ruby Sandbox!
# Write your Ruby code here

puts "Hello, World!"
puts "Ruby is working in NexLab!"`,

  php: `<?php
// Welcome to NexLab PHP Sandbox!
// Write your PHP code here

echo "Hello, World!\\n";
echo "PHP is working in NexLab!\\n";
?>`,

  swift: `// Welcome to NexLab Swift Sandbox!
// Write your Swift code here

import Foundation

print("Hello, World!")
print("Swift is working in NexLab!")`,

  kotlin: `// Welcome to NexLab Kotlin Sandbox!
// Write your Kotlin code here

fun main() {
    println("Hello, World!")
    println("Kotlin is working in NexLab!")
}`,
};

export class SandboxController {
  static async execute(req: Request, res: Response) {
    const tempDir = path.join(process.cwd(), 'temp');
    
    try {
      console.log('🏖️ Sandbox execute called');
      console.log('👤 req.userId:', req.userId);
      console.log('📦 req.body:', req.body);

      // Check if user is authenticated
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

      // ---- Rate Limiting (Redis) ----
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

      // ---- Create Temp Directory ----
      await fs.mkdir(tempDir, { recursive: true });

      // ---- Create Temp File ----
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

      // Write code to file
      await fs.writeFile(filePath, code, 'utf-8');

      console.log(`📄 Created temp file: ${filePath}`);

      let output = '';
      let error = '';
      let exitCode = 0;

      // ---- Compile if needed ----
      if (config.compileCmd) {
        try {
          console.log(`🔨 Compiling ${language}...`);
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

      // ---- Execute Code ----
      try {
        console.log(`🚀 Executing ${language}...`);
        const execOptions = {
          timeout: 5000,
          env: { ...process.env, PATH: process.env.PATH },
        };

        // For Java, we need to handle the class name differently
        let cmd = config.executeCmd(filePath);
        if (language === 'java') {
          // Java expects the file name to match the class name
          const className = 'Main';
          const javaDir = path.dirname(filePath);
          cmd = `cd "${javaDir}" && java ${className}`;
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

      // ---- Cleanup Temp Files ----
      try {
        await fs.rm(filePath, { force: true });
        // Clean up compiled files
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

      // ---- Return Response ----
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

      // Cleanup temp directory if possible
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) { /* ignore */ }

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

  // Get available languages
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