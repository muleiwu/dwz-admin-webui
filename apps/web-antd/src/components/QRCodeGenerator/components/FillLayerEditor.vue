<template>
  <div class="fill-layer-editor">
    <FormItem label="图层名称">
      <Input v-model:value="localLayer.name" placeholder="输入图层名称" />
    </FormItem>

    <FormItem label="填充类型">
      <Select v-model:value="fillType" @change="handleFillTypeChange">
        <SelectOption value="solid">纯色</SelectOption>
        <SelectOption value="gradient">渐变色</SelectOption>
      </Select>
    </FormItem>

    <template v-if="fillType === 'solid'">
      <FormItem label="颜色">
        <div class="flex items-center gap-2">
          <Input
            v-model:value="localLayer.color"
            type="color"
            class="w-20"
          />
          <Input
            v-model:value="localLayer.color"
            class="flex-1"
            placeholder="#000000"
          />
        </div>
      </FormItem>
    </template>

    <template v-else-if="fillType === 'gradient'">
      <FormItem label="渐变类型">
        <Select v-model:value="localLayer.gradient!.type">
          <SelectOption value="linear">线性渐变</SelectOption>
          <SelectOption value="radial">径向渐变</SelectOption>
        </Select>
      </FormItem>

      <FormItem v-if="localLayer.gradient!.type === 'linear'" label="渐变方向">
        <Select v-model:value="localLayer.gradient!.direction">
          <SelectOption value="horizontal">水平</SelectOption>
          <SelectOption value="vertical">垂直</SelectOption>
          <SelectOption value="diagonal">对角线</SelectOption>
        </Select>
      </FormItem>

      <FormItem label="渐变色">
        <Space direction="vertical" :style="{ width: '100%' }" :size="12">
          <Card
            v-for="(colorStop, index) in localLayer.gradient!.colors"
            :key="index"
            size="small"
            :body-style="{ padding: '12px' }"
          >
            <Space :style="{ width: '100%' }" :size="8">
              <Input
                v-model:value="colorStop.color"
                type="color"
                :style="{ width: '64px' }"
              />
              <div :style="{ flex: 1, minWidth: 0 }">
                <Slider
                  v-model:value="colorStop.offset"
                  :min="0"
                  :max="1"
                  :step="0.01"
                />
              </div>
              <InputNumber
                v-model:value="colorStop.offset"
                :min="0"
                :max="1"
                :step="0.01"
                :style="{ width: '80px' }"
              />
              <Button
                v-if="localLayer.gradient!.colors.length > 2"
                size="small"
                danger
                @click="removeColorStop(index)"
              >
                删除
              </Button>
            </Space>
          </Card>
          <Button
            v-if="localLayer.gradient!.colors.length < 5"
            block
            @click="addColorStop"
          >
            添加颜色
          </Button>
        </Space>
      </FormItem>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';

import {
  Button,
  Card,
  FormItem,
  Input,
  InputNumber,
  Select,
  SelectOption,
  Slider,
  Space,
} from 'ant-design-vue';

import type { FillLayer } from '../../../types/qrcode';

const props = defineProps<{
  layer: FillLayer;
}>();

const emit = defineEmits<{
  update: [layer: FillLayer];
}>();

const localLayer = reactive<FillLayer>({ ...props.layer });

// 判断填充类型
const fillType = computed(() => {
  return localLayer.gradient ? 'gradient' : 'solid';
});

// 处理填充类型变化
const handleFillTypeChange = (value: string) => {
  if (value === 'solid') {
    delete localLayer.gradient;
    localLayer.color = '#000000';
  } else {
    delete localLayer.color;
    localLayer.gradient = {
      type: 'linear',
      direction: 'diagonal',
      colors: [
        { offset: 0, color: '#000000' },
        { offset: 1, color: '#0066ff' },
      ],
    };
  }
};

// 添加颜色节点
const addColorStop = () => {
  if (localLayer.gradient) {
    localLayer.gradient.colors.push({
      offset: 0.5,
      color: '#888888',
    });
  }
};

// 删除颜色节点
const removeColorStop = (index: number) => {
  if (localLayer.gradient) {
    localLayer.gradient.colors.splice(index, 1);
  }
};

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
.fill-layer-editor {
  padding: 16px;
}
</style>

