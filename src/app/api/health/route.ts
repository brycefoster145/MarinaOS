import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    // Health check endpoint
    return apiSuccess({
      status: "healthy",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return apiError("Health check failed", 500);
  }
}