// app/api/recipe-suggestion/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

const model = new ChatGroq({
  temperature: 0.8,
  model: 'gemma2-9b-it', // or gemma2-9b-it
  apiKey: process.env.GROQ_API_KEY,
});

console.log('Using API KEY:', process.env.GROQ_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pantryItems } = body;

    const response = await model.call([
      new SystemMessage(
        `You're a recipe generator. Suggest 3 creative recipes using: ${pantryItems.join(
          ', '
        )}. Return as JSON array with id, title, description, imageUrl:(use 'https://picsum.photos/600/400' with different seed numbers like '?random=1', '?random=2', etc. for reliable placeholder food images), ingredients, inPantry: list of ingredients that are in the pantry, missing: list of ingredients that are missing in the pantry, and estimatedTime.`
      ),
      new HumanMessage('Generate the recipes.'),
    ]);

    const rawText = response.text.trim();
    const jsonText = rawText.replace(/```json|```/g, '').trim();

    const recipes = JSON.parse(jsonText);
    return NextResponse.json({ recipes });
  } catch (err) {
    console.error('[ERROR]', err);
    return NextResponse.json(
      { error: 'Failed to generate recipes', key: process.env.GROQ_API_KEY },
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
