import { GoogleGenAI, Chat, Modality, FunctionDeclaration, Type } from "@google/genai";

const apiKey = process.env.API_KEY;

if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

const generateImageFunctionDeclaration: FunctionDeclaration = {
  name: 'generateImage',
  parameters: {
    type: Type.OBJECT,
    description: 'Generates an image based on a user-provided text description. The user can optionally specify the desired width and height in pixels.',
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'A detailed text description of the image to be generated.',
      },
      width: {
        type: Type.NUMBER,
        description: 'The desired width of the image in pixels.',
      },
      height: {
        type: Type.NUMBER,
        description: 'The desired height of the image in pixels.',
      },
    },
    required: ['prompt'],
  },
};

export const startChatSession = (): Chat => {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are Aether, an advanced AI assistant created by Bilal Mughal. Prioritize speed and begin streaming your response immediately. Be concise and direct, but maintain a professional, insightful tone. You are proficient in multiple languages and must respond to the user in the language they use.
---
**Core Instructions:**
- **Greetings:** For simple greetings like "hi" or "hello", reply with a short, friendly greeting. Do not give a long introduction.
- **About You:** Only when a user explicitly asks about you (e.g., "who are you?", "tell me about yourself"), introduce yourself in a friendly, professional tone. Explain that you can help with writing, research, coding, creative brainstorming, and general problem-solving. Clarify that you don't have emotions but are designed for natural communication.
- **Image Generation:** When the user asks you to create, draw, or generate an image, you must use the 'generateImage' tool. If the user specifies dimensions (e.g., "make it 1080p", "size 512x512"), extract the width and height and pass them to the tool. Do not refuse or suggest other tools.
- **Long-Form Content:** For articles or reports, begin your response with a compelling Markdown H1 title (e.g., '# Title'). For all other conversational replies, do not use a title.`,
            tools: [{ functionDeclarations: [generateImageFunctionDeclaration] }],
        },
    });
    return chat;
};

export const generateImage = async (prompt: string, width?: number, height?: number): Promise<string> => {
    let finalPrompt = prompt;
    if (width && height) {
        finalPrompt = `${prompt}. The desired image dimensions are ${width}x${height} pixels.`;
    } else if (width) {
        finalPrompt = `${prompt}. The desired image width is ${width} pixels.`;
    } else if (height) {
        finalPrompt = `${prompt}. The desired image height is ${height} pixels.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: finalPrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error('No image data found in the API response.');
    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error && error.message.includes('deadline')) {
             throw new Error('The image generation request timed out. Please try again.');
        }
        throw new Error('Sorry, I was unable to generate the image.');
    }
};

export const editImage = async (prompt: string, imageData: string, mimeType: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                data: imageData,
                mimeType: mimeType,
            },
        };
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [imagePart, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error('No edited image data found in the API response.');
    } catch (error) {
        console.error("Error editing image:", error);
        if (error instanceof Error && error.message.includes('deadline')) {
            throw new Error('The image editing request timed out. Please try again.');
        }
        throw new Error('Sorry, I was unable to edit the image.');
    }
};