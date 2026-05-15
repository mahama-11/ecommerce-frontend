import { request } from '@/services/http'
import type {
  StartParsingRequest,
  StartParsingResponse,
  EvaluateDecisionTreeRequest,
  CompileIntentRequest,
  CompiledIntent,
  ExecutionConfig,
  TaskQuota,
  AssetVariant,
  CreateInpaintTaskRequest,
  InpaintTask,
  RefinementSession,
  RefinementMessage,
  SendRefinementMessageRequest,
  FinalizeAssetsRequest,
  DualTrackParsing,
  LlmDecisionTreeResult,
  ParsingSource,
} from '@/types/production'
import {
  isDevMode,
  delay,
  uid,
  MOCK_SOURCES,
  mockDualTrackParsing,
  mockDecisionTree,
  MOCK_INTENTS,
  MOCK_EXECUTION_CONFIG,
  MOCK_QUOTA,
  MOCK_VARIANTS,
  mockInpaintTask,
  mockRefinementSession,
  mockRefinementReply,
} from '@/mocks/productionDemo'

// ─── Base URL for V2 API ────────────────────────────────────
const V2 = '/api/v2/production'

// ─── Dev mock state (persists across calls within a session) ─
let devIntentCounter = 4

// ─── Prep Hub APIs ──────────────────────────────────────────

/** Upload source images for parsing */
export async function uploadParsingSource(
  productId: string,
  file: File,
): Promise<ParsingSource> {
  if (isDevMode()) {
    await delay(600)
    return {
      id: `src-${uid()}`,
      type: 'sku_image',
      url: URL.createObjectURL(file),
      thumbnailUrl: URL.createObjectURL(file),
      name: file.name,
      uploadedAt: new Date().toISOString(),
    }
  }
  const formData = new FormData()
  formData.append('file', file)
  const { API_BASE_URL } = await import('@/services/apiBase')
  const token = localStorage.getItem('ecommerce_access_token') ?? ''
  const res = await fetch(`${API_BASE_URL}${V2}/${productId}/sources`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  })
  const envelope = await res.json()
  if (!res.ok || envelope.code !== 0) {
    throw new Error(envelope.error_hint || envelope.message || 'Upload failed')
  }
  return envelope.data
}

/** Start dual-track parsing */
export async function startParsing(
  req: StartParsingRequest,
): Promise<StartParsingResponse> {
  if (isDevMode()) {
    await delay(400)
    return { parsingJobId: `job-${uid()}`, status: 'parsing' }
  }
  return request<StartParsingResponse>(`${V2}/${req.productId}/parse`, {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

/** Get parsing results (polling) */
export async function getParsingResult(
  productId: string,
): Promise<DualTrackParsing> {
  if (isDevMode()) {
    await delay(1200)
    return mockDualTrackParsing()
  }
  return request<DualTrackParsing>(`${V2}/${productId}/parse`)
}

/** Evaluate LLM decision tree */
export async function evaluateDecisionTree(
  req: EvaluateDecisionTreeRequest,
): Promise<LlmDecisionTreeResult> {
  if (isDevMode()) {
    await delay(800)
    return mockDecisionTree()
  }
  return request<LlmDecisionTreeResult>(
    `${V2}/${req.productId}/decision-tree`,
    { method: 'POST', body: JSON.stringify(req) },
  )
}

/** Get decision tree result (polling) */
export async function getDecisionTree(
  productId: string,
): Promise<LlmDecisionTreeResult> {
  if (isDevMode()) {
    await delay(600)
    return mockDecisionTree()
  }
  return request<LlmDecisionTreeResult>(`${V2}/${productId}/decision-tree`)
}

/** Update parsed attribute (manual override / drift correction) */
export async function updateParsedAttribute(
  productId: string,
  key: string,
  value: unknown,
): Promise<void> {
  if (isDevMode()) {
    await delay(300)
    return
  }
  await request<void>(`${V2}/${productId}/attributes/${key}`, {
    method: 'PATCH',
    body: JSON.stringify({ value }),
  })
}

// ─── Sandbox APIs ───────────────────────────────────────────

/** Compile an intent from description */
export async function compileIntent(
  req: CompileIntentRequest,
): Promise<CompiledIntent> {
  if (isDevMode()) {
    await delay(500)
    const id = `intent-dev-${devIntentCounter++}`
    return {
      id,
      type: req.type,
      description: req.description,
      prompt: req.description,
      priority: req.priority ?? 'medium',
      params: req.params ?? {},
      status: 'compiled',
      createdAt: new Date().toISOString(),
    }
  }
  return request<CompiledIntent>(`${V2}/${req.productId}/intents`, {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

/** List all compiled intents */
export async function listIntents(productId: string): Promise<CompiledIntent[]> {
  if (isDevMode()) {
    await delay(300)
    return MOCK_INTENTS
  }
  return request<CompiledIntent[]>(`${V2}/${productId}/intents`)
}

/** Update an intent */
export async function updateIntent(
  productId: string,
  intentId: string,
  patch: Partial<CompiledIntent>,
): Promise<CompiledIntent> {
  if (isDevMode()) {
    await delay(300)
    const existing = MOCK_INTENTS.find((i) => i.id === intentId)
    return { ...(existing ?? MOCK_INTENTS[0]), ...patch }
  }
  return request<CompiledIntent>(`${V2}/${productId}/intents/${intentId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

/** Delete an intent */
export async function deleteIntent(
  productId: string,
  intentId: string,
): Promise<void> {
  if (isDevMode()) {
    await delay(300)
    return
  }
  await request<void>(`${V2}/${productId}/intents/${intentId}`, {
    method: 'DELETE',
  })
}

/** Execute selected intents */
export async function executeIntents(
  productId: string,
  intentIds: string[],
  config?: ExecutionConfig,
): Promise<{ jobId: string }> {
  if (isDevMode()) {
    await delay(2000)
    return { jobId: `exec-${uid()}` }
  }
  return request<{ jobId: string }>(`${V2}/${productId}/execute`, {
    method: 'POST',
    body: JSON.stringify({ intentIds, config }),
  })
}

/** Get execution quota status */
export async function getTaskQuota(productId: string): Promise<TaskQuota> {
  if (isDevMode()) {
    await delay(200)
    return MOCK_QUOTA
  }
  return request<TaskQuota>(`${V2}/${productId}/quota`)
}

/** Get execution config */
export async function getExecutionConfig(
  productId: string,
): Promise<ExecutionConfig> {
  if (isDevMode()) {
    await delay(200)
    return MOCK_EXECUTION_CONFIG
  }
  return request<ExecutionConfig>(`${V2}/${productId}/execution-config`)
}

/** Update execution config */
export async function updateExecutionConfig(
  productId: string,
  config: ExecutionConfig,
): Promise<ExecutionConfig> {
  if (isDevMode()) {
    await delay(300)
    return config
  }
  return request<ExecutionConfig>(`${V2}/${productId}/execution-config`, {
    method: 'PUT',
    body: JSON.stringify(config),
  })
}

// ─── Workshop APIs ──────────────────────────────────────────

/** List generated asset variants */
export async function listVariants(productId: string): Promise<AssetVariant[]> {
  if (isDevMode()) {
    await delay(400)
    return MOCK_VARIANTS
  }
  return request<AssetVariant[]>(`${V2}/${productId}/variants`)
}

/** Create an inpaint task (rectangular region) */
export async function createInpaintTask(
  productId: string,
  req: CreateInpaintTaskRequest,
): Promise<InpaintTask> {
  if (isDevMode()) {
    await delay(1500)
    return mockInpaintTask(req.variantId, req.regions, req.prompt)
  }
  return request<InpaintTask>(`${V2}/${productId}/inpaint`, {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

/** Get inpaint task status */
export async function getInpaintTask(
  productId: string,
  taskId: string,
): Promise<InpaintTask> {
  if (isDevMode()) {
    await delay(300)
    return mockInpaintTask('var-1', [{ x: 100, y: 100, width: 200, height: 150 }], 'demo inpaint')
  }
  return request<InpaintTask>(`${V2}/${productId}/inpaint/${taskId}`)
}

/** Start or resume a refinement chat session */
export async function getOrCreateRefinementSession(
  productId: string,
  variantId: string,
): Promise<RefinementSession> {
  if (isDevMode()) {
    await delay(600)
    return mockRefinementSession(variantId)
  }
  return request<RefinementSession>(
    `${V2}/${productId}/variants/${variantId}/refinement`,
    { method: 'POST' },
  )
}

/** Send a message in refinement chat */
export async function sendRefinementMessage(
  productId: string,
  sessionId: string,
  req: SendRefinementMessageRequest,
): Promise<RefinementMessage> {
  if (isDevMode()) {
    await delay(1200)
    return mockRefinementReply(req.content)
  }
  return request<RefinementMessage>(
    `${V2}/${productId}/refinement/${sessionId}/messages`,
    { method: 'POST', body: JSON.stringify(req) },
  )
}

/** Finalize selected variants as production assets */
export async function finalizeAssets(
  req: FinalizeAssetsRequest,
): Promise<{ assetIds: string[] }> {
  if (isDevMode()) {
    await delay(800)
    return { assetIds: req.variantIds.map((id) => `finalized-${id}`) }
  }
  return request<{ assetIds: string[] }>(
    `${V2}/${req.productId}/finalize`,
    { method: 'POST', body: JSON.stringify(req) },
  )
}
