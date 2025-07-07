import React, { createContext, useContext, useEffect, useState } from "react"

const ThemeProviderContext = createContext({
  theme: "system",
  setTheme: () => null,
  dir: "ltr",
  setDir: () => null,
})

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultDir = "ltr",
  themeStorageKey = "vite-ui-theme",
  dirStorageKey = "vite-ui-dir",
  ...props
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(themeStorageKey) || defaultTheme
  )
  const [dir, setDir] = useState(
    () => localStorage.getItem(dirStorageKey) || defaultDir
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    root.setAttribute("dir", dir)
  }, [dir])

  const value = {
    theme,
    setTheme: (theme) => {
      localStorage.setItem(themeStorageKey, theme)
      setTheme(theme)
    },
    dir,
    setDir: (dir) => {
      localStorage.setItem(dirStorageKey, dir)
      setDir(dir)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
