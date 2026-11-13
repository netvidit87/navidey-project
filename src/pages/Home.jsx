import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const UPLOAD_API = '/api/upload'
const TURNSTILE_SITE_KEY = '0x4AAAAAAF-N4cGvBQXckJzF'

export default function Home() {
  const fileRef = useRef(null)
  const turnstileRef = useRef(null)
  const widgetIdRef = useRef(null)
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  // Render Turnstile widget
  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !turnstileRef.current) return

    // Clear previous if any
    if (widgetIdRef.current !== null) {
      try {
        window.turnstile.remove(widgetIdRef.current)
      } catch {}
      widgetIdRef.current = null
    }

    turnstileRef.current.innerHTML = ''
    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'light',
      callback: (token) => {
        setTurnstileToken(token)
        setError('')
      },
      'expired-callback': () => {
        setTurnstileToken('')
      },
      'error-callback': () => {
        setTurnstileToken('')
        setError('Turnstile verification failed. Please try again.')
      },
    })
  }, [])

  useEffect(() => {
    // Wait for Turnstile script
    if (window.turnstile) {
      renderTurnstile()
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval)
          renderTurnstile()
        }
      }, 200)
      return () => clearInterval(interval)
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {}
      }
    }
  }, [renderTurnstile])

  const onPick = () => {
    setError('')
    if (!turnstileToken) {
      setError('Please complete the security check first.')
      return
    }
    fileRef.current?.click()
  }

  const onFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!turnstileToken) {
      setError('Please complete the security check first.')
      return
    }

    if (!file.type.startsWith('video/')) {
      setError('File harus berupa video.')
      return
    }

    // batas 200MB
    if (file.size > 200 * 1024 * 1024) {
      setError('Ukuran maksimal 200MB.')
      return
    }

    setUploading(true)
    setProgress(0)
    setError('')

    const form = new FormData()
    form.append('file', file)
    form.append('cf-turnstile-response', turnstileToken)

    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100))
      }
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300 && data.id) {
          setProgress(100)
          setTimeout(() => {
            setUploading(false)
            // Reset Turnstile after successful upload
            setTurnstileToken('')
            if (window.turnstile && widgetIdRef.current !== null) {
              try {
                window.turnstile.reset(widgetIdRef.current)
              } catch {}
            }
            navigate(`/v/${encodeURIComponent(data.id)}`)
          }, 250)
        } else {
          throw new Error(data.error || `Upload gagal (${xhr.status})`)
        }
      } catch (err) {
        setError(err.message || 'Upload gagal.')
        setUploading(false)
        setProgress(0)
        // Reset token on error so user can retry
        setTurnstileToken('')
        if (window.turnstile && widgetIdRef.current !== null) {
          try {
            window.turnstile.reset(widgetIdRef.current)
          } catch {}
        }
      }
    }

    xhr.onerror = () => {
      setError('Network error. Coba lagi.')
      setUploading(false)
      setProgress(0)
      setTurnstileToken('')
      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.reset(widgetIdRef.current)
        } catch {}
      }
    }

    xhr.open('POST', UPLOAD_API)
    xhr.send(form)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex items-center">
        <div className="max-w-6xl w-full mx-auto px-6 lg:px-8">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
                Upload your videos
                <br />
                <span className="text-gray-600">and share</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-700 font-medium leading-relaxed">
                Free and simple video hosting.
              </p>

              {!uploading ? (
                <div className="pt-4 space-y-5">
                  {/* Cloudflare Turnstile Widget */}
                  <div className="flex justify-center">
                    <div ref={turnstileRef} />
                  </div>

                  <button
                    type="button"
                    onClick={onPick}
                    disabled={!turnstileToken}
                    className={`inline-flex items-center justify-center px-8 py-3 font-semibold rounded-full transition-all duration-200 min-w-[180px] ${
                      turnstileToken
                        ? 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-105 active:scale-95'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Upload Video
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={onFile}
                  />
                  {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                </div>
              ) : (
                <div className="pt-4 max-w-md mx-auto">
                  <p className="text-sm text-gray-600 mb-3">
                    Please wait while your file uploads...
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gray-900 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {Math.min(Math.round(progress), 100)}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
