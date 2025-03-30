"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, StopCircle, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PythonRunnerProps {
  onOutput: (output: string) => void
  input: string
}

export function PythonRunner({ onOutput, input }: PythonRunnerProps) {
  const [code, setCode] = useState(`# Введите ваш код здесь
print("Hello, World!")
`)
  const [isRunning, setIsRunning] = useState(false)
  const [iframeReady, setIframeReady] = useState(false)
  const [iframeError, setIframeError] = useState<string | null>(null)
  const [lastOutput, setLastOutput] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Use Skulpt instead of Brython for better compatibility
  const [useSkulpt, setUseSkulpt] = useState(true)

  // Example code snippets
  const examples = {
    basic: `# Простой пример
print("Привет, мир!")
print("Это интерпретатор Python в браузере")
print("2 + 2 =", 2 + 2)`,

    input: `# Пример использования input()
name = input("Введите ваше имя: ")
print("Привет,", name + "!")

age = input("Сколько вам лет? ")
print("Через 10 лет вам будет", int(age) + 10, "лет")`,

    loop: `# Пример цикла
print("Таблица умножения на 5:")
for i in range(1, 11):
    print(f"5 × {i} = {5 * i}")`,

    conditional: `# Пример условного оператора
number = int(input("Введите число: "))

if number > 0:
    print("Число положительное")
elif number < 0:
    print("Число отрицательное")
else:
    print("Число равно нулю")`,

    list: `# Пример работы со списками
fruits = ["яблоко", "банан", "апельсин", "груша", "киви"]

print("Список фруктов:")
for i, fruit in enumerate(fruits):
    print(f"{i+1}. {fruit}")

print("\\nПервый фрукт:", fruits[0])
print("Последний фрукт:", fruits[-1])

print("\\nСортировка списка:")
sorted_fruits = sorted(fruits)
for fruit in sorted_fruits:
    print(fruit)`,
  }

  // Function to reload the iframe
  const reloadIframe = () => {
    setIframeReady(false)
    setIframeError(null)
    setLastOutput(null)
    onOutput("Перезагрузка интерпретатора Python...")

    if (iframeRef.current) {
      const iframe = iframeRef.current
      // Reload the iframe by changing its src
      iframe.src = `/skulpt-runner.html?t=${Date.now()}`
    }
  }

  // Toggle between Brython and Skulpt
  const toggleEngine = () => {
    setUseSkulpt(!useSkulpt)
    setIframeReady(false)
    setIframeError(null)
    setLastOutput(null)
    onOutput(`Переключение на ${!useSkulpt ? "Skulpt" : "Brython"}...`)
  }

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data

      if (data.type === "python_ready") {
        console.log("Python iframe is ready")
        setIframeReady(true)
        setIframeError(null)

        // Only update output with ready message if we're not showing execution results
        if (!lastOutput) {
          onOutput(`Интерпретатор Python готов к использованию`)
        }
      } else if (data.type === "execution_result") {
        console.log("Received execution result")
        setLastOutput(data.output || "Нет вывода")
        onOutput(data.output || "Нет вывода")
        setIsRunning(false)
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [onOutput, lastOutput])

  // Initialize iframe when useSkulpt changes
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = `/skulpt-runner.html?t=${Date.now()}`
    }

    // Set a timeout to check if iframe is ready after a reasonable time
    const timeoutId = setTimeout(() => {
      if (!iframeReady && !iframeError) {
        setIframeError("Timeout waiting for Python to initialize. Try reloading.")
        onOutput("Ошибка: Python не инициализировался в течение ожидаемого времени. Попробуйте перезагрузить.")
      }
    }, 5000)

    return () => clearTimeout(timeoutId)
  }, [iframeReady, iframeError, onOutput])

  const handleRunCode = () => {
    if (!iframeReady || !iframeRef.current) {
      onOutput("Ошибка: Python не готов. Пожалуйста, перезагрузите интерпретатор.")
      return
    }

    setIsRunning(true)
    setLastOutput(null)
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
    setIsRunning(false)
    onOutput("Выполнение программы остановлено (примечание: в текущей реализации код продолжает выполняться в фоне)")
  }

  const loadExample = (exampleKey: string) => {
    if (examples[exampleKey as keyof typeof examples]) {
      setCode(examples[exampleKey as keyof typeof examples])
    }
  }

  // Handle tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget

    // Handle Tab key
    if (e.key === "Tab") {
      e.preventDefault()

      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      // Insert 4 spaces at cursor position
      const newText = code.substring(0, start) + "    " + code.substring(end)
      setCode(newText)

      // Move cursor after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4
      }, 0)
    }

    // Handle Enter key for auto-indentation
    if (e.key === "Enter") {
      const start = textarea.selectionStart
      const currentLine = code.substring(0, start).split("\n").pop() || ""

      // Check if the current line ends with a colon (like "if condition:" or "for i in range(10):")
      if (currentLine.trim().endsWith(":")) {
        e.preventDefault()

        // Get the indentation of the current line
        const indentMatch = currentLine.match(/^\s*/)
        const currentIndent = indentMatch ? indentMatch[0] : ""
        const additionalIndent = "    " // 4 spaces for additional indentation

        // Insert new line with increased indentation
        const newText = code.substring(0, start) + "\n" + currentIndent + additionalIndent + code.substring(start)
        setCode(newText)

        // Move cursor to the indented position
        setTimeout(() => {
          const newPosition = start + 1 + currentIndent.length + additionalIndent.length
          textarea.selectionStart = textarea.selectionEnd = newPosition
        }, 0)
      }
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <Tabs defaultValue="editor" className="w-full">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="editor">Редактор</TabsTrigger>
            <TabsTrigger value="examples">Примеры</TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="mt-0">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="font-mono w-full min-h-[300px] p-4 bg-muted rounded-md text-sm"
                spellCheck={false}
              />

              {/* Status indicator */}
              {!iframeReady && (
                <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 p-2 text-sm flex justify-between items-center">
                  <span>
                    {iframeError ? `Ошибка Python: ${iframeError}` : `Загрузка Python... Пожалуйста, подождите.`}
                  </span>
                  <Button variant="outline" size="sm" onClick={reloadIframe} className="ml-2">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Перезагрузить
                  </Button>
                </div>
              )}

              {/* Engine indicator */}

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
          </TabsContent>
          <TabsContent value="examples" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto py-2 justify-start flex-col items-start"
                onClick={() => loadExample("basic")}
              >
                <span className="font-bold">Простой пример</span>
                <span className="text-xs text-left mt-1">Базовый пример с использованием print()</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-2 justify-start flex-col items-start"
                onClick={() => loadExample("input")}
              >
                <span className="font-bold">Ввод данных</span>
                <span className="text-xs text-left mt-1">Пример использования функции input()</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-2 justify-start flex-col items-start"
                onClick={() => loadExample("loop")}
              >
                <span className="font-bold">Циклы</span>
                <span className="text-xs text-left mt-1">Пример использования циклов for</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-2 justify-start flex-col items-start"
                onClick={() => loadExample("conditional")}
              >
                <span className="font-bold">Условные операторы</span>
                <span className="text-xs text-left mt-1">Пример использования if-elif-else</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-2 justify-start flex-col items-start"
                onClick={() => loadExample("list")}
              >
                <span className="font-bold">Списки</span>
                <span className="text-xs text-left mt-1">Пример работы со списками</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hidden iframe that runs Python */}
      <iframe
        ref={iframeRef}
        src={`/skulpt-runner.html`}
        style={{ width: "100%", height: "0", border: "none" }}
        title="Python Runner"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  )
}

