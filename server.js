import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = 5000;

const VISION_PROMPT = `You are VisionAssist, an AI vision assistant for a visually impaired user.

Analyze the image carefully and describe only what is actually visible.

Focus on:
- Objects and their positions
- People, if visible
- Readable text
- Signs and labels
- Doors, chairs, tables and useful surroundings
- Anything important for understanding the scene

Use clear, simple English.
Do not guess or invent details.
If something is unclear, blurry or uncertain, say that you are not sure.`;

const PRODUCT_PROMPT = `You are Product Reader for a visually impaired user.

Analyze this product image carefully. Report only information that is actually visible and readable.

Start with the product name and brand if they are visible.

Then focus on:
- Product name
- Brand
- Product type
- Label text
- Ingredients or contents, if readable
- Quantity, size or weight, if readable
- Price, if visible
- Manufacturing date, if visible
- Expiry or best-before date, if visible
- Usage instructions, if readable
- Warnings or important safety information, if visible
- Other important information printed on the package

Read visible text as accurately as possible.

Do not guess, invent, or complete missing information.

If text is blurry or cannot be read, clearly say that it is not readable.

If the image is not actually a product, say so clearly.

For medicine bottles, do not give medical advice or recommend a dose.
Only report visible label information.

Use clear, simple English suitable for a visually impaired user.`;

app.post("/api/analyze-image", async (req, res) => {
  let timeout;

  try {
    console.log("📸 Image analysis request received");

    const { image, mode = "vision" } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "No image received.",
      });
    }

    const [header, base64Image] = image.split(",");

    if (!base64Image) {
      return res.status(400).json({
        error: "Invalid image data.",
      });
    }

    const mimeType =
      header.match(/data:(.*?);base64/)?.[1] || "image/jpeg";

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing from .env",
      });
    }

    const prompt =
      mode === "product"
        ? PRODUCT_PROMPT
        : VISION_PROMPT;

    console.log("🖼️ Image type:", mimeType);
    console.log("🎯 Analysis mode:", mode);
    console.log("🤖 Sending image to Gemini...");

    const controller = new AbortController();

    timeout = setTimeout(() => {
      controller.abort();
    }, 120000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        signal: controller.signal,

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    clearTimeout(timeout);
    timeout = null;

    console.log(
      "📨 Gemini response status:",
      response.status
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Gemini API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed.",
      });
    }

    const result =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join(" ")
        .trim();

    if (!result) {
      console.error("❌ No text returned:", data);

      return res.status(500).json({
        error: "Gemini returned no analysis.",
      });
    }

    console.log(
      "✅ Analysis received successfully"
    );

    return res.json({
      analysis: result,
    });

  } catch (error) {

    if (timeout) {
      clearTimeout(timeout);
    }

    console.error(
      "❌ AI Vision Error:",
      error
    );

    if (error.name === "AbortError") {
      return res.status(504).json({
        error:
          "Gemini request timed out after 120 seconds.",
      });
    }

    return res.status(500).json({
      error:
        error.message ||
        "Failed to analyze image.",
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message:
      "VisionAssist AI Vision Server is running.",
  });
});

app.listen(PORT, () => {
  console.log(
    `🚀 AI Vision Server running on http://localhost:${PORT}`
  );
});