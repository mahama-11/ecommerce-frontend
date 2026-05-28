import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = process.cwd()
const toolPage = () => readFileSync(join(root, 'src/pages/ToolPage.tsx'), 'utf8')
const toolTemplatePicker = () => readFileSync(join(root, 'src/pages/tool-page/components/ToolTemplatePicker.tsx'), 'utf8')
const visualToolsPage = () => readFileSync(join(root, 'src/pages/ProductVisualToolsPage.tsx'), 'utf8')
const zh = () => readFileSync(join(root, 'src/i18n/zh.ts'), 'utf8')
const userMenu = () => readFileSync(join(root, 'src/components/account/UserAccountMenu.tsx'), 'utf8')

test('Visual Tools Studio copy avoids abstract helper and secondary-tool wording', () => {
  const source = `${zh()}\n${visualToolsPage()}`
  assert.doesNotMatch(source, /次级工具库|推荐目标不够|避免视觉结果没有上下文|一次只选择一个视觉目标|视频能力作为后续选项保留|不干扰当前图片创作/)
  assert.match(source, /按当前商品选择一个图片目标，生成结果会保存到商品素材。/)
})

test('Visual Tools Studio keeps product detail action near selected product context, not buried below help copy', () => {
  const source = visualToolsPage()
  assert.match(source, /to=\{`\/products\/\$\{selectedProduct\.id\}`\}/)
  const detailIndex = source.indexOf('product.visualTools.viewProductDetail')
  const helpIndex = source.indexOf('product.visualToolsStudio.helpTitle')
  assert.ok(detailIndex >= 0, 'detail link must be present')
  assert.ok(helpIndex >= 0, 'help panel must be present')
  assert.ok(detailIndex < helpIndex, 'detail action should appear before help panel instead of being buried below it')
})

test('Product-scoped AI tool page uses scroll-safe canvas and non-stretching uploaded image layout', () => {
  const source = toolPage()
  assert.match(source, /min-h-screen[^"]*overflow-x-hidden/)
  assert.doesNotMatch(source, /min-h-screen[^"]*overflow-hidden/)
  assert.match(source, /data-testid="ai-product-canvas"/)
  assert.match(source, /max-h-\[min\(70vh,720px\)\]/)
  assert.match(source, /max-w-\[min\(1120px,calc\(100vw-2rem\)\)\]/)
  assert.doesNotMatch(source, /w-full aspect-square sm:aspect-video max-h-\[75vh\]/)
  assert.match(source, /data-testid="source-preview-image"[\s\S]*max-w-full[\s\S]*max-h-full[\s\S]*object-contain/)
  assert.match(source, /data-testid="result-preview-image"[\s\S]*max-w-full[\s\S]*max-h-full[\s\S]*object-contain/)
  const sourceImageSegment = source.slice(source.indexOf('data-testid="source-preview-image"'), source.indexOf('data-testid="result-preview-image"'))
  const resultImageSegment = source.slice(source.indexOf('data-testid="result-preview-image"'), source.indexOf('{!isProcessing && ( <Button', source.indexOf('data-testid="result-preview-image"')))
  assert.doesNotMatch(sourceImageSegment, /w-full h-full object-cover/)
  assert.doesNotMatch(resultImageSegment, /w-full h-full object-cover/)
})

test('Template picker modal is viewport-safe and does not squeeze template cards', () => {
  const source = `${toolPage()}\n${toolTemplatePicker()}`
  assert.match(source, /data-testid="template-picker-modal"/)
  assert.match(source, /max-h-\[min\(86vh,780px\)\]/)
  assert.match(source, /overflow-hidden/)
  assert.match(source, /grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4/)
  assert.doesNotMatch(source, /grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-\[60vh\]/)
})


test('Template picker cards are readable, not tiny fixed-height buttons', () => {
  const source = `${toolPage()}\n${toolTemplatePicker()}`
  assert.match(source, /data-testid="template-style-card"/)
  assert.match(source, /h-auto[^"]*whitespace-normal/)
  assert.match(source, /min-h-\[320px\]/)
  assert.match(source, /text-base font-bold text-white/)
  assert.match(source, /text-sm text-white\/65 leading-relaxed/)
  assert.doesNotMatch(source, /text-\[10px\] text-white\/60 line-clamp-2/)
})

test('Clicking a model/style template applies a usable prompt so generation does not require manual prompt writing', () => {
  const source = toolPage()
  assert.match(source, /const injectedPrompt/)
  assert.match(source, /setPrompt\(current =>/)
  assert.match(source, /applyTemplatePayload\(payload, \{ replacePrompt: true/)
  assert.match(source, /setPickerOpen\(false\)/)
})

test('User account compact trigger renders one clean avatar shape without nested border frames', () => {
  const source = userMenu()
  assert.match(source, /compact \? 'h-10 w-10 rounded-full p-0'/)
  assert.match(source, /compact \? 'h-full w-full border-0'/)
  assert.doesNotMatch(source, /compact \? 'px-3 py-2'/)
})
