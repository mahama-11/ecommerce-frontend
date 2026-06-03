# 多图模板接入与验证矩阵

状态：本矩阵用于约束图生图、多图生图、文生图在模板中心的可见范围、素材槽渲染、提交契约与后端/runtime 证据。

## 模板业务语义

模板不是单纯的 prompt 预设，而是同时声明：

1. `toolSlug`：适用哪个业务工具。
2. `inputMode`：`text_to_image` / `image_to_image` / `multi_image`。
3. `requiredAssets`：用户必须上传哪些素材槽，含 slot、role、label、required、constraints。
4. `applicability`：可用范围，含 product category、platform、industry、scenario、provider capability 以及 exclude 规则。
5. `defaultVariables` / `promptLayers`：生成描述与负向词的预填与编排。
6. runtime route hint：后端需把多图素材、slot map、route family 写入 runtime manifest。

## 业务模块接入矩阵

| 工具 | inputMode | 必填素材槽 | 模板范围要求 | 验证重点 |
| --- | --- | --- | --- | --- |
| 真人换模特 `changing-model` | image_to_image | `primary/model` | model/apparel 模板；不展示 food/home 场景模板 | 单图槽渲染；提交一个 source asset |
| 人台换模特 `changing-mannequin` | image_to_image | `primary/garment` | model/apparel 模板 | 人台/服装类模板过滤 |
| 换背景 `changing-bg` | image_to_image | `primary/model` | model/background 场景模板 | 模板 prompt 注入与单图提交 |
| AI穿衣 `ai-dressing` | multi_image | `garment` + `model` | apparel/model try-on 模板 | 至少 2 个必填槽；slot 顺序进入 `source_asset_map` |
| 穿戴商品 `ai-wearable` | multi_image | `product` + `body_reference` | jewelry/accessory/body-part 模板 | 不让非穿戴/食物模板出现 |
| 商品场景合成 `ai-product` | multi_image | `product` + `scene_reference` | product category + platform + scene 模板 | 场景参考图必须独立传入 runtime |
| 商品替换 `product-replacement` | multi_image | `reference_scene` + `product` | replacement/perspective 模板 | reference/product 角色不得倒置 |
| 手持商品 `handheld-goods` | multi_image | `product` + `hand_reference` | handheld/model/product 模板 | 手部姿态参考图进入 slot map |
| 服装套图 `clothing-image-suite` | multi_image | `front` + `back`，`detail` optional | apparel suite 模板 | optional 细节图不能阻塞生成；必填不足应前端阻断 |
| 商品套图 `product-image-suite` | multi_image | `front` + `side`，`detail` optional | product suite 模板 | 多视角素材保序提交 |
| 批量生成视频 `batch-generate-videos` | multi_image | `first_frame` + `style_frame` | video/style 模板 | 作为多参考图契约验证，runtime 后续再接视频 provider |
| 视频拼接 `video-concat` | multi_image | `clip_reference_a` + `clip_reference_b` | video concat 模板 | 作为多参考图契约验证，runtime 后续再接视频 provider |
| 场景素材生成 `scene-image` | text_to_image | 无 | text/scene 模板 | 不显示需要图片素材的模板；提交无 source asset |
| 姿势裂变、场景裂变、设计器、商品精修 | image_to_image | 单个 primary/reference/product 槽 | 对应工具/场景模板 | 不误接 multi_image 模板 |

## 必须通过的证据

- 前端 catalog 请求必须携带 `tool_slug`、`input_mode`、`product_category`、`platform`、`provider_capability`，且缓存 key 也包含这些上下文。
- 后端 template catalog 必须按声明的 `input_modes`、`product_categories`、`provider_capabilities` 与 exclude 规则过滤；未声明老模板作为 legacy 兼容可见。
- `use template` 响应必须返回 `inputMode`、`requiredAssets`、`applicability`，前端用这些字段驱动素材槽。
- 多图生成提交必须包含 `source_assets[]`，后端 runtime manifest 必须包含 `source_asset_ids`、`source_assets`、`source_asset_map`、`route_hint.runtime_route_family=generate/multi-image`。
- `text_to_image` 不应要求 source asset；`multi_image` 少于 2 个素材应阻断。
