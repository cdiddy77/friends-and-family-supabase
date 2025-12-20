'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSupabase } from '@/hooks/use-supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function ActivateContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const router = useRouter()
  const { supabase } = useSupabase()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!code) {
      setStatus('error')
      setErrorMessage('No activation code provided.')
      return
    }

    const activate = async () => {
      try {
        const res = await fetch('/api/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Activation failed')
        }

        const { token } = data

        const { error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: token, // Hack: using access token as refresh token
        })

        if (error) throw error

        setStatus('success')
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } catch (err: any) {
        setStatus('error')
        setErrorMessage(err.message || 'Something went wrong')
      }
    }

    activate()
  }, [code, router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Account Activation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-gray-600">Verifying your invitation...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="mt-4 text-lg font-medium text-green-700">Success!</p>
              <p className="text-gray-600">Redirecting you to the app...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="mt-4 text-lg font-medium text-red-700">Activation Failed</p>
              <p className="text-center text-gray-600">{errorMessage}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
       <ActivateContent />
    </Suspense>
  )
}

