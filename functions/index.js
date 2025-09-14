const functions = require("firebase-functions");
const {onCall} = require("firebase-functions/v2/https");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const axios = require("axios");
const officeParser = require("officeparser");
const pdfParse = require("pdf-parse");
const admin = require("firebase-admin");

admin.initializeApp();

exports.generateFlashcardsFromNote = onCall({
  secrets: ["GEMINI_API_KEY"],
}, async (request) => {
  const {idToken, fileUrl, fileType, generationSettings} = request.data;
  const {difficulty, cardCount} = generationSettings;

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error("ID Token verification failed:", error);
    throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called with a valid authentication token.",
    );
  }

  if (!fileUrl || !fileType) {
    console.error("Missing fileUrl or fileType in request");
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required file information.",
    );
  }

  const uid = decodedToken.uid;
  console.log(`Authenticated user with UID: ${uid}`);

  let extractedText = "";

  try {
    const response = await axios.get(fileUrl, {responseType: "arraybuffer"});
    const fileContent = response.data;
    console.log(`Downloaded file content. Length: ${
      fileContent.byteLength} bytes`);

    if (fileType.includes("pdf")) {
      try {
        const data = await pdfParse(fileContent);
        extractedText = data.text;
      } catch (error) {
        throw new functions.https.HttpsError(
            "internal",
            `PDF parsing failed: ${
              error.message}. The file may be image-based or corrupted.`,
        );
      }
    } else if (fileType.includes("word") || fileType.includes("document")) {
      try {
        extractedText = await officeParser.parseOfficeAsync(fileContent);
      } catch (error) {
        throw new functions.https.HttpsError(
            "internal",
            `Word document parsing failed with officeparser: ${
              error.message}.The file may be corrupted or invalid .docx file.`,
        );
      }
    } else if (fileType.includes("text")) {
      extractedText = response.data.toString();
    } else {
      throw new functions.https.HttpsError(
          "invalid-argument",
          "Unsupported file type for text extraction.",
      );
    }

    extractedText = extractedText
        .replace(/\s+/g, " ")
        .replace(/[^\w\s.,!?;:()'"]/g, "")
        .trim();

    if (extractedText.length < 100) {
      throw new functions.https.HttpsError(
          "internal",
          "Extracted text is too short (less than 100 characters).",
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});

    const prompt = `Create exactly ${
      cardCount} educational flashcards from the following text content.
STRICT REQUIREMENTS:
1. Generate flashcards ONLY from the provided text content
2. Each flashcard must have a clear question (front) and detailed answer (back)
3. Focus on key concepts, definitions, and important facts from the text
4. Difficulty level: ${difficulty}
5. Return ONLY valid JSON format

TEXT CONTENT:
${extractedText.substring(0, 10000)}

Return exactly this JSON format:
[
  {
    "front": "Clear question from the text",
    "back": "Detailed answer based on the text content",
    "difficulty": "${difficulty}"
  }
]
Generate exactly ${cardCount} flashcards.
Return only the JSON array, no other text.`;

    const geminiResult = await model.generateContent(prompt);
    const responseText = geminiResult.response.text();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new functions.https.HttpsError(
          "internal",
          "Gemini did not return valid JSON format.",
      );
    }

    const flashcards = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
      throw new functions.https.HttpsError(
          "internal",
          "Gemini returned empty or invalid flashcard array.",
      );
    }

    return {flashcards};
  } catch (error) {
    console.error("❌ Cloud Function failed:", error);
    if (error.code) {
      throw error;
    }
    throw new functions.https.HttpsError(
        "internal",
        `Server-side flashcard generation failed: ${error.message}`,
    );
  }
});
