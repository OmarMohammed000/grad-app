import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * Verify an image against a task description using Gemini API
 * @param {string} imageUrl - URL of the image to verify
 * @param {string} taskDescription - Description of the task to verify against
 * @returns {Promise<{approved: boolean, reason: string, confidence: number}>}
 */
export async function verifyImage(imageUrl, taskDescription) {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    return {
      approved: false,
      reason: 'AI verification service is not configured (missing API key).',
      confidence: 0
    };
  }

  try {
    console.log('🤖 AI Verification Started');
    console.log('📝 Task Description:', taskDescription);
    console.log('🖼️  Image URL:', imageUrl);

    // Construct the prompt
    const prompt = `
      You are an AI verifier for a challenge app. 
      Task Description: "${taskDescription}"
      
      Analyze the provided image. Does it reasonably prove that the user completed the task described above?
      
      Respond with a JSON object ONLY:
      {
        "approved": boolean,
        "reason": "short explanation for the user",
        "confidence": number (0-1)
      }
      
      If the image is irrelevant, unclear, or does not match the task, set approved to false.
      Be lenient but logical.
    `;

    // Fetch the image to convert to base64 if needed, or pass URL if Gemini supports it.
    // Gemini API supports image URLs in some contexts, but sending base64 is safer for public URLs.


    let imageBase64;
    try {
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBase64 = Buffer.from(arrayBuffer).toString('base64');
    } catch (err) {
      console.error('Error downloading proof image:', err);
      return { approved: false, reason: 'Failed to access proof image.', confidence: 0 };
    }

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: "image/jpeg", // Assuming JPEG for simplicity, or detect from URL
              data: imageBase64
            }
          }
        ]
      }]
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('Empty response from Gemini');
    }

    console.log('📥 Raw Gemini Response:', textResponse);

    // Clean up markdown code blocks if present
    const jsonString = textResponse.replace(/```json\n?|\n?```/g, '').trim();
    const result = JSON.parse(jsonString);

    const finalResult = {
      approved: result.approved,
      reason: result.reason,
      confidence: result.confidence
    };

    console.log('✅ AI Verification Successful!');
    console.log('📤 Result sent to frontend:', JSON.stringify(finalResult, null, 2));
    console.log(`   - Approved: ${finalResult.approved ? '✅ YES' : '❌ NO'}`);
    console.log(`   - Reason: ${finalResult.reason}`);
    console.log(`   - Confidence: ${(finalResult.confidence * 100).toFixed(0)}%`);

    return finalResult;

  } catch (error) {
    console.error('AI Verification Error:', error);
    return {
      approved: false,
      reason: 'AI verification failed due to technical error. Please try manual verification.',
      confidence: 0
    };
  }
}
