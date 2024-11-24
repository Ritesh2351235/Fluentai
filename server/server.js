import express from 'express';
import multer from 'multer';
import fs from 'fs';
import cors from 'cors';
import { AssemblyAI } from 'assemblyai';
import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
const app = express();
const upload = multer({ dest: 'uploads/' });
const client = new AssemblyAI({ apiKey: 'b225efd7bf6947c0b6af6d422954e453' });

// Enable CORS
app.use(cors());
app.use(express.json());
const prisma = new PrismaClient();
// Function to analyze text using Ollama

app.post('/user', async (req, res) => {
  const { name, email } = req.body;

  // Validation: Check if both fields are present
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }
  try {
    const newUser = await prisma.user.create({
      data: { name, email },
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});



async function analyzeWithOllama(text) {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: `Please analyze the following speech transcript and provide the detailed analysis :
                Transcript: "${text}"
                Provide a detailed analysis in the following JSON format:
              {
                "scores": {
                  "pronunciation": <score 1-10>,
                  "vocabulary": <score 1-10>,
                  "fluency": <score 1-10>,
                  "grammer": <score 1-10>,
                  
                },
                "feedback": {
                  "pronunciation": "<specific feedback on pronunciation>",
                  "vocabulary": "<specific feedback on vocabulary and grammar>",
                  "fluency": "<specific feedback on reading flow and speed>",
                  "grammer": "<specific feedback on grammer>",
                }
              }
              Consider these aspects in your scoring:
              - Pronunciation: Correct sound production, clarity of speech
              - Vocabulary: Correct use of words, appropriate vocabulary
              - Fluency: Smooth reading pace, appropriate pauses, lack of hesitation
              - Grammer: Correct grammar, correct use of punctuation

              Provide detailed, constructive feedback for each aspect and strictly follow the above format and add any other feilds or information.
                `,
        stream: false
      }),
    });

    const data = await response.json();
    console.log('Ollama analysis response:', data);

    try {
      // Find the JSON object in the response text
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysisData = JSON.parse(jsonMatch[0]);

      // Format the response in a frontend-friendly structure
      const formattedAnalysis = {
        scores: analysisData.scores,
        combinedFeedback: `Overall Assessment:\n${analysisData.feedback.overall}\n\n` +
          `Pronunciation: ${analysisData.feedback.pronunciation}\n\n` +
          `Vocabulary: ${analysisData.feedback.vocabulary}\n\n` +
          `Fluency: ${analysisData.feedback.fluency}\n\n` +
          `Grammer: ${analysisData.feedback.grammer}`
      };
      console.log("Formatted analysis:", formattedAnalysis);
      return formattedAnalysis;

    } catch (parseError) {
      console.error('Error parsing Ollama response:', parseError);
      // Fallback response if parsing fails
      return {
        scores: {
          pronunciation: 5,
          vocabulary: 5,
          fluency: 5,
          grammer: 5
        },
        combinedFeedback: "Error processing analysis results. Please try again."
      };
    }
  } catch (error) {
    console.error('Ollama analysis error:', error);
    throw new Error('Speech analysis failed');
  }
}

// Enhanced transcription endpoint
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    console.error('No file received');
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const audioFilePath = req.file.path;
  console.log(`Received audio file: ${req.file.originalname}`);
  console.log(`File path: ${audioFilePath}`);
  console.log(`File size: ${req.file.size} bytes`);
  console.log(`File mimetype: ${req.file.mimetype}`);

  try {
    // Upload audio to AssemblyAI
    console.log(`Uploading audio file to AssemblyAI`);
    const transcriptRequest = await client.transcripts.transcribe({ audio: audioFilePath });
    console.log(`Transcription request sent. ID: ${transcriptRequest.id}`);

    // Poll for transcription completion
    let transcriptResult;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      transcriptResult = await client.transcripts.get(transcriptRequest.id);
      console.log(`Transcription status (Attempt ${attempts + 1}): ${transcriptResult.status}`);

      if (transcriptResult.status === 'completed') break;
      if (transcriptResult.status === 'error') {
        throw new Error(`Transcription failed: ${transcriptResult.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new Error('Transcription timed out');
    }

    console.log("Transcription completed. Text:", transcriptResult.text);

    // Analyze transcribed text with Ollama
    const analysisResult = await analyzeWithOllama(transcriptResult.text);

    // Prepare response
    const response = {
      transcription: transcriptResult.text,
      analysis: {
        pronunciation: analysisResult.scores.pronunciation || 5,
        vocabulary: analysisResult.scores.vocabulary || 5,
        fluency: analysisResult.scores.fluency || 5,
        grammer: analysisResult.scores.grammer || 5,
        feedback: analysisResult.combinedFeedback || "No detailed feedback available."
      }
    };

    // Clean up uploaded file
    fs.unlinkSync(audioFilePath);
    console.log(`Deleted temporary file: ${audioFilePath}`);

    // Send final response
    res.json(response);

  } catch (error) {
    console.error('Transcription/Analysis Error:', error);

    // Delete temporary file if it exists
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }

    // Send error response
    res.status(500).json({
      error: 'Transcription or analysis failed',
      details: error.message || 'Unknown error occurred'
    });
  }
});

async function analyzeWithOllama2(transcriptionText, paragraph) {
  try {
    const structuredPrompt = `
Analyze this reading performance by comparing the transcript to the original paragraph.

Original Paragraph:
"${paragraph}"

Student's Reading Transcript:
"${transcriptionText}"

Provide a detailed analysis in the following JSON format:
{
  "scores": {
    "pronunciation": <score 1-10>,
    "fluency": <score 1-10>,
    "accuracy": <score 1-10>,
    "intonation": <score 1-10>
  },
  "feedback": {
    "pronunciation": "<specific feedback on pronunciation>",
    "fluency": "<specific feedback on reading flow and speed>",
    "accuracy": "<specific feedback on word accuracy and completeness>",
    "intonation": "<specific feedback on expression and tone>",
    "overall": "<general improvement suggestions>"
  }
}

Consider these aspects in your scoring:
- Pronunciation: Correct sound production, clarity of speech
- Fluency: Smooth reading pace, appropriate pausing, lack of hesitation
- Accuracy: Correct words, no omissions or additions
- Intonation: Appropriate expression, tone variation, emphasis

Provide detailed, constructive feedback for each aspect and strictly follow the above format and add any other feilds or information.
`

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: structuredPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze with Ollama');
    }

    const data = await response.json();
    console.log("Ollama response:", data);
    // Parse the Ollama response to extract the JSON
    try {
      // Find the JSON object in the response text
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysisData = JSON.parse(jsonMatch[0]);

      // Format the response in a frontend-friendly structure
      const formattedAnalysis = {
        scores: analysisData.scores,
        combinedFeedback: `Overall Assessment:\n${analysisData.feedback.overall}\n\n` +
          `Pronunciation: ${analysisData.feedback.pronunciation}\n\n` +
          `Fluency: ${analysisData.feedback.fluency}\n\n` +
          `Accuracy: ${analysisData.feedback.accuracy}\n\n` +
          `Intonation: ${analysisData.feedback.intonation}`
      };
      console.log("Formatted analysis:", formattedAnalysis);
      return formattedAnalysis;

    } catch (parseError) {
      console.error('Error parsing Ollama response:', parseError);
      // Fallback response if parsing fails
      return {
        scores: {
          pronunciation: 5,
          fluency: 5,
          accuracy: 5,
          intonation: 5
        },
        combinedFeedback: "Error processing analysis results. Please try again."
      };
    }
  } catch (error) {
    console.error('Error communicating with Ollama:', error);
    throw new Error('Ollama analysis failed');
  }
}

// Update the endpoint to handle the new response format
app.post('/analyze-reading', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    console.error('No file received');
    return res.status(400).json({ error: 'No file received' });
  }

  const audioFilePath = req.file.path;
  const paragraph = req.body.text;

  try {
    // Upload and transcribe with AssemblyAI
    const transcriptRequest = await client.transcripts.transcribe({ audio: audioFilePath });

    let transcriptResult;
    do {
      transcriptResult = await client.transcripts.get(transcriptRequest.id);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } while (transcriptResult.status !== 'completed');

    // Get the analysis from Ollama with the new structured format
    const analysisResult = await analyzeWithOllama2(transcriptResult.text, paragraph);

    // Send the formatted response to the frontend
    res.json({
      transcription: transcriptResult.text,
      analysis: {
        pronunciation: analysisResult.scores.pronunciation,
        fluency: analysisResult.scores.fluency,
        accuracy: analysisResult.scores.accuracy,
        intonation: analysisResult.scores.intonation,
        feedback: analysisResult.combinedFeedback
      }
    });

    // Clean up the uploaded file
    fs.unlinkSync(audioFilePath);

  } catch (error) {
    console.error('Error analyzing reading:', error);
    res.status(500).json({ error: 'Error analyzing reading', details: error.message });
  }
});

app.post('/analyze-writing', async (req, res) => {
  const { text } = req.body;
  console.log(text);
  try {

    const analysisResult = await analyzeWithOllama3(text);
    res.json({
      analysis: {
        pronunciation: analysisResult.scores.pronunciation,
        grammer: analysisResult.scores.grammer,
        structure: analysisResult.scores.structure,
        vocabulary: analysisResult.scores.vocabulary,
        feedback: analysisResult.combinedFeedback
      }
    });

  } catch (error) {
    console.error('Error analyzing reading:', error);
    res.status(500).json({ error: 'Error analyzing reading', details: error.message });
  }
});

async function analyzeWithOllama3(text) {
  try {
    const structuredPrompt = `
Analyze this writing performance of the user by considering grammer and other writng rules.

Original Paragraph:
"${text}"

Provide a detailed analysis in the following JSON format:
{
  "scores": {
    "pronunciation": <score 1-10>,
    "grammer": <score 1-10>,
    "structure": <score 1-10>,
    "vocabulary": <score 1-10>
  },
  "feedback": {
    "pronunciation": "<specific feedback on pronunciation>",
    "grammer": "<specific feedback on grammer>",
    "vocabulary": "<specific feedback on vocabulary>",
    "structure": "<specific feedback on structure>",
    "overall": "<general improvement suggestions>"
  }
}

Consider these aspects in your scoring:
- Pronunciation: Correct sound production, clarity of speech
- grammer: Correct grammar, correct use of punctuation
- Structure: Proper organization of sentences, coherence
- Vocabulary: Correct use of words, appropriate vocabulary


Provide detailed, constructive feedback for each aspect and strictly follow the above format and add any other feilds or information.
`

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral',
        prompt: structuredPrompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze with Ollama');
    }

    const data = await response.json();
    console.log("Ollama response:", data);
    // Parse the Ollama response to extract the JSON
    try {
      // Find the JSON object in the response text
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysisData = JSON.parse(jsonMatch[0]);

      // Format the response in a frontend-friendly structure
      const formattedAnalysis = {
        scores: analysisData.scores,
        combinedFeedback: `Overall Assessment:\n${analysisData.feedback.overall}\n\n` +
          `Pronunciation: ${analysisData.feedback.pronunciation}\n\n` +
          `Grammer: ${analysisData.feedback.grammer}\n\n` +
          `Structure: ${analysisData.feedback.structure}\n\n` +
          `Vocabulary: ${analysisData.feedback.vocabulary}`
      };
      console.log("Formatted analysis:", formattedAnalysis);
      return formattedAnalysis;

    } catch (parseError) {
      console.error('Error parsing Ollama response:', parseError);
      // Fallback response if parsing fails
      return {
        scores: {
          pronunciation: 5,
          grammer: 5,
          structure: 5,
          vocabulary: 5
        },
        combinedFeedback: "Error processing analysis results. Please try again."
      };
    }
  } catch (error) {
    console.error('Error communicating with Ollama:', error);
    throw new Error('Ollama analysis failed');
  }
}
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});