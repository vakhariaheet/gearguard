import { useState, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  baseUrl?: string
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const { getToken } = useAuth()
  const { baseUrl = '/api', onSuccess, onError } = options
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const request = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const token = await getToken()
      const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setState({ data, loading: false, error: null })
      onSuccess?.(data)
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      onError?.(errorMessage)
      throw error
    }
  }, [getToken, baseUrl, onSuccess, onError])

  const get = useCallback((endpoint: string) => 
    request(endpoint, { method: 'GET' }), [request])

  const post = useCallback((endpoint: string, data?: any) =>
    request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }), [request])

  const put = useCallback((endpoint: string, data?: any) =>
    request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }), [request])

  const del = useCallback((endpoint: string) =>
    request(endpoint, { method: 'DELETE' }), [request])

  return {
    ...state,
    request,
    get,
    post,
    put,
    delete: del,
  }
}