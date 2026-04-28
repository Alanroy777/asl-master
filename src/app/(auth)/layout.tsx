
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-muted/40">
            {children}
        </div>
    )
}
