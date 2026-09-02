import { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { redisClient } from '../../config/redis.js';

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

// Language file extensions and default versions
const LANGUAGE_CONFIG: Record<string, { extension: string; defaultVersion: string }> = {
  python: { extension: 'py', defaultVersion: '3.10.0' },
  javascript: { extension: 'js', defaultVersion: '18.15.0' },
  typescript: { extension: 'ts', defaultVersion: '5.0.3' },
  java: { extension: 'java', defaultVersion: '17.0.1' },
  cpp: { extension: 'cpp', defaultVersion: '10.2.0' },
  c: { extension: 'c', defaultVersion: '10.2.0' },
  go: { extension: 'go', defaultVersion: '1.19.0' },
  rust: { extension: 'rs', defaultVersion: '1.70.0' },
  ruby: { extension: 'rb', defaultVersion: '3.2.0' },
  php: { extension: 'php', defaultVersion: '8.2.0' },
  swift: { extension: 'swift', defaultVersion: '5.8.0' },
  kotlin: { extension: 'kt', defaultVersion: '1.8.0' },
};

// Sample code snippets for each language
export const SAMPLE_CODE: Record<string, string> = {
  python: `# Welcome to NexLab Python Sandbox!
# Write your Python code here

def greet(name):
    return f"Hello, {name}! Welcome to NexLab!"

name = input("Enter your name: ")
print(greet(name))
print("\\n✨ Python execution successful!")`,

  javascript: `// Welcome to NexLab JavaScript Sandbox!
// Write your JavaScript code here

function greet(name) {
  return \`Hello, \${name}! Welcome to NexLab!\`;
}

const name = "Student";
console.log(greet(name));
console.log("\\n✨ JavaScript execution successful!");`,

  typescript: `// Welcome to NexLab TypeScript Sandbox!
// Write your TypeScript code here

interface Greeting {
  message: string;
  timestamp: Date;
}

function greet(name: string): Greeting {
  return {
    message: \`Hello, \${name}! Welcome to NexLab!\`,
    timestamp: new Date()
  };
}

const result = greet("Student");
console.log(result.message);
console.log("\\n✨ TypeScript execution successful!");`,

  java: `// Welcome to NexLab Java Sandbox!
// Write your Java code here

import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter your name: ");
        String name = scanner.nextLine();
        
        System.out.println("Hello, " + name + "! Welcome to NexLab!");
        System.out.println("\\n✨ Java execution successful!");
        scanner.close();
    }
}`,

  cpp: `// Welcome to NexLab C++ Sandbox!
// Write your C++ code here

#include <iostream>
#include <string>

using namespace std;

int main() {
    string name;
    cout << "Enter your name: ";
    getline(cin, name);
    
    cout << "Hello, " << name << "! Welcome to NexLab!" << endl;
    cout << "\\n✨ C++ execution successful!" << endl;
    return 0;
}`,

  c: `// Welcome to NexLab C Sandbox!
// Write your C code here

#include <stdio.h>

int main() {
    char name[100];
    printf("Enter your name: ");
    fgets(name, sizeof(name), stdin);
    
    printf("Hello, %s! Welcome to NexLab!\\n", name);
    printf("\\n✨ C execution successful!\\n");
    return 0;
}`,

  go: `// Welcome to NexLab Go Sandbox!
// Write your Go code here

package main

import "fmt"

func main() {
    var name string
    fmt.Print("Enter your name: ")
    fmt.Scanln(&name)
    
    fmt.Printf("Hello, %s! Welcome to NexLab!\\n", name)
    fmt.Println("\\n✨ Go execution successful!")
}`,

  rust: `// Welcome to NexLab Rust Sandbox!
// Write your Rust code here

use std::io;

fn main() {
    println!("Welcome to NexLab Sandbox!");
    
    // Simple arithmetic
    let x = 10;
    let y = 20;
    let sum = x + y;
    
    println!("Sum of {} and {} is: {}", x, y, sum);
    println!("\\n✨ Rust execution successful!");
}`,

  ruby: `# Welcome to NexLab Ruby Sandbox!
# Write your Ruby code here

def greet(name)
  puts "Hello, #{name}! Welcome to NexLab!"
end

print "Enter your name: "
name = gets.chomp

greet(name)
puts "\\n✨ Ruby execution successful!"`,

  php: `<?php
// Welcome to NexLab PHP Sandbox!
// Write your PHP code here

$name = "Student";
echo "Hello, $name! Welcome to NexLab!\\n";
echo "\\n✨ PHP execution successful!\\n";
?>`,

  swift: `// Welcome to NexLab Swift Sandbox!
// Write your Swift code here

import Foundation

print("Welcome to NexLab Sandbox!")
print("Enter your name: ", terminator: "")

if let name = readLine() {
    print("Hello, \\(name)! Welcome to NexLab!")
    print("\\n✨ Swift execution successful!")
}`,

  kotlin: `// Welcome to NexLab Kotlin Sandbox!
// Write your Kotlin code here

fun main() {
    println("Welcome to NexLab Sandbox!")
    
    val name = "Student"
    println("Hello, $name! Welcome to NexLab!")
    println("\\n✨ Kotlin execution successful!")
}`,
};

export class SandboxController {
  static async execute(req: Request, res: Response) {
    try {
      // Log everything for debugging
      console.log('🏖️ Sandbox execute called');
      console.log('👤 req.userId:', req.userId);
      console.log('🍪 req.cookies:', req.cookies);
      console.log('📋 req.headers.authorization:', req.headers.authorization);
      console.log('📦 req.body:', req.body);

      // Check if user is authenticated
      if (!req.userId) {
        console.warn('⚠️ No userId found - authentication failed');
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in again.',
          details: 'No user ID found in request'
        });
      }

      const { language, code, stdin, args, version } = executeSchema.parse(req.body);
      const userId = req.userId;

      console.log(`📝 Executing ${language} code for user ${userId}`);

      // ---- Rate Limiting (Redis) ----
      const rateKey = `sandbox:rate:${userId}`;
      if (redisClient.isReady) {
        const current = await redisClient.incr(rateKey);
        if (current === 1) await redisClient.expire(rateKey, 60);
        if (current > 10) {
          return res.status(429).json({
            success: false,
            message: 'Rate limit exceeded. 10 executions per minute allowed.',
          });
        }
      }

      // ---- Prepare Payload for Piston API ----
      const config = LANGUAGE_CONFIG[language];
      if (!config) {
        return res.status(400).json({
          success: false,
          message: `Unsupported language: ${language}`,
        });
      }

      const payload = {
        language: language,
        version: version || config.defaultVersion,
        files: [
          {
            name: `main.${config.extension}`,
            content: code,
          },
        ],
        stdin: stdin || '',
        args: args || [],
        compile_timeout: 10000,
        run_timeout: 5000,
        compile_memory_limit: 256,
        run_memory_limit: 128,
      };

      console.log(`🚀 Sending request to Piston API for ${language}`);

      // ---- Call Piston API ----
      const response = await axios.post(
        'https://emkc.org/api/v2/piston/execute',
        payload,
        {
          timeout: 12000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const { run, compile, language: lang, version: ver } = response.data;

      // ---- Check for Compilation Errors ----
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

      // ---- Success Response ----
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

  // Get available languages
  static async getLanguages(req: Request, res: Response) {
    try {
      const languages = Object.keys(LANGUAGE_CONFIG).map((key) => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1),
        extension: LANGUAGE_CONFIG[key].extension,
        defaultVersion: LANGUAGE_CONFIG[key].defaultVersion,
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