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
  static async createProblem(data: Partial<IProblem>): Promise<IProblem> {
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
        .select('title slug difficulty tags createdAt isPublished starterCode')
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

  // ---------- SUBMIT SOLUTION - FIXED ----------
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
    
    const testResults: any[] = [];

    if (testCases.length === 0) {
      return {
        passedTests: 0,
        totalTests: 0,
        status: 'runtime_error',
        runtime: 0,
        memory: 0,
        errorMessage: 'No test cases defined.',
        testResults: [],
      };
    }

    console.log(`🔍 Running ${testCases.length} test cases...`);

    for (const testCase of testCases) {
      const isHidden = testCase.isHidden || false;
      const result: any = { 
        input: testCase.input, 
        expected: testCase.expectedOutput, 
        passed: false, 
        isHidden,
        got: ''
      };
      
      try {
        const execResult = await this.executeCodeDirectly(code, testCase.input);
        
        runtime += execResult.runtime || 0;
        memory = Math.max(memory, execResult.memory || 0);

        const output = execResult.output.trim();
        const expected = testCase.expectedOutput.trim();

        result.got = output;
        
        console.log(`📊 Test: input="${testCase.input}", expected="${expected}", got="${output}"`);
        console.log(`📊 Comparison: "${output}" === "${expected}" ? ${output === expected}`);
        
        if (output !== expected) {
          status = 'wrong_answer';
          errorMessage = `Expected: ${expected}, Got: ${output}`;
          result.passed = false;
          testResults.push(result);
          break;
        }

        result.passed = true;
        testResults.push(result);
        passedTests++;
      } catch (error: any) {
        console.error('Test case error:', error);
        result.got = error.message || 'Error';
        result.passed = false;
        testResults.push(result);
        status = 'runtime_error';
        errorMessage = error.message || 'Runtime error';
        break;
      }
    }

    while (testResults.length < testCases.length) {
      const idx = testResults.length;
      const tc = testCases[idx];
      testResults.push({
        input: tc.input,
        expected: tc.expectedOutput,
        got: 'Not executed',
        passed: false,
        isHidden: tc.isHidden || false
      });
    }

    const submission = await ProblemSubmission.create({
      problemId: new Types.ObjectId(problemId),
      userId: new Types.ObjectId(userId),
      language: 'javascript',
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
      testResults,
    };
  }

  // ---------- DIRECT CODE EXECUTION - FIXED ----------
  static async executeCodeDirectly(
    code: string,
    input: string
  ): Promise<{ output: string; runtime: number; memory: number }> {
    const tempDir = path.join(process.cwd(), 'temp');
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (e) {}

    const fileId = randomUUID();
    const filePath = path.join(tempDir, `code_${fileId}.js`);

    // ✅ Detect function name across multiple declaration styles
    const patterns = [
      /var\s+(\w+)\s*=\s*function/,
      /let\s+(\w+)\s*=\s*function/,
      /const\s+(\w+)\s*=\s*function/,
      /function\s+(\w+)\s*\(/,
      /var\s+(\w+)\s*=\s*\(/,
      /let\s+(\w+)\s*=\s*\(/,
      /const\s+(\w+)\s*=\s*\(/,
    ];
    
    let functionName: string | null = null;
    for (const p of patterns) {
      const m = code.match(p);
      if (m) { 
        functionName = m[1]; 
        break; 
      }
    }
    
    if (!functionName) {
      throw new Error('Could not detect a function definition in your code.');
    }

    // ✅ Validate input is safe JS
    try {
      new Function(`return [${input}]`)();
    } catch {
      throw new Error(`Test case input is not valid JS arguments: "${input}". Use format like: 5, 10`);
    }

    // ✅ Create the wrapper
    const wrapperCode = `
${code}

// ✅ Execute with test values
const result = ${functionName}(${input});
// ✅ Ensure clean output - no extra spaces
console.log(String(result).trim());
`;
    
    await fs.writeFile(filePath, wrapperCode, 'utf-8');

    console.log(`📄 Running test: ${functionName}(${input})`);

    const startTime = Date.now();
    let stdout = '';
    let stderr = '';

    try {
      const result = await execAsync(`node "${filePath}"`, {
        timeout: 5000,
        env: { ...process.env, PATH: process.env.PATH },
        maxBuffer: 1024 * 1024 * 10,
      });
      
      stdout = result.stdout;
      stderr = result.stderr;
      
      stdout = stdout.trim();
      stderr = stderr.trim();
      
      console.log(`📤 Output: "${stdout}"`);
      
    } catch (error: any) {
      console.error('❌ Execution error:', error);
      if (error.stdout) stdout = error.stdout.trim();
      if (error.stderr) stderr = error.stderr.trim();
      
      if (stdout || stderr) {
        return { 
          output: stdout || stderr, 
          runtime: Date.now() - startTime, 
          memory: 0 
        };
      }
      throw new Error(error.message || 'Execution failed');
    } finally {
      try {
        await fs.rm(filePath, { force: true });
      } catch (e) {}
    }

    const runtime = Date.now() - startTime;

    if (stdout) {
      return { output: stdout, runtime, memory: 0 };
    }
    
    if (stderr) {
      return { output: stderr, runtime, memory: 0 };
    }

    return { output: '', runtime, memory: 0 };
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