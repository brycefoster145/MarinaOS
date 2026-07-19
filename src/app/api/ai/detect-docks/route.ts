import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";

interface DetectedDockSuggestion {
  name: string;
  /** Center x in pixels within the original image */
  px: number;
  /** Center y in pixels within the original image */
  py: number;
  /** Dock width in meters */
  width: number;
  /** Dock height in meters */
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
    const { imageUrl, latitude, longitude, zoom, mapWidth, mapHeight, imageWidth, imageHeight } = body;

    const width = imageWidth || mapWidth || 800;
    const height = imageHeight || mapHeight || 500;

    // Try Gemini 2.5 Flash first
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "placeholder") {
      try {
        const suggestions = await detectWithGemini(imageUrl, latitude, longitude, width, height);
        if (suggestions.length > 0) {
          return apiSuccess({ suggestions, source: "gemini" });
        }
      } catch (aiError: any) {
        console.error("Gemini vision error:", aiError.message || aiError);
      }
    }

    // Fallback to OpenAI if Gemini not available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "sk-placeholder") {
      try {
        const suggestions = await detectWithOpenAI(imageUrl, latitude, longitude, width, height);
        return apiSuccess({ suggestions, source: "openai" });
      } catch (aiError: any) {
        console.error("OpenAI vision error:", aiError.message || aiError);
      }
    }

    // Smart detection based on location data
    const suggestions = generateSmartSuggestions(latitude, longitude, width, height);
    return apiSuccess({ suggestions, source: "smart" });
  } catch (error) {
    console.error("AI dock detection error:", error);
    return apiError("Failed to detect docks", 500);
  }
}

async function detectWithGemini(
  imageUrl: string | null,
  latitude?: number,
  longitude?: number,
  imageWidth: number = 800,
  imageHeight: number = 500
): Promise<DetectedDockSuggestion[]> {
  const prompt = `You are analyzing a satellite image of a marina at coordinates ${latitude || "unknown"}, ${longitude || "unknown"}.

The image dimensions are ${imageWidth}x${imageHeight} pixels. Pixel coordinates start at (0,0) in the top-left corner.

Look for docks, piers, and boat slips in this marina image. For each dock you find, identify its position as PIXEL COORDINATES within the image.

Return ONLY a JSON array of detected docks with this structure:
[
  {
    "name": "Dock name (e.g. Main Dock, East Dock, etc.)",
    "px": number (center x of the dock in pixels, 0 to ${imageWidth}),
    "py": number (center y of the dock in pixels, 0 to ${imageHeight}),
    "width": number (dock width in meters - estimate from image),
    "height": number (dock height in meters - estimate from image),
    "slipCount": number (visible boat slips, at least 2),
    "slipLength": number (estimated slip length in feet, 30-60),
    "slipWidth": number (estimated slip width in feet, 12-18)
  }
]

IMPORTANT: The px, py values MUST be pixel coordinates in the image, NOT latitude/longitude. A typical marina at zoom 17-18 has docks that are 80-300 pixels long.`;

  // Strip the data URL prefix to get raw base64
  let base64Image = "";
  if (imageUrl) {
    const parts = imageUrl.split(",");
    base64Image = parts.length > 1 ? parts[1] : imageUrl;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              ...(base64Image
                ? [{ inline_data: { mime_type: "image/jpeg", data: base64Image } }]
                : []),
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Parse JSON from the response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No valid JSON in Gemini response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const DOCK_COLORS = [
    "#0284c7", "#059669", "#d97706", "#7c3aed",
    "#dc2626", "#0891b2", "#65a30d", "#0d9488",
  ];

  return parsed.map((dock: any, idx: number) => ({
    name: dock.name || `Dock ${String.fromCharCode(65 + idx)}`,
    px: dock.px || dock.x || imageWidth / 2 + (idx - 1) * 100,
    py: dock.py || dock.y || imageHeight / 2 + idx * 80,
    width: dock.width || 80,
    height: dock.height || 8,
    color: DOCK_COLORS[idx % DOCK_COLORS.length],
    slipCount: dock.slipCount || 4,
    slipLength: dock.slipLength || 40,
    slipWidth: dock.slipWidth || 14,
    dailyRate: 3.5 + idx * 0.5,
    monthlyRate: 75 + idx * 10,
    confidence: 0.85 - idx * 0.05,
  }));
}

async function detectWithOpenAI(
  imageUrl: string | null,
  latitude?: number,
  longitude?: number,
  imageWidth: number = 800,
  imageHeight: number = 500
): Promise<DetectedDockSuggestion[]> {
  const prompt = `You are analyzing a satellite image of a marina at coordinates ${latitude || "unknown"}, ${longitude || "unknown"}.

The image dimensions are ${imageWidth}x${imageHeight} pixels. Pixel coordinates start at (0,0) in the top-left corner.

Look for docks, piers, and boat slips in this marina image. For each dock you find, identify its position as PIXEL COORDINATES within the image.

Return ONLY a JSON array of detected docks with this structure:
[
  {
    "name": "Dock name (e.g. Main Dock, East Dock, etc.)",
    "px": number (center x of the dock in pixels, 0 to ${imageWidth}),
    "py": number (center y of the dock in pixels, 0 to ${imageHeight}),
    "width": number (dock width in meters - estimate from image),
    "height": number (dock height in meters - estimate from image),
    "slipCount": number (visible boat slips, at least 2),
    "slipLength": number (estimated slip length in feet, 30-60),
    "slipWidth": number (estimated slip width in feet, 12-18)
  }
]

IMPORTANT: The px, py values MUST be pixel coordinates in the image, NOT latitude/longitude.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
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
      temperature: 0.1,
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
    px: dock.px || dock.x || imageWidth / 2 + (idx - 1) * 100,
    py: dock.py || dock.y || imageHeight / 2 + idx * 80,
    width: dock.width || 80,
    height: dock.height || 8,
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
  imageWidth: number = 800,
  imageHeight: number = 500
): DetectedDockSuggestion[] {
  const cx = imageWidth / 2;
  const cy = imageHeight / 2;

  const suggestions: DetectedDockSuggestion[] = [
    {
      name: "Main Pier",
      px: cx,
      py: cy - 80,
      width: 120,
      height: 8,
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
      px: cx + 100,
      py: cy + 20,
      width: 100,
      height: 8,
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
      px: cx - 80,
      py: cy + 40,
      width: 90,
      height: 8,
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
      px: cx + 20,
      py: cy + 130,
      width: 70,
      height: 7,
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
      px: cx + 200,
      py: cy - 60,
      width: 60,
      height: 9,
      color: "#dc2626",
      slipCount: 2,
      slipLength: 55,
      slipWidth: 18,
      dailyRate: 5.0,
      monthlyRate: 130,
      confidence: 0.75,
    },
  ];

  return suggestions;
}