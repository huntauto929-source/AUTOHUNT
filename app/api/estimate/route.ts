import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mediaType, division, notes } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing ANTHROPIC_API_KEY. Add it to .env.local (and your Vercel project env vars)." },
        { status: 500 }
      );
    }

    const prompt = `You are a repair estimator for a ${division === "mechanic" ? "Mechanic" : "Auto Body"} shop. Look at the attached photo of a vehicle. ${
      notes ? `Shop notes: ${notes}. ` : ""
    }Respond with ONLY a raw JSON object, no markdown fences, no preamble, in exactly this shape:
{"summary":"one sentence describing the visible damage or work needed","lineItems":[{"item":"string","cost":number}],"estimateLow":number,"estimateHigh":number}
Costs are in USD. Give 2-5 realistic line items. This is a preliminary estimate only.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: 502 });
    }

    const data = await response.json();
    const text = (data.content || []).map((b: any) => b.text || "").join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to generate estimate." }, { status: 500 });
  }
}
