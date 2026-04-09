'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppLayout } from '@/components/app-layout'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Shield, Bug, CheckCircle2, Wrench, DollarSign, Activity, Cpu } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface DashboardStats {
  totalRepos: number
  vulnerabilities: number
  fixed: number
  issuesFixed: number
  totalCost: number
}

interface VulnerabilityData {
  date: string
  critical: number
  high: number
  medium: number
}

interface LeaderboardRepo {
  name: string
  score: number
  trend: 'up' | 'down'
}

interface TerminalLog {
  timestamp: string
  agent: string
  message: string
  status: 'info' | 'success' | 'warning'
}

interface ModelUsage {
  model: string
  requests: number
  tokens: number
  cost: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRepos: 0,
    vulnerabilities: 0,
    fixed: 0,
    issuesFixed: 0,
    totalCost: 0,
  })
  const [vulnerabilityData, setVulnerabilityData] = useState<VulnerabilityData[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardRepo[]>([])
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([])
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // API fetch implementation using NEXT_PUBLIC_API_URL
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const [statsRes, modelsRes] = await Promise.all([
          fetch(`${apiUrl}/api/stats`),
          fetch(`${apiUrl}/api/models`),
        ])

        let statsData = {
          total_repos_scanned: 0,
          total_vulnerabilities_found: 0,
          vulnerabilities_fixed: 0,
          issues_fixed: 0,
          total_cost_usd: 0,
        };

        let modelsData: { model: string, requests: number, tokens: number, cost: number }[] = [];

        if (statsRes.ok) statsData = await statsRes.json();
        if (modelsRes.ok) modelsData = await modelsRes.json();

        setStats({
          totalRepos: statsData.total_repos_scanned,
          vulnerabilities: statsData.total_vulnerabilities_found,
          fixed: statsData.vulnerabilities_fixed,
          issuesFixed: statsData.issues_fixed || 0,
          totalCost: statsData.total_cost_usd,
        })

        // Mock data for visual components until backend provides real endpoints
        setVulnerabilityData([
          { date: 'Jan', critical: 12, high: 28, medium: 45 },
          { date: 'Feb', critical: 10, high: 32, medium: 42 },
          { date: 'Mar', critical: 8, high: 25, medium: 38 },
          { date: 'Apr', critical: 15, high: 35, medium: 52 },
          { date: 'May', critical: 11, high: 28, medium: 44 },
          { date: 'Jun', critical: 7, high: 22, medium: 35 },
        ])

        setLeaderboard([
          { name: 'auth-service', score: 98, trend: 'up' },
          { name: 'payment-gateway', score: 96, trend: 'up' },
          { name: 'user-api', score: 94, trend: 'down' },
          { name: 'analytics-engine', score: 92, trend: 'up' },
          { name: 'notification-service', score: 89, trend: 'up' },
        ])

        setTerminalLogs([
          { timestamp: '14:32:18', agent: 'Coordinator', message: 'Initiating scan on auth-service', status: 'info' },
          { timestamp: '14:32:22', agent: 'Scanner', message: 'Detected 3 vulnerabilities in dependencies', status: 'warning' },
          { timestamp: '14:32:25', agent: 'Coder', message: 'Applied security patch to crypto module', status: 'success' },
          { timestamp: '14:32:28', agent: 'Validator', message: 'All tests passed successfully', status: 'success' },
          { timestamp: '14:32:31', agent: 'Coordinator', message: 'Scan complete. Repository secured.', status: 'info' },
        ])

        setModelUsage(modelsData.map((m: { model: string, requests: number, tokens: number, cost: number }) => ({
          model: m.model,
          requests: m.requests,
          tokens: m.tokens,
          cost: m.cost
        })))

        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    { title: 'Total Repos Scanned', value: stats.totalRepos, icon: Shield, color: 'text-primary' },
    { title: 'Vulnerabilities Found', value: stats.vulnerabilities, icon: Bug, color: 'text-destructive' },
    { title: 'Vulnerabilities Fixed', value: stats.fixed, icon: CheckCircle2, color: 'text-green-500' },
    { title: 'Issues Fixed', value: stats.issuesFixed, icon: Wrench, color: 'text-accent' },
    { title: 'Total Cost', value: `$${stats.totalCost.toFixed(2)}`, icon: DollarSign, color: 'text-yellow-500' },
  ]

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your security infrastructure in real-time</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {loading ? '...' : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vulnerability Trends Chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Vulnerability Trends
              </CardTitle>
              <CardDescription>Monthly vulnerability detection overview</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Loading chart...
                </div>
              ) : (
                <ChartContainer
                  config={{
                    critical: {
                      label: 'Critical',
                      color: 'hsl(var(--destructive))',
                    },
                    high: {
                      label: 'High',
                      color: 'hsl(var(--accent))',
                    },
                    medium: {
                      label: 'Medium',
                      color: 'hsl(var(--chart-3))',
                    },
                  }}
                  className="h-[300px]"
                >
                  <AreaChart data={vulnerabilityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="critical"
                      stackId="1"
                      stroke="hsl(var(--destructive))"
                      fill="hsl(var(--destructive))"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="high"
                      stackId="1"
                      stroke="hsl(var(--accent))"
                      fill="hsl(var(--accent))"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="medium"
                      stackId="1"
                      stroke="hsl(var(--chart-3))"
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Top Secured Repositories
              </CardTitle>
              <CardDescription>Repositories with highest security scores</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Loading leaderboard...
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((repo, index) => (
                    <div key={repo.name} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{repo.name}</div>
                        <div className="text-xs text-muted-foreground">Security Score</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-foreground">{repo.score}</span>
                        <Badge variant={repo.trend === 'up' ? 'default' : 'secondary'}>
                          {repo.trend === 'up' ? '↑' : '↓'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Terminal */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-accent" />
                Live Terminal
              </CardTitle>
              <CardDescription>Real-time swarm activity monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px] w-full rounded-md border border-border bg-card/50 p-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Loading logs...
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-xs">
                    {terminalLogs.map((log, index) => (
                      <div key={index} className="flex gap-3">
                        <span className="text-muted-foreground">[{log.timestamp}]</span>
                        <span className={
                          log.status === 'success' ? 'text-green-500' :
                          log.status === 'warning' ? 'text-yellow-500' :
                          'text-accent'
                        }>
                          [{log.agent}]
                        </span>
                        <span className="text-foreground">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Model Usage */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Model Usage
              </CardTitle>
              <CardDescription>AI model consumption and costs</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  Loading usage data...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Requests</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelUsage.map((model) => (
                      <TableRow key={model.model}>
                        <TableCell className="font-medium">{model.model}</TableCell>
                        <TableCell className="text-right">{model.requests.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{model.tokens.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${model.cost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
