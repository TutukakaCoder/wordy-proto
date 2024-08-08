import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const audioFile = files.audio?.[0];
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    try {
      const transcription = await transcribeAudio(audioFile);
      res.status(200).json({ transcription });
    } catch (error) {
      console.error('Error transcribing audio:', error);
      res.status(500).json({ error: 'Error transcribing audio', details: error.message });
    }
  });
}

async function transcribeAudio(audioFile) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(audioFile.filepath), {
    filename: audioFile.originalFilename,
    contentType: audioFile.mimetype,
  });
  formData.append('model', 'whisper-1');

  try {
    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    return response.data.text;
  } catch (error) {
    console.error('OpenAI API error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to transcribe audio');
  }
}