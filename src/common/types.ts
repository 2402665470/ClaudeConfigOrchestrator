export type AppData = {
  marketPath: string
  projects: Project[]
}

export type Project = {
  id: string
  alias: string
  path: string
  description?: string
}

export type Plugin = {
  meta: { id: string; name: string; readmePath?: string; iconPath?: string }
  capabilities: Record<string, unknown>
  rootPath: string
}
