export type VisualSession = { id: string
  product_id: string
  sku_code: string
  current_stage: string
  status: string
  template_id?: string
  template_version_id?: string
  intent_spec?: IntentSpecDTO
  prompt_plan?: PromptPlanDTO
  generation_versions?: GenerationVersionDTO[] }
export type ProductionTemplateListItem = { id: string
  modality?: string
  capabilityType?: string
  recommendScore?: number }
export type SourceReferenceDTO = { id: string
  source_kind: string
  source_ref?: string
  asset_id?: string
  asset_relation_id?: string
  asset_content_url?: string
  mime_type?: string
  status: string
  metadata?: Record<string, unknown> }
export type DeconstructionJobDTO = { job_id: string
  source_reference_id?: string
  runtime_job_id?: string
  status: string
  stage?: string
  stage_message?: string
  progress?: number
  unavailable_reason?: string
  error_code?: string
  error_message?: string }
export type DeconstructionElementDTO = { id: string
  element_type: string
  element_key?: string
  label?: string
  confidence?: number
  value?: Record<string, unknown>
  selected?: boolean
  confirmed?: boolean
  decision?: 'keep' | 'replace' | 'drop' | string
  readiness?: string
  source_role?: 'sku' | 'reference' | string
  source_reference_id?: string
  source_asset_id?: string }
export type IntentSpecDTO = { schema_version?: string
  scene_type?: string
  tool_slug?: string
  product_id?: string
  sku_code?: string
  selections?: Array<{ element_id?: string
    element_type?: string
    decision?: string
    element_key?: string
    label?: string
    value?: Record<string, unknown>
    metadata?: Record<string, unknown> }>
  requirements?: Record<string, unknown>
  metadata?: Record<string, unknown> }
export type PromptPlanDTO = { schema_version?: string
  status?: string
  prompt_id?: string
  scene_type?: string
  template_id?: string
  variables?: Record<string, unknown>
  source_assets?: Array<Record<string, unknown>>
  metadata?: Record<string, unknown>
  blockers?: Array<{ code: string; message: string; target?: string }> }
export type ResultAssetDTO = { asset_id: string
  asset_content_url?: string
  role?: string
  selected?: boolean
  metadata?: Record<string, unknown> }
export type GenerationVersionDTO = { version_id: string
  prompt_id?: string
  status: string
  stage?: string
  progress?: number
  runtime_job_id?: string
  selected_result_asset_id?: string
  result_assets?: ResultAssetDTO[]
  parent_version_id?: string
  prompt_plan_status?: string
  metadata?: Record<string, unknown>
  blockers?: Array<{ code: string; message: string; target?: string }>
  created_at?: string }
export type GenerationFanoutResponseDTO = { session_id: string
  product_id: string
  sku_code: string
  fanout_id: string
  items: Array<{ fanout_task_id: string
    source_asset_id: string
    template_id: string
    template_version_id?: string
    slot_index: number
    scene_tag?: string
    detail_requirement?: string
    generation_version: GenerationVersionDTO }> }
export type BusinessWorkflowNode = { node_id: string
  label: string
  owner: string
  status: string
  readiness?: string
  evidence?: Record<string, unknown>
  blockers?: Array<{ code: string; message: string; target?: string }> }
export type BusinessWorkflowDAG = { schema_version: string
  flow_id: string
  status: string
  persistence?: string
  nodes: BusinessWorkflowNode[]
  edges: Array<{ from: string; to: string; dependency?: string }> }
export type IntegrationVerdict = { schema_version: string
  status: 'pass' | 'partial_pass' | 'blocked' | 'fail' | string
  ready_count: number
  total_count: number
  gates: Array<{ gate_id: string; label: string; status: string; evidence?: Record<string, unknown> }>
  blockers?: Array<{ code: string; message: string; target?: string }> }
export type RollbackSnapshot = { schema_version: string
  session_id: string
  status: string
  scopes: Array<{ scope_id: string; resource_type: string; resource_id?: string; action: string; safe: boolean; evidence?: Record<string, unknown> }>
  instructions?: string[]
  metadata?: Record<string, unknown> }
export type ReleaseReadiness = { schema_version: string
  status: string
  gates: Array<{ gate_id: string; label: string; status: string; evidence?: Record<string, unknown> }>
  blockers?: Array<{ code: string; message: string; target?: string }> }
export type StageViewDTO = VisualSession & { session_id?: string
  source_reference?: SourceReferenceDTO
  source_references?: SourceReferenceDTO[]
  deconstruction_job?: DeconstructionJobDTO
  deconstruction_elements: DeconstructionElementDTO[]
  readiness?: { overall?: string
    source?: string
    deconstruction?: string
    prompt?: string
    generation?: string
    blockers?: Array<{ code: string; message: string; target?: string }> }
  business_flow?: BusinessWorkflowDAG
  integration_verdict?: IntegrationVerdict
  rollback_snapshot?: RollbackSnapshot
  release_readiness?: ReleaseReadiness
  runtime_capabilities?: Array<{ task_type: string; status: string; available: boolean; unavailable_reason?: string }>
  runtime_capability_error?: { code: string; message: string }
  updated_at?: string }
