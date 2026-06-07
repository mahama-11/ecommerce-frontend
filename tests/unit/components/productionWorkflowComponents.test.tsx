import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DecisionStepCard, ResultAssetCard, VersionLineageItem } from '@/components/production/ProductionWorkflowComponents'

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, tag: string) => ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => React.createElement(tag, props, children),
  }),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

const activeDecisionStep = {
  id: 'style-step',
  stepNumber: 2,
  status: 'active',
  title: '确认主图风格',
  description: '选择本轮商品图的商业表达方式。',
  selectedOptionId: 'studio',
  options: [
    { id: 'studio', label: '棚拍质感', description: '干净背景，突出主体', confidence: 0.94, icon: '📷' },
    { id: 'lifestyle', label: '生活方式', description: '真实场景，强调使用氛围', confidence: 0.81, icon: '🏠' },
  ],
}

const versionNode = {
  id: 'v-1.2',
  version: 'V1.2',
  label: '版本 V1.2（当前）',
  description: '增强高光，强化螺纹细节',
  skuBias: 40,
  refBias: 60,
  timestamp: '2026-05-11T10:30:00Z',
  strategySnapshot: 'V1.2：增强高光',
  isCurrent: true,
  childrenIds: [],
  weightParams: { skuBias: 40, styleStrength: 0.6, identityConsistency: 0.4, creativeFreedom: 0.5 },
}

const variant = {
  id: 'asset-variant-1',
  thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect width=%2264%22 height=%2264%22 fill=%22%230891b2%22/%3E%3C/svg%3E',
  metadata: {
    template_name: 'Amazon Hero Main Image',
    source_name: 'QA Product Reference',
  },
}

describe('ProductionWorkflowComponents', () => {
  it('DecisionStepCard renders selected decision and emits step/option ids when another option is chosen', async () => {
    const user = userEvent.setup()
    const onSelectOption = vi.fn()

    render(<DecisionStepCard step={activeDecisionStep as never} isCurrent onSelectOption={onSelectOption} />)

    expect(screen.getByText('确认主图风格')).toBeVisible()
    expect(screen.getByRole('button', { name: /棚拍质感/ })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /生活方式/ }))

    expect(onSelectOption).toHaveBeenCalledWith('style-step', 'lifestyle')
  })

  it('DecisionStepCard shows pending label instead of empty choices while analysis is waiting', () => {
    render(<DecisionStepCard step={{ ...activeDecisionStep, status: 'pending', options: [], selectedOptionId: undefined } as never} isCurrent={false} onSelectOption={() => {}} pendingLabel="正在等待真实商品解析" />)

    expect(screen.getByText('正在等待真实商品解析')).toBeVisible()
    expect(screen.queryByTestId('production-choice-submit')).not.toBeInTheDocument()
  })

  it('VersionLineageItem exposes current version context and calls onSelect', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<VersionLineageItem node={versionNode as never} active index={0} onSelect={onSelect} />)

    expect(screen.getByText('版本 V1.2（当前）')).toBeVisible()
    expect(screen.getByText('当前')).toBeVisible()
    expect(screen.getByText('SKU 40%')).toBeVisible()
    expect(screen.getByText('REF 60%')).toBeVisible()
    await user.click(screen.getByTestId('production-version-card'))

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('ResultAssetCard toggles selection from the explicit selection button and exposes image surface semantics', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()

    render(<ResultAssetCard variant={variant as never} index={0} isSelected={false} onToggle={onToggle} onZoom={() => {}} onDownload={() => {}} />)

    expect(screen.getByText('Amazon Hero Main Image')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /选择生成结果 1/ }))
    const imageSurface = screen.getByRole('button', { name: /^选择变体 1$/ })
    expect(imageSurface.tagName).toBe('DIV')
    expect(imageSurface).toHaveAttribute('tabindex', '0')
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('ResultAssetCard shows zoom/download actions on hover and keeps card toggle isolated', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const onZoom = vi.fn()
    const onDownload = vi.fn()

    render(<ResultAssetCard variant={variant as never} index={1} isSelected onToggle={onToggle} onZoom={onZoom} onDownload={onDownload} />)

    fireEvent.mouseEnter(screen.getByTestId('production-result-card'))
    fireEvent.click(await screen.findByRole('button', { name: /查看生成结果 2/ }))
    fireEvent.click(screen.getByRole('button', { name: /下载生成结果 2/ }))

    expect(onZoom).toHaveBeenCalledTimes(1)
    expect(onDownload).toHaveBeenCalledTimes(1)
    expect(onToggle).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /取消选择生成结果 2/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
