<template>
  <div class="text-layer-editor">
    <FormItem label="图层名称">
      <Input v-model:value="localLayer.name" placeholder="输入图层名称" />
    </FormItem>

    <FormItem label="文本内容">
      <Textarea
        v-model:value="localLayer.text"
        placeholder="输入文本内容"
        :rows="3"
      />
    </FormItem>

    <FormItem label="位置">
      <Select v-model:value="localLayer.position">
        <SelectOption value="top">顶部</SelectOption>
        <SelectOption value="bottom">底部</SelectOption>
        <SelectOption value="custom">自定义位置</SelectOption>
      </Select>
    </FormItem>

    <template v-if="localLayer.position === 'custom'">
      <FormItem label="X 坐标">
        <InputNumber
          v-model:value="customX"
          :min="0"
          :max="100"
          class="w-full"
          addon-after="%"
        />
      </FormItem>
      <FormItem label="Y 坐标">
        <InputNumber
          v-model:value="customY"
          :min="0"
          :max="100"
          class="w-full"
          addon-after="%"
        />
      </FormItem>
    </template>

    <FormItem label="字体大小">
      <Slider
        v-model:value="localLayer.fontSize"
        :min="12"
        :max="72"
        :step="1"
      />
      <InputNumber
        v-model:value="localLayer.fontSize"
        :min="12"
        :max="72"
        class="mt-2 w-full"
        addon-after="px"
      />
    </FormItem>

    <FormItem label="字体颜色">
      <div class="flex items-center gap-2">
        <Input v-model:value="localLayer.color" type="color" class="w-20" />
        <Input
          v-model:value="localLayer.color"
          class="flex-1"
          placeholder="#000000"
        />
      </div>
    </FormItem>

    <FormItem label="字体">
      <Select v-model:value="localLayer.fontFamily">
        <SelectOption value="Arial">Arial</SelectOption>
        <SelectOption value="Helvetica">Helvetica</SelectOption>
        <SelectOption value="Times New Roman">Times New Roman</SelectOption>
        <SelectOption value="微软雅黑">微软雅黑</SelectOption>
        <SelectOption value="黑体">黑体</SelectOption>
        <SelectOption value="宋体">宋体</SelectOption>
      </Select>
    </FormItem>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import {
  FormItem,
  Input,
  InputNumber,
  Select,
  SelectOption,
  Slider,
  Textarea,
} from 'ant-design-vue';

import type { TextLayer } from '../../../types/qrcode';

const props = defineProps<{
  layer: TextLayer;
  canvasSize: number;
}>();

const emit = defineEmits<{
  update: [layer: TextLayer];
}>();

const localLayer = reactive<TextLayer>({ ...props.layer });

// 自定义坐标（百分比）
const customX = computed({
  get: () => {
    if (localLayer.customPosition) {
      return (localLayer.customPosition.x / props.canvasSize) * 100;
    }
    return 50;
  },
  set: (value: number) => {
    if (!localLayer.customPosition) {
      localLayer.customPosition = { x: 0, y: 0 };
    }
    localLayer.customPosition.x = (value / 100) * props.canvasSize;
  },
});

const customY = computed({
  get: () => {
    if (localLayer.customPosition) {
      return (localLayer.customPosition.y / props.canvasSize) * 100;
    }
    return 50;
  },
  set: (value: number) => {
    if (!localLayer.customPosition) {
      localLayer.customPosition = { x: 0, y: 0 };
    }
    localLayer.customPosition.y = (value / 100) * props.canvasSize;
  },
});

// 监听变化并触发更新
watch(
  localLayer,
  () => {
    emit('update', { ...localLayer });
  },
  { deep: true },
);
</script>

<style scoped>
.text-layer-editor {
  padding: 16px;
}
</style>

