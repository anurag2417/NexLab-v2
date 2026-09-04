// packages/backend/src/modules/problems/problem.service.ts

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

  // ---------- SUBMIT SOLUTION WITH DETAILED TEST RESULTS ----------
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
    
    if (testCases.length === 0) {
      return {
        passedTests: 0,
        totalTests: 0,
        status: 'runtime_error',
        runtime: 0,
        memory: 0,
        errorMessage: 'No test cases defined for this problem.',
        testResults: [],
      };
    }

    console.log(`🔍 Running ${testCases.length} test cases...`);
    console.log(`📝 Code: ${code.substring(0, 100)}...`);

    // ✅ Run ALL test cases (visible + hidden)
    const testResults: any[] = [];
    let passedTests = 0;
    let totalTests = testCases.length;
    let status = 'accepted';
    let errorMessage = '';
    let totalRuntime = 0;
    let maxMemory = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const isHidden = testCase.isHidden || false;
      
      // Create result object for this test case
      const result: any = {
        testCaseIndex: i,
        input: testCase.input,
        expected: testCase.expectedOutput,
        got: '',
        passed: false,
        isHidden: isHidden,
        runtime: 0,
        memory: 0,
        error: null,
      };

      try {
        console.log(`🧪 Running test case ${i + 1}/${testCases.length}: input="${testCase.input}"`);
        
        const execResult = await this.executeCodeDirectly(code, testCase.input);
        
        result.runtime = execResult.runtime || 0;
        result.memory = execResult.memory || 0;
        totalRuntime += result.runtime;
        maxMemory = Math.max(maxMemory, result.memory);

        // ✅ Get actual output
        const actualOutput = execResult.output.trim();
        const expectedOutput = testCase.expectedOutput.trim();

        result.got = actualOutput;

        // ✅ Compare outputs
        if (actualOutput === expectedOutput) {
          result.passed = true;
          passedTests++;
          console.log(`✅ Test case ${i + 1} PASSED`);
        } else {
          result.passed = false;
          status = 'wrong_answer';
          errorMessage = `Test case ${i + 1} failed. Expected: "${expectedOutput}", Got: "${actualOutput}"`;
          console.log(`❌ Test case ${i + 1} FAILED`);
        }

        testResults.push(result);

      } catch (error: any) {
        console.error(`❌ Test case ${i + 1} error:`, error);
        result.got = 'Error';
        result.passed = false;
        result.error = error.message || 'Runtime error';
        testResults.push(result);
        
        // If this is a visible test case, mark as runtime error
        if (!isHidden) {
          status = 'runtime_error';
          errorMessage = error.message || 'Runtime error occurred';
        }
      }
    }

    // Calculate averages
    const avgRuntime = testResults.length > 0 ? Math.round(totalRuntime / testResults.length) : 0;

    // ✅ Determine final status
    // Only mark as accepted if ALL test cases passed
    if (passedTests === totalTests) {
      status = 'accepted';
      errorMessage = '';
    } else if (status === 'accepted') {
      // If some tests failed but no runtime error
      status = 'wrong_answer';
      errorMessage = `${totalTests - passedTests} test case(s) failed`;
    }

    console.log(`📊 Results: ${passedTests}/${totalTests} tests passed, Status: ${status}`);

    // ✅ Save submission to database
    const submission = await ProblemSubmission.create({
      problemId: new Types.ObjectId(problemId),
      userId: new Types.ObjectId(userId),
      language: 'javascript',
      code,
      status,
      passedTests,
      totalTests,
      runtime: avgRuntime,
      memory: maxMemory,
      errorMessage: errorMessage || undefined,
      submittedAt: new Date(),
    });

    // ✅ Award XP if ALL tests passed
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
        console.log(`🏆 Awarded ${xpGain} XP to user ${userId}`);
      }
    }

    // ✅ Return detailed results
    return {
      submission: {
        id: submission._id,
        status: submission.status,
        passedTests: submission.passedTests,
        totalTests: submission.totalTests,
        runtime: submission.runtime,
        memory: submission.memory,
        errorMessage: submission.errorMessage,
        createdAt: submission.submittedAt,
      },
      // ✅ Full test results for display
      testResults: testResults.map((tr: any) => ({
        input: tr.input,
        expected: tr.expected,
        got: tr.got,
        passed: tr.passed,
        isHidden: tr.isHidden,
        runtime: tr.runtime,
        memory: tr.memory,
        error: tr.error,
      })),
      passedTests,
      totalTests,
      status,
      runtime: avgRuntime,
      memory: maxMemory,
      errorMessage,
    };
  }

  // ---------- DIRECT CODE EXECUTION ----------
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

    // ✅ Detect function name
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
      throw new Error('Could not detect a function definition in your code. Make sure you define a function.');
    }

    // ✅ Validate input
    try {
      new Function(`return [${input}]`)();
    } catch {
      throw new Error(`Test case input is not valid JS arguments: "${input}". Use format like: 5, 10`);
    }

    // ✅ Create wrapper with detailed error handling
    const wrapperCode = `
${code}

// ✅ Execute with test values
try {
  const result = ${functionName}(${input});
  // Ensure clean output
  console.log(String(result).trim());
} catch (error) {
  console.error('Runtime Error:', error.message);
  process.exit(1);
}
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