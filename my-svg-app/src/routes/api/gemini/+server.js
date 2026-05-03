import { GoogleGenerativeAI } from "@google/generative-ai";
import { json } from "@sveltejs/kit";
import { GOOGLE_API_KEY } from "$env/static/private"; // Securely imports your key

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

export async function POST({ request }) {
  const { message } = await request.json();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent(message);
    const response = result.response.text();
    return json({ reply: response });
  } catch (error) {
    return json({ error: "Failed to connect to AI" }, { status: 500 });
  }
}
