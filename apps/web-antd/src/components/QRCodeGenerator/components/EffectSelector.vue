<template>
  <div class="effect-selector">
    <FormItem label="特效类型">
      <Select v-model:value="localEffect.type" @change="handleEffectTypeChange">
        <SelectOption value="none">无特效</SelectOption>
        <SelectOption value="round">圆角效果</SelectOption>
        <SelectOption value="liquid">融合效果（液体风格）</SelectOption>
        <SelectOption value="dot">点状效果</SelectOption>
      </Select>
    </FormItem>

    <template v-if="localEffect.type !== 'none'">
      <FormItem label="特效强度">
        <Slider
          v-model:value="localEffect.value"
          :min="0"
          :max="1"
          :step="0.05"
        />
        <div class="mt-2 flex items-center gap-2">
          <InputNumber
            v-model:value="localEffect.value"
            :min="0"
            :max="1"
            :step="0.05"
            class="flex-1"
          />
          <span class="text-sm text-gray-500">
            {{ (localEffect.value * 100).toFixed(0) }}%
          </span>
        </div>
      </FormItem>

      <Alert
        :message="getEffectDescription()"
        type="info"
        show-icon
        class="effect-description"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';

import {
  Alert,
  FormItem,
  InputNumber,
  Select,
  SelectOption,
  Slider,
} from 'ant-design-vue';

import type { QREffect } from '../../../types/qrcode';

const props = defineProps<{
  effect: QREffect;
}>();

const emit = defineEmits<{
  update: [effect: QREffect];
}>();

const localEffect = reactive<QREffect>({ ...props.effect });

// 处理特效类型变化
const handleEffectTypeChange = () => {
  if (localEffect.type === 'none') {
    localEffect.value = 0;
  } else if (localEffect.value === 0) {
    localEffect.value = 0.5;
  }
};

// 获取特效描述
const getEffectDescription = (): string => {
  switch (localEffect.type) {
    case 'round':
      return '圆角效果会将二维码的方块变得更圆润，适合追求柔和视觉效果的场景。';
    case 'liquid':
      return '融合效果让二维码模块之间产生流动的连接，呈现液体般的视觉效果。';
    case 'dot':
      return '点状效果将二维码的方块转换为圆点，呈现出独特的视觉效果。';
    default:
      return '';
  }
};

// 监听变化并触发更新
watch(
  localEffect,
  () => {
    emit('update', { ...localEffect });
  },
  { deep: true },
);
</script>

<style scoped>
.effect-selector {
  padding: 16px;
}

.effect-description {
  margin-top: 16px;
}
</style>

