"use client"

import { MouseEvent as ReactMouseEvent, useRef, useState } from "react"
import Image from "next/image"
import { motion, useMotionValue, useSpring, type PanInfo } from "framer-motion"
import { MoveLeft, MoveRight } from "lucide-react"

import { cn } from "~/lib/utils"
import { imagesUrls } from "~/app/constant/data"

const START_INDEX = 0
const DRAG_THRESHOLD = 150
const FALLBACK_WIDTH = 509

const CURSOR_SIZE = 80

export default function SuggestedCarousel() {
  const containerRef = useRef<HTMLUListElement>(null)
  const itemsRef = useRef<(HTMLLIElement | null)[]>([])
  const [activeSlide, setActiveSlide] = useState(START_INDEX)
  const canScrollPrev = activeSlide > 0
  const canScrollNext = activeSlide < imagesUrls.length - 1
  const offsetX = useMotionValue(0)
  const animatedX = useSpring(offsetX, {
    damping: 100,
    stiffness: 350,
  })

  const [isDragging, setIsDragging] = useState(false)
  function handleDragSnap(
    _: MouseEvent,
    { offset: { x: dragOffset } }: PanInfo,
  ) {
    setIsDragging(false)
    containerRef.current?.removeAttribute("data-dragging")

    animatedX.stop()

    const currentOffset = offsetX.get()

    if (
      Math.abs(dragOffset) < DRAG_THRESHOLD ||
      (!canScrollPrev && dragOffset > 0) ||
      (!canScrollNext && dragOffset < 0)
    ) {
      animatedX.set(currentOffset)
      return
    }

    let offsetWidth = 0
    for (
      let i = activeSlide;
      dragOffset > 0 ? i >= 0 : i < itemsRef.current.length;
      dragOffset > 0 ? i-- : i++
    ) {
      const item = itemsRef.current[i]
      if (item === null) continue
      const itemOffset = item.offsetWidth

      const prevItemWidth =
        itemsRef.current[i - 1]?.offsetWidth ?? FALLBACK_WIDTH
      const nextItemWidth =
        itemsRef.current[i + 1]?.offsetWidth ?? FALLBACK_WIDTH

      if (
        (dragOffset > 0 && dragOffset > offsetWidth + itemOffset && i > 1) ||
        (dragOffset < 0 &&
          dragOffset < offsetWidth + -itemOffset &&
          i < itemsRef.current.length - 2)
      ) {
        dragOffset > 0
          ? (offsetWidth += prevItemWidth)
          : (offsetWidth -= nextItemWidth)
        continue
      }

      if (dragOffset > 0) {
        //prev
        offsetX.set(currentOffset + offsetWidth + prevItemWidth)
        setActiveSlide(i - 1)
      } else {
        //next
        offsetX.set(currentOffset + offsetWidth - nextItemWidth)
        setActiveSlide(i + 1)
      }
      break
    }
  }

  function scrollPrev() {
    if (!canScrollPrev) return

    const nextWidth = itemsRef.current
      .at(activeSlide - 1)
      ?.getBoundingClientRect().width
    if (nextWidth === undefined) return
    offsetX.set(offsetX.get() + nextWidth)

    setActiveSlide((prev) => prev - 1)
  }
  function scrollNext() {
    if (!canScrollNext) return

    const nextWidth = itemsRef.current
      .at(activeSlide + 1)
      ?.getBoundingClientRect().width
    if (nextWidth === undefined) return
    offsetX.set(offsetX.get() - nextWidth)

    setActiveSlide((prev) => prev + 1)
  }

  const [hoverType, setHoverType] = useState<"prev" | "next" | "click" | null>(
    null,
  )
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function navButtonHover({
    currentTarget,
    clientX,
    clientY,
  }: ReactMouseEvent<HTMLButtonElement, MouseEvent>) {
    const parent = currentTarget.offsetParent
    if (!parent) return
    const { left: parentLeft, top: parentTop } = parent.getBoundingClientRect()

    const { left, top, width, height } = currentTarget.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2

    const offsetFromCenterX = clientX - centerX
    const offsetFromCenterY = clientY - centerY

    mouseX.set(left - parentLeft + offsetFromCenterX / 4)
    mouseY.set(top - parentTop + offsetFromCenterY / 4)
  }

  return (
    <>
      <div className="left-space-container group relative mx-24 my-16">
        <div className="overflow-hidden">
          <div className="absolute right-6 top-4 flex items-center gap-5 sm:right-10 md:right-12 md:gap-4 lg:right-16 xl:right-24">
            <button
              type="button"
              className={cn(
                "group z-20 grid aspect-square !h-0 !w-0 place-content-center rounded-full transition-colors md:!h-6 md:!w-12",
                {
                  "bg-[#2E3324]": activeSlide === 0,
                  "bg-[#434B34]": activeSlide !== 0,
                },
              )}
              style={{
                width: CURSOR_SIZE,
                height: CURSOR_SIZE,
              }}
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              onMouseEnter={() => setHoverType("prev")}
              onMouseMove={(e) => navButtonHover(e)}
              onMouseLeave={() => setHoverType(null)}
            >
              <span className="sr-only">Previous Guide</span>
              <MoveLeft className="h-4 w-4 stroke-[3.5] transition-colors group-enabled:group-hover:text-gray-900 group-disabled:opacity-50" />
            </button>
            <p className="text-sm text-gray-500">
              {activeSlide + 1}/{imagesUrls.length}
            </p>
            <button
              type="button"
              className={cn(
                "group z-20 grid aspect-square !h-0 !w-0 place-content-center rounded-full transition-colors md:!h-6 md:!w-12",
                {
                  "bg-[#434B34]": activeSlide === imagesUrls.length - 1,
                  "bg-[#2E3324]": activeSlide !== imagesUrls.length - 1,
                },
              )}
              style={{
                width: CURSOR_SIZE,
                height: CURSOR_SIZE,
              }}
              onClick={scrollNext}
              disabled={!canScrollNext}
              onMouseEnter={() => setHoverType("next")}
              onMouseMove={(e) => navButtonHover(e)}
              onMouseLeave={() => setHoverType(null)}
            >
              <span className="sr-only">Next Guide</span>
              <MoveRight className="h-4 w-4 stroke-[3.5] transition-colors group-enabled:group-hover:text-gray-900 group-disabled:opacity-50" />
            </button>
          </div>
          <motion.ul
            ref={containerRef}
            className={cn("flex items-start")}
            style={{
              x: animatedX,
            }}
            drag="x"
            dragConstraints={{
              left: -(FALLBACK_WIDTH * (imagesUrls.length - 1)),
              right: FALLBACK_WIDTH,
            }}
            onMouseMove={({ currentTarget, clientX, clientY }) => {
              const parent = currentTarget.offsetParent
              if (!parent) return
              const { left, top } = parent.getBoundingClientRect()
              mouseX.set(clientX - left - CURSOR_SIZE / 2)
              mouseY.set(clientY - top - CURSOR_SIZE / 2)
            }}
            onDragStart={() => {
              containerRef.current?.setAttribute("data-dragging", "true")
              setIsDragging(true)
            }}
            onDragEnd={handleDragSnap}
          >
            {imagesUrls.map((url, index) => {
              const active = index === activeSlide
              return (
                <motion.li
                  layout
                  key={index}
                  ref={(el) => (itemsRef.current[index] = el)}
                  className={cn(
                    "group relative shrink-0 select-none px-3 transition-opacity duration-300",
                    !active && "opacity-100",
                    !active && "top-28 sm:top-36 md:top-40 xl:top-72",
                  )}
                  transition={{
                    ease: "easeInOut",
                    duration: 0.4,
                  }}
                  style={{
                    flexBasis: active ? "80%" : "30%",
                  }}
                >
                  <div
                    className={cn(
                      "grid place-content-center overflow-hidden rounded-2xl",
                      active
                        ? "mt-4 aspect-[5/3]"
                        : "aspect-[4/3] h-[200px] md:h-[350px] lg:h-[380px]",
                    )}
                  >
                    <Image
                      src={url}
                      width={1200}
                      height={70}
                      priority
                      alt={`img${index}`}
                      className="h-[300px] w-[1050px] rounded-2xl md:h-auto"
                    />
                  </div>
                </motion.li>
              )
            })}
          </motion.ul>
        </div>
      </div>
    </>
  )
}
