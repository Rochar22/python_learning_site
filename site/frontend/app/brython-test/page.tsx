"use client"

import { useEffect, useState } from "react"

export default function BrythonTestPage() {
  const [status, setStatus] = useState("Проверка Brython...")

  useEffect(() => {
    // Check if Brython is available
    if (typeof window !== "undefined") {
      if (window.brython) {
        try {
          window.brython({ debug: 1 })
          setStatus("Brython успешно загружен и инициализирован!")

          // Create a test Python script
          const script = document.createElement("script")
          script.type = "text/python"
          script.textContent = `
from browser import document
document["test-output"].textContent = "Этот текст был создан с помощью Python!"
print("Python script executed successfully")
          `
          document.body.appendChild(script)
        } catch (error) {
          setStatus(`Ошибка инициализации Brython: ${error}`)
        }
      } else {
        setStatus("Brython не загружен. Проверьте консоль браузера для деталей.")
      }
    }
  }, [])

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Тестовая страница Brython</h1>

      <div className="p-4 mb-4 bg-muted rounded-md">
        <h2 className="text-xl font-semibold mb-2">Статус Brython:</h2>
        <p>{status}</p>
      </div>

      <div className="p-4 bg-muted rounded-md">
        <h2 className="text-xl font-semibold mb-2">Вывод Python:</h2>
        <div id="test-output" className="font-mono">
          Ожидание выполнения Python кода...
        </div>
      </div>

      <div className="mt-8">
        <p>Если вы видите текст, созданный с помощью Python выше, значит Brython работает корректно!</p>
        <p className="mt-4">
          <a href="/" className="text-blue-500 hover:underline">
            Вернуться на главную
          </a>
        </p>
      </div>
    </div>
  )
}

