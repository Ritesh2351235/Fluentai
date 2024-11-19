/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff, RefreshCw } from 'lucide-react'

const CircularProgress = ({ value, label }) => {
  const getColor = (score) => {
    if (score >= 7) return 'text-green-500'
    if (score >= 4) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-gray-700 stroke-current"
          strokeWidth="10"
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
        ></circle>
        <circle
          className={`${getColor(value)} stroke-current`}
          strokeWidth="10"
          strokeLinecap="round"
          cx="50"
          cy="50"
          r="40"
          fill="transparent"
          strokeDasharray={`${2 * Math.PI * 40}`}
          strokeDashoffset={`${2 * Math.PI * 40 * (1 - value / 10)}`}
          transform="rotate(-90 50 50)"
        ></circle>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getColor(value)}`}>{value}</span>
        <span className="text-sm text-gray-300">{label}</span>
      </div>
    </div>
  )
}

const sampleParagraphs = [
  "The ancient city stood silent, its stone walls weathered by centuries of wind and rain. Narrow streets wound between tall buildings, their windows dark and empty. In the central square, a fountain lay dry, its basin filled with fallen leaves. Despite its abandonment, there was a sense of history and mystery that clung to every corner, waiting to be discovered by those brave enough to explore its depths.",
  "The laboratory hummed with activity as scientists in white coats moved purposefully between gleaming machines. Screens flickered with data, and the air was filled with the soft beeping of monitors. In one corner, a team huddled around a microscope, excitedly discussing their latest discovery. The atmosphere was charged with the potential for breakthrough, the next great scientific advancement just waiting to be uncovered.",
  "The garden was a riot of color and scent, with flowers of every hue competing for attention. Bees buzzed lazily from bloom to bloom, their legs heavy with pollen. A stone path wound through the beds, leading to a small pond where water lilies floated serenely. In the dappled shade of an old oak tree, a bench invited visitors to sit and soak in the peaceful atmosphere of this hidden paradise."
]

export default function ReadingPractice() {
  const [paragraph, setParagraph] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  useEffect(() => {
    getNewParagraph()
  }, [])

  const getNewParagraph = () => {
    const randomIndex = Math.floor(Math.random() * sampleParagraphs.length)
    setParagraph(sampleParagraphs[randomIndex])
    setAnalysis(null)
    setTranscription('')
  }

  const startRecording = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          audioChunksRef.current = []

          const formData = new FormData()
          formData.append('audio', audioBlob)
          formData.append('text', paragraph)

          const response = await fetch('http://localhost:3000/analyze-reading', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()
          setTranscription(result.transcription)
          setAnalysis({
            pronunciation: result.analysis.pronunciation,
            fluency: result.analysis.fluency,
            accuracy: result.analysis.accuracy,
            intonation: result.analysis.intonation,
            feedback: result.analysis.feedback
          })
        } catch (error) {
          console.error('Error during reading analysis:', error)
          setError('Error analyzing reading: ' + error.message)
        } finally {
          setIsProcessing(false)
        }

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Error accessing microphone: ' + error.message)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className='mx-10 my-10 mb-20 text-center'>
        <h1 className="text-4xl font-bold ">Reading Practice</h1>
        <p className="text-white font-thin mb-6">
          Practice your English reading skills with our AI-powered analysis.
        </p>
      </div>
      <Card className="bg-black border-white text-white mb-8 w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-md">Read the Passage below aloud</CardTitle>
          <CardDescription className="text-white font-thin">
            Based on the passage response, the feedback will be provided below.
            The feedback will consider the following aspects: Pronunciation, Fluency, Accuracy, Intonation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-black rounded-lg border border-gray-700">
            <p className="text-lg">{paragraph}</p>
          </div>
          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              onClick={startRecording}
              disabled={isRecording || isProcessing}
              className={`${isRecording || isProcessing ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}
            >
              <Mic className="mr-2 h-4 w-4" /> Start Recording
            </Button>
            <Button
              onClick={stopRecording}
              disabled={!isRecording || isProcessing}
              className={`${!isRecording || isProcessing ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
            >
              <MicOff className="mr-2 h-4 w-4" /> Stop Recording
            </Button>
            <Button
              onClick={getNewParagraph}
              disabled={isRecording || isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> New Paragraph
            </Button>
          </div>

          {isProcessing && (
            <div className="text-blue-400 mb-4">
              Processing audio...
            </div>
          )}

          {error && (
            <div className="text-red-400 mb-4">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {transcription && (
        <Card className="bg-black border-white text-white mb-6 w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Your Reading</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 whitespace-pre-wrap">{transcription}</p>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card className="bg-black text-white border-white mb-8 w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Reading Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <CircularProgress value={analysis.pronunciation} label="Pronunciation" />
              <CircularProgress value={analysis.fluency} label="Fluency" />
              <CircularProgress value={analysis.accuracy} label="Accuracy" />
              <CircularProgress value={analysis.intonation} label="Intonation" />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Detailed Feedback</h3>
              <div className="whitespace-pre-line text-gray-300 bg-black p-4 rounded-lg">
                {analysis.feedback}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}