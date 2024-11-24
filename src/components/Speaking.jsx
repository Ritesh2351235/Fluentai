/* eslint-disable react/prop-types */
'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mic, MicOff } from 'lucide-react'

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

export default function Speaking() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const startRecording = async () => {
    try {
      setError('')
      console.log("Requesting microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          console.log("Audio chunk available:", event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped.")
        setIsProcessing(true)

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          audioChunksRef.current = []

          const formData = new FormData()
          formData.append('audio', audioBlob)

          console.log("Sending audio to backend...")
          const response = await fetch('http://13.203.89.62/transcribe', {
            method: 'POST',
            body: formData
          })

          console.log("Response received from backend:", response.status)
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Error:', response.status, errorText)
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()
          console.log("Transcription result:", result.transcription)
          setTranscription(result.transcription)
          setAnalysis({
            pronunciation: result.analysis.pronunciation,
            vocabulary: result.analysis.vocabulary,
            fluency: result.analysis.fluency,
            grammer: result.analysis.grammer,
            feedback: result.analysis.feedback
          })

        } catch (error) {
          console.error('Error during transcription:', error)
          setError('Error during transcription: ' + error.message)
        } finally {
          setIsProcessing(false)
        }

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      console.log("Recording started...")
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
      <h1 className="text-4xl font-bold ">Speaking Practice</h1>
      <p className="text-white font-thin mb-5">
        Practice your English speaking skills with our AI-powered analysis.
        </p>
      </div>
      

      <Card className="bg-black border-white text-white mb-8 w-1/2 md:w-3/4 mx-auto">
        <CardHeader>
          <CardTitle>Improve Your Speaking Skills</CardTitle>
          <CardDescription className="text-white font-thin">
            Start by introducing yourself in the box below, and we&apos;ll provide feedback on various aspects of your speech.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
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
              <CircularProgress value={analysis.vocabulary} label="Vocabulary" />
              <CircularProgress value={analysis.fluency} label="Fluency" />
              <CircularProgress value={analysis.grammer} label="Grammer" />
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