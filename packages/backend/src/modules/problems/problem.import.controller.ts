// packages/backend/src/modules/problems/problem.import.controller.ts

import { Request, Response } from 'express';
import { ProblemImportService } from './problem.import.service.js';
import { z } from 'zod';

const importSchema = z.object({
  problems: z.array(z.any()).optional(),
  jsonData: z.string().optional(),
});

export class ProblemImportController {

  // ---------- Import problems from JSON ----------
  static async importProblems(req: Request, res: Response) {
    try {
      const { problems, jsonData } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      let importResult;

      if (jsonData) {
        // Import from JSON string
        importResult = await ProblemImportService.importFromJSONString(jsonData, userId);
      } else if (problems && Array.isArray(problems)) {
        // Import from array
        importResult = await ProblemImportService.importProblems(problems, userId);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Please provide either "problems" array or "jsonData" string',
        });
      }

      res.status(importResult.success ? 200 : 207).json({
        success: importResult.success,
        message: importResult.success 
          ? `Successfully imported ${importResult.imported} problems` 
          : `Imported ${importResult.imported} problems, ${importResult.failed} failed`,
        data: {
          total: importResult.total,
          imported: importResult.imported,
          failed: importResult.failed,
          problems: importResult.problems,
          errors: importResult.errors,
        },
      });
    } catch (error: any) {
      console.error('Import error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to import problems',
      });
    }
  }

  // ---------- Get import template ----------
  static async getTemplate(req: Request, res: Response) {
    try {
      const template = ProblemImportService.generateTemplate();
      res.status(200).json({
        success: true,
        data: {
          template,
          schema: {
            type: 'object',
            required: ['title', 'difficulty', 'description', 'testCases'],
            properties: {
              title: { type: 'string', minLength: 3, maxLength: 100 },
              difficulty: { enum: ['easy', 'medium', 'hard'] },
              description: { type: 'string', minLength: 10 },
              examples: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['input', 'output'],
                  properties: {
                    input: { type: 'string' },
                    output: { type: 'string' },
                    explanation: { type: 'string' },
                  },
                },
              },
              constraints: { type: 'array', items: { type: 'string' } },
              testCases: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['input', 'expectedOutput'],
                  properties: {
                    input: { type: 'string' },
                    expectedOutput: { type: 'string' },
                    isHidden: { type: 'boolean' },
                  },
                },
                minItems: 1,
              },
              starterCode: { type: 'string' },
              solutionCode: { type: 'string' },
              hints: { type: 'array', items: { type: 'string' } },
              tags: { type: 'array', items: { type: 'string' } },
              timeLimit: { type: 'number', minimum: 100 },
              memoryLimit: { type: 'number', minimum: 16 },
              isPublished: { type: 'boolean' },
            },
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate template',
      });
    }
  }

  // ---------- Export problems ----------
  static async exportProblems(req: Request, res: Response) {
    try {
      const { problemIds } = req.body;
      const problems = await ProblemImportService.exportProblems(problemIds);
      
      res.status(200).json({
        success: true,
        data: problems,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export problems',
      });
    }
  }

  // ---------- Validate JSON without importing ----------
  static async validateJSON(req: Request, res: Response) {
    try {
      const { jsonData } = req.body;

      if (!jsonData) {
        return res.status(400).json({
          success: false,
          message: 'jsonData is required',
        });
      }

      let data;
      try {
        data = JSON.parse(jsonData);
      } catch (error: any) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format',
          error: error.message,
        });
      }

      const validation = ProblemImportService.validateJSONStructure(data);
      
      res.status(200).json({
        success: validation.valid,
        message: validation.valid 
          ? 'JSON structure is valid' 
          : 'JSON structure has errors',
        errors: validation.errors,
        problemCount: Array.isArray(data) ? data.length : 1,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to validate JSON',
      });
    }
  }
}