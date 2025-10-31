<template>
  <div class="foreground-editor">
    <FormItem label="前景模式">
      <Select v-model:value="foregroundMode" @change="handleModeChange">
        <SelectOption value="solid">纯色</SelectOption>
        <SelectOption value="gradient">渐变</SelectOption>
        <SelectOption value="colorful">彩色定位角</SelectOption>
      </Select>
    </FormItem>

    <!-- 纯色模式 -->
    <template v-if="foregroundMode === 'solid'">
      <FormItem label="颜色">
        <div class="flex items-center gap-2">
          <Input
            v-model:value="solidColor"
            type="color"
            class="w-20"
            @input="emitUpdate"
          />
          <Input
            v-model:value="solidColor"
            class="flex-1"
            placeholder="#000000"
            @input="emitUpdate"
          />
        </div>
      </FormItem>
    </template>

    <!-- 渐变模式 -->
    <template v-else-if="foregroundMode === 'gradient'">
      <FormItem label="渐变类型">
        <Select v-model:value="gradientConfig.type" @change="emitUpdate">
          <SelectOption value="linear">线性渐变</SelectOption>
          <SelectOption value="radial">径向渐变</SelectOption>
        </Select>
      </FormItem>

      <FormItem v-if="gradientConfig.type === 'linear'" label="渐变方向">
        <Select v-model:value="gradientConfig.direction" @change="emitUpdate">
          <SelectOption value="horizontal">水平（左→右）</SelectOption>
          <SelectOption value="vertical">垂直（上→下）</SelectOption>
          <SelectOption value="diagonal">对角线（左上→右下）</SelectOption>
        </Select>
      </FormItem>

      <FormItem label="渐变色">
        <Space direction="vertical" :style="{ width: '100%' }" :size="12">
          <Card
            v-for="(colorStop, index) in gradientConfig.colors"
            :key="index"
            size="small"
            :body-style="{ padding: '12px' }"
          >
            <Space :style="{ width: '100%' }" :size="8">
              <Input
                v-model:value="colorStop.color"
                type="color"
                :style="{ width: '64px' }"
                @input="emitUpdate"
              />
              <div :style="{ flex: 1, minWidth: 0 }">
                <Slider
                  v-model:value="colorStop.offset"
                  :min="0"
                  :max="1"
                  :step="0.01"
                  @change="emitUpdate"
                />
              </div>
              <InputNumber
                v-model:value="colorStop.offset"
                :min="0"
                :max="1"
                :step="0.01"
                :style="{ width: '80px' }"
                @change="emitUpdate"
              />
              <Button
                v-if="gradientConfig.colors.length > 2"
                size="small"
                danger
                @click="removeColorStop(index)"
              >
                删除
              </Button>
            </Space>
          </Card>
          <Button
            v-if="gradientConfig.colors.length < 5"
            block
            @click="addColorStop"
          >
            添加颜色
          </Button>
        </Space>
      </FormItem>
    </template>

    <!-- 彩色定位角模式 -->
    <template v-else-if="foregroundMode === 'colorful'">
      <FormItem label="主体颜色">
        <div class="flex items-center gap-2">
          <Input
            v-model:value="colorfulConfig.mainColor"
            type="color"
            class="w-20"
            @input="emitUpdate"
          />
          <Input
            v-model:value="colorfulConfig.mainColor"
            class="flex-1"
            placeholder="#5555aa"
            @input="emitUpdate"
          />
        </div>
      </FormItem>

      <FormItem label="定位角外框颜色">
        <div class="flex items-center gap-2">
          <Input
            v-model:value="colorfulConfig.outerColor"
            type="color"
            class="w-20"
            @input="emitUpdate"
          />
          <Input
            v-model:value="colorfulConfig.outerColor"
            class="flex-1"
            placeholder="#cc3333"
            @input="emitUpdate"
          />
        </div>
      </FormItem>

      <FormItem label="定位角内框颜色">
        <div class="flex items-center gap-2">
          <Input
            v-model:value="colorfulConfig.innerColor"
            type="color"
            class="w-20"
            @input="emitUpdate"
          />
          <Input
            v-model:value="colorfulConfig.innerColor"
            class="flex-1"
            placeholder="#662211"
            @input="emitUpdate"
          />
        </div>
      </FormItem>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

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

import type {
  ColorfulPositionerConfig,
  GradientConfig,
  QRForegroundArea,
} from '../../../types/qrcode';

const props = defineProps<{
  foreground?: string | QRForegroundArea[];
  size?: number;
}>();

const emit = defineEmits<{
  update: [foreground: string | QRForegroundArea[]];
}>();

// 前景模式
const foregroundMode = ref<'solid' | 'gradient' | 'colorful'>('solid');

// 纯色
const solidColor = ref('#000000');

// 渐变配置
const gradientConfig = ref<GradientConfig>({
  type: 'linear',
  direction: 'diagonal',
  colors: [
    { offset: 0, color: '#1890ff' },
    { offset: 1, color: '#0050b3' },
  ],
});

// 彩色定位角配置
const colorfulConfig = ref<ColorfulPositionerConfig>({
  mainColor: '#5555aa',
  outerColor: '#cc3333',
  innerColor: '#662211',
});

// 初始化：解析 foreground 属性
const initializeFromProp = () => {
  if (!props.foreground) {
    foregroundMode.value = 'solid';
    solidColor.value = '#000000';
    return;
  }

  if (Array.isArray(props.foreground)) {
    // 彩色定位角模式
    foregroundMode.value = 'colorful';
    const mainColorItem = props.foreground.find(
      (item) => !item.row && !item.col,
    );
    if (mainColorItem) {
      colorfulConfig.value.mainColor = mainColorItem.style;
    }
    const outerColorItem = props.foreground.find(
      (item) => item.row === 0 && item.rows === 7 && item.col === 0,
    );
    if (outerColorItem) {
      colorfulConfig.value.outerColor = outerColorItem.style;
    }
    const innerColorItem = props.foreground.find(
      (item) => item.row === 2 && item.rows === 3 && item.col === 2,
    );
    if (innerColorItem) {
      colorfulConfig.value.innerColor = innerColorItem.style;
    }
  } else if (
    typeof props.foreground === 'string' &&
    props.foreground.startsWith('gradient:')
  ) {
    // 渐变模式
    foregroundMode.value = 'gradient';
    const parsed = parseGradientString(props.foreground);
    if (parsed) {
      gradientConfig.value = parsed;
    }
  } else {
    // 纯色模式
    foregroundMode.value = 'solid';
    solidColor.value = props.foreground;
  }
};

// 解析渐变字符串
const parseGradientString = (str: string): GradientConfig | null => {
  try {
    const parts = str.split(':');
    if (parts.length < 4) return null;

    const type = parts[1] as 'linear' | 'radial';
    const coords = parts[2];
    const colors = parts[3];

    if (!coords || !colors) return null;

    const coordValues = coords.split(',').map((v) => Number.parseInt(v, 10));
    const colorValues = colors.split(',');

    let direction: 'horizontal' | 'vertical' | 'diagonal' = 'diagonal';

    if (type === 'linear' && coordValues.length >= 4) {
      // 判断方向
      if (coordValues[0] === 0 && coordValues[1] === 0 && coordValues[3] === 0) {
        direction = 'horizontal';
      } else if (
        coordValues[0] === 0 &&
        coordValues[1] === 0 &&
        coordValues[2] === 0
      ) {
        direction = 'vertical';
      } else {
        direction = 'diagonal';
      }
    }

    const step = 1 / (colorValues.length - 1);
    const colorStops = colorValues.map((color, index) => ({
      offset: index * step,
      color: color.trim(),
    }));

    return {
      type,
      direction,
      colors: colorStops,
    };
  } catch {
    return null;
  }
};

// 生成渐变字符串
const generateGradientString = (): string => {
  const size = props.size || 400;
  const { type, direction } = gradientConfig.value;

  let coords = '';
  if (type === 'linear') {
    switch (direction) {
      case 'horizontal':
        coords = `0,0,${size},0`;
        break;
      case 'vertical':
        coords = `0,0,0,${size}`;
        break;
      case 'diagonal':
      default:
        coords = `0,0,${size},${size}`;
        break;
    }
  } else {
    // radial
    coords = `${size / 2},${size / 2},0,${size / 2},${size / 2},${size / 2}`;
  }

  const colors = gradientConfig.value.colors.map((c) => c.color).join(',');
  return `gradient:${type}:${coords}:${colors}`;
};

// 生成彩色定位角数组
const generateColorfulArray = (): QRForegroundArea[] => {
  return [
    // 主体颜色
    { style: colorfulConfig.value.mainColor },
    // 三个定位角外框
    { row: 0, rows: 7, col: 0, cols: 7, style: colorfulConfig.value.outerColor },
    {
      row: -7,
      rows: 7,
      col: 0,
      cols: 7,
      style: colorfulConfig.value.outerColor,
    },
    {
      row: 0,
      rows: 7,
      col: -7,
      cols: 7,
      style: colorfulConfig.value.outerColor,
    },
    // 三个定位角内框
    { row: 2, rows: 3, col: 2, cols: 3, style: colorfulConfig.value.innerColor },
    {
      row: -5,
      rows: 3,
      col: 2,
      cols: 3,
      style: colorfulConfig.value.innerColor,
    },
    {
      row: 2,
      rows: 3,
      col: -5,
      cols: 3,
      style: colorfulConfig.value.innerColor,
    },
  ];
};

// 发送更新
const emitUpdate = () => {
  let result: string | QRForegroundArea[];

  switch (foregroundMode.value) {
    case 'solid':
      result = solidColor.value;
      break;
    case 'gradient':
      result = generateGradientString();
      break;
    case 'colorful':
      result = generateColorfulArray();
      break;
    default:
      result = '#000000';
  }

  emit('update', result);
};

// 模式切换处理
const handleModeChange = () => {
  emitUpdate();
};

// 添加颜色节点
const addColorStop = () => {
  gradientConfig.value.colors.push({
    offset: 0.5,
    color: '#888888',
  });
  emitUpdate();
};

// 删除颜色节点
const removeColorStop = (index: number) => {
  gradientConfig.value.colors.splice(index, 1);
  emitUpdate();
};

// 监听 prop 变化
watch(
  () => props.foreground,
  () => {
    initializeFromProp();
  },
  { immediate: true },
);
</script>

<style scoped>
.foreground-editor {
  padding: 0;
}
</style>

