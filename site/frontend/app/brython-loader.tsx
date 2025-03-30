"use client"

import { useEffect, useState } from "react"

export function BrythonLoader() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const initBrython = () => {
        if (window.brython) {
          try {
            console.log("Initializing Brython from BrythonLoader")
            window.brython({ debug: 1 })
            setLoaded(true)
          } catch (error) {
            console.error("Error initializing Brython:", error)
          }
        } else {
          console.warn("Brython not available yet, will retry")
        }
      }

      // Try to initialize after a short delay to ensure scripts are loaded
      const timeoutId = setTimeout(initBrython, 500)

      // Also set up a listener for when scripts might be loaded
      window.addEventListener("load", initBrython)

      // Clean up
      return () => {
        clearTimeout(timeoutId)
        window.removeEventListener("load", initBrython)
      }
    }
  }, [])

  return null
}

