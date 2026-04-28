
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, Award, Mail, Phone, User as UserIcon, Calendar, Edit, Activity } from "lucide-react"
import { auth } from "@/auth"
import { getInstructorProfileStats } from "../../lib/actions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload"

export default async function InstructorProfilePage() {
    const session = await auth()
    if (!session?.user?.email) redirect('/login')

    const stats = await getInstructorProfileStats(session.user.email)

    if (!stats) {
        return <div>Profile not found.</div>
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-0">
            {/* Header / Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-xl">
                {/* Banner Background */}
                <div className="h-40 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-20"></div>
                
                <div className="px-8 pb-8 -mt-16 flex flex-col md:flex-row items-center md:items-end gap-6">
                    {/* Profile Picture Area */}
                    <div className="relative group">
                        <ProfileImageUpload currentImage={stats.image} />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2 pb-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <h1 className="text-4xl font-extrabold tracking-tight">{stats.name || 'Instructor'}</h1>
                            <Badge variant="secondary" className="w-fit mx-auto md:mx-0 bg-blue-500/10 text-blue-600 border-blue-500/20 px-3">
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
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="hover:border-blue-500/50 transition-colors shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <Badge variant="outline" className="text-xs">Active</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black">{stats.totalStudents || 0}</h3>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Total Students</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-indigo-500/50 transition-colors shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                        <BookOpen className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <Badge variant="outline" className="text-xs">Published</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black">{stats.totalLessons || 0}</h3>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Lessons Created</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-purple-500/50 transition-colors shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-500/10 rounded-2xl">
                                        <Award className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <Badge variant="outline" className="text-xs">Earned</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black">{stats.totalCertificates || 0}</h3>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Certificates Issued</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Placeholder for future specific instructor insights if needed */}
                </TabsContent>

                {/* ACCOUNT TAB */}
                <TabsContent value="account" className="space-y-6 mt-4 outline-none">
                    <Card className="shadow-xl overflow-hidden">
                        <div className="h-1 bg-blue-500"></div>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle>Instructor Profile</CardTitle>
                                <CardDescription>Your professional account and contact details.</CardDescription>
                            </div>
                            <Link href="/profile/edit">
                                <Button variant="outline" className="rounded-full gap-2 px-6 border-2 border-blue-500/20 hover:border-blue-500/50 hover:bg-secondary">
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
                                        <Calendar className="h-3 w-3" /> Teaching Since
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
