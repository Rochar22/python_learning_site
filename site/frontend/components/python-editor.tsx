"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, StopCircle } from "lucide-react"

interface PythonEditorProps {
  onOutput: (output: string) => void
  input: string
}

declare global {
  interface Window {
    brython: (config?: { debug?: number }) => void
    __BRYTHON__: any
  }
}

export function PythonEditor({ onOutput, input }: PythonEditorProps) {
  const [code, setCode] = useState(`# Введите ваш код здесь
print("Hello, World!")
`)
  const [isRunning, setIsRunning] = useState(false)
  const [brythonLoaded, setBrythonLoaded] = useState(false)
  const pythonConsoleRef = useRef<HTMLDivElement>(null)
  const originalConsoleLog = useRef<typeof console.log | null>(null)
  const originalConsoleError = useRef<typeof console.error | null>(null)
  const checkAttemptsRef = useRef(0)

  // Check if Brython is loaded
  useEffect(() => {
    const checkBrython = () => {
      if (typeof window !== "undefined" && window.brython) {
        console.log("Brython detected, initializing...")
        try {
          window.brython({ debug: 1 })
          setBrythonLoaded(true)
          console.log("Brython initialized successfully")
        } catch (error) {
          console.error("Error initializing Brython:", error)
        }
      } else {
        console.log("Brython not detected, will check again...")
        checkAttemptsRef.current += 1

        // If we've tried many times and Brython is still not available,
        // suggest reloading the page
        if (checkAttemptsRef.current > 10) {
          console.error("Failed to load Brython after multiple attempts")
        }
      }
    }

    // Check immediately
    checkBrython()

    // Also set up an interval to check a few times
    const intervalId = setInterval(() => {
      if (!brythonLoaded && checkAttemptsRef.current < 20) {
        checkBrython()
      } else {
        clearInterval(intervalId)
      }
    }, 1000)

    // Clean up interval
    return () => {
      clearInterval(intervalId)
      // Cleanup console overrides
      if (originalConsoleLog.current) {
        console.log = originalConsoleLog.current
      }
      if (originalConsoleError.current) {
        console.error = originalConsoleError.current
      }
    }
  }, [brythonLoaded])

  const handleRunCode = () => {
    if (!brythonLoaded) {
      onOutput("Ошибка: Brython не загружен. Пожалуйста, перезагрузите страницу.")
      return
    }

    setIsRunning(true)
    let output = ""

    // Save original console methods
    originalConsoleLog.current = console.log
    originalConsoleError.current = console.error

    // Override console.log to capture output
    console.log = (...args) => {
      const text = args.map((arg) => String(arg)).join(" ")
      output += text + "\n"
      originalConsoleLog.current?.(...args)
    }

    // Override console.error to capture errors
    console.error = (...args) => {
      const text = args.map((arg) => String(arg)).join(" ")
      output += "Error: " + text + "\n"
      originalConsoleError.current?.(...args)
    }

    // Create a Python script element
    const scriptId = "python-script-" + Date.now()
    const existingScript = document.getElementById(scriptId)
    if (existingScript) {
      existingScript.remove()
    }

    // Create a new script element with the Python code
    const script = document.createElement("script")
    script.id = scriptId
    script.type = "text/python"

    // Handle input if provided
    let processedCode = code
    if (input.trim()) {
      // Create a simple input simulation by pre-defining values
      const inputLines = input
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
      let inputSetup = "# Input simulation\n"
      inputSetup += "_input_values = " + JSON.stringify(inputLines) + "\n"
      inputSetup += "_input_index = 0\n\n"
      inputSetup += "def input(prompt=''):\n"
      inputSetup += "    global _input_index\n"
      inputSetup += "    if _input_index < len(_input_values):\n"
      inputSetup += "        value = _input_values[_input_index]\n"
      inputSetup += "        _input_index += 1\n"
      inputSetup += "        print(prompt + value)\n"
      inputSetup += "        return value\n"
      inputSetup += "    return ''\n\n"

      processedCode = inputSetup + processedCode
    }

    script.textContent = processedCode

    try {
      // Add the script to the document to execute it
      document.body.appendChild(script)

      // Capture the output after a short delay
      setTimeout(() => {
        onOutput(output || "Программа выполнена без вывода")
        setIsRunning(false)

        // Restore original console methods
        if (originalConsoleLog.current) {
          console.log = originalConsoleLog.current
        }
        if (originalConsoleError.current) {
          console.error = originalConsoleError.current
        }

        // Clean up
        script.remove()
      }, 500)
    } catch (error) {
      onOutput(`Ошибка выполнения: ${error}`)
      setIsRunning(false)

      // Restore original console methods
      if (originalConsoleLog.current) {
        console.log = originalConsoleLog.current
      }
      if (originalConsoleError.current) {
        console.error = originalConsoleError.current
      }
    }
  }

  const handleStopCode = () => {
    // This is a simple implementation - in a real app, you would need
    // a more sophisticated way to interrupt Brython execution
    setIsRunning(false)
    onOutput("Выполнение программы остановлено")

    // Restore original console methods
    if (originalConsoleLog.current) {
      console.log = originalConsoleLog.current
    }
    if (originalConsoleError.current) {
      console.error = originalConsoleError.current
    }
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
        {!brythonLoaded && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 p-2 text-sm">
            Загрузка Brython... Если это сообщение не исчезает, попробуйте перезагрузить страницу.
          </div>
        )}
        {isRunning ? (
          <Button onClick={handleStopCode} className="absolute bottom-4 right-4" variant="destructive">
            <StopCircle className="h-4 w-4 mr-2" />
            Остановить
          </Button>
        ) : (
          <Button onClick={handleRunCode} className="absolute bottom-4 right-4" disabled={!brythonLoaded}>
            <Play className="h-4 w-4 mr-2" />
            Запустить
          </Button>
        )}
      </div>
      <div ref={pythonConsoleRef} id="python-console" className="hidden"></div>
    </div>
  )
}

