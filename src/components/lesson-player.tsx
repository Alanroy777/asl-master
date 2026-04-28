
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, CheckCircle, RefreshCcw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { completeLesson, generateQuizForLesson } from '@/app/lib/actions'
import { useRouter } from 'next/navigation'

interface Sign {
    id: string
    word: string
    description: string | null
    videoUrl: string
}

interface Lesson {
    id: string
    title: string
    signs: Sign[]
}

export default function LessonPlayer({ lesson }: { lesson: any }) {
    const router = useRouter()
    const [currentSignIndex, setCurrentSignIndex] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false) // Finished signs
    const [isPending, startTransition] = useTransition()

    // Quiz State
    const [quizMode, setQuizMode] = useState(false)
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(false)
    const [questions, setQuestions] = useState<any[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<{ questionId: string, answerId: string }[]>([])
    const [quizResult, setQuizResult] = useState<{ score: number, xp: number } | null>(null)

    const currentSign = lesson.signs[currentSignIndex]
    const progress = quizMode
        ? 50 + ((currentQuestionIndex / (questions.length || 1)) * 50)
        : ((currentSignIndex + 1) / lesson.signs.length) * 50

    const handleNext = async () => {
        if (currentSignIndex < lesson.signs.length - 1) {
            setCurrentSignIndex(prev => prev + 1)
        } else {
            setIsCompleted(true)
            await startQuiz()
        }
    }

    const startQuiz = async () => {
        setIsLoadingQuiz(true)
        try {
            const result = await generateQuizForLesson(lesson.id)

            if (result.success && result.questions && result.questions.length > 0) {
                setQuestions(result.questions)
                setQuizMode(true)
            } else {
                // If no quiz generated (e.g. not enough signs), just complete the lesson
                handleCompleteLesson(100)
            }
        } catch (error) {
            console.error("Quiz generation failed", error)
            handleCompleteLesson(100) // Fallback
        } finally {
            setIsLoadingQuiz(false)
        }
    }

    const handlePrevious = () => {
        if (quizMode) {
            if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(prev => prev - 1)
            } else {
                setQuizMode(false)
                setIsCompleted(false)
            }
        } else if (currentSignIndex > 0) {
            setCurrentSignIndex(prev => prev - 1)
            setIsCompleted(false)
        }
    }

    const handleAnswerSelect = (questionId: string, answerId: string) => {
        setAnswers(prev => {
            const others = prev.filter(a => a.questionId !== questionId)
            return [...others, { questionId, answerId }]
        })
    }

    const handleQuizNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1)
        } else {
            // Calculate Score
            let correctCount = 0
            questions.forEach(q => {
                const answer = answers.find(a => a.questionId === q.id)
                const correctOption = q.answers.find((opt: any) => opt.isCorrect)
                if (answer && answer.answerId === correctOption.id) {
                    correctCount++
                }
            })
            const score = Math.round((correctCount / questions.length) * 100)
            handleCompleteLesson(score)
        }
    }

    const handleCompleteLesson = (score: number) => {
        startTransition(async () => {
            try {
                const result = await completeLesson(lesson.id, score)
                if (result.success) {
                    setQuizResult({ score, xp: result.xpEarned || 0 })
                }
            } catch (error) {
                console.error("Lesson completion failed", error)
            }
        })
    }

    if (quizResult) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in zoom-in duration-300">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-20 w-20" />
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl font-bold tracking-tight">Lesson Completed!</h2>
                    <div className="flex items-center justify-center gap-8 text-lg">
                        <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl min-w-[120px]">
                            <span className="font-bold text-3xl">{quizResult.score}%</span>
                            <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Accuracy</span>
                        </div>
                        <div className="flex flex-col items-center p-4 bg-muted/50 rounded-xl min-w-[120px]">
                            <span className="font-bold text-3xl">+{quizResult.xp}</span>
                            <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">XP Earned</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 mt-8">
                    <Link href={lesson.levelId ? `/learn/unit/${lesson.levelId}` : '/learn'}>
                        <Button variant="outline" size="lg" className="min-w-[140px]">Back to Unit</Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button size="lg" className="min-w-[140px]">Dashboard</Button>
                    </Link>
                </div>
            </div>
        )
    }

    if (isLoadingQuiz) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground">Generating Quiz...</p>
            </div>
        )
    }

    if (quizMode && questions.length > 0) {
        const question = questions[currentQuestionIndex]
        const currentAnswer = answers.find(a => a.questionId === question.id)?.answerId
        const isLastQuestion = currentQuestionIndex === questions.length - 1

        return (
            <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-in slide-in-from-right-8 duration-300">
                {/* Progress Bar */}
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-8">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-in-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <span className="text-muted-foreground font-medium">
                        Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                </div>

                <Card className="border-2">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">{question.text}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Video / Image Prompt */}
                        {question.videoUrl && (() => {
                            const url = question.videoUrl
                            if (url.endsWith('.gif') || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.webp')) {
                                return (
                                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-lg flex items-center justify-center">
                                        <img src={url} alt="Sign" className="w-full h-full object-contain" />
                                    </div>
                                )
                            }
                            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                return (
                                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-lg">
                                        <iframe
                                            src={url.replace('watch?v=', 'embed/')}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                )
                            }
                            return (
                                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-lg">
                                    <video key={url} src={url} className="w-full h-full object-contain" controls autoPlay playsInline />
                                </div>
                            )
                        })()}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {question.answers.map((ans: any) => (
                                <Button
                                    key={ans.id}
                                    variant={currentAnswer === ans.id ? "secondary" : "outline"}
                                    className={`w-full justify-start h-auto py-6 px-6 text-lg transition-all 
                                        ${currentAnswer === ans.id
                                            ? 'bg-primary/10 text-primary border-2 border-primary hover:bg-primary/15'
                                            : 'hover:bg-muted hover:border-primary/50'
                                        }`}
                                    onClick={() => handleAnswerSelect(question.id, ans.id)}
                                >
                                    <div className="flex items-center w-full">
                                        <div className={`mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold
                                            ${currentAnswer === ans.id
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-muted-foreground text-muted-foreground'
                                            }`}>
                                            {String.fromCharCode(65 + question.answers.indexOf(ans))}
                                        </div>
                                        {ans.text}
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end pt-2 pb-6 px-6">
                        <Button
                            size="lg"
                            disabled={!currentAnswer || isPending}
                            onClick={handleQuizNext}
                            className="w-full md:w-auto min-w-[140px]"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLastQuestion ? "Finish Quiz" : "Next Question"}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // Default Lesson Player UI (Signs)
    if (!currentSign) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
            <div className="text-5xl mb-2">📭</div>
            <h2 className="text-xl font-bold">No Signs in This Lesson</h2>
            <p className="text-muted-foreground">The instructor hasn't added any signs to this lesson yet.</p>
        <Link href={lesson.levelId ? `/learn/unit/${lesson.levelId}` : '/learn'}><Button variant="outline">Back to Unit</Button></Link>
        </div>
    )

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between">
                <Link href={lesson.levelId ? `/learn/unit/${lesson.levelId}` : '/learn'}>
                    <Button variant="ghost" size="sm">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Unit
                    </Button>
                </Link>
                <div className="text-sm text-muted-foreground">
                    Sign {currentSignIndex + 1} of {lesson.signs.length}
                </div>
            </div>

            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {/* Main Video Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="aspect-video bg-black flex items-center justify-center relative overflow-hidden shadow-xl rounded-xl border-0">
                        {currentSign.videoUrl ? (() => {
                            const url = currentSign.videoUrl
                            // GIF or image
                            if (url.endsWith('.gif') || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.webp')) {
                                return (
                                    <img
                                        key={url}
                                        src={url}
                                        alt={currentSign.word}
                                        className="w-full h-full object-contain"
                                    />
                                )
                            }
                            // YouTube
                            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                return (
                                    <iframe
                                        src={url.replace('watch?v=', 'embed/')}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                )
                            }
                            // Direct video file
                            return (
                                <video
                                    key={url}
                                    src={url}
                                    className="w-full h-full object-contain"
                                    controls
                                    autoPlay
                                    playsInline
                                />
                            )
                        })() : (
                            <div className="text-white text-center">
                                <p className="text-2xl font-bold mb-2">No Video Available</p>
                            </div>
                        )}
                    </Card>

                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => { /* Toggle Play */ }}>
                                <RefreshCcw className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={handlePrevious}
                                disabled={currentSignIndex === 0}
                                className="min-w-[100px]"
                            >
                                Previous
                            </Button>

                            <Button onClick={handleNext} size="lg" className="min-w-[140px]">
                                {currentSignIndex < lesson.signs.length - 1 ?
                                    <>Next <ChevronRight className="ml-2 h-4 w-4" /></> :
                                    "Start Quiz"
                                }
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-4">
                    <Card className="h-full border-none shadow-none bg-transparent md:bg-card md:border md:shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-5xl font-extrabold text-primary tracking-tight">{currentSign.word}</CardTitle>
                            <CardDescription className="text-lg font-medium text-foreground/80 mt-2">Lesson: {lesson.title}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert">
                                <p className="text-lg leading-relaxed text-muted-foreground">
                                    {currentSign.description || "Watch the video carefully and mimic the hand movements. Pay attention to facial expressions as well."}
                                </p>
                            </div>
                            <div className="mt-8 flex flex-col gap-2">
                                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</div>
                                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 w-fit">
                                    {currentSign.category || 'General'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

