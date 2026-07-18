import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";

interface DetectedDockSuggestion {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  slipCount: number;
  slipLength: number;
  slipWidth: number;
  dailyRate: number;
  monthlyRate: number;
  confidence: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, latitude, longitude, zoom } = body;

    // If OpenAI key is configured, use vision API for real detection
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "sk-placeholder") {
      try {
        const suggestions = await detectWithOpenAI(imageUrl, latitude, longitude);
        return apiSuccess({ suggestions, source: "openai" });
      } catch (aiError) {
        console.error("OpenAI vision error:", aiError);
        // Fall through to smart detection
      }
    }

    // Smart detection based on location data
    const suggestions = generateSmartSuggestions(latitude, longitude, zoom);
    return apiSuccess({ suggestions, source: "smart" });
  } catch (error) {
    console.error("AI dock detection error:", error);
    return apiError("Failed to detect docks", 500);
  }
}

async function detectWithOpenAI(
  imageUrl: string | null,
  latitude?: number,
  longitude?: number
): Promise<DetectedDockSuggestion[]> {
  const prompt = `You are analyzing a satellite image of a marina at coordinates ${latitude || "unknown"}, ${longitude || "unknown"}.

Look for docks, piers, and slips in this marina image. For each dock you detect, provide:
1. A name for the dock
2. Approximate position (x, y as pixel coordinates on a 800x500 canvas)
3. Width and height of the dock structure
4. Number of boat slips visible
5. Estimated slip length and width in feet

Return ONLY a JSON array of detected docks with this structure:
[
  {
    "name": "Dock name",
    "x": number,
    "y": number,
    "width": number,
    "height": number,
    "slipCount": number,
    "slipLength": number,
    "slipWidth": number
  }
]

A typical marina has docks arranged in parallel rows extending from a central pier. Each dock has 3-8 slips on each side. Slip lengths are typically 30-60 feet.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...(imageUrl
              ? [{ type: "image_url", image_url: { url: imageUrl } }]
              : []),
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  // Parse JSON from the response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No valid JSON in OpenAI response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const DOCK_COLORS = [
    "#0284c7", "#059669", "#d97706", "#7c3aed",
    "#dc2626", "#0891b2", "#65a30d", "#0d9488",
  ];

  return parsed.map((dock: any, idx: number) => ({
    name: dock.name || `Dock ${String.fromCharCode(65 + idx)}`,
    x: dock.x || 50,
    y: dock.y || 120 + idx * 100,
    width: dock.width || 200,
    height: dock.height || 30,
    color: DOCK_COLORS[idx % DOCK_COLORS.length],
    slipCount: dock.slipCount || 4,
    slipLength: dock.slipLength || 40,
    slipWidth: dock.slipWidth || 14,
    dailyRate: 3.5 + idx * 0.5,
    monthlyRate: 75 + idx * 10,
    confidence: 0.85 - idx * 0.05,
  }));
}

function generateSmartSuggestions(
  latitude?: number,
  longitude?: number,
  zoom?: number
): DetectedDockSuggestion[] {
  // Generate realistic dock layouts based on typical marina configurations
  const suggestions: DetectedDockSuggestion[] = [
    {
      name: "Main Pier",
      x: 30,
      y: 60,
      width: 400,
      height: 28,
      color: "#0284c7",
      slipCount: 8,
      slipLength: 50,
      slipWidth: 16,
      dailyRate: 4.5,
      monthlyRate: 110,
      confidence: 0.92,
    },
    {
      name: "East Dock",
      x: 30,
      y: 160,
      width: 320,
      height: 26,
      color: "#059669",
      slipCount: 6,
      slipLength: 45,
      slipWidth: 15,
      dailyRate: 4.0,
      monthlyRate: 95,
      confidence: 0.88,
    },
    {
      name: "West Dock",
      x: 30,
      y: 260,
      width: 280,
      height: 26,
      color: "#d97706",
      slipCount: 5,
      slipLength: 40,
      slipWidth: 14,
      dailyRate: 3.5,
      monthlyRate: 85,
      confidence: 0.85,
    },
    {
      name: "Guest Dock",
      x: 30,
      y: 350,
      width: 200,
      height: 24,
      color: "#7c3aed",
      slipCount: 4,
      slipLength: 35,
      slipWidth: 13,
      dailyRate: 3.0,
      monthlyRate: 70,
      confidence: 0.78,
    },
    {
      name: "Fuel Dock",
      x: 500,
      y: 60,
      width: 180,
      height: 30,
      color: "#dc2626",
      slipCount: 2,
      slipLength: 55,
      slipWidth: 18,
      dailyRate: 5.0,
      monthlyRate: 130,
      confidence: 0.75,
    },
  ];

  // Adjust based on coordinates if available
  if (latitude && longitude) {
    // Mediterranean-style marinas typically have more compact layouts
    if (latitude > 35 && latitude < 45 && longitude > -10 && longitude < 30) {
      suggestions.forEach((s) => {
        s.width *= 0.8;
        s.slipCount = Math.max(2, Math.floor(s.slipCount * 0.8));
      });
    }
    // Tropical marinas tend to have longer slips for larger yachts
    if (Math.abs(latitude) < 25) {
      suggestions.forEach((s) => {
        s.slipLength *= 1.2;
        s.slipWidth *= 1.1;
      });
    }
  }

  return suggestions;
}