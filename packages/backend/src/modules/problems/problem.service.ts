import { Types } from 'mongoose';
import { Problem, ProblemSubmission, IProblem } from './problem.model.js';
import { User } from '../auth/auth.model.js';
import { LeaderboardService } from '../leaderboard/leaderboard.service.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

export class ProblemService {
  // ---------- Problem CRUD ----------
  
  static async createProblem(data: Partial<IProblem>): Promise<IProblem> {
    if (!data.starterCode || data.starterCode.trim() === '') {
      const functionName = data.title
        ? data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
        : 'solution';
      
      data.starterCode = `function ${functionName}() {\n  // Write your solution here\n  // Return the result\n  return 0;\n}`;
    }
    
    const problem = await Problem.create(data);
    return problem;
  }

  static async getProblemById(problemId: string): Promise<IProblem | null> {
    const problem = await Problem.findById(problemId).populate('createdBy', 'name').lean();
    return problem as IProblem | null;
  }

  static async getProblemBySlug(slug: string): Promise<IProblem | null> {
    const problem = await Problem.findOne({ slug, isPublished: true }).populate('createdBy', 'name').lean();
    return problem as IProblem | null;
  }

  static async getProblems(filters: {
    difficulty?: string;
    tag?: string;
    search?: string;
    limit?: number;
    page?: number;
  }): Promise<{ problems: any[]; total: number }> {
    const { difficulty, tag, search, limit = 20, page = 1 } = filters;
    const query: any = { isPublished: true };

    if (difficulty) query.difficulty = difficulty;
    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [problems, total] = await Promise.all([
      Problem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title slug difficulty tags createdAt isPublished')
        .lean(),
      Problem.countDocuments(query),
    ]);

    return { problems, total };
  }

  static async updateProblem(problemId: string, data: Partial<IProblem>): Promise<IProblem | null> {
    const problem = await Problem.findByIdAndUpdate(problemId, data, { new: true, runValidators: true });
    return problem as IProblem | null;
  }

  static async deleteProblem(problemId: string): Promise<boolean> {
    const result = await Problem.findByIdAndDelete(problemId);
    return !!result;
  }

  // ---------- Helper: Strip ANSI Color Codes ----------
  static stripAnsiCodes(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
  }

  // ---------- Submit Solution ----------
  static async submitSolution(
    problemId: string,
    userId: string,
    code: string
  ): Promise<any> {
    const problem = await Problem.findById(problemId);
    if (!problem) {
      throw new Error('Problem not found');
    }

    const testCases = problem.testCases || [];
    let passedTests = 0;
    let totalTests = testCases.length;
    let status = 'accepted';
    let errorMessage = '';
    let runtime = 0;
    let memory = 0;

    for (const testCase of testCases) {
      try {
        const result = await this.executeJavaScript(
          code,
          testCase.input,
          problem.timeLimit || 2000
        );
        
        runtime += result.runtime;
        memory = Math.max(memory, result.memory);

        const output = this.stripAnsiCodes(result.output).trim();
        const expected = testCase.expectedOutput.trim();

        if (output !== expected) {
          status = 'wrong_answer';
          errorMessage = `Expected: ${expected}, Got: ${output}`;
          break;
        }

        passedTests++;
      } catch (error: any) {
        console.error('Test case error:', error);
        if (error.message.includes('timeout')) {
          status = 'time_limit';
          errorMessage = 'Time limit exceeded';
        } else {
          status = 'runtime_error';
          errorMessage = error.message || 'Runtime error';
        }
        break;
      }
    }

    const submission = await ProblemSubmission.create({
      problemId: new Types.ObjectId(problemId),
      userId: new Types.ObjectId(userId),
      code,
      status,
      passedTests,
      totalTests,
      runtime: Math.round(runtime / Math.max(testCases.length, 1)),
      memory,
      errorMessage,
      submittedAt: new Date(),
    });

    if (status === 'accepted') {
      const xpGain = this.getXpForDifficulty(problem.difficulty);
      const user = await User.findById(userId);
      if (user) {
        user.xp = (user.xp || 0) + xpGain;
        const newLevel = Math.floor(user.xp / 100) + 1;
        if (newLevel > user.level) {
          user.level = newLevel;
        }
        await user.save();
        await LeaderboardService.updateUserScore(userId, user.xp);
      }
    }

    return {
      submission,
      passedTests,
      totalTests,
      status,
      runtime: Math.round(runtime / Math.max(testCases.length, 1)),
      memory,
      errorMessage,
    };
  }

  // ---------- Execute JavaScript Code ----------
  static async executeJavaScript(
    code: string,
    input: string,
    timeLimit: number
  ): Promise<{ output: string; runtime: number; memory: number }> {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });

    const fileId = randomUUID();
    const filePath = path.join(tempDir, `code_${fileId}.js`);

    const finalCode = this.wrapWithTestRunner(code, input);
    await fs.writeFile(filePath, finalCode, 'utf-8');

    const startTime = Date.now();
    let output = '';
    let error = '';

    try {
      const timeoutMs = Math.max(timeLimit, 3000);
      const { stdout, stderr } = await execAsync(
        `node "${filePath}"`,
        {
          timeout: timeoutMs,
          env: { ...process.env, PATH: process.env.PATH },
          maxBuffer: 1024 * 1024 * 10,
        }
      );
      output = stdout;
      error = stderr;
    } catch (execError: any) {
      console.error('Execution error:', execError);
      if (execError.killed) {
        throw new Error('timeout');
      }
      if (execError.stderr) {
        error = execError.stderr;
        return { output: execError.stdout || '', runtime: Date.now() - startTime, memory: 0 };
      }
      throw new Error(execError.message || 'Execution failed');
    } finally {
      await fs.rm(filePath, { force: true });
    }

    const runtime = Date.now() - startTime;
    const memory = 0;

    if (error) {
      throw new Error(error);
    }

    return { output: this.stripAnsiCodes(output), runtime, memory };
  }

  // ---------- Wrap Code with Test Runner ----------
  static wrapWithTestRunner(code: string, input: string): string {
    // Parse input
    const lines = input.split('\n').filter(s => s.trim());
    const args = lines.map(s => s.trim());
    
    let parsedInput = args;
    if (args.length === 1 && args[0].startsWith('[')) {
      try {
        parsedInput = JSON.parse(args[0]);
      } catch (e) { /* ignore */ }
    }

    const inputString = JSON.stringify(parsedInput);
    
    // Try to detect the function name from the code
    let functionName = 'solution';
    const funcMatch = code.match(/(?:function|const|let|var)\s+(\w+)\s*[=\(]/);
    if (funcMatch) {
      functionName = funcMatch[1];
    }

    return `
${code}

// Test runner
function runSolution() {
  try {
    const input = ${inputString};
    
    let result;
    if (Array.isArray(input)) {
      result = ${functionName}(...input);
    } else {
      result = ${functionName}(input);
    }
    
    console.log(result);
  } catch (error) {
    console.error(error.message);
  }
}

runSolution();
`;
  }

  static getXpForDifficulty(difficulty: string): number {
    const xpMap: Record<string, number> = {
      easy: 15,
      medium: 30,
      hard: 50,
    };
    return xpMap[difficulty] || 15;
  }

  static async getUserSubmissions(userId: string, problemId?: string): Promise<any[]> {
    const query: any = { userId };
    if (problemId) query.problemId = problemId;

    return await ProblemSubmission.find(query)
      .populate('problemId', 'title difficulty')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getProblemStats(problemId: string): Promise<any> {
    const submissions = await ProblemSubmission.find({ problemId });
    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter(s => s.status === 'accepted').length;

    return {
      totalSubmissions,
      acceptedSubmissions,
      acceptanceRate: totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0,
    };
  }
}