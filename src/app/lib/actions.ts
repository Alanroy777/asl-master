'use server'

import { signIn, signOut, auth } from '@/auth'
import { AuthError } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
// --- Authentication Actions ---

const SignupSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
})

export async function signup(prevState: string | null | undefined, formData: FormData) {
    const validation = SignupSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!validation.success) {
        return 'Invalid input'
    }

    const { name, email, password } = validation.data

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return 'Email already in use.'
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                profile: {
                    create: {
                        learningGoal: 'Get started with ASL',
                        experienceLevel: 'BEGINNER',
                    }
                }
            },
        })

        // Auto-login after signup is not directly supported by server actions nicely without redirect
        // We will let the frontend redirect to login
        return null; // Success
    } catch (error) {
        console.error('Signup error:', error)
        return 'Failed to create account.'
    }
}

export async function authenticate(prevState: string | null | undefined, formData: FormData) {
    try {
        console.log("Attempting login for:", formData.get('email'))
        await signIn('credentials', formData)
    } catch (error) {
        if (error instanceof AuthError) {
            console.error("AuthError:", error.type)
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.'
                default:
                    return 'Something went wrong.'
            }
        }
        console.error("Login error:", error)
        throw error
    }
}

export async function logout() {
    await signOut({ redirectTo: '/' })
}

// --- Curriculum & Progress Actions ---

export async function getDashboardStats(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            profile: true,
            lessonProgress: true,
            practiceSessions: true
        }
    })

    if (!user || !user.profile) return null

    // Approximate generic stats if not fully implemented
    const signsLearned = await prisma.userSignProgress.count({
        where: { userId: user.id }
    })

    // Calculate level based on XP (simple formula: level = floor(sqrt(xp/100)))
    const currentLevel = Math.floor(Math.sqrt(user.profile.totalXP / 100)) + 1

    // Calculate progress to next level
    const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100
    const xpForNextLevel = Math.pow(currentLevel, 2) * 100
    const progressToNextLevel = Math.min(100, Math.max(0,
        ((user.profile.totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
    ))

    const completedLessons = await prisma.userLessonProgress.count({
        where: { userId: user.id, completed: true }
    })

    const totalLessons = await prisma.lesson.count()

    return {
        name: user.name || 'Learner',
        totalXP: user.profile.totalXP,
        currentStreak: user.profile.currentStreak,
        signsLearned: signsLearned,
        level: currentLevel,
        progressToNextLevel,
        completedLessons,
        totalLessons
    }
}

export async function getLevels() {
    const session = await auth()
    
    // Define visibility filter
    const visibilityFilter = async () => {
        if (!session?.user?.id) return { createdById: null }
        
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, role: true, tutorId: true }
        })

        if (!user) return { createdById: null }
        if (user.role === 'ADMIN') return {} // Admins see everything

        const allowedIds: string[] = []
        if (user.role === 'INSTRUCTOR') allowedIds.push(user.id)
        if (user.role === 'LEARNER' && user.tutorId) allowedIds.push(user.tutorId)

        return {
            OR: [
                { createdById: null },
                { createdById: { in: allowedIds } }
            ]
        }
    }

    const filter = await visibilityFilter()

    return await prisma.level.findMany({
        where: filter,
        include: {
            lessons: {
                where: filter,
                orderBy: { orderIndex: 'asc' }
            }
        },
        orderBy: { orderIndex: 'asc' }
    })
}

export async function getLesson(slug: string) {
    const session = await auth()
    
    const lesson = await prisma.lesson.findUnique({
        where: { slug },
        include: {
            signs: {
                orderBy: { orderIndex: 'asc' }
            },
            quiz: {
                include: {
                    questions: {
                        include: {
                            answers: true
                        }
                    }
                }
            }
        }
    })

    if (!lesson) return null
    if (!lesson.createdById) return lesson // Global content

    // Authorization check for tutor-specific content
    if (!session?.user?.id) return null
    
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, tutorId: true }
    })

    if (!user) return null
    if (user.role === 'ADMIN') return lesson
    if (user.id === lesson.createdById) return lesson
    if (user.role === 'LEARNER' && user.tutorId === lesson.createdById) return lesson

    return null // Not authorized to view this tutor's lesson
}






export async function logPracticeSession(signId: string, accuracy: number) {
    const session = await auth()
    if (!session?.user?.email) return

    // We need the user ID
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { profile: true }
    })
    if (!user) return

    // 1. Log the session
    console.log(`Logging practice session for user ${user.email}, sign ${signId}, accuracy ${accuracy}`)
    await prisma.practiceSession.create({
        data: {
            userId: user.id,
            signId,
            durationSeconds: 30, // simulated
            accuracy: accuracy
        }
    })

    // 2. Update stats on Profile (Analytics)
    // We update atomically
    await prisma.profile.update({
        where: { userId: user.id },
        data: {
            totalPracticeSessions: { increment: 1 },
            totalPracticeTime: { increment: 30 },
            // Moving average for accuracy: NewAvg = OldAvg + (NewVal - OldAvg) / NewCount
            // But Prisma doesn't support that complex math in one atomic query easily mixed with relation logic,
            // so we'll do a simple approximation or fetch-calc-update.
            // For robustness, let's just increment totals and Recalculate average on display or periodically?
            // Let's do fetch-update for now.
            lastActiveDate: new Date()
        }
    })

    // 3. Update Sign Mastery Logic
    // Fetch current progress
    const signProgress = await prisma.userSignProgress.findUnique({
        where: { userId_signId: { userId: user.id, signId } }
    })

    const currentAttempts = (signProgress?.practiceAttempts || 0) + 1

    // Weighted Average Calculation
    // New Score = (OldScore * (N-1) + NewAccuracy) / N 
    // Wait, let's weight recent attempts more.
    // Simple Exponential Moving Average (EMA): NewMastery = Alpha * NewAccuracy + (1-Alpha) * OldMastery
    // Alpha = 0.3 (allows faster updates)
    const oldMastery = signProgress?.masteryScore || 0
    const newMasteryScore = (signProgress ? (0.3 * accuracy + 0.7 * oldMastery) : accuracy)

    let newMasteryLevel: 'WEAK' | 'IMPROVING' | 'STRONG' | 'MASTERED' = 'WEAK'
    if (newMasteryScore >= 90) newMasteryLevel = 'MASTERED'
    else if (newMasteryScore >= 70) newMasteryLevel = 'STRONG'
    else if (newMasteryScore >= 40) newMasteryLevel = 'IMPROVING'

    await prisma.userSignProgress.upsert({
        where: { userId_signId: { userId: user.id, signId } },
        update: {
            practiceAttempts: { increment: 1 },
            masteryScore: newMasteryScore,
            masteryLevel: newMasteryLevel,
            lastPracticedAt: new Date()
        },
        create: {
            userId: user.id,
            signId,
            practiceAttempts: 1,
            masteryScore: accuracy,
            masteryLevel: newMasteryLevel, // Initial level
            lastPracticedAt: new Date()
        }
    })

    // XP for practice
    const xpEarned = 10

    // Create XP Log
    await prisma.xPLog.create({
        data: {
            userId: user.id,
            amount: xpEarned,
            source: 'PRACTICE'
        }
    })

    await prisma.profile.update({
        where: { userId: user.id },
        data: { totalXP: { increment: xpEarned } }
    })

    revalidatePath('/dashboard')
}

// ... (Rest of existing actions: submitQuiz, etc.)

export async function submitQuiz(lessonId: string, userAnswers: { questionId: string, answerId: string }[]) {
    const session = await auth()
    if (!session?.user?.email) return { success: false, error: "Unauthorized" }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return { success: false, error: "User not found" }

    // Fetch quiz and correct answers
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
            quiz: {
                include: {
                    questions: {
                        include: { answers: true }
                    }
                }
            }
        }
    })

    if (!lesson || !lesson.quiz) {
        return { success: false, error: "Quiz not found" }
    }

    const quiz = lesson.quiz
    let correctCount = 0
    const totalQuestions = quiz.questions.length || 1

    // Calculate Score
    userAnswers.forEach(ans => {
        const question = quiz.questions.find(q => q.id === ans.questionId)
        if (question) {
            const correctAnswer = question.answers.find(a => a.isCorrect)
            if (correctAnswer && correctAnswer.id === ans.answerId) {
                correctCount++
            }
        }
    })

    const score = Math.round((correctCount / totalQuestions) * 100)
    const passed = score >= 70

    // Save Attempt
    await prisma.userQuizAttempt.create({
        data: {
            userId: user.id,
            quizId: quiz.id,
            score,
            passed
        }
    })

    // Handle Completion & Rewards
    let xpEarned = 0
    if (passed) {
        // Mark lesson complete (Reuse existing logic or update directly)
        await prisma.userLessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: user.id,
                    lessonId: lesson.id
                }
            },
            update: {
                completed: true,
                completedAt: new Date(),
                score: Math.max(score, 0) // Keep max score? Na, just update
            },
            create: {
                userId: user.id,
                lessonId: lesson.id,
                completed: true,
                completedAt: new Date(),
                score: score
            }
        })

        // Bonus XP
        const xpAmount = 20
        xpEarned = xpAmount

        await prisma.xPLog.create({
            data: {
                userId: user.id,
                amount: xpAmount,
                source: 'LESSON_COMPLETE'
            }
        })

        await prisma.profile.update({
            where: { userId: user.id },
            data: { totalXP: { increment: xpAmount } }
        })
    }

    revalidatePath('/learn')
    return { success: true, passed, score, xp: xpEarned }
}

export async function getLevelLessons(levelId: string) {
    // We need to fetch lessons AND their locked status for the current user
    const session = await auth()
    const userId = session?.user?.id

    let tutorId: string | null = null
    let isAdmin = false

    if (userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { tutorId: true, role: true }
        })
        tutorId = user?.tutorId || null
        isAdmin = user?.role === 'ADMIN'
    }

    const lessons = await prisma.lesson.findMany({
        where: { 
            levelId,
            ...(isAdmin ? {} : {
                OR: [
                    { createdById: null },
                    ...(tutorId ? [{ createdById: tutorId }] : []),
                    { createdById: userId } // If they are the instructor
                ]
            })
        },
        orderBy: { orderIndex: 'asc' },
        include: {
            userProgress: userId ? {
                where: { userId }
            } : false,
            signs: true,
            lessonSigns: true
        }
    })

    // Post-process to determine locked state
    // A lesson is locked if the PREVIOUS lesson is not completed.
    // First lesson of a level is unlocked if the level is unlocked (assuming linear levels for now, or just unlocked)

    // For simplicity: Lesson N is locked if Lesson N-1 is not complete.
    // Also, we need to know if the Level itself is locked? (not implemented yet, assumed open)

    const processedLessons = lessons.map((lesson, index) => {
        // @ts-ignore
        const isCompleted = lesson.userProgress?.[0]?.completed || false
        let isLocked = lesson.isLockedDefault

        if (index === 0) {
            isLocked = false // First lesson always open
        } else {
            const prevLesson = lessons[index - 1]
            // @ts-ignore
            const prevCompleted = prevLesson.userProgress?.[0]?.completed || false
            if (prevCompleted) {
                isLocked = false
            }
        }

        return {
            ...lesson,
            isCompleted,
            isLocked
        }
    })

    return processedLessons
}


// --- Dictionary Actions ---

export async function searchSigns(query: string) {
    if (!query || query.length < 1) return []

    const signs = await prisma.signsLibrary.findMany({
        where: {
            name: {
                contains: query,
                mode: 'insensitive'
            }
        },
        orderBy: { name: 'asc' },
        take: 10
    })

    return signs.map(s => ({
        ...s,
        word: s.name // Map to legacy property name expected by SignCard
    }))
}

export async function getSignDetails(signId: string) {
    const session = await auth()
    const userId = session?.user?.id

    const sign = await prisma.signsLibrary.findUnique({
        where: { id: signId },
        include: {
            userProgress: userId ? {
                where: { userId }
            } : false
        }
    })

    if (!sign) return null

    return {
        ...sign,
        isMastered: sign.userProgress[0]?.mastered || false,
        masteryLevel: sign.userProgress[0]?.masteryLevel || 'WEAK'
    }
}

export async function getWeakSigns(limit: number = 10) {
    const session = await auth()
    if (!session?.user?.email) return []

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return []

    const weakSigns = await prisma.userSignProgress.findMany({
        where: {
            userId: user.id,
            masteryLevel: { in: ['WEAK', 'IMPROVING'] }
        },
        include: {
            sign: true
        },
        orderBy: { lastPracticedAt: 'asc' },
        take: limit
    })

    return weakSigns.map(p => ({
        ...p.sign,
        word: p.sign.name,
        video_url: p.sign.videoUrl, // map for practice studio
        isMastered: p.mastered,
        masteryLevel: p.masteryLevel,
        masteryScore: p.masteryScore
    }))
}

export async function getRecommendedReview(limit: number = 10) {
    const session = await auth()
    if (!session?.user?.email) return []

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return []

    // Fetch signs the user has practiced that are currently in WEAK or IMPROVING status
    const progress = await prisma.userSignProgress.findMany({
        where: { 
            userId: user.id, 
            masteryLevel: { in: ['WEAK', 'IMPROVING'] } 
        },
        include: { sign: true },
        orderBy: { lastPracticedAt: 'asc' },
        take: limit
    })

    return progress.map(p => ({
        ...p.sign,
        word: p.sign.name,
        video_url: p.sign.videoUrl,
        isMastered: p.mastered,
        masteryLevel: p.masteryLevel,
        masteryScore: p.masteryScore,
        isNew: false
    }))
}

export async function getAllLearnedSigns(limit: number = 20) {
    const session = await auth()
    if (!session?.user?.email) return []

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return []

    // Fetch ANY signs the user has progress on (Mastered, Strong, Improving, or Weak)
    const progress = await prisma.userSignProgress.findMany({
        where: { userId: user.id },
        include: { sign: true },
        orderBy: { lastPracticedAt: 'desc' },
        take: limit
    })

    return progress.map(p => ({
        ...p.sign,
        word: p.sign.name,
        video_url: p.sign.videoUrl,
        isMastered: p.mastered,
        masteryLevel: p.masteryLevel,
        masteryScore: p.masteryScore,
        isNew: false
    }))
}

export async function getVocabularyStats() {
    const session = await auth()
    if (!session?.user?.email) return null

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return null

    const stats = await prisma.userSignProgress.groupBy({
        by: ['masteryLevel'],
        where: { userId: user.id },
        _count: {
            signId: true
        }
    })

    const totalLearned = await prisma.userSignProgress.count({
        where: { userId: user.id }
    })

    const signsList = await prisma.userSignProgress.findMany({
        where: { userId: user.id },
        include: { sign: true }
    })

    const categorizedSigns = {
        WEAK: signsList.filter(s => s.masteryLevel === 'WEAK').map(s => s.sign),
        IMPROVING: signsList.filter(s => s.masteryLevel === 'IMPROVING').map(s => s.sign),
        STRONG: signsList.filter(s => s.masteryLevel === 'STRONG').map(s => s.sign),
        MASTERED: signsList.filter(s => s.masteryLevel === 'MASTERED').map(s => s.sign),
    }

    return {
        totalLearned,
        byLevel: stats.reduce((acc, curr) => {
            acc[curr.masteryLevel] = curr._count.signId
            return acc
        }, {} as Record<string, number>),
        categorizedSigns
    }
}

export async function getDictionaryCategories() {
    const categories = await prisma.signsLibrary.groupBy({
        by: ['category'],
        _count: {
            category: true
        }
    })
    return categories.map(c => ({ name: c.category, count: c._count.category }))
}

// --- Profile Actions ---

export async function updateProfile(formData: FormData) {
    const session = await auth()
    if (!session?.user?.email) return "Not authenticated"

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const ageStr = formData.get('age') as string
    const email = formData.get('email') as string

    if (!name || name.length < 2) {
        return "Name must be at least 2 characters."
    }

    if (!email || !email.includes('@')) {
        return "Please provide a valid email."
    }

    const age = ageStr ? parseInt(ageStr, 10) : null

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: { 
                name,
                email,
                phone: phone || null,
                age: age && !isNaN(age) ? age : null
            } as any
        })
    } catch (error) {
        console.error("Update Profile Error:", error)
        return "Failed to update profile or email already in use."
    }
    
    revalidatePath('/profile')
    redirect('/profile')
}

export async function getUserProfileStats(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            profile: true
        }
    })

    if (!user) return null

    // Self-healing: Create profile if missing
    if (!user.profile) {
        console.log("Profile missing for user, creating one...")
        await prisma.profile.create({
            data: {
                userId: user.id,
                learningGoal: 'Get started with ASL',
                experienceLevel: 'BEGINNER'
            }
        })
        return getUserProfileStats(email) // Recursive retry once
    }

    return {
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        phone: (user as any).phone,
        age: (user as any).age,
        joinedAt: user.createdAt,
        // Profile Data
        totalXP: user.profile?.totalXP || 0,
        streak: user.profile?.currentStreak || 0,
        level: 1, // Calculate based on XP if needed
        totalPracticeSessions: user.profile?.totalPracticeSessions || 0,
        totalPracticeTime: user.profile?.totalPracticeTime || 0,
        averageAccuracy: user.profile?.averageAccuracy || 0,
    }
}

/**
 * Fetch statistics specific to an instructor
 */
export async function getInstructorProfileStats(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) return null

    const totalStudents = await prisma.user.count({
        where: { role: 'LEARNER' } // Simple count of all learners for now
    })

    const totalLessons = await prisma.lesson.count()

    const totalCertificates = 0 // Placeholder for now

    return {
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        phone: (user as any).phone,
        age: (user as any).age,
        joinedAt: user.createdAt,
        // Instructor Stats
        totalStudents,
        totalLessons,
        totalCertificates,
    }
}


// --- Lesson Data Action ---

export async function getLessonData(lessonId: string) {
    const session = await auth()
    const userId = session?.user?.id

    // Try finding by ID first, then by slug
    const lesson = await prisma.lesson.findFirst({
        where: {
            OR: [
                { id: lessonId },
                { slug: lessonId }
            ]
        },
        include: {
            signs: {
                orderBy: { orderIndex: 'asc' }
            },
            // Also fetch library-linked lesson signs
            lessonSigns: {
                orderBy: { orderIndex: 'asc' },
                include: {
                    librarySign: true
                }
            },
            quiz: {
                include: {
                    questions: {
                        include: { answers: true },
                        orderBy: { orderIndex: 'asc' }
                    }
                }
            },
            userProgress: userId ? {
                where: { userId }
            } : false
        }
    })

    if (!lesson) return null

    // Merge legacy signs + library lesson signs into a unified array for the player
    const legacySigns = lesson.signs.map((s: any) => ({
        id: s.id,
        word: s.word,
        description: s.description ?? null,
        videoUrl: s.videoUrl,
        category: s.category ?? 'General',
        source: 'legacy' as const,
    }))

    const librarySigns = (lesson.lessonSigns as any[]).map((ls) => {
        const name = ls.useLibrary && ls.librarySign ? ls.librarySign.name : 'Custom Sign'
        const videoUrl = ls.useLibrary ? ls.librarySign?.videoUrl : ls.customVideoUrl
        return {
            id: ls.id,
            word: name,
            description: ls.useLibrary && ls.librarySign ? `${ls.librarySign.category?.replace('_', ' ')} · ${ls.librarySign.difficulty}` : null,
            videoUrl: videoUrl ?? '',
            category: ls.useLibrary && ls.librarySign ? ls.librarySign.category : 'Custom',
            source: 'library' as const,
        }
    })

    const allSigns = [...legacySigns, ...librarySigns]

    return {
        ...lesson,
        signs: allSigns,
        isCompleted: lesson.userProgress?.[0]?.completed || false,
        totalSigns: allSigns.length
    }
}

// --- Curriculum Creation Actions (Instructor Only) ---

export async function createLevel(prevState: any, formData: FormData) {
    const session = await auth()
    // @ts-ignore
    const role = session?.user?.role
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const orderIndex = parseInt(formData.get('orderIndex') as string)

    if (!title || isNaN(orderIndex)) {
        return { success: false, message: 'Invalid input' }
    }

    try {
        await prisma.level.create({
            data: {
                title,
                description,
                orderIndex,
                createdById: session.user.id
            }
        })
        revalidatePath('/instructor/curriculum')
        revalidatePath('/learn') // Update learner view too
        return { success: true, message: 'Level created successfully' }
    } catch (error) {
        console.error('Create Level Error:', error)
        return { success: false, message: 'Failed to create level' }
    }
}

export async function createLesson(prevState: any, formData: FormData) {
    const session = await auth()
    // @ts-ignore
    const role = session?.user?.role
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    const title = formData.get('title') as string
    const levelId = formData.get('levelId') as string
    const description = formData.get('description') as string || ''
    const orderIndex = parseInt(formData.get('orderIndex') as string)
    const xpReward = parseInt(formData.get('xpReward') as string)
    const isLockedDefault = formData.get('isLockedDefault') === 'on'
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7)

    if (!title || !levelId || isNaN(orderIndex) || isNaN(xpReward)) {
        return { success: false, message: 'Invalid input' }
    }

    try {
        await prisma.lesson.create({
            data: {
                title,
                description,
                slug,
                levelId,
                orderIndex,
                xpReward,
                isLockedDefault,
                createdById: session.user.id
            }
        })
        revalidatePath('/instructor/curriculum')
        revalidatePath('/learn')
        return { success: true, message: 'Lesson created successfully' }
    } catch (error) {
        console.error('Create Lesson Error:', error)
        return { success: false, message: 'Failed to create lesson' }
    }
}

export async function createSign(prevState: any, formData: FormData) {
    const session = await auth()
    // @ts-ignore
    const role = session?.user?.role
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    const word = formData.get('word') as string
    const videoUrl = formData.get('videoUrl') as string
    const lessonId = formData.get('lessonId') as string
    const description = formData.get('description') as string || null
    const category = formData.get('category') as string
    const difficulty = parseInt(formData.get('difficulty') as string) || 1

    if (!word || !videoUrl || !lessonId) {
        return { success: false, message: 'Missing required fields' }
    }

    try {
        // Get current sign count for order
        const count = await prisma.sign.count({ where: { lessonId } })

        await prisma.sign.create({
            data: {
                word,
                description,
                videoUrl,
                lessonId,
                category: category || 'General',
                difficulty: (difficulty || 1) as any,
                orderIndex: count
            }
        })
        revalidatePath('/instructor/curriculum')
        revalidatePath('/dictionary')
        return { success: true, message: 'Sign created successfully' }
    } catch (error) {
        console.error('Create Sign Error:', error)
        return { success: false, message: 'Failed to create sign' }
    }
}

export async function deleteSign(signId: string) {
    const session = await auth()
    // @ts-ignore
    const role = session?.user?.role
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        await prisma.sign.delete({
            where: { id: signId }
        })
        revalidatePath('/instructor/curriculum')
        revalidatePath('/dictionary')
        return { success: true, message: 'Sign deleted successfully' }
    } catch (error) {
        console.error('Delete Sign Error:', error)
        return { success: false, message: 'Failed to delete sign' }
    }
}

export async function updateSign(prevState: any, formData: FormData) {
    const session = await auth()
    // @ts-ignore
    const role = session?.user?.role
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    const id = formData.get('id') as string
    const word = formData.get('word') as string
    const videoUrl = formData.get('videoUrl') as string
    const description = formData.get('description') as string || null
    const category = formData.get('category') as string
    const difficulty = parseInt(formData.get('difficulty') as string) || 1

    if (!id || !word || !videoUrl) {
        return { success: false, message: 'Missing required fields' }
    }

    try {
        await prisma.sign.update({
            where: { id },
            data: {
                word,
                description,
                videoUrl,
                category: category || 'General',
                difficulty: (difficulty || 1) as any,
            }
        })
        revalidatePath('/instructor/curriculum')
        revalidatePath('/dictionary')
        return { success: true, message: 'Sign updated successfully' }
    } catch (error) {
        console.error('Update Sign Error:', error)
        return { success: false, message: 'Failed to update sign' }
    }
}


// --- Level Actions ---

export async function deleteLevel(levelId: string) {
    const session = await auth()
    // @ts-ignore
    const role = session?.user?.role
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        await prisma.level.delete({
            where: { id: levelId }
        })
        revalidatePath('/instructor/curriculum')
        revalidatePath('/learn')
        return { success: true, message: 'Level deleted successfully' }
    } catch (error) {
        console.error('Delete Level Error:', error)
        return { success: false, message: 'Failed to delete level' }
    }
}

export async function updateLevel(prevState: any, formData: FormData) {
    const session = await auth()
    // @ts-ignore
    const role = session?.user?.role
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const orderIndex = parseInt(formData.get('orderIndex') as string)

    if (!id || !title || isNaN(orderIndex)) {
        return { success: false, message: 'Invalid input' }
    }

    try {
        await prisma.level.update({
            where: { id },
            data: {
                title,
                description,
                orderIndex
            }
        })
        revalidatePath('/instructor/curriculum')
        revalidatePath('/learn')
        return { success: true, message: 'Level updated successfully' }
    } catch (error) {
        console.error('Update Level Error:', error)
        return { success: false, message: 'Failed to update level' }
    }
}

// --- Profile Image Actions ---


/**
 * Update user's profile image URL
 */
export async function updateProfileImage(imageUrl: string) {
    const session = await auth()
    if (!session?.user?.email) return { success: false, message: 'Unauthorized' }

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: { image: imageUrl }
        })
        revalidatePath('/profile')
        return { success: true, message: 'Profile picture updated!' }
    } catch (error) {
        console.error('Update Profile Image Error:', error)
        return { success: false, message: 'Failed to update profile picture.' }
    }
}

// --- Lesson Actions ---

export async function deleteLesson(lessonId: string) {
    const session = await auth()
    // @ts-ignore
    const role = session?.user?.role
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        await prisma.lesson.delete({
            where: { id: lessonId }
        })
        revalidatePath('/instructor/curriculum')
        revalidatePath('/learn')
        return { success: true, message: 'Lesson deleted successfully' }
    } catch (error) {
        console.error('Delete Lesson Error:', error)
        return { success: false, message: 'Failed to delete lesson' }
    }
}

export async function updateLesson(prevState: any, formData: FormData) {
    const session = await auth()
    // @ts-ignore
    const role = session?.user?.role
    if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const orderIndex = parseInt(formData.get('orderIndex') as string)
    const xpReward = parseInt(formData.get('xpReward') as string)
    const isLockedDefault = formData.get('isLockedDefault') === 'on'

    if (!id || !title || isNaN(orderIndex) || isNaN(xpReward)) {
        return { success: false, message: 'Invalid input' }
    }

    try {
        await prisma.lesson.update({
            where: { id },
            data: {
                title,
                description,
                orderIndex,
                xpReward,
                isLockedDefault
            }
        })
        revalidatePath('/instructor/curriculum')
        revalidatePath('/learn')
        return { success: true, message: 'Lesson updated successfully' }
    } catch (error) {
        console.error('Update Lesson Error:', error)
        return { success: false, message: 'Failed to update lesson' }
    }
}

// --- Quiz & Progress Actions ---

export async function generateQuizForLesson(lessonId: string) {
    const session = await auth()
    if (!session?.user) return { success: false, message: 'Unauthorized' }

    try {
        // 1. Get lesson with BOTH legacy signs and library lesson signs
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                signs: true,
                lessonSigns: {
                    include: { librarySign: true }
                }
            }
        })

        if (!lesson) return { success: false, message: 'Lesson not found' }

        // 2. Normalize all signs into a unified format
        const legacySigns = lesson.signs.map(s => ({
            id: s.id,
            word: s.word,
            videoUrl: s.videoUrl,
            source: 'legacy' as const,
        }))

        const librarySigns = lesson.lessonSigns
            .filter(ls => ls.useLibrary && ls.librarySign)
            .map(ls => ({
                id: ls.id, // use the LessonSign id as the unique key
                word: ls.librarySign!.name,
                videoUrl: ls.librarySign!.videoUrl,
                source: 'library' as const,
            }))

        const allLessonSigns = [...legacySigns, ...librarySigns]

        if (allLessonSigns.length < 1) {
            return { success: false, message: 'Not enough signs to generate a quiz.' }
        }

        // 3. Build distractor pool
        // For legacy-sourced lessons, pull from Sign table
        // For library-sourced lessons, pull from SignsLibrary table
        let distractorPool: { id: string; word: string }[] = []

        if (legacySigns.length > 0) {
            const rawDistractors = await prisma.sign.findMany({
                where: { videoUrl: { not: '' } },
                take: 100,
                select: { id: true, word: true }
            })
            distractorPool = rawDistractors
        }

        if (librarySigns.length > 0) {
            const rawLibDistractors = await prisma.signsLibrary.findMany({
                where: { videoUrl: { not: '' } },
                take: 100,
                select: { id: true, name: true }
            })
            // Merge, avoiding duplicates
            distractorPool = [
                ...distractorPool,
                ...rawLibDistractors.map(d => ({ id: d.id, word: d.name }))
            ]
        }

        // 4. Generate Questions — one per sign in the lesson
        const questions = allLessonSigns.map((sign, index) => {
            // Exclude this sign from distractors
            const potentialDistractors = distractorPool.filter(d =>
                d.id !== sign.id && d.word.toLowerCase() !== sign.word.toLowerCase()
            )

            const wrongOptions = potentialDistractors
                .sort(() => 0.5 - Math.random())
                .slice(0, 3)

            // If not enough distractors, pad with dummy options
            while (wrongOptions.length < 3) {
                wrongOptions.push({ id: `dummy-${wrongOptions.length}`, word: `Option ${wrongOptions.length + 1}` })
            }

            const options = [...wrongOptions, { id: sign.id, word: sign.word }]
                .sort(() => 0.5 - Math.random())

            return {
                id: `q-${index}`,
                text: `What sign is this?`,
                videoUrl: sign.videoUrl,
                answers: options.map(opt => ({
                    id: opt.id,
                    text: opt.word,
                    isCorrect: opt.id === sign.id
                }))
            }
        })

        return { success: true, questions }
    } catch (error) {
        console.error('Generate Quiz Error:', error)
        return { success: false, message: 'Failed to generate quiz' }
    }
}

export async function completeLesson(lessonId: string, score: number) {
    const session = await auth()
    if (!session?.user?.email) return { success: false, message: 'Unauthorized' }

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (!user) return { success: false, message: 'User not found' }

        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
        if (!lesson) return { success: false, message: 'Lesson not found' }

        // Check if already completed
        const existingProgress = await prisma.userLessonProgress.findUnique({
            where: {
                userId_lessonId: {
                    userId: user.id,
                    lessonId: lessonId
                }
            }
        })

        let xpEarned = 0
        if (!existingProgress?.completed) {
            xpEarned = lesson.xpReward

            // Mark as completed
            await prisma.userLessonProgress.upsert({
                where: { userId_lessonId: { userId: user.id, lessonId: lessonId } },
                update: {
                    completed: true,
                    completedAt: new Date(),
                    score: Math.max(score, existingProgress?.score || 0),
                    attempts: { increment: 1 }
                },
                create: {
                    userId: user.id,
                    lessonId: lessonId,
                    completed: true,
                    completedAt: new Date(),
                    score,
                    attempts: 1
                }
            })

            // Award XP
            await prisma.profile.update({
                where: { userId: user.id },
                data: {
                    totalXP: { increment: xpEarned },
                    // Simplified streak logic: Update lastActiveDate
                    lastActiveDate: new Date()
                }
            })
        } else {
            // Just update score/attempts if replaying
            await prisma.userLessonProgress.update({
                where: { userId_lessonId: { userId: user.id, lessonId: lessonId } },
                data: {
                    score: Math.max(score, existingProgress.score),
                    attempts: { increment: 1 }
                }
            })
        }

        revalidatePath('/dashboard')
        revalidatePath('/learn')
        return { success: true, xpEarned, message: 'Lesson completed!' }
    } catch (error) {
        console.error('Complete Lesson Error:', error)
        return { success: false, message: 'Failed to complete lesson' }
    }
}


export async function getRecentActivity(limit: number = 5) {
    const session = await auth()
    if (!session?.user?.email) {
        console.log("getRecentActivity: No session")
        return []
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return []

    // Fetch XP Logs as they represent activity
    const logs = await prisma.xPLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
    })

    console.log(`getRecentActivity: Found ${logs.length} logs for user ${user.email}`)

    return logs.map(log => {
        let title = "Earned XP"
        let type: 'lesson' | 'practice' | 'streak' | 'other' = 'other'

        if (log.source === 'LESSON_COMPLETE') {
            title = "Completed Lesson"
            type = 'lesson'
        } else if (log.source === 'PRACTICE') {
            title = "Practice Session"
            type = 'practice'
        } else if (log.source === 'STREAK_BONUS') {
            title = "Daily Streak"
            type = 'streak'
        } else if (log.source === 'QUIZ_BONUS') {
            title = "Aced Quiz"
            type = 'lesson'
        }

        return {
            id: log.id,
            title,
            description: `+${log.amount} XP`,
            type,
            date: log.createdAt
        }
    })
}

// --- Admin Actions ---

export async function getAdminStats() {
    const session = await auth()
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') return null

    const totalUsers = await prisma.user.count()
    const roleStats = await prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
    })
    
    let totalLearners = 0;
    let totalInstructors = 0;
    let totalAdmins = 0;

    roleStats.forEach(stat => {
        if (stat.role === 'LEARNER') totalLearners += stat._count.role;
        else if (stat.role === 'INSTRUCTOR' || stat.role === ('TEACHER' as any)) totalInstructors += stat._count.role;
        else if (stat.role === 'ADMIN') totalAdmins += stat._count.role;
    })

    const totalLessons = await prisma.lesson.count()
    const totalSigns = await prisma.sign.count()
    const totalPracticeSessions = await prisma.practiceSession.count()

    const avgAccuracyAgg = await prisma.profile.aggregate({
        _avg: { averageAccuracy: true }
    })
    const averageAccuracy = Math.round(avgAccuracyAgg._avg.averageAccuracy || 0)

    return {
        totalUsers,
        totalLearners,
        totalInstructors,
        totalAdmins,
        totalLessons,
        totalSigns,
        totalPracticeSessions,
        averageAccuracy
    }
}

export async function getAllUsers() {
    const session = await auth()
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') return []

    return await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            profile: {
                select: {
                    totalXP: true,
                    learningGoal: true
                }
            },
            tutorId: true,
            tutor: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function updateUserRole(userId: string, newRole: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN') {
    const session = await auth()
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') return { success: false, message: 'Unauthorized' }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { role: newRole }
        })
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error("Failed to update user role", error)
        return { success: false, message: 'Failed to update role' }
    }
}

export async function deleteUser(userId: string) {
    const session = await auth()
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') return { success: false, message: 'Unauthorized' }

    if (session?.user?.id === userId) {
        return { success: false, message: 'Cannot delete yourself' }
    }

    try {
        await prisma.user.delete({
            where: { id: userId }
        })
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete user", error)
        return { success: false, message: 'Failed to delete user' }
    }
}

export async function createInstructor(prevState: any, formData: FormData) {
    const session = await auth()
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') return "Unauthorized"

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = (formData.get('phone') as string) || null
    const address = (formData.get('address') as string) || null
    const qualification = (formData.get('qualification') as string) || null
    const background = (formData.get('background') as string) || null

    if (!name || !email) {
        return "Invalid input. Name and email are required."
    }

    // --- Step 1: Create user in DB ---
    let userId: string
    const generatedPassword = crypto.randomBytes(5).toString('hex')

    try {
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) return "An account with this email already exists."

        const hashedPassword = await bcrypt.hash(generatedPassword, 10)
        const newId = crypto.randomUUID()

        // Use raw SQL to insert all fields including new ones (avoids stale Prisma client type issues)
        await prisma.$executeRaw`
            INSERT INTO "User" (id, name, email, password, phone, address, qualification, background, role, "createdAt", "updatedAt")
            VALUES (${newId}, ${name}, ${email}, ${hashedPassword}, ${phone}, ${address}, ${qualification}, ${background}, 'INSTRUCTOR', now(), now())
        `

        // Create the linked profile
        await prisma.$executeRaw`
            INSERT INTO "Profile" (id, "userId", "lastActiveDate", "totalXP", "currentStreak", "longestStreak", "totalPracticeSessions", "totalPracticeTime", "averageAccuracy", "experienceLevel")
            VALUES (${crypto.randomUUID()}, ${newId}, now(), 0, 0, 0, 0, 0, 0, 'BEGINNER')
        `

        userId = newId
        console.log("✅ Instructor created:", email)
    } catch (error) {
        console.error("❌ Create instructor DB error:", error)
        return "Failed to create instructor. Please check the server logs."
    }

    // --- Step 2: Send welcome email ---
    try {
        const htmlEmail = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 40px; margin: 0;">
    <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #18181b; margin-top: 0;">Welcome to ASL Learning!</h2>
        <p style="color: #52525b; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        <p style="color: #52525b; line-height: 1.6;">An administrator has created an instructor account for you on the ASL Learning Platform.</p>
        <div style="background-color: #f4f4f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #52525b;"><strong>Login URL:</strong> ${process.env.NEXTAUTH_URL}/login</p>
            <p style="margin: 0 0 10px 0; color: #52525b;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0; color: #52525b;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 16px; font-weight: bold; color: #18181b; letter-spacing: 2px;">${generatedPassword}</span></p>
        </div>
        <p style="color: #52525b; line-height: 1.6; font-size: 14px;">Please change your password after your first login.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
        <p style="color: #a1a1aa; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} ASL Learning Platform. All rights reserved.</p>
    </div>
</body>
</html>`

        await createSmtpTransporter().sendMail({
            from: `"ASL Learning Admin" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: "Your ASL Learning Instructor Account",
            html: htmlEmail,
        })
        console.log("✅ Welcome email sent to:", email)
    } catch (emailError) {
        console.error("❌ Email send error:", emailError)
        // Account was created successfully — don't fail the whole operation, just warn
        revalidatePath('/admin/users')
        return "Instructor created but email failed to send. Please check SMTP settings."
    }

    revalidatePath('/admin/users')
    return null // full success
}

export async function logFingerspellingScore(gameType: 'TIME_TRIAL' | 'WORD_SPELL', score: number, mistakes: number = 0) {
    const session = await auth()
    if (!session?.user?.email) return { success: false, message: 'Unauthorized' }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })
    if (!user) return { success: false, message: 'User not found' }

    try {
        await prisma.fingerspellingRecord.create({
            data: {
                userId: user.id,
                gameType,
                score,
                mistakes
            }
        })

        // Award some XP
        const xpAmount = gameType === 'TIME_TRIAL' ? 50 : 25
        await prisma.profile.update({
            where: { userId: user.id },
            data: { totalXP: { increment: xpAmount } }
        })

        await prisma.xPLog.create({
            data: {
                userId: user.id,
                amount: xpAmount,
                source: `GAME_${gameType}`
            }
        })

        revalidatePath('/dashboard')
        revalidatePath('/games/fingerspelling')
        return { success: true }
    } catch (error) {
        console.error("Failed to log fingerspelling score", error)
        return { success: false, message: 'Failed to save score' }
    }
}

// --- Tutor/Learner Assignment Actions ---

export async function getInstructors() {
    const session = await auth()
    if (!session?.user?.email) return []

    // Check if admin (optional strict check)
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (user?.role !== 'ADMIN') return []

    return await prisma.user.findMany({
        where: { role: 'INSTRUCTOR' },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
    })
}

export async function assignTutor(learnerId: string, tutorId: string | null) {
    const session = await auth()
    if (!session?.user?.email) return { success: false, message: 'Unauthorized' }

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (admin?.role !== 'ADMIN') return { success: false, message: 'Forbidden' }

    try {
        await prisma.user.update({
            where: { id: learnerId },
            data: { tutorId }
        })
        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error("Failed to assign tutor", error)
        return { success: false, message: 'Failed to assign tutor' }
    }
}

/**
 * Fetch statistics specific to an admin
 */
export async function getAdminProfileStats(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) return null

    const totalUsers = await prisma.user.count()
    const totalSigns = await (prisma as any).signsLibrary.count()
    const totalPracticeSessions = await prisma.practiceSession.count()

    return {
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        phone: (user as any).phone,
        joinedAt: user.createdAt,
        // Admin Stats
        totalUsers,
        totalSigns,
        totalPracticeSessions,
    }
}

/**
 * Updates a sign's landmark blueprint (used for AI detection)
 */
export async function updateSignBlueprint(signId: string, landmarks: number[], angles: number[]) {
    try {
        await prisma.signsLibrary.update({
            where: { id: signId },
            data: {
                landmarkBlueprint: {
                    landmarks: Array.from(landmarks),
                    angles: Array.from(angles),
                    capturedAt: new Date().toISOString()
                }
            }
        })
        return { success: true }
    } catch (error) {
        console.error("Failed to update sign blueprint", error)
        return { success: false, message: 'Failed to update blueprint' }
    }
}

/**
 * Fetches all alphabet signs from the centralized library including AI blueprints
 */
export async function getAlphabetsWithBlueprints() {
    try {
        const alphabets = await prisma.signsLibrary.findMany({
            where: { category: 'alphabet' },
            orderBy: { name: 'asc' }
        })
        
        return alphabets.map(s => ({
            id: s.id,
            name: s.name,
            videoUrl: s.videoUrl,
            blueprint: s.landmarkBlueprint
        }))
    } catch (error) {
        console.error("Failed to fetch alphabets", error)
        return []
    }
}


