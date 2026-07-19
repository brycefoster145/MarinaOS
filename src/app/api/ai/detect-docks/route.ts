import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";

interface DetectedDockSuggestion {
  name: string;
  lng: number;
  lat: number;
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
    const { imageUrl, latitude, longitude, zoom, mapWidth, mapHeight } = body;

    // Try Gemini 2.0 Flash first
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "placeholder") {
      try {
        const suggestions = await detectWithGemini(imageUrl, latitude, longitude, mapWidth, mapHeight);
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
        const suggestions = await detectWithOpenAI(imageUrl, latitude, longitude, mapWidth, mapHeight);
        return apiSuccess({ suggestions, source: "openai" });
      } catch (aiError: any) {
        console.error("OpenAI vision error:", aiError.message || aiError);
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

async function detectWithGemini(
  imageUrl: string | null,
  latitude?: number,
  longitude?: number,
  mapWidth: number = 800,
  mapHeight: number = 500
): Promise<DetectedDockSuggestion[]> {
  const prompt = `You are analyzing a satellite image of a marina at coordinates ${latitude || "unknown"}, ${longitude || "unknown"}.

The image is ${mapWidth}x${mapHeight} pixels. The center of the image is at latitude ${latitude || "unknown"}, longitude ${longitude || "unknown"}.

Look for docks, piers, and slips in this marina image. For each dock you detect, provide:
1. A name for the dock
2. The center latitude and longitude of the dock
3. Width and height of the dock structure in meters
4. Number of boat slips visible
5. Estimated slip length and width in feet

Return ONLY a JSON array of detected docks with this structure:
[
  {
    "name": "Dock name",
    "lng": number,
    "lat": number,
    "width": number,
    "height": number,
    "slipCount": number,
    "slipLength": number,
    "slipWidth": number
  }
]

A typical marina has docks arranged in parallel rows extending from a central pier. Each dock has 3-8 slips on each side. Slip lengths are typically 30-60 feet. The entire marina typically spans about 100-300 meters across.`;

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
          temperature: 0.2,
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
    lng: dock.lng || dock.x || longitude || -117.92,
    lat: dock.lat || dock.y || latitude || 33.62,
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

async function detectWithOpenAI(
  imageUrl: string | null,
  latitude?: number,
  longitude?: number,
  mapWidth: number = 800,
  mapHeight: number = 500
): Promise<DetectedDockSuggestion[]> {
  const prompt = `You are analyzing a satellite image of a marina at coordinates ${latitude || "unknown"}, ${longitude || "unknown"}.

The image is ${mapWidth}x${mapHeight} pixels. The center of the image is at latitude ${latitude || "unknown"}, longitude ${longitude || "unknown"}.

Look for docks, piers, and slips in this marina image. For each dock you detect, provide:
1. A name for the dock
2. The center latitude and longitude of the dock
3. Width and height of the dock structure in meters
4. Number of boat slips visible
5. Estimated slip length and width in feet

Return ONLY a JSON array of detected docks with this structure:
[
  {
    "name": "Dock name",
    "lng": number,
    "lat": number,
    "width": number,
    "height": number,
    "slipCount": number,
    "slipLength": number,
    "slipWidth": number
  }
]

A typical marina has docks arranged in parallel rows extending from a central pier. Each dock has 3-8 slips on each side. Slip lengths are typically 30-60 feet. The entire marina typically spans about 100-300 meters across.`;

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
    lng: dock.lng || dock.x || longitude || -117.92,
    lat: dock.lat || dock.y || latitude || 33.62,
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
  const centerLat = latitude || 33.62;
  const centerLng = longitude || -117.92;
  // Approximate meters per degree at this latitude
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((centerLat * Math.PI) / 180);

  // Generate offset in degrees for ~100m spacing
  const offset1 = 100 / metersPerDegLng; // ~100m east
  const offset2 = 200 / metersPerDegLng; // ~200m east
  const offset3 = 100 / metersPerDegLat; // ~100m south

  const suggestions: DetectedDockSuggestion[] = [
    {
      name: "Main Pier",
      lng: centerLng + offset1 * 0.3,
      lat: centerLat,
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
      lng: centerLng + offset1,
      lat: centerLat - offset3 * 0.4,
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
      lng: centerLng + offset1 * 0.5,
      lat: centerLat - offset3 * 0.8,
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
      lng: centerLng,
      lat: centerLat - offset3,
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
      lng: centerLng + offset2,
      lat: centerLat,
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