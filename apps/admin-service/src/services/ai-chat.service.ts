//Path: apps/admin-service/src/services/ai-chat.service.ts
import { GoogleGenAI } from "@google/genai";
import { buildAnalyticsKnowledge } from "./analytics-context.service";

export const askAnalyticsAssistant = async (question: string): Promise<string> => {
   //without a key, @google/genai silently falls back to Google Cloud ADC auth and throws
   //a confusing "Could not load the default credentials" error instead of an auth error
   if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set. Add it to the root .env file.");
   }

   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

   const knowledge = await buildAnalyticsKnowledge();

   const prompt = `
You are a data analyst assistant for an e-commerce admin dashboard.

Use ONLY the analytics data provided below to answer the admin's question.
You may summarize, compare, or interpret the data, but do NOT invent numbers,
product names, or shops that are not present in the data. If the data provided
doesn't contain enough information to answer, say so clearly instead of guessing.

--------------------
STORE ANALYTICS DATA
--------------------
${knowledge}

--------------------
ADMIN QUESTION
--------------------
${question}

--------------------
ANSWER
--------------------
`;

   const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
   });

   return result.text ?? "";
};
