'use client'

import { useEffect, useState, useMemo } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Search, Star } from 'lucide-react'

interface Repository {
  id: string
  target: string
  stars: number
  integrityScore: number
  clusters: string[]
  lastEncounter: string
}

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/api/repositories?limit=100`)

        if (response.ok) {
           const data = await response.json();
           const formattedRepos = data.map((r: { id: number, full_name: string, stars: number, code_quality_percent: number | null, themes: string[], last_scanned_at: string | null, created_at: string }) => ({
             id: r.id.toString(),
             target: r.full_name,
             stars: r.stars,
             integrityScore: r.code_quality_percent || 0,
             clusters: r.themes || [],
             lastEncounter: r.last_scanned_at ? new Date(r.last_scanned_at).toLocaleString() : new Date(r.created_at).toLocaleString()
           }))
           setRepositories(formattedRepos)
        }

        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch repositories:', error)
        setLoading(false)
      }
    }

    fetchRepositories()
  }, [])

  const filteredRepos = useMemo(() => {
    if (searchQuery.trim() === '') {
      return repositories
    } else {
      return repositories.filter(
        (repo) =>
          repo.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
          repo.clusters.some((cluster) =>
            cluster.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    }
  }, [searchQuery, repositories])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 75) return 'text-yellow-500'
    return 'text-destructive'
  }

  const getScoreProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 75) return 'bg-yellow-500'
    return 'bg-destructive'
  }

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Repositories</h1>
          <p className="text-muted-foreground mt-1">Browse and analyze scanned codebases</p>
        </div>

        {/* Search Bar */}
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search repositories by name or cluster..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Repository Table */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Scanned Repositories</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `${filteredRepos.length} repositories found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Loading repositories...
              </div>
            ) : (
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repository Target</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead>Integrity Score</TableHead>
                      <TableHead>Thematic Clusters</TableHead>
                      <TableHead>Last Encounter</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRepos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No repositories found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRepos.map((repo) => (
                        <TableRow key={repo.id}>
                          <TableCell className="font-medium text-foreground">
                            {repo.target}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                  key={index}
                                  className={`w-4 h-4 ${
                                    index < repo.stars
                                      ? 'fill-yellow-500 text-yellow-500'
                                      : 'text-muted'
                                  }`}
                                />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2 min-w-[200px]">
                              <div className="flex items-center justify-between text-sm">
                                <span className={`font-semibold ${getScoreColor(repo.integrityScore)}`}>
                                  {repo.integrityScore}%
                                </span>
                              </div>
                              <div className="relative">
                                <Progress value={repo.integrityScore} className="h-2" />
                                <div
                                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getScoreProgressColor(repo.integrityScore)}`}
                                  style={{ width: `${repo.integrityScore}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {repo.clusters.map((cluster) => (
                                <Badge key={cluster} variant="secondary" className="text-xs">
                                  {cluster}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {repo.lastEncounter}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
