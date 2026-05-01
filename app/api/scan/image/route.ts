import { expenseFormSchema, receiptScanSchema } from "@/lib/validation/expense";
import { NextResponse } from "next/server";

function fixLLMOutput(data: any) {
  return {
    title: data.title ?? 'Receipt',
    date: data.date ?? null,
    merchant: data.merchant ?? null,
    amount: Number(data.total ?? data.amount ?? 0),
    description: data.description ?? null,
    items: Array.isArray(data.items)
      ? data.items.map((item: any) => ({
        name: item.name ?? 'Unknown',
        amount: Number(item.total ?? item.amount ?? 0),
      }))
      : [],
  };
}

async function callLLM(base64: string, extraPrompt?: string) {
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OLLAMA_MODEL_VISION!,
      messages: [
        {
          role: 'user',
          content: `
Extract receipt data and return STRICT JSON.

Rules:
- Output MUST be valid JSON (no markdown, no explanation)
- Follow this exact schema:
{
  "title": string,
  "date": string | null,
  "merchant": string | null,
  "amount": number,
  "description": string | null,
  "items": [
    {
      "name": string,
      "amount": number
    }
  ]
}
- "amount" = total receipt value
- Each item "amount" = total per item
- If unknown, use null
- Do NOT include extra fields
- "date" MUST be ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
- Example: "2026-04-15T00:00:00.000Z"
- If time is unknown, use "T00:00:00.000Z"
- If date is not found, use null

${extraPrompt ?? ''}
          `,
          images: [base64],
        },
      ],
      stream: false,
    }),
  });

  const json = await res.json();
  return json.message?.content;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ message: 'Image is required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // 1️⃣ First LLM call
    let text = await callLLM(base64);

    let parsed: any;

    // 2️⃣ Try parse JSON
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON from LLM');
    }

    // 3️⃣ Validate with Zod
    let result = expenseFormSchema.safeParse(parsed);

    // 4️⃣ If fail → fix locally
    if (!result.success) {
      parsed = fixLLMOutput(parsed);
      result = expenseFormSchema.safeParse(parsed);
    }

    // 5️⃣ If still fail → retry LLM with error feedback
    if (!result.success) {
      const retryText = await callLLM(
        base64,
        `
Fix this JSON to match schema. Return ONLY JSON.

Invalid JSON:
${JSON.stringify(parsed)}

Errors:
${JSON.stringify(result.error.flatten())}
        `
      );

      try {
        parsed = JSON.parse(retryText);
      } catch {
        throw new Error('Retry JSON parse failed');
      }

      // final validation (must pass or throw)
      parsed = receiptScanSchema.parse(parsed);
    }

    return NextResponse.json({ data: parsed });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error processing receipt' }, { status: 500 });
  }
}