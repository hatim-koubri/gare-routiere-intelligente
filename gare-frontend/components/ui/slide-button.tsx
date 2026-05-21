"use client"

import React, {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
  type SpringOptions,
} from "framer-motion"
import { Check, Loader2, SendHorizontal, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/components/ui/Button"

const DRAG_CONSTRAINTS = { left: 0, right: 280 }
const DRAG_THRESHOLD = 0.85

const BUTTON_STATES = {
  initial: { width: "100%" },
  completed: { width: "100%" },
}

const ANIMATION_CONFIG = {
  spring: {
    type: "spring" as const,
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  } as SpringOptions,
}

type StatusIconProps = {
  status: string
}

const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  const iconMap: Record<string, JSX.Element> = useMemo(
    () => ({
      loading: <Loader2 className="animate-spin" size={20} />,
      success: <Check size={20} />,
      error: <X size={20} />,
    }),
    []
  )

  if (!iconMap[status]) return null

  return (
    <motion.div
      key={crypto.randomUUID()}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
    >
      {iconMap[status]}
    </motion.div>
  )
}

const useButtonStatus = (resolveTo: "success" | "error", onComplete?: () => void) => {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")

  const handleSubmit = useCallback(() => {
    setStatus("loading")
    setTimeout(() => {
      setStatus(resolveTo)
      if (resolveTo === "success" && onComplete) {
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 2000)
  }, [resolveTo, onComplete])

  return { status, handleSubmit }
}

interface SlideButtonProps extends ButtonProps {
  onSuccess?: () => void;
  buttonText?: string;
}

const SlideButton = forwardRef<HTMLButtonElement, SlideButtonProps>(
  ({ className, onSuccess, buttonText = "Glissez pour payer", ...props }, ref) => {
    const [isDragging, setIsDragging] = useState(false)
    const [completed, setCompleted] = useState(false)
    const dragHandleRef = useRef<HTMLDivElement | null>(null)
    const { status, handleSubmit } = useButtonStatus("success", onSuccess)

    const dragX = useMotionValue(0)
    const springX = useSpring(dragX, ANIMATION_CONFIG.spring)
    const dragProgress = useTransform(
      springX,
      [0, DRAG_CONSTRAINTS.right],
      [0, 1]
    )

    const handleDragStart = useCallback(() => {
      if (completed || props.disabled) return
      setIsDragging(true)
    }, [completed, props.disabled])

    const handleDragEnd = () => {
      if (completed) return
      setIsDragging(false)

      const progress = dragProgress.get()
      if (progress >= DRAG_THRESHOLD) {
        if (props.disabled) {
          dragX.set(0)
          return
        }
        setCompleted(true)
        handleSubmit()
      } else {
        dragX.set(0)
      }
    }

    const handleDrag = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (completed) return
      const newX = Math.max(0, Math.min(info.offset.x, DRAG_CONSTRAINTS.right))
      dragX.set(newX)
    }

    const adjustedWidth = useTransform(springX, (x) => x + 10)

    return (
      <motion.div
        animate={completed ? BUTTON_STATES.completed : BUTTON_STATES.initial}
        transition={ANIMATION_CONFIG.spring}
        className="relative flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-lg overflow-hidden"
      >
        {!completed && (
          <motion.div
            style={{
              width: adjustedWidth,
            }}
            className="absolute inset-y-0 left-0 z-0 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 shadow-lg"
          />
        )}
        
        <span className="relative z-10 text-sm font-medium text-gray-500 dark:text-gray-400 select-none px-4">
          {buttonText}
        </span>

        <AnimatePresence>
          {!completed && (
            <motion.div
              ref={dragHandleRef}
              drag="x"
              dragConstraints={DRAG_CONSTRAINTS}
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              style={{ x: springX }}
              className="absolute -left-4 z-20 flex cursor-grab items-center justify-start active:cursor-grabbing"
            >
              <Button
                ref={ref}
                disabled={status === "loading"}
                size="icon"
                {...props}
                className={cn(
                  "h-12 w-12 rounded-full bg-white shadow-xl hover:scale-105 transition-transform",
                  isDragging && "scale-105",
                  className
                )}
              >
                <SendHorizontal className="size-5 text-orange-500" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {completed && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                disabled={status === "loading"}
                className="size-full rounded-full bg-transparent hover:bg-transparent"
              >
                <AnimatePresence mode="wait">
                  <StatusIcon status={status} />
                </AnimatePresence>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)

SlideButton.displayName = "SlideButton"

export { SlideButton }