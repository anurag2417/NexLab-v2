import { Request, Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { ProblemService } from './problem.service.js';
import { Problem } from './problem.model.js'; // ✅ Add this import

// Validation schemas
const createProblemSchema = z.object({
  title: z.string().min(3).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  description: z.string().min(10),
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional(),
  })),
  constraints: z.array(z.string()).default([]),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    isHidden: z.boolean().default(false),
  })),
  starterCode: z.string().default(''),
  solutionCode: z.string().default(''),
  hints: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  timeLimit: z.number().default(2000),
  memoryLimit: z.number().default(256),
});

const submitProblemSchema = z.object({
  code: z.string().min(1),
});

export class ProblemController {
  // ---------- Create Problem ----------
  static async create(req: Request, res: Response) {
    try {
      const data = createProblemSchema.parse(req.body);

      // Ensure starterCode is set
      if (!data.starterCode || data.starterCode.trim() === '') {
        const functionName = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');

        data.starterCode = `function ${functionName}() {\n  // Write your solution here\n  // Return the result\n  return 0;\n}`;
      }

      const problem = await ProblemService.createProblem({
        ...data,
        createdBy: new Types.ObjectId(req.userId),
        isPublished: false,
      });

      res.status(201).json({
        success: true,
        message: 'Problem created successfully',
        data: problem,
      });
    } catch (error: any) {
      console.error('Create problem error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create problem',
      });
    }
  }

  // ---------- Get Problems (Student) ----------
  static async getProblems(req: Request, res: Response) {
    try {
      const { difficulty, tag, search, limit, page } = req.query;
      const result = await ProblemService.getProblems({
        difficulty: difficulty as string,
        tag: tag as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : 20,
        page: page ? parseInt(page as string) : 1,
      });

      res.status(200).json({
        success: true,
        data: result.problems,
        pagination: {
          total: result.total,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
          totalPages: Math.ceil(result.total / (limit ? parseInt(limit as string) : 20)),
        },
      });
    } catch (error: any) {
      console.error('Get problems error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch problems',
      });
    }
  }

  // ---------- Get All Problems for Admin ----------
  static async getAdminProblems(req: Request, res: Response) {
    try {
      const { search, difficulty, tag, limit = 50, page = 1 } = req.query;
      const query: any = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }
      if (difficulty) query.difficulty = difficulty;
      if (tag) query.tags = tag;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const [problems, total] = await Promise.all([
        Problem.find(query) // ✅ Use Problem model directly
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit as string))
          .populate('createdBy', 'name')
          .lean(),
        Problem.countDocuments(query), // ✅ Use Problem model directly
      ]);

      res.status(200).json({
        success: true,
        data: problems,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error: any) {
      console.error('Get admin problems error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch problems',
      });
    }
  }

  // ---------- Get Problem by Slug (Student) ----------
  static async getProblem(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const problem = await ProblemService.getProblemBySlug(slug);

      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      let userSubmissions = [];
      if (req.userId) {
        userSubmissions = await ProblemService.getUserSubmissions(req.userId, problem._id.toString());
      }

      const stats = await ProblemService.getProblemStats(problem._id.toString());

      res.status(200).json({
        success: true,
        data: {
          problem,
          userSubmissions,
          stats,
        },
      });
    } catch (error: any) {
      console.error('Get problem error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch problem',
      });
    }
  }

  // ---------- Get Problem by ID (Admin) ----------
  static async getProblemById(req: Request, res: Response) {
    try {
      const { problemId } = req.params;
      const problem = await ProblemService.getProblemById(problemId);

      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      res.status(200).json({
        success: true,
        data: problem,
      });
    } catch (error: any) {
      console.error('Get problem by ID error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch problem',
      });
    }
  }

  // ---------- Submit Solution ----------
  static async submitSolution(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const userId = req.userId;
      const { code } = submitProblemSchema.parse(req.body);

      const problem = await ProblemService.getProblemBySlug(slug);
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      const result = await ProblemService.submitSolution(
        problem._id.toString(),
        userId,
        code
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Submit solution error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit solution',
      });
    }
  }

  // ---------- Update Problem ----------
  static async updateProblem(req: Request, res: Response) {
    try {
      const { problemId } = req.params;
      const data = createProblemSchema.partial().parse(req.body);

      const problem = await ProblemService.updateProblem(problemId, data);
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Problem updated successfully',
        data: problem,
      });
    } catch (error: any) {
      console.error('Update problem error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: error.errors?.[0]?.message || 'Validation error',
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update problem',
      });
    }
  }

  // ---------- Delete Problem ----------
  static async deleteProblem(req: Request, res: Response) {
    try {
      const { problemId } = req.params;
      const deleted = await ProblemService.deleteProblem(problemId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Problem deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete problem error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete problem',
      });
    }
  }

  // ---------- Toggle Publish ----------
  static async togglePublish(req: Request, res: Response) {
    try {
      const { problemId } = req.params;
      const problem = await ProblemService.getProblemById(problemId);
      if (!problem) {
        return res.status(404).json({
          success: false,
          message: 'Problem not found',
        });
      }

      const updated = await ProblemService.updateProblem(problemId, {
        isPublished: !problem.isPublished,
      });

      res.status(200).json({
        success: true,
        message: `Problem ${updated?.isPublished ? 'published' : 'unpublished'} successfully`,
        data: updated,
      });
    } catch (error: any) {
      console.error('Toggle publish error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to toggle publish',
      });
    }
  }
}