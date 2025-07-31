import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { inferenceService } from '@/services/inferenceService'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export function VerifyPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [selectedInference, setSelectedInference] = useState<'A' | 'B' | 'C' | 'custom'>('A')
  const [customInference, setCustomInference] = useState('')
  const [rationale, setRationale] = useState('')
  const [correct, setCorrect] = useState<boolean | null>(null)

  const { data: inferences, isLoading, refetch } = useQuery({
    queryKey: ['unverified-inferences'],
    queryFn: () => inferenceService.getUnverified(1),
  })

  const currentInference = inferences?.[0]

  const verifyMutation = useMutation({
    mutationFn: (data: {
      id: string
      selectedInference: 'A' | 'B' | 'C' | 'custom'
      customInference?: string
      correct: boolean
      rationale: string
    }) => inferenceService.verifyInference(data.id, {
      selectedInference: data.selectedInference,
      customInference: data.customInference,
      correct: data.correct,
      rationale: data.rationale,
    }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Inference verified successfully!',
      })
      
      // Reset form
      setSelectedInference('A')
      setCustomInference('')
      setRationale('')
      setCorrect(null)
      
      // Refetch to get next inference
      refetch()
      queryClient.invalidateQueries({ queryKey: ['inference-stats'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to verify inference',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = () => {
    if (!currentInference || correct === null || !rationale.trim()) {
      toast({
        title: 'Error',
        description: 'Please complete all fields before submitting',
        variant: 'destructive',
      })
      return
    }

    if (selectedInference === 'custom' && !customInference.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a custom inference',
        variant: 'destructive',
      })
      return
    }

    verifyMutation.mutate({
      id: currentInference.id,
      selectedInference,
      customInference: selectedInference === 'custom' ? customInference : undefined,
      correct,
      rationale,
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!currentInference) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              There are no inferences waiting for verification at this time.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Verify Inference</h1>
        <p className="text-muted-foreground">
          Review and validate AI-generated inferences to build verified knowledge
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Query Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="font-medium">{currentInference.topic}</p>
            <p className="text-sm text-muted-foreground">{currentInference.context}</p>
            {currentInference.source_link && (
              <a
                href={currentInference.source_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View Source
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generated Inferences</CardTitle>
          <CardDescription>
            Select the most accurate inference or provide your own
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedInference}
            onValueChange={(value) => setSelectedInference(value as 'A' | 'B' | 'C' | 'custom')}
          >
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="A" id="inference-a" />
                  <Label htmlFor="inference-a" className="flex-1 cursor-pointer">
                    <span className="font-semibold">Inference A (Conservative)</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentInference.inference_a}
                    </p>
                  </Label>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="B" id="inference-b" />
                  <Label htmlFor="inference-b" className="flex-1 cursor-pointer">
                    <span className="font-semibold">Inference B (Progressive)</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentInference.inference_b}
                    </p>
                  </Label>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="C" id="inference-c" />
                  <Label htmlFor="inference-c" className="flex-1 cursor-pointer">
                    <span className="font-semibold">Inference C (Synthetic)</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentInference.inference_c}
                    </p>
                  </Label>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="custom" id="inference-custom" />
                  <Label htmlFor="inference-custom" className="flex-1 cursor-pointer">
                    <span className="font-semibold">Custom Inference</span>
                  </Label>
                </div>
                {selectedInference === 'custom' && (
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your custom inference..."
                    value={customInference}
                    onChange={(e) => setCustomInference(e.target.value)}
                    rows={3}
                  />
                )}
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Is this inference correct?</Label>
            <div className="flex gap-4 mt-2">
              <Button
                variant={correct === true ? 'default' : 'outline'}
                onClick={() => setCorrect(true)}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Correct
              </Button>
              <Button
                variant={correct === false ? 'destructive' : 'outline'}
                onClick={() => setCorrect(false)}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Incorrect
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="rationale">Verification Rationale</Label>
            <Textarea
              id="rationale"
              placeholder="Explain why this inference is correct or incorrect..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={verifyMutation.isPending || correct === null || !rationale.trim()}
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Verification'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}