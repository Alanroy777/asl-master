"use client"

import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import { searchSigns as searchDictionary } from "@/app/lib/actions"
import SignCard from "./sign-card"
import { useDebounce } from "use-debounce"

interface DictionarySearchProps {
    initialCategories: { name: string, count: number }[]
}

export default function DictionarySearch({ initialCategories }: DictionarySearchProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [debouncedQuery] = useDebounce(query, 500)

    const handleSearch = useCallback(async (searchTerm: string) => {
        setIsSearching(true)
        try {
            const data = await searchDictionary(searchTerm)

            // Client-side category filter for MVP simplicity
            const filtered = selectedCategory
                ? data.filter((s: any) => s.category === selectedCategory)
                : data

            setResults(filtered)
        } catch (error) {
            console.error("Search failed", error)
        } finally {
            setIsSearching(false)
        }
    }, [selectedCategory])

    useEffect(() => {
        if (debouncedQuery || selectedCategory) {
            handleSearch(debouncedQuery)
        } else {
            setResults([])
        }
    }, [debouncedQuery, selectedCategory, handleSearch])

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search for a sign (e.g. 'Hello', 'Thank you')..."
                        className="pl-10 h-12 text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge
                        variant={selectedCategory === null ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm"
                        onClick={() => setSelectedCategory(null)}
                    >
                        All
                    </Badge>
                    {initialCategories.map(cat => (
                        <Badge
                            key={cat.name}
                            variant={selectedCategory === cat.name ? "default" : "outline"}
                            className="cursor-pointer px-4 py-2 text-sm"
                            onClick={() => setSelectedCategory(cat.name)}
                        >
                            {cat.name} ({cat.count})
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {results.map(sign => (
                    <SignCard key={sign.id} sign={sign} />
                ))}

                {!isSearching && results.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        {query ? "No signs found matching your search." : "Start typing to search the dictionary."}
                    </div>
                )}
            </div>
        </div>
    )
}
