
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Get started with&nbsp;
          <code className="font-mono font-bold">ASL Learning Platform</code>
        </p>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-to-br before:from-transparent before:to-blue-700 before:opacity-10 before:blur-2xl after:absolute after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-to-t after:from-sky-900 after:via-[#0141ff] after:opacity-40 after:blur-2xl z-[-1]">
        <h1 className="text-6xl font-bold tracking-tighter text-center">
          Learn ASL <br /> the <span className="text-primary">Modern Way</span>
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-2 lg:text-left mt-12 gap-4">
        <div className="flex flex-col gap-4 items-center lg:items-end">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8">Login</Button>
          </Link>
        </div>
        <div className="flex flex-col gap-4 items-center lg:items-start">
          <Link href="/signup">
            <Button size="lg" variant="outline" className="text-lg px-8">Sign Up</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
