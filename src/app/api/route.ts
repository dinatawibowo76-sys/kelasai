import { NextResponse } from "next/server";

export async function GET() {
  // Health check endpoint - useful for debugging deployment issues
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const hasNextauthSecret = !!process.env.NEXTAUTH_SECRET;

  return NextResponse.json({
    status: "ok",
    service: "KelasAI",
    env: {
      DATABASE_URL: hasDbUrl ? "SET" : "MISSING",
      GEMINI_API_KEY: hasGeminiKey ? "SET" : "MISSING",
      NEXTAUTH_SECRET: hasNextauthSecret ? "SET" : "MISSING",
    },
    ready: hasDbUrl && hasGeminiKey && hasNextauthSecret,
    missing: [
      !hasDbUrl && "DATABASE_URL",
      !hasGeminiKey && "GEMINI_API_KEY",
      !hasNextauthSecret && "NEXTAUTH_SECRET",
    ].filter(Boolean),
  });
}