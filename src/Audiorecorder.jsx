import { useState, useRef } from 'react';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [analysis, setAnalysis] = useState(null); // State for Ollama analysis
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      setError('');
      console.log("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log("Audio chunk available:", event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped.");
        setIsProcessing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];

          const formData = new FormData();
          formData.append('audio', audioBlob);

          console.log("Sending audio to backend...");
          const response = await fetch('http://localhost:3000/transcribe', {
            method: 'POST',
            body: formData
          });

          console.log("Response received from backend:", response.status);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          console.log("Transcription result:", result.transcription);
          setTranscription(result.transcription);
          setAnalysis(result.analysis); // Set analysis data from backend

        } catch (error) {
          console.error('Error during transcription:', error);
          setError('Error during transcription: ' + error.message);
        } finally {
          setIsProcessing(false);
        }

        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      console.log("Recording started...");
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Error accessing microphone: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Audio Recorder</h1>

      <div className="space-x-4 mb-6">
        <button
          onClick={startRecording}
          disabled={isRecording || isProcessing}
          className={`px-4 py-2 rounded ${isRecording || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium transition-colors`}
        >
          Start Recording
        </button>

        <button
          onClick={stopRecording}
          disabled={!isRecording || isProcessing}
          className={`px-4 py-2 rounded ${!isRecording || isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'} text-white font-medium transition-colors`}
        >
          Stop Recording
        </button>
      </div>

      {isProcessing && (
        <div className="text-blue-500 mb-4">
          Processing audio...
        </div>
      )}

      {error && (
        <div className="text-red-500 mb-4">
          {error}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Transcription:</h2>
        <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">
          {transcription || 'No transcription available'}
        </pre>

        {analysis && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Analysis:</h2>
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
};

export default AudioRecorder;