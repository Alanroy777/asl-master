
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Users, Library, ShieldCheck, Mail, Phone, User as UserIcon, Calendar, Edit, Activity, LayoutDashboard } from "lucide-react"
import { auth } from "@/auth"
import { getAdminProfileStats } from "../../lib/actions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload"

export default async function AdminProfilePage() {
    const session = await auth()
    if (!session?.user?.email) redirect('/login')

    const stats = await getAdminProfileStats(session.user.email)

    if (!stats) {
        return <div>Profile not found.</div>
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 p-4 md:p-0">
            {/* Header / Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-xl">
                {/* Banner Background */}
                <div className="h-40 w-full bg-gradient-to-r from-zinc-800 via-zinc-900 to-black opacity-20"></div>
                
                <div className="px-8 pb-8 -mt-16 flex flex-col md:flex-row items-center md:items-end gap-6">
                    {/* Profile Picture Area */}
                    <div className="relative group">
                        <ProfileImageUpload currentImage={stats.image} />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2 pb-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <h1 className="text-4xl font-extrabold tracking-tight">{stats.name || 'Administrator'}</h1>
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
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="hover:border-primary/50 transition-colors shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-zinc-500/10 rounded-2xl">
                                        <Users className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                                    </div>
                                    <Badge variant="outline" className="text-xs">Platform</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black">{stats.totalUsers || 0}</h3>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Total Users</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-zinc-500/10 rounded-2xl">
                                        <Library className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                                    </div>
                                    <Badge variant="outline" className="text-xs">Resources</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black">{stats.totalSigns || 0}</h3>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Library Assets</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-zinc-500/10 rounded-2xl">
                                        <Activity className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                                    </div>
                                    <Badge variant="outline" className="text-xs">Activity</Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black">{stats.totalPracticeSessions || 0}</h3>
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Total Sessions</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                System Administration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-6 bg-muted/30 border border-border rounded-2xl">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    You have full administrative access to the ASL Learning Platform. From your profile, you can monitor overall system health, user growth, and content library expansion. 
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link href="/admin/users" className="block p-4 border border-border rounded-xl hover:bg-muted/50 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Users className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                            <span className="font-bold">Manage Users</span>
                                        </div>
                                        <Activity className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </Link>
                                <Link href="/admin/library" className="block p-4 border border-border rounded-xl hover:bg-muted/50 transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Library className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                            <span className="font-bold">Resource Library</span>
                                        </div>
                                        <Activity className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ACCOUNT TAB */}
                <TabsContent value="account" className="space-y-6 mt-4 outline-none">
                    <Card className="shadow-xl overflow-hidden">
                        <div className="h-1 bg-primary"></div>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle>Admin Account</CardTitle>
                                <CardDescription>Your administrative identity and contact details.</CardDescription>
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
                                        <Calendar className="h-3 w-3" /> Admin Since
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
