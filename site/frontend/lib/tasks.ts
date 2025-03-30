interface Task {
  title: string
  description: string
}

// Sample tasks database
const tasks: Record<string, Record<string, Task>> = {
  "if-else": {
    "1": {
      title: "Проверка числа",
      description:
        "Напишите программу, которая проверяет, является ли введенное число положительным, отрицательным или нулем.",
    },
    "2": {
      title: "Четное или нечетное",
      description: "Напишите программу, которая определяет, является ли введенное число четным или нечетным.",
    },
    // More tasks...
  },
  loops: {
    "1": {
      title: "Сумма чисел",
      description:
        "Напишите программу, которая вычисляет сумму чисел от 1 до N, где N - введенное пользователем число.",
    },
    "2": {
      title: "Таблица умножения",
      description: "Напишите программу, которая выводит таблицу умножения для введенного числа.",
    },
    // More tasks...
  },
  lists: {
    "1": {
      title: "Максимальное число",
      description: "Напишите программу, которая находит максимальное число в списке.",
    },
    "2": {
      title: "Обратный порядок",
      description: "Напишите программу, которая выводит элементы списка в обратном порядке.",
    },
    // More tasks...
  },
  functions: {
    "1": {
      title: "Простая функция",
      description: "Напишите функцию, которая принимает имя и возвращает приветствие.",
    },
    "2": {
      title: "Факториал",
      description: "Напишите функцию для вычисления факториала числа.",
    },
    // More tasks...
  },
  strings: {
    "1": {
      title: "Подсчет символов",
      description: "Напишите программу, которая подсчитывает количество гласных и согласных букв в строке.",
    },
    "2": {
      title: "Палиндром",
      description: "Напишите программу, которая проверяет, является ли строка палиндромом.",
    },
    // More tasks...
  },
}

// Default task when no specific topic or difficulty is selected
const defaultTask: Task = {
  title: "Пример задачи",
  description: "Выберите тему и сложность на главной странице, чтобы получить конкретную задачу.",
}

export function getTask(topic: string | null, difficulty: string | null): Task {
  if (!topic && !difficulty) {
    return defaultTask
  }

  if (topic && difficulty && tasks[topic]?.[difficulty]) {
    return tasks[topic][difficulty]
  }

  if (topic) {
    // Return the first task of the selected topic
    const topicTasks = tasks[topic]
    if (topicTasks) {
      const firstDifficulty = Object.keys(topicTasks)[0]
      return topicTasks[firstDifficulty]
    }
  }

  if (difficulty) {
    // Return a task of the selected difficulty from the first topic
    const firstTopic = Object.keys(tasks)[0]
    if (tasks[firstTopic]?.[difficulty]) {
      return tasks[firstTopic][difficulty]
    }
  }

  return defaultTask
}

