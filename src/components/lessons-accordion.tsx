'use client'

import { useState } from "react"
import Link from "next/link"
import { CheckCircle, PlayCircle, Lock, ChevronDown } from "lucide-react"

interface Sign {
    id: string
    [key: string]: unknown
}

interface Lesson {
    id: string
    title: string
    slug: string
    isCompleted: boolean
    isLocked: boolean
    signs: Sign[]
}

interface Level {
    title: string
    description?: string | null
}

interface LessonsAccordionProps {
    level: Level
    lessons: Lesson[]
    unitNumber?: number
}

export default function LessonsAccordion({
    level,
    lessons,
    unitNumber = 1,
}: LessonsAccordionProps) {
    const [open, setOpen] = useState(false)

    const totalCount = lessons.length
    const nextLesson = lessons.find(l => !l.isCompleted && !l.isLocked)

    return (
        <div className="rounded-2xl border border-border overflow-hidden shadow-sm">

            {/* ── Unit Header (clickable) ── */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className="w-full text-left relative flex items-center justify-between px-6 py-5 bg-foreground transition-opacity hover:opacity-90 focus:outline-none"
                aria-expanded={open}
            >
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-muted-foreground/40" />

                <div className="pl-3">
                    <h1 className="text-xl font-bold text-background leading-tight">
                        {level.title}
                    </h1>
                    <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-background/20 text-background tracking-widest">
                            UNIT {unitNumber}
                        </span>
                        <span className="text-sm text-background/70 font-medium">
                            {totalCount} {totalCount === 1 ? "chapter" : "chapters"}
                        </span>
                    </div>
                    {level.description && (
                        <p className="text-xs text-background/60 mt-1 max-w-xs">
                            {level.description}
                        </p>
                    )}
                </div>

                {/* Right side: emoji + chevron */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full text-3xl bg-background/15 border border-background/20">
                        👋
                    </div>
                    <ChevronDown
                        className={`h-5 w-5 text-background/70 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                    />
                </div>
            </button>

            {/* ── Collapsible Body ── */}
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
            >
                {/* Continue button row */}
                {nextLesson && (
                    <div className="flex justify-end px-5 pt-3 pb-1 bg-background border-t border-border">
                        <Link href={`/learn/${nextLesson.slug}`}>
                            <button className="text-xs font-bold px-4 py-1.5 rounded-full border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors tracking-widest">
                                CONTINUE
                            </button>
                        </Link>
                    </div>
                )}

                {/* Chapter list */}
                <div className="flex flex-col divide-y divide-border bg-background">
                    {lessons.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">
                            No chapters in this unit yet.
                        </div>
                    ) : (
                        lessons.map((lesson, index) => {
                            const progressPct = lesson.isCompleted ? 100 : 0

                            return (
                                <div
                                    key={lesson.id}
                                    className={`flex items-center gap-5 px-6 py-5 transition-colors
                                        ${lesson.isLocked ? "opacity-50" : "hover:bg-muted/40"}`}
                                >
                                    {/* Left content */}
                                    <div className="flex-1 min-w-0">
                                        <span
                                            className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded"
                                            style={{
                                                backgroundColor: lesson.isCompleted ? "#000" : lesson.isLocked ? "#e5e7eb" : "#f3f4f6",
                                                color: lesson.isCompleted ? "#fff" : lesson.isLocked ? "#9ca3af" : "#374151",
                                            }}
                                        >
                                            CHAPTER {index + 1}
                                        </span>

                                        <h2 className="text-base font-bold mt-1.5 text-foreground leading-snug">
                                            {lesson.title}
                                        </h2>

                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {lesson.isCompleted
                                                ? `${lesson.signs.length} of ${lesson.signs.length} lessons completed`
                                                : `0 of ${lesson.signs.length} lessons completed`}
                                        </p>

                                        {/* Progress bar */}
                                        <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${progressPct}%`, backgroundColor: "#000" }}
                                            />
                                        </div>
                                    </div>

                                    {/* Right action icon */}
                                    <div className="shrink-0">
                                        {lesson.isCompleted ? (
                                            <Link href={`/learn/${lesson.slug}`}>
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground cursor-pointer hover:opacity-80 transition-opacity">
                                                    <CheckCircle className="h-6 w-6 text-background" />
                                                </div>
                                            </Link>
                                        ) : lesson.isLocked ? (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted border border-border">
                                                <Lock className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        ) : (
                                            <Link href={`/learn/${lesson.slug}`}>
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-foreground cursor-pointer hover:bg-foreground hover:text-background transition-all">
                                                    <PlayCircle className="h-6 w-6" />
                                                </div>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
