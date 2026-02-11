import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define the response schema using Zod
const HealthSchema = z.object({
  status: z.string().describe('Current system status'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp of the check'),
  environment: z.string().describe('Current deployment environment'),
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System Health Check
 *     description: Returns the operational status of the API and database connections.
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: System is operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   example: "2026-02-10T14:30:00Z"
 *                 environment:
 *                   type: string
 *                   example: "production"
 *       500:
 *         description: Internal system failure
 */
export async function GET() {
  const payload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Validate outgoing data (good practice for strict contracts)
  const result = HealthSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Internal State Error' }, 
      { status: 500 }
    );
  }

  return NextResponse.json(result.data);
}
