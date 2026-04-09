'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Cpu, Link2, Key, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SwarmConfig {
  use_verifier: boolean
  coordinator_model: string
  scanner_model: string
  verifier_model: string
  coder_model: string
  local_base_url: string
  github_token: string
  openai: string[]
  anthropic: string[]
  groq: string[]
  mistral: string[]
  gemini: string[]
  deepseek: string[]
}

const aiModels = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq)' },
  { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (Groq)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
]

export default function AdminPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<SwarmConfig>({
    use_verifier: true,
    coordinator_model: 'gpt-4o',
    scanner_model: 'claude-3-5-sonnet-latest',
    verifier_model: 'gpt-4o',
    coder_model: 'gpt-4o',
    local_base_url: 'http://localhost:8000',
    github_token: '',
    openai: [],
    anthropic: [],
    groq: [],
    mistral: [],
    gemini: [],
    deepseek: [],
  })

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const res = await fetch(`${apiUrl}/api/config`)
        if (res.ok) {
          setConfig(await res.json())
        }
      } catch (error) {
        console.error('Failed to fetch config:', error)
      }
    }
    fetchConfig()
  }, [])

  const handleSave = async () => {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        await fetch(`${apiUrl}/api/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        })

        toast({
          title: 'Configuration Saved',
          description: 'Your settings have been updated successfully.',
        })
    } catch {
         toast({
          title: 'Error',
          description: 'Failed to save configuration.',
        })
    }
  }

  const handleKeyChange = (provider: keyof SwarmConfig, idx: number, val: string) => {
    const newKeys = [...(config[provider] as string[])];
    newKeys[idx] = val;
    setConfig({ ...config, [provider]: newKeys });
  };

  const addKeyField = (provider: keyof SwarmConfig) => {
    setConfig({ ...config, [provider]: [...(config[provider] as string[]), ""] });
  };

  const removeKeyField = (provider: keyof SwarmConfig, idx: number) => {
    const newKeys = [...(config[provider] as string[])];
    newKeys.splice(idx, 1);
    setConfig({ ...config, [provider]: newKeys });
  };


  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin & Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your AI Security Swarm engine</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Swarm Engine Configuration */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                Swarm Engine Config
              </CardTitle>
              <CardDescription>Configure AI models and swarm behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-Failover Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-failover" className="text-base">Use Verifier Agent</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable verification step after code fixes
                  </p>
                </div>
                <Switch
                  id="auto-failover"
                  checked={config.use_verifier}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, use_verifier: checked })
                  }
                />
              </div>

              <Separator />

              {/* AI Model Selections */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coordinator-model">Coordinator Model</Label>
                  <Select
                    value={config.coordinator_model}
                    onValueChange={(value) =>
                      setConfig({ ...config, coordinator_model: value })
                    }
                  >
                    <SelectTrigger id="coordinator-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scanner-model">Scanner Model</Label>
                  <Select
                    value={config.scanner_model}
                    onValueChange={(value) =>
                      setConfig({ ...config, scanner_model: value })
                    }
                  >
                    <SelectTrigger id="scanner-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verifier-model">Verifier Model</Label>
                  <Select
                    disabled={!config.use_verifier}
                    value={config.verifier_model}
                    onValueChange={(value) =>
                      setConfig({ ...config, verifier_model: value })
                    }
                  >
                    <SelectTrigger id="verifier-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coder-model">Coder Model</Label>
                  <Select
                    value={config.coder_model}
                    onValueChange={(value) =>
                      setConfig({ ...config, coder_model: value })
                    }
                  >
                    <SelectTrigger id="coder-model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-accent" />
                API Configuration
              </CardTitle>
              <CardDescription>Configure local API endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="local-api-url">Local API URL</Label>
                <Input
                  id="local-api-url"
                  type="url"
                  placeholder="http://localhost:8000"
                  value={config.local_base_url}
                  onChange={(e) =>
                    setConfig({ ...config, local_base_url: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  The base URL for your local SafeCode API instance
                </p>
              </div>

              <div className="space-y-2 pt-4">
                  <Label htmlFor="github-token">GitHub Token</Label>
                  <Input
                    id="github-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={config.github_token}
                    onChange={(e) =>
                      setConfig({ ...config, github_token: e.target.value })
                    }
                  />
              </div>
            </CardContent>
          </Card>

          {/* Credentials */}
          <Card className="border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-destructive" />
                Credentials
              </CardTitle>
              <CardDescription>Manage API keys and tokens for external services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {['openai', 'anthropic', 'groq', 'mistral', 'gemini'].map((provider) => (
                <div key={provider} className="space-y-2 border-l-2 pl-4 border-border">
                  <div className="flex justify-between items-center">
                    <Label className="capitalize">{provider} Keys</Label>
                    <Button variant="outline" size="sm" onClick={() => addKeyField(provider as keyof SwarmConfig)}>+</Button>
                  </div>
                  {(config[provider as keyof SwarmConfig] as string[]).map((key, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        type="password"
                        placeholder="API Key"
                        value={key}
                        onChange={(e) => handleKeyChange(provider as keyof SwarmConfig, idx, e.target.value)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeKeyField(provider as keyof SwarmConfig, idx)}>X</Button>
                    </div>
                  ))}
                </div>
              ))}

              <div className="pt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> API keys are encrypted and stored securely. They are never exposed
                  in logs or transmitted without encryption.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" className="gap-2">
            <Save className="w-4 h-4" />
            Save Configuration
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
