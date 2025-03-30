"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Home() {
  const router = useRouter()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null)

  const topics = [
    { id: "if-else", name: "If-Else" },
    { id: "loops", name: "Циклы" },
    { id: "lists", name: "Списки" },
    { id: "functions", name: "Функции" },
    { id: "strings", name: "Методы строк" },
  ]

  const difficulties = [1, 2, 3, 4, 5]

  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId)
  }

  const handleDifficultySelect = (level: number) => {
    setSelectedDifficulty(level)
  }

  const handleStart = () => {
    if (selectedTopic && selectedDifficulty) {
      router.push(`/task?topic=${selectedTopic}&difficulty=${selectedDifficulty}`)
    }
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <header className="flex justify-end mb-8">
          <div className="grid grid-cols-2 gap-4">
            <Link href="/login">
              <Button className="w-full h-16">
                Вход
              </Button>
            </Link>
            <Link href="/register">
              <Button className="w-full h-16">
                Регистрация
              </Button>
            </Link>
          </div>
      </header>
      <h1 className="text-3xl font-bold mb-8 text-center">Выбор задачи</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Выберите тему</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {topics.map((topic) => (
              <Button
                key={topic.id}
                variant={selectedTopic === topic.id ? "default" : "outline"}
                className="w-full h-16"
                onClick={() => handleTopicSelect(topic.id)}
              >
                {topic.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Выберите сложность</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {difficulties.map((level) => (
              <Button
                key={level}
                variant={selectedDifficulty === level ? "default" : "outline"}
                className="w-full h-16"
                onClick={() => handleDifficultySelect(level)}
              >
                {level}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTopic && selectedDifficulty && (
        <div className="flex justify-center mt-8">
          <Button size="lg" className="px-8 py-6 text-lg" onClick={handleStart}>
            Старт
          </Button>
        </div>
      )}
            <div className="mt-8 text-center">
        <Link href="/compiler">
          <Button variant="outline">Открыть отдельный компилятор Python</Button>
        </Link>
      </div>
      
    </main>
  )
}

