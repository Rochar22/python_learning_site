"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, StopCircle, RefreshCw } from "lucide-react"

interface BrythonIframeProps {
  onOutput: (output: string) => void
  input: string
}

export function BrythonIframe({ onOutput, input }: BrythonIframeProps) {
  const [code, setCode] = useState(`# Введите ваш код здесь
print("Hello, World!")
`)
  const [isRunning, setIsRunning] = useState(false)
  const [iframeReady, setIframeReady] = useState(false)
  const [iframeError, setIframeError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Function to reload the iframe
  const reloadIframe = () => {
    setIframeReady(false)
    setIframeError(null)
    onOutput("Перезагрузка интерпретатора Python...")

    if (iframeRef.current) {
      const iframe = iframeRef.current
      // Reload the iframe by changing its src
      iframe.src = "/brython-runner.html?t=" + Date.now()
    }
  }

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data

      if (data.type === "brython_ready") {
        console.log("Brython iframe is ready")
        setIframeReady(true)
        setIframeError(null)
        onOutput("Интерпретатор Python готов к использованию")
      } else if (data.type === "brython_error") {
        console.error("Brython error:", data.error)
        setIframeError(data.error || "Неизвестная ошибка Brython")
        setIframeReady(false)
        onOutput(`Ошибка инициализации Brython: ${data.error || "Неизвестная ошибка"}`)
      } else if (data.type === "execution_result") {
        console.log("Received execution result")
        onOutput(data.output || "Нет вывода")
        setIsRunning(false)
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [onOutput])

  // Initialize iframe on component mount
  useEffect(() => {
    // Set a timeout to check if iframe is ready after a reasonable time
    const timeoutId = setTimeout(() => {
      if (!iframeReady && !iframeError) {
        setIframeError("Timeout waiting for Brython to initialize. Try reloading.")
        onOutput("Ошибка: Brython не инициализировался в течение ожидаемого времени. Попробуйте перезагрузить.")
      }
    }, 5000)

    return () => clearTimeout(timeoutId)
  }, [iframeReady, iframeError, onOutput])

  const handleRunCode = () => {
    if (!iframeReady || !iframeRef.current) {
      onOutput("Ошибка: Brython не готов. Пожалуйста, перезагрузите интерпретатор.")
      return
    }

    setIsRunning(true)
    onOutput("Выполнение...")

    try {
      // Send code to iframe for execution
      iframeRef.current.contentWindow?.postMessage(
        {
          type: "run_code",
          code: code,
          input: input,
        },
        "*",
      )
    } catch (error) {
      setIsRunning(false)
      onOutput(`Ошибка отправки кода в интерпретатор: ${error}`)
    }
  }

  const handleStopCode = () => {
    // In this implementation, we can't really stop execution
    // since it's running in an iframe, but we can update the UI
    setIsRunning(false)
    onOutput("Выполнение программы остановлено (примечание: в текущей реализации код продолжает выполняться в фоне)")
  }

  return (
    <div className="flex flex-col">
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="font-mono w-full min-h-[300px] p-4 bg-muted rounded-md text-sm"
          spellCheck={false}
        />

        {/* Status indicator */}
        {!iframeReady && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 p-2 text-sm flex justify-between items-center">
            <span>{iframeError ? `Ошибка Brython: ${iframeError}` : "Загрузка Brython... Пожалуйста, подождите."}</span>
            <Button variant="outline" size="sm" onClick={reloadIframe} className="ml-2">
              <RefreshCw className="h-3 w-3 mr-1" />
              Перезагрузить
            </Button>
          </div>
        )}

        {/* Run/Stop button */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          {iframeReady && (
            <>
              {isRunning ? (
                <Button onClick={handleStopCode} variant="destructive">
                  <StopCircle className="h-4 w-4 mr-2" />
                  Остановить
                </Button>
              ) : (
                <Button onClick={handleRunCode}>
                  <Play className="h-4 w-4 mr-2" />
                  Запустить
                </Button>
              )}
            </>
          )}

          {!iframeReady && (
            <Button variant="outline" onClick={reloadIframe}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Перезагрузить интерпретатор
            </Button>
          )}
        </div>
      </div>

      {/* Hidden iframe that runs Brython */}
      <iframe
        ref={iframeRef}
        src={`/brython-runner.html?t=${Date.now()}`}
        style={{ width: "100%", height: "0", border: "none" }}
        title="Brython Runner"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}

