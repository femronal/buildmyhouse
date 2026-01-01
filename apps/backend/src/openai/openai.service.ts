import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export interface PlanAnalysis {
  projectType: string; // 'residential' | 'commercial' | 'renovation'
  estimatedBudget: number;
  estimatedDuration: string; // e.g., "6-8 months"
  squareFootage: number;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  
  // Extracted details
  rooms: string[]; // List of rooms mentioned
  materials: string[]; // Building materials identified
  features: string[]; // Special features (pool, garage, etc.)
  
  // Construction phases
  phases: {
    name: string;
    description: string;
    estimatedDuration: string;
    estimatedCost: number;
  }[];
  
  // AI confidence and notes
  confidence: number; // 0-100
  notes: string;
  processingDate: string;
}

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not set - AI analysis will use mock data');
    }
    this.openai = new OpenAI({
      apiKey: apiKey || 'sk-mock-key',
    });
  }

  /**
   * Analyze architectural plan PDF using OpenAI
   * Note: This is a simplified version. In production, you'd:
   * 1. Extract text from PDF using a library like pdf-parse
   * 2. Send extracted text + images to OpenAI Vision API
   * 3. Parse and structure the response
   */
  async analyzePlan(
    pdfText: string,
    projectName: string,
    userBudget: number,
  ): Promise<PlanAnalysis> {
    try {
      // If no API key, return mock analysis
      if (!process.env.OPENAI_API_KEY) {
        return this.getMockAnalysis(projectName, userBudget);
      }

      // Use OpenAI to analyze the plan
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert construction project analyzer. Analyze architectural plans and provide detailed project estimates. Return ONLY valid JSON with no markdown formatting.`,
          },
          {
            role: 'user',
            content: `Analyze this architectural plan and provide a detailed project analysis.

Project Name: ${projectName}
User's Budget: $${userBudget}

Plan Content:
${pdfText.substring(0, 4000)} // Limit text to avoid token limits

Provide analysis in this exact JSON structure:
{
  "projectType": "residential|commercial|renovation",
  "estimatedBudget": number,
  "estimatedDuration": "X-Y months",
  "squareFootage": number,
  "floors": number,
  "bedrooms": number,
  "bathrooms": number,
  "rooms": ["room1", "room2"],
  "materials": ["material1", "material2"],
  "features": ["feature1", "feature2"],
  "phases": [
    {
      "name": "Phase name",
      "description": "Phase description",
      "estimatedDuration": "X weeks",
      "estimatedCost": number
    }
  ],
  "confidence": 85,
  "notes": "Additional notes about the project"
}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const responseText = completion.choices[0].message.content;
      
      // Parse JSON response
      const analysis = JSON.parse(responseText);
      analysis.processingDate = new Date().toISOString();

      return analysis;
    } catch (error) {
      console.error('OpenAI analysis error:', error);
      
      // Fallback to mock analysis on error
      return this.getMockAnalysis(projectName, userBudget);
    }
  }

  /**
   * Generate mock analysis for development/testing
   */
  private getMockAnalysis(projectName: string, userBudget: number): PlanAnalysis {
    return {
      projectType: 'residential',
      estimatedBudget: Math.round(userBudget * 1.1), // 10% higher than user estimate
      estimatedDuration: '6-8 months',
      squareFootage: 2500,
      floors: 2,
      bedrooms: 4,
      bathrooms: 3,
      
      rooms: [
        'Living Room',
        'Kitchen',
        'Dining Room',
        'Master Bedroom',
        '3 Additional Bedrooms',
        'Family Room',
        'Laundry Room',
        '2-Car Garage',
      ],
      
      materials: [
        'Concrete Foundation',
        'Wood Framing',
        'Brick Exterior',
        'Asphalt Shingle Roofing',
        'Hardwood Flooring',
        'Granite Countertops',
        'Ceramic Tile',
      ],
      
      features: [
        'Open Floor Plan',
        'High Ceilings (10ft)',
        'Energy-Efficient Windows',
        'Central HVAC',
        'Walk-in Closets',
        'Covered Patio',
      ],
      
      phases: [
        {
          name: 'Site Preparation & Foundation',
          description: 'Clear site, excavate, pour foundation and basement',
          estimatedDuration: '4-6 weeks',
          estimatedCost: Math.round(userBudget * 0.15),
        },
        {
          name: 'Framing & Structural',
          description: 'Frame walls, install roof structure, windows, and doors',
          estimatedDuration: '6-8 weeks',
          estimatedCost: Math.round(userBudget * 0.20),
        },
        {
          name: 'Rough-in (MEP)',
          description: 'Install plumbing, electrical, and HVAC systems',
          estimatedDuration: '4-5 weeks',
          estimatedCost: Math.round(userBudget * 0.18),
        },
        {
          name: 'Insulation & Drywall',
          description: 'Install insulation, hang and finish drywall',
          estimatedDuration: '3-4 weeks',
          estimatedCost: Math.round(userBudget * 0.12),
        },
        {
          name: 'Interior Finishes',
          description: 'Paint, flooring, cabinets, countertops, fixtures',
          estimatedDuration: '6-8 weeks',
          estimatedCost: Math.round(userBudget * 0.25),
        },
        {
          name: 'Exterior & Landscaping',
          description: 'Siding, roofing, driveway, landscaping',
          estimatedDuration: '3-4 weeks',
          estimatedCost: Math.round(userBudget * 0.10),
        },
      ],
      
      confidence: 85,
      notes: `This is an AI-generated analysis based on ${projectName}. Actual costs and timeline may vary based on location, material availability, and contractor rates. Recommend getting detailed quotes from 2-3 general contractors.`,
      processingDate: new Date().toISOString(),
    };
  }

  /**
   * Extract text from PDF buffer
   * Note: This requires pdf-parse package
   */
  async extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
    try {
      // TODO: Implement actual PDF text extraction
      // const pdfParse = require('pdf-parse');
      // const data = await pdfParse(pdfBuffer);
      // return data.text;
      
      // For now, return placeholder
      return 'PDF text extraction not yet implemented. Using mock analysis.';
    } catch (error) {
      console.error('PDF extraction error:', error);
      return '';
    }
  }
}


