import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Trophy, Flame, Clock, Target, Calendar, Award, Mail, Phone, User as UserIcon, Shield, Activity, Settings, Edit } from "lucide-react"
import { auth } from "@/auth"
import { getUserProfileStats } from "../lib/actions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload"

export default async function ProfilePage() {
    const session = await auth()
    if (!session?.user?.email) redirect('/login')

    const stats = await getUserProfileStats(session.user.email)

    if (!stats) {
        return <div>Profile not found.</div>
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-0">
            {/* Header / Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-xl">
                {/* Banner Background */}
                <div className="h-40 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20"></div>
                
                <div className="px-8 pb-8 -mt-16 flex flex-col md:flex-row items-center md:items-end gap-6">
                    {/* Profile Picture Area */}
                    <div className="relative group">
                        <ProfileImageUpload currentImage={stats.image} />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2 pb-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <h1 className="text-4xl font-extrabold tracking-tight">{stats.name || 'Learner'}</h1>
                            <Badge variant="secondary" className="w-fit mx-auto md:mx-0 bg-primary/10 text-primary border-primary/20 px-3">
                                {stats.role}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                            <Mail className="h-4 w-4" />
                            {stats.email}
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="bg-muted/50 p-1 border border-border rounded-xl mb-6">
                    <TabsTrigger value="overview" className="rounded-lg px-8 data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
                    <TabsTrigger value="account" className="rounded-lg px-8 data-[state=active]:bg-background data-[state=active]:shadow-sm">Account Details</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 outline-none">
                    {/* Stats Highlights */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="hover:border-primary/50 transition-colors shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-yellow-500/10 rounded-2xl">
                                        <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                                    </div>
                                    <Badge variant="outline" className="text-xs">Total</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black">{stats.totalPracticeSessions || 0}</h3>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Sessions</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                                        <Clock className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                                    </div>
                                    <Badge variant="outline" className="text-xs">Active</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black">{Math.round((stats.totalPracticeTime || 0) / 60)}m</h3>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Time</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-green-500/10 rounded-2xl">
                                        <Target className="h-6 w-6 text-green-600 dark:text-green-500" />
                                    </div>
                                    <Badge variant="outline" className="text-xs">Avg</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black">{Math.round(stats.averageAccuracy || 0)}%</h3>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Accuracy</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-orange-500/10 rounded-2xl">
                                        <Flame className="h-6 w-6 text-orange-600 dark:text-orange-500" />
                                    </div>
                                    <Badge variant="outline" className="text-xs">Current</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black">{stats.streak || 0}</h3>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Streak</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6">
                        <Card className="shadow-lg border-primary/10 overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b border-primary/10">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Award className="h-5 w-5 text-primary" />
                                    Current Rank & Mastery
                                </CardTitle>
                                <CardDescription>Your standing in the ASL Learning Community</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 p-8">
                                <div className="flex flex-col md:flex-row items-center gap-12">
                                    <div className="p-8 bg-primary/5 border-2 border-primary/10 rounded-3xl text-center min-w-[240px] relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20 relative z-10">
                                            <Shield className="h-10 w-10 text-white" />
                                        </div>
                                        <h4 className="text-2xl font-black mb-1 relative z-10">Beginner I</h4>
                                        <p className="text-sm text-muted-foreground font-medium relative z-10">XP to next rank: 250</p>
                                    </div>

                                    <div className="flex-1 w-full space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-muted/50 rounded-2xl border border-border">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Rank Title</p>
                                                <p className="font-bold">Novice Signer</p>
                                            </div>
                                            <div className="p-4 bg-muted/50 rounded-2xl border border-border">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Skill Tier</p>
                                                <p className="font-bold">Bronze II</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                <span className="flex items-center gap-2">
                                                    <Activity className="h-3 w-3 text-primary" />
                                                    Level Progress
                                                </span>
                                                <span className="text-primary">65%</span>
                                            </div>
                                            <div className="h-4 w-full bg-secondary rounded-full overflow-hidden p-1 border border-border shadow-inner">
                                                <div className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full w-[65%] transition-all duration-1000 shadow-lg" />
                                            </div>
                                            <p className="text-[10px] text-center text-muted-foreground font-medium">
                                                Earn <span className="text-primary font-bold">120 XP</span> more to reach <span className="text-primary font-bold">Level 12</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ACCOUNT TAB */}
                <TabsContent value="account" className="space-y-6 mt-4 outline-none">
                    <Card className="shadow-xl overflow-hidden">
                        <div className="h-1 bg-indigo-500"></div>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Your account and contact details.</CardDescription>
                            </div>
                            <Link href="/profile/edit">
                                <Button variant="outline" className="rounded-full gap-2 px-6 border-2 border-primary/20 hover:border-primary/50 hover:bg-secondary">
                                    <Edit className="h-4 w-4" />
                                    Edit Profile
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="grid gap-8 p-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                        <UserIcon className="h-3 w-3" /> Full Name
                                    </label>
                                    <p className="text-lg font-semibold">{stats.name || '—'}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Mail className="h-3 w-3" /> Email Address
                                    </label>
                                    <p className="text-lg font-semibold">{stats.email}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Phone className="h-3 w-3" /> Phone Number
                                    </label>
                                    <p className="text-lg font-semibold">{stats.phone || '—'}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Calendar className="h-3 w-3" /> Member Since
                                    </label>
                                    <p className="text-lg font-semibold">{new Date(stats.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
