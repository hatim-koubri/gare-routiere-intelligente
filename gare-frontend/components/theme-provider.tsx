"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeCtx = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
})

export const useTheme = () => useContext(ThemeCtx)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("theme") as Theme | null
    if (stored === "light" || stored === "dark") {
      setThemeState(stored)
      document.documentElement.setAttribute("class", stored)
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      const t = prefersDark ? "dark" : "light"
      setThemeState(t)
      document.documentElement.setAttribute("class", t)
    }
  }, [])

  const setTheme = (t: Theme) => {
    setThemeState(t)
    localStorage.setItem("theme", t)
    document.documentElement.setAttribute("class", t)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  )
}
