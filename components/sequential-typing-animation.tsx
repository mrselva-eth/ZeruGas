"use client"

import { useState, useEffect, useCallback } from "react"

interface SequentialTypingAnimationProps {
  headingTexts: string[]
  descriptionTexts: string[]
  headingClassName?: string
  descriptionClassName?: string
  headingCursorClassName?: string
  descriptionCursorClassName?: string
  typingSpeed?: number
  intervalDuration?: number
}

export function SequentialTypingAnimation({
  headingTexts,
  descriptionTexts,
  headingClassName = "",
  descriptionClassName = "",
  headingCursorClassName = "",
  descriptionCursorClassName = "",
  typingSpeed = 100,
  intervalDuration = 2000,
}: SequentialTypingAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [headingText, setHeadingText] = useState("")
  const [descriptionText, setDescriptionText] = useState("")
  const [isTypingHeading, setIsTypingHeading] = useState(true)
  const [isTypingDescription, setIsTypingDescription] = useState(false)
  const [showHeadingCursor, setShowHeadingCursor] = useState(true)
  const [showDescriptionCursor, setShowDescriptionCursor] = useState(false)

  // Get current texts
  const currentHeading = headingTexts[currentIndex % headingTexts.length]
  const currentDescription = descriptionTexts[currentIndex % descriptionTexts.length]

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowHeadingCursor((prev) => !prev)
      setShowDescriptionCursor((prev) => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Reset function for new cycle
  const startNewCycle = useCallback(() => {
    setHeadingText("")
    setDescriptionText("")
    setIsTypingHeading(true)
    setIsTypingDescription(false)
    setShowHeadingCursor(true)
    setShowDescriptionCursor(false)
  }, [])

  // Main animation logic
  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isTypingHeading) {
      // Type heading
      if (headingText.length < currentHeading.length) {
        timeout = setTimeout(() => {
          setHeadingText(currentHeading.slice(0, headingText.length + 1))
        }, typingSpeed)
      } else {
        // Heading complete, wait then start description
        timeout = setTimeout(() => {
          setIsTypingHeading(false)
          setShowHeadingCursor(false)
          setIsTypingDescription(true)
          setShowDescriptionCursor(true)
        }, intervalDuration)
      }
    } else if (isTypingDescription) {
      // Type description
      if (descriptionText.length < currentDescription.length) {
        timeout = setTimeout(() => {
          setDescriptionText(currentDescription.slice(0, descriptionText.length + 1))
        }, typingSpeed)
      } else {
        // Description complete, wait then start next cycle
        timeout = setTimeout(() => {
          setIsTypingDescription(false)
          setShowDescriptionCursor(false)
          setCurrentIndex((prev) => prev + 1)
          // Start new cycle after a pause
          setTimeout(() => {
            startNewCycle()
          }, intervalDuration)
        }, intervalDuration)
      }
    }

    return () => clearTimeout(timeout)
  }, [
    headingText,
    descriptionText,
    isTypingHeading,
    isTypingDescription,
    currentHeading,
    currentDescription,
    typingSpeed,
    intervalDuration,
    startNewCycle,
  ])

  return (
    <div>
      <h1 className={`${headingClassName} min-h-[2.5rem] flex items-center`}>
        {headingText}
        <span
          className={`${headingCursorClassName} transition-opacity duration-100 ${
            (isTypingHeading || (headingText && !isTypingDescription)) && showHeadingCursor
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          |
        </span>
      </h1>
      <div className={`${descriptionClassName} min-h-[1.5rem] flex items-center`}>
        {descriptionText}
        <span
          className={`${descriptionCursorClassName} transition-opacity duration-100 ${
            isTypingDescription && showDescriptionCursor ? "opacity-100" : "opacity-0"
          }`}
        >
          |
        </span>
      </div>
    </div>
  )
}
