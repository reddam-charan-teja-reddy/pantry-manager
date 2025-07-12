// app/api/recipe-suggestion/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

const model = new ChatGroq({
  temperature: 0.8,
  model: 'gemma2-9b-it', // or gemma2-9b-it
  apiKey: process.env.GROQ_API_KEY,
});

// console.log('Using API KEY:', process.env.GROQ_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pantryItems } = body;

    const response = await model.call([
      new SystemMessage(
        `You're a recipe generator. Suggest 3 creative recipes using: ${pantryItems.join(
          ', '
        )}. Return ONLY a JSON array of recipe objects in this exact format (no additional text):
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "imageUrl": "string",
    "ingredients": ["string"],
    "inPantry": ["string"],
    "missing": ["string"],
    "estimatedTime": "string"
  }
]
Use 'https://picsum.photos/600/400?random=1' (and ?random=2, etc.) for placeholder images.`
      ),
      new HumanMessage('Generate the recipes.'),
    ]);

    const rawText = response.text.trim();
    const jsonText = rawText.replace(/```json|```/g, '').trim();

    let recipes;
    try {
      recipes = JSON.parse(jsonText);
    } catch (parseErr) {
      console.error(
        '[ERROR] JSON parse failed in recipe-suggestion:',
        parseErr,
        'raw:',
        rawText
      );
      return NextResponse.json(
        { error: 'Invalid JSON format from model', raw: rawText },
        { status: 500 }
      );
    }
    return NextResponse.json({ recipes });
  } catch (err) {
    console.error('[ERROR] Recipe suggestion failed:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Failed to generate recipes', details: message },
      { status: 500 }
    );
  }
}

// Optional GET handler
export async function GET() {
  return NextResponse.json(
    { message: 'GET not supported for recipe generation' },
    { status: 405 }
  );
}
