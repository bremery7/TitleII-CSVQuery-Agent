import dotenv from "dotenv";
dotenv.config();

console.log("Testing OpenAI setup...");
console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
console.log("API Key starts with:", process.env.OPENAI_API_KEY?.substring(0, 8));

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("OpenAI client created:", !!client);
console.log("Client has chat:", !!client.chat);

async function testCall() {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Say hello" }],
    });
    console.log("✓ API call successful:", response.choices[0].message.content);
  } catch (error) {
    console.error("✗ API call failed:", error);
  }
}

testCall();