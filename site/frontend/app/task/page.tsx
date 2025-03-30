"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PythonRunner } from "@/components/python-runner"

export default function TaskPage() {
  const searchParams = useSearchParams()
  const topic = searchParams.get("topic")
  const difficulty = searchParams.get("difficulty")

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [task, setTask] = useState<{ title: string; description: string } | null>(null)



  useEffect(() => {
    if (topic || difficulty) {
      async function getTask(topic, difficulty) {
        try {
            console.log(topic, difficulty)
            const response = await fetch("http://127.0.0.1:8000/task/", {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                method: "POST",
                redirect: 'follow',
                body: JSON.stringify({ topic: topic, difficulty: difficulty }),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const result = await response.json(); // Используем response.json()
            return result;
        } catch (err) {
            console.error("Fetch error:", err);
            return null;
        }
    }
        getTask(topic, difficulty).then((data) => {
            if (data) {
                console.log(data.task)
                setTask({description: data.task}); // Устанавливаем состояние с результатом
            }
        });
    }
}, [topic, difficulty]);

  const handleOutput = (outputText: string) => {
    setOutput(outputText)
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Link href="/">
          <Button variant="outline" size="icon" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {task ? task.title : "Задача"}
          {topic && ` (${topic})`}
          {difficulty && ` - Сложность ${difficulty}`}
        </h1>
      </div>

      {task && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Описание задачи</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{task.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Редактор кода</CardTitle>
            </CardHeader>
            <CardContent>
              <PythonRunner onOutput={handleOutput} input={input} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Входные данные</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Введите входные данные для программы..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Вывод</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md whitespace-pre-wrap min-h-[200px] text-sm overflow-auto max-h-[400px]">
                {output || "Здесь будет вывод программы..."}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

