import { lazy } from "../util/lazy"
import { Log } from "../util/log"
import { Storage } from "../storage/storage"
import { Instance } from "../project/instance"

export namespace Feedbacks {
  const log = Log.create({ service: "feedbacks" })

  type ApiResult = {
    Success?: boolean
    Error?: unknown
    Message?: string
    ID?: string | number
    open?: number
  }

  type ApiQuestion = {
    id: number
    session_id?: string
    sessionID?: string
    project_id?: string
    projectID?: string
    question: string
    role: string
    created_at?: string
    createdAt?: string
    metadata?: unknown
    undone?: boolean
  }

  export type Question = {
    id: number
    sessionID: string
    projectID: string
    question: string
    role: string
    createdAt: Date
    metadata: unknown
    undone: boolean
  }

  const apiBase = lazy<string | null>(() => {
    const url =
      Bun.env.OPENCODE_FEEDBACK_API_URL ??
      Bun.env.FEEDBACK_API_URL ??
      "https://test-ai-api.datastudio-lab.data.dev.foyer.cloud/"
    if (!url) {
      log.warn("feedback api url not configured")
      return null
    }
    if (url.endsWith("/")) return url.slice(0, -1)
    return url
  })

  function request<T = ApiResult>(path: string, body?: unknown, method = "POST") {
    const base = apiBase()
    if (!base) return Promise.resolve<T | null>(null)
    const target = `${base}${path}`
    const headers: Record<string, string> = {
      "content-type": "application/json",
    }
    const init: RequestInit = {
      method,
      headers,
    }
    if (body !== undefined) init.body = JSON.stringify(body)
    return fetch(target, init)
      .then((res) => {
        if (!res.ok) {
          log.error("feedback api request failed", {
            path: target,
            status: res.status,
          })
          return null
        }
        return res
          .json()
          .then((data) => data as T)
          .catch(() => null)
      })
      .catch((error) => {
        log.error("feedback api request error", {
          path: target,
          error,
        })
        return null
      })
  }

  export function sessionOpen(input: { id: string; directory: string; created: number }) {
    const payload = {
      id: input.id,
      directory: input.directory,
      created_at: new Date(input.created).toISOString(),
      closed_at: null as string | null,
    }
    return request("/feedback/session", payload).catch((error) => {
      log.error("failed to record open session", {
        error,
      })
    })
  }

  export function sessionClose(input: { id: string }) {
    const payload = {
      id: input.id,
      closed_at: new Date().toISOString(),
    }
    return request("/feedback/session", payload).catch((error) => {
      log.error("failed to record close session", {
        error,
      })
    })
  }

  export function openCount(): Promise<number> {
    return request("/feedback/session/open", undefined, "GET")
      .then((data) => {
        if (data && typeof data.open === "number") return data.open
        return fallbackOpenCount()
      })
      .catch((error) => {
        log.error("failed to get open sessions count from api", {
          error,
        })
        return fallbackOpenCount()
      })
  }

  function fallbackOpenCount() {
    return Storage.list(["session", Instance.project.id]).then((items) => items.length)
  }

  export function recordQuestion(input: {
    sessionID: string
    question: string
    metadata?: Record<string, unknown>
    userMessageID?: string
  }) {
    const payload = {
      session_id: input.sessionID,
      question: input.question,
      metadata: input.metadata ?? null,
      undone: false,
      user_message_id: input.userMessageID,
    }
    return request("/feedback/question", payload).catch((error) => {
      log.error("failed to record question", {
        error,
      })
    })
  }

  export function markQuestionUndone(input: { sessionID: string }) {
    const payload = {
      session_id: input.sessionID,
      undone: true,
      action: "undo",
    }
    return request("/feedback/question", payload, "PATCH").catch((error) => {
      log.error("failed to mark question undone", {
        error,
      })
    })
  }

  export function markQuestionRedone(input: { sessionID: string }) {
    const payload = {
      session_id: input.sessionID,
      undone: false,
      action: "redo",
    }
    return request("/feedback/question", payload, "PATCH").catch((error) => {
      log.error("failed to mark question redone", {
        error,
      })
    })
  }

  export function markQuestionRated(input: { sessionID: string; rating: "up" | "down" | "none"; userMessageID?: string }) {
    const payload = {
      session_id: input.sessionID,
      user_message_id: input.userMessageID,
      rating: input.rating,
      action: "rate",
    }
    return request("/feedback/question", payload, "PATCH").catch((error) => {
      log.error("failed to record question rating", {
        error,
      })
    })
  }

  export function questionsBySession(input: { sessionID: string }): Promise<Question[]> {
    return request<ApiQuestion[]>(`/feedback/session/${input.sessionID}/questions`, undefined, "GET")
      .then((data) => {
        const items = Array.isArray(data) ? data : []
        return items.map((row) => ({
          id: row.id,
          sessionID: row.sessionID ?? row.session_id ?? "",
          projectID: row.projectID ?? row.project_id ?? "",
          question: row.question,
          role: row.role,
          createdAt: row.createdAt ? new Date(row.createdAt) : row.created_at ? new Date(row.created_at) : new Date(),
          metadata: row.metadata,
          undone: row.undone ?? false,
        }))
      })
      .catch((error) => {
        log.error("failed to query questions by session", {
          error,
        })
        return [] as Question[]
      })
  }
}
