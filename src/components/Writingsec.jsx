/* eslint-disable react/prop-types */
'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from 'lucide-react'

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

export default function Writing() {
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch('https://nutritionai.in/analyze-writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setAnalysis({
        pronunciation: result.analysis.pronunciation,
        grammer: result.analysis.grammer,
        structure: result.analysis.structure,
        vocabulary: result.analysis.vocabulary,
        feedback: result.analysis.feedback
      })
    } catch (error) {
      console.error('Error during writing analysis:', error)
      setError('Error analyzing writing: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className='mx-10 my-10 mb-20 text-center'>
        <h1 className="text-4xl font-bold ">Writing Practice</h1>
        <p className="text-white font-thin mb-8">
          Practice your English writing skills with our AI-powered analysis.
        </p>
      </div>

      <Card className="bg-black  text-white mb-8 w-1/2 md:w-3/4 mx-auto">
        <CardHeader>
          <CardTitle>Improve Your Writing Skills</CardTitle>
          <CardDescription className="text-white font-regular">
            Write a short introduction to yourself in the box below, and we&apos;ll provide feedback on various aspects of your writing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Start writing here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] bg-black text-white p-4 rounded"
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || text.trim().length === 0}
            className={`${isLoading ? 'bg-gray-600' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Writing'
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-400 mb-4">
          {error}
        </div>
      )}

      {analysis && (
        <Card className="bg-black text-white border-white mb-8 w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Writing Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <CircularProgress value={analysis.pronunciation} label="Pronunciation" />
              <CircularProgress value={analysis.grammer} label="Fluency" />
              <CircularProgress value={analysis.structure} label="Accuracy" />
              <CircularProgress value={analysis.vocabulary} label="Intonation" />
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
