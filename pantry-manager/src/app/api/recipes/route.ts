import { NextRequest, NextResponse } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const model = new ChatGroq({
  temperature: 0.7,
  model: 'gemma2-9b-it', // You can change this to another model like "llama3-8b-8192"
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userMessage, pantryItems } = body;

    // console.log("route",userMessage, pantryItems);
    console.log('route', process.env.GROQ_API_KEY);

    if (!userMessage || !Array.isArray(pantryItems)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const systemPrompt = `You are a helpful recipe assistant and normal conversational chatbot. chat with the user politely and friendly and based on user messages decide whether to suggest recipes or char normally. The user has the following pantry items: ${pantryItems.join(
      ', '
    )}. Suggest recipe ideas, meal plans, or ingredient substitutes as requested. Be creative but practical. Also don't generate huge messages keep it simple and short`;

    const response = await model.call([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ]);

    return NextResponse.json({ reply: response.text });
  } catch (error) {
    console.error('Groq API error:', error, process.env.GROQ_API_KEY);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
