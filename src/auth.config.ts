
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                // @ts-ignore
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                // @ts-ignore
                session.user.id = token.id as string
                // @ts-ignore
                session.user.role = token.role
            }
            return session
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            // @ts-ignore
            const userRole = auth?.user?.role;


            const isInstructorRoute = nextUrl.pathname.startsWith('/instructor');
            const isAdminRoute = nextUrl.pathname.startsWith('/admin');

            // Debug Log
            if (isLoggedIn) {
                console.log(`[Middleware] User: ${auth?.user?.email}, Role: ${userRole}, Path: ${nextUrl.pathname}`);
            }

            const isLearnerRoute = ['/dashboard', '/learn', '/practice', '/profile'].some(path => nextUrl.pathname.startsWith(path));

            // 1. Protect Instructor Routes
            if (isInstructorRoute) {
                if (!isLoggedIn) return false;
                // Cast to any/string to handle potential legacy 'TEACHER' value from DB
                const role = userRole as string;
                if (role !== 'INSTRUCTOR' && role !== 'TEACHER' && role !== 'ADMIN') {
                    return Response.redirect(new URL('/dashboard', nextUrl)); // Redirect unauthorized to learner dashboard
                }
                return true;
            }

            // 2. Protect Admin Routes
            if (isAdminRoute) {
                if (!isLoggedIn) return false;
                if (userRole !== 'ADMIN') {
                    return Response.redirect(new URL('/dashboard', nextUrl));
                }
                return true;
            }

            // 3. Protect Learner Routes (Shared)
            if (isLearnerRoute) {
                if (isLoggedIn) {
                    const role = userRole as string;
                    if (role === 'ADMIN') {
                        return Response.redirect(new URL('/admin', nextUrl));
                    }
                    if (role === 'INSTRUCTOR' || role === 'TEACHER') {
                        return Response.redirect(new URL('/instructor/dashboard', nextUrl));
                    }
                    return true;
                }
                return false; // Redirect unauthenticated users to login page
            }

            // 4. Handle Auth Pages (Login/Signup)
            if (isLoggedIn) {
                if (nextUrl.pathname === '/login' || nextUrl.pathname === '/signup' || nextUrl.pathname === '/') {
                    // Redirect based on role
                    const role = userRole as string;
                    if (role === 'ADMIN') {
                        return Response.redirect(new URL('/admin', nextUrl));
                    }
                    if (role === 'INSTRUCTOR' || role === 'TEACHER') {
                        return Response.redirect(new URL('/instructor/dashboard', nextUrl));
                    }
                    if (nextUrl.pathname !== '/') { // Don't redirect root to dashboard if not logged in loop
                        return Response.redirect(new URL('/dashboard', nextUrl));
                    }
                }
            }
            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
