<template>
  <Modal
    v-model:open="visible"
    title="二维码生成器"
    width="1200px"
    :footer="null"
    @cancel="handleClose"
  >
    <div class="flex gap-6">
      <!-- 左侧：二维码显示区 -->
      <div class="qr-preview-container">
        <div class="qr-preview">
          <canvas ref="qrCanvasRef" />
        </div>
        <div class="mt-4 flex gap-2">
          <Button type="primary" block @click="() => handleDownloadQR('png')">
            下载 PNG
          </Button>
          <Button block @click="() => handleDownloadQR('jpg')">
            下载 JPG
          </Button>
          <Button block @click="handleResetConfig">重置</Button>
        </div>
      </div>

      <!-- 右侧：配置面板 -->
      <div class="flex-1">
        <Tabs v-model:activeKey="activeTabKey">
          <!-- 预设模板 -->
          <TabPane key="preset" tab="预设模板">
            <div class="preset-grid">
              <Card
                v-for="preset in presets"
                :key="preset.id"
                hoverable
                class="preset-card"
                :class="{ active: selectedPresetId === preset.id }"
                :body-style="{ padding: '16px' }"
                @click="applyPreset(preset.id)"
              >
                <div class="preset-name">{{ preset.name }}</div>
                <div class="preset-desc">{{ preset.description }}</div>
              </Card>
            </div>
          </TabPane>

          <!-- 基础配置 -->
          <TabPane key="basic" tab="基础配置">
            <Form layout="vertical" class="p-4">
              <FormItem label="二维码尺寸">
                <Slider
                  v-model:value="qrConfig.size"
                  :min="200"
                  :max="800"
                  :step="50"
                />
                <InputNumber
                  v-model:value="qrConfig.size"
                  :min="200"
                  :max="800"
                  class="mt-2 w-full"
                  addon-after="px"
                />
              </FormItem>

              <FormItem label="容错率">
                <Select v-model:value="qrConfig.correctLevel">
                  <SelectOption value="L">L - 低 (约 7%)</SelectOption>
                  <SelectOption value="M">M - 中 (约 15%)</SelectOption>
                  <SelectOption value="Q">Q - 高 (约 25%)</SelectOption>
                  <SelectOption value="H">H - 最高 (约 30%)</SelectOption>
                </Select>
              </FormItem>

              <FormItem label="背景色">
                <div class="flex items-center gap-2">
                  <Input
                    v-model:value="qrConfig.background"
                    type="color"
                    class="w-20"
                  />
                  <Input
                    v-model:value="qrConfig.background"
                    class="flex-1"
                    placeholder="#ffffff"
                  />
                </div>
              </FormItem>

              <FormItem label="前景配置">
                <ForegroundEditor
                  :foreground="qrConfig.foreground"
                  :size="qrConfig.size"
                  @update="(fg: string | QRForegroundArea[]) => (qrConfig.foreground = fg)"
                />
              </FormItem>

              <FormItem label="内边距">
                <Slider
                  v-model:value="qrConfig.padding"
                  :min="0"
                  :max="50"
                  :step="1"
                />
                <InputNumber
                  v-model:value="qrConfig.padding"
                  :min="0"
                  :max="50"
                  class="mt-2 w-full"
                  addon-after="px"
                />
              </FormItem>
            </Form>
          </TabPane>

          <!-- 图层管理 -->
          <TabPane key="layers" tab="图层管理">
            <div class="layer-manager p-4">
              <div class="layer-controls mb-4">
                <Space>
                  <Button @click="addLayer('fill')">添加填充层</Button>
                  <Button @click="addLayer('image')">添加图片层</Button>
                  <Button @click="addLayer('text')">添加文字层</Button>
                </Space>
              </div>

              <Space direction="vertical" :style="{ width: '100%' }" class="mb-4">
                <Card
                  v-for="layer in qrConfig.layers"
                  :key="layer.id"
                  size="small"
                  class="layer-card"
                  :class="{ active: selectedLayerId === layer.id }"
                  :body-style="{ padding: '12px' }"
                  @click="selectedLayerId = layer.id"
                >
                  <div class="layer-content">
                    <span class="layer-name">{{ layer.name }}</span>
                    <Space :size="8">
                      <Switch
                        v-model:checked="layer.visible"
                        size="small"
                        @click.stop
                      />
                      <Button
                        size="small"
                        danger
                        @click.stop="deleteLayer(layer.id)"
                      >
                        删除
                      </Button>
                    </Space>
                  </div>
                </Card>
              </Space>

              <!-- 图层编辑器 -->
              <div v-if="selectedLayer" class="layer-editor">
                <Divider>编辑图层</Divider>
                <FillLayerEditor
                  v-if="selectedLayer.type === 'fill'"
                  :layer="selectedLayer"
                  @update="(layer: QRCodeLayer) => Object.assign(selectedLayer, layer)"
                />
                <ImageLayerEditor
                  v-if="selectedLayer.type === 'image'"
                  :layer="selectedLayer"
                  @update="(layer: QRCodeLayer) => Object.assign(selectedLayer, layer)"
                />
                <TextLayerEditor
                  v-if="selectedLayer.type === 'text'"
                  :layer="selectedLayer"
                  :canvas-size="qrConfig.size"
                  @update="(layer: QRCodeLayer) => Object.assign(selectedLayer, layer)"
                />
              </div>
            </div>
          </TabPane>

          <!-- 特效 -->
          <TabPane key="effects" tab="特效">
            <EffectSelector
              :effect="qrConfig.effect"
              @update="(effect: QREffect) => (qrConfig.effect = effect)"
            />
          </TabPane>

          <!-- Logo -->
          <TabPane key="logo" tab="Logo">
            <Form layout="vertical" class="p-4">
              <FormItem label="Logo 类型">
                <Select v-model:value="logoType">
                  <SelectOption value="none">无 Logo</SelectOption>
                  <SelectOption value="image">图片 Logo</SelectOption>
                  <SelectOption value="text">文字 Logo</SelectOption>
                </Select>
              </FormItem>

              <!-- 图片 Logo 配置 -->
              <template v-if="logoType === 'image'">
                <FormItem label="Logo 图片">
                  <Upload
                    :show-upload-list="false"
                    accept="image/*"
                    :before-upload="handleLogoUpload"
                  >
                    <Button>
                      {{ qrConfig.logoImage ? '更换 Logo' : '上传 Logo' }}
                    </Button>
                  </Upload>
                  <div v-if="qrConfig.logoImage" class="mt-2">
                    <Card size="small" :body-style="{ padding: '8px' }">
                      <Image
                        :src="qrConfig.logoImage"
                        alt="Logo"
                        :width="120"
                        :height="120"
                        :preview="{ mask: '预览' }"
                        class="preview-logo"
                      />
                    </Card>
                    <Button
                      size="small"
                      danger
                      block
                      class="mt-2"
                      @click="removeLogoImage"
                    >
                      移除 Logo
                    </Button>
                  </div>
                </FormItem>

                <FormItem label="Logo 大小">
                  <Slider
                    v-model:value="qrConfig.logoSize"
                    :min="0.1"
                    :max="0.3"
                    :step="0.01"
                  />
                  <div class="mt-1 text-sm text-gray-500">
                    当前: {{ (qrConfig.logoSize * 100).toFixed(0) }}%
                  </div>
                </FormItem>
              </template>

              <!-- 文字 Logo 配置 -->
              <template v-if="logoType === 'text'">
                <FormItem label="文字内容">
                  <Input
                    v-model:value="qrConfig.logo!.text"
                    placeholder="输入文字"
                  />
                </FormItem>

                <FormItem label="文字颜色">
                  <div class="flex items-center gap-2">
                    <Input
                      v-model:value="qrConfig.logo!.options!.color"
                      type="color"
                      class="w-20"
                    />
                    <Input
                      v-model:value="qrConfig.logo!.options!.color"
                      class="flex-1"
                      placeholder="#1890ff"
                    />
                  </div>
                </FormItem>

                <FormItem label="字体大小">
                  <Slider
                    v-model:value="qrConfig.logo!.options!.fontSize"
                    :min="12"
                    :max="48"
                    :step="1"
                  />
                  <InputNumber
                    v-model:value="qrConfig.logo!.options!.fontSize"
                    :min="12"
                    :max="48"
                    class="mt-2 w-full"
                    addon-after="px"
                  />
                </FormItem>

                <FormItem label="Logo 大小">
                  <Slider
                    v-model:value="qrConfig.logo!.size"
                    :min="0.1"
                    :max="0.3"
                    :step="0.01"
                  />
                  <div class="mt-1 text-sm text-gray-500">
                    当前: {{ ((qrConfig.logo?.size || 0.2) * 100).toFixed(0) }}%
                  </div>
                </FormItem>

                <FormItem label="清除边缘点数">
                  <InputNumber
                    v-model:value="qrConfig.logo!.clearEdges"
                    :min="0"
                    :max="5"
                    class="w-full"
                  />
                  <div class="mt-1 text-sm text-gray-500">
                    清除 Logo 周围的二维码点，避免干扰文字
                  </div>
                </FormItem>
              </template>
            </Form>
          </TabPane>
        </Tabs>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import { useStorage } from '@vueuse/core';

import {
  Button,
  Card,
  Divider,
  Form,
  FormItem,
  Image,
  InputNumber,
  message,
  Modal,
  Select,
  SelectOption,
  Slider,
  Space,
  Switch,
  TabPane,
  Tabs,
  theme,
  Upload,
} from 'ant-design-vue';

import { useQRCodeGenerator } from '../../composables/useQRCodeGenerator';
import { getAllPresets } from '../../constants/qrcode-presets';
import type {
  ExportFormat,
  QRCodeConfig,
  QRCodeLayer,
  QREffect,
  QRForegroundArea,
} from '../../types/qrcode';
import EffectSelector from '../../views/shortlink/components/EffectSelector.vue';
import FillLayerEditor from '../../views/shortlink/components/FillLayerEditor.vue';
import ForegroundEditor from '../../views/shortlink/components/ForegroundEditor.vue';
import ImageLayerEditor from '../../views/shortlink/components/ImageLayerEditor.vue';
import TextLayerEditor from '../../views/shortlink/components/TextLayerEditor.vue';

// Props
interface Props {
  url: string;
  modelValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

// 控制显示/隐藏
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// Canvas ref
const qrCanvasRef = ref<HTMLCanvasElement | null>(null);

// 获取主题 token
const { token } = theme.useToken();

// 生成器定时器
let qrGenerateTimer: ReturnType<typeof setTimeout> | null = null;

// 使用新的配置结构
const qrConfig = useStorage<QRCodeConfig>('qrcode-generator-config', {
  size: 400,
  correctLevel: 'M',
  background: '#ffffff',
  foreground: '#000000',
  padding: 0,
  layers: [],
  effect: { type: 'none', value: 0 },
  logoImage: null,
  logoSize: 0.2,
} as QRCodeConfig);

// 图层管理
const selectedLayerId = ref<string | null>(null);
const activeTabKey = ref('preset');

// 预设列表
const presets = getAllPresets();
const selectedPresetId = ref('classic');

// 获取二维码生成器
const { generateQRCode, exportQRCode, downloadBlob } = useQRCodeGenerator();

// 当前选中的图层
const selectedLayer = computed(() => {
  return qrConfig.value.layers.find(
    (layer) => layer.id === selectedLayerId.value,
  );
});

// 生成二维码
const handleGenerateQR = async () => {
  if (!qrCanvasRef.value || !props.url) return;

  try {
    await generateQRCode(qrCanvasRef.value, props.url, qrConfig.value);
  } catch (error) {
    console.error('生成二维码失败:', error);
    message.error(
      '生成失败: ' + (error instanceof Error ? error.message : '未知错误'),
    );
  }
};

// 预设管理
const applyPreset = (presetId: string) => {
  const preset = presets.find((p) => p.id === presetId);
  if (preset && preset.config) {
    selectedPresetId.value = presetId;
    Object.assign(qrConfig.value, {
      ...qrConfig.value,
      ...preset.config,
    });
  }
};

// 图层管理
const addLayer = (type: QRCodeLayer['type']) => {
  const newLayer: Partial<QRCodeLayer> = {
    id: `layer-${Date.now()}`,
    type,
    visible: true,
    name: `${getLayerTypeName(type)} ${qrConfig.value.layers.length + 1}`,
  };

  switch (type) {
    case 'fill':
      Object.assign(newLayer, { color: '#000000' });
      break;
    case 'image':
      Object.assign(newLayer, { imageUrl: '', opacity: 0.1 });
      break;
    case 'text':
      Object.assign(newLayer, {
        text: '示例文本',
        position: 'bottom',
        fontSize: 16,
        color: '#000000',
        fontFamily: 'Arial',
      });
      break;
  }

  qrConfig.value.layers.push(newLayer as QRCodeLayer);
  selectedLayerId.value = newLayer.id!;
};

const deleteLayer = (layerId: string) => {
  const index = qrConfig.value.layers.findIndex((l) => l.id === layerId);
  if (index !== -1) {
    qrConfig.value.layers.splice(index, 1);
    if (selectedLayerId.value === layerId) {
      selectedLayerId.value = null;
    }
  }
};

const getLayerTypeName = (type: string): string => {
  const names: Record<string, string> = {
    fill: '填充层',
    image: '图片层',
    text: '文本层',
    logo: 'Logo层',
  };
  return names[type] || type;
};

// Logo 类型管理
const logoType = computed({
  get: () => {
    if (qrConfig.value.logoImage) return 'image';
    if (qrConfig.value.logo?.text) return 'text';
    return 'none';
  },
  set: (value: 'none' | 'image' | 'text') => {
    if (value === 'none') {
      qrConfig.value.logoImage = null;
      qrConfig.value.logo = undefined;
    } else if (value === 'text') {
      qrConfig.value.logoImage = null;
      qrConfig.value.logo = {
        text: 'QRCode',
        clearEdges: 2,
        size: 0.2,
        options: { color: '#1890ff', fontSize: 24 },
      };
    } else if (value === 'image') {
      qrConfig.value.logo = undefined;
      // logoImage 保持现有值或为 null
    }
  },
});

// Logo 管理
const handleLogoUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    qrConfig.value.logoImage = dataUrl;
  };
  reader.readAsDataURL(file);
  return false;
};

const removeLogoImage = () => {
  qrConfig.value.logoImage = null;
};

// 下载二维码
const handleDownloadQR = async (format: ExportFormat = 'png') => {
  if (!qrCanvasRef.value) return;

  try {
    const blob = await exportQRCode(qrCanvasRef.value, { format });
    const timestamp = Date.now();
    const filename = `qrcode-${timestamp}.${format}`;
    downloadBlob(blob, filename);
    message.success('下载成功');
  } catch (error) {
    console.error('下载失败:', error);
    message.error('下载失败');
  }
};

// 重置配置
const handleResetConfig = () => {
  applyPreset('classic');
  message.success('已重置为默认配置');
};

// 关闭弹窗
const handleClose = () => {
  visible.value = false;
};

// 监听配置变化，自动重新生成二维码（带防抖）
watch(
  () => qrConfig.value,
  () => {
    if (visible.value && qrCanvasRef.value) {
      // 清除之前的定时器
      if (qrGenerateTimer) {
        clearTimeout(qrGenerateTimer);
      }
      // 防抖：200ms后重新生成
      qrGenerateTimer = setTimeout(() => {
        nextTick(() => {
          handleGenerateQR();
        });
      }, 200);
    }
  },
  { deep: true },
);

// 监听显示状态，打开时生成二维码
watch(visible, (newValue) => {
  if (newValue) {
    activeTabKey.value = 'preset';
    nextTick(() => {
      handleGenerateQR();
    });
  }
});
</script>

<style scoped>
/* 二维码预览区域 */
.qr-preview-container {
  width: 500px;
  flex-shrink: 0;
}

.qr-preview {
  width: 500px;
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed v-bind('token.colorBorder');
  border-radius: v-bind('token.borderRadius + "px"');
  padding: 16px;
  background-color: v-bind('token.colorBgContainer');
}

.qr-preview canvas {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

/* 预设网格 */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.preset-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-width: 2px;
}

.preset-card.active {
  border-color: v-bind('token.colorPrimary');
  background-color: v-bind('token.colorPrimaryBg');
  box-shadow: 0 0 0 2px v-bind('token.colorPrimaryBgHover');
}

.preset-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: v-bind('token.colorText');
}

.preset-desc {
  font-size: 14px;
  color: v-bind('token.colorTextSecondary');
}

/* 图层管理 */
.layer-manager {
  max-height: 500px;
  overflow-y: auto;
}

.layer-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border-width: 2px;
}

.layer-card:hover {
  border-color: v-bind('token.colorPrimaryHover');
  background-color: v-bind('token.colorBgTextHover');
}

.layer-card.active {
  border-color: v-bind('token.colorPrimary');
  background-color: v-bind('token.colorPrimaryBg');
  box-shadow: 0 0 0 2px v-bind('token.colorPrimaryBgHover');
}

.layer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.layer-name {
  flex: 1;
  font-weight: 500;
  color: v-bind('token.colorText');
}

.layer-editor {
  margin-top: 16px;
}

/* Logo预览 */
.preview-logo {
  object-fit: contain;
  display: block;
}
</style>

