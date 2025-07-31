import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { queryService } from '@/services/queryService'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

const querySchema = z.object({
  topic: z.string().min(5, 'Topic must be at least 5 characters').max(500),
  context: z.string().min(10, 'Context must be at least 10 characters').max(5000),
  dataType: z.enum(['1st-party', '3rd-party']),
  sourceLink: z.string().url().optional().or(z.literal('')),
})

type QueryFormData = z.infer<typeof querySchema>

export function QueryPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QueryFormData>({
    resolver: zodResolver(querySchema),
    defaultValues: {
      dataType: '1st-party',
    },
  })

  const dataType = watch('dataType')

  const onSubmit = async (data: QueryFormData) => {
    try {
      setIsSubmitting(true)
      const result = await queryService.createQuery({
        ...data,
        sourceLink: data.sourceLink || undefined,
      })
      
      toast({
        title: 'Success',
        description: 'Query created and inferences generated!',
      })
      
      navigate(`/query/${result.query.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create query',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Query</CardTitle>
          <CardDescription>
            Submit a topic and context for AI-powered inference generation
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="What would you like to analyze?"
                {...register('topic')}
                disabled={isSubmitting}
              />
              {errors.topic && (
                <p className="text-sm text-destructive">{errors.topic.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                A clear, specific topic for inference generation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Context</Label>
              <Textarea
                id="context"
                placeholder="Provide relevant background information, data, or constraints..."
                rows={6}
                {...register('context')}
                disabled={isSubmitting}
              />
              {errors.context && (
                <p className="text-sm text-destructive">{errors.context.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Include any relevant information that will help generate accurate inferences
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataType">Data Type</Label>
              <Select
                value={dataType}
                onValueChange={(value: '1st-party' | '3rd-party') => setValue('dataType', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="dataType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st-party">1st Party Data</SelectItem>
                  <SelectItem value="3rd-party">3rd Party Data</SelectItem>
                </SelectContent>
              </Select>
              {errors.dataType && (
                <p className="text-sm text-destructive">{errors.dataType.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Select whether this is from your own data or external sources
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceLink">Source Link (Optional)</Label>
              <Input
                id="sourceLink"
                type="url"
                placeholder="https://example.com/source"
                {...register('sourceLink')}
                disabled={isSubmitting}
              />
              {errors.sourceLink && (
                <p className="text-sm text-destructive">{errors.sourceLink.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Provide a link to the source material if available
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Inferences...
                </>
              ) : (
                'Generate Inferences'
              )}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}