<template>
  <div class="image-layer-editor">
    <FormItem label="图层名称">
      <Input v-model:value="localLayer.name" placeholder="输入图层名称" />
    </FormItem>

    <FormItem label="背景图片">
      <Upload
        :show-upload-list="false"
        accept="image/*"
        :before-upload="handleBeforeUpload"
      >
        <Button>
          {{ localLayer.imageUrl ? '更换图片' : '上传图片' }}
        </Button>
      </Upload>
      <div v-if="localLayer.imageUrl" class="mt-2">
        <Card size="small" :body-style="{ padding: '8px' }">
          <Image
            :src="localLayer.imageUrl"
            alt="背景图片"
            :width="120"
            :height="120"
            :preview="{ mask: '预览' }"
            class="preview-image"
          />
        </Card>
        <Button size="small" danger block class="mt-2" @click="removeImage">
          移除图片
        </Button>
      </div>
    </FormItem>

    <FormItem label="透明度">
      <Slider
        v-model:value="localLayer.opacity"
        :min="0"
        :max="1"
        :step="0.05"
      />
      <div class="mt-1 text-sm text-gray-500">
        当前: {{ (localLayer.opacity * 100).toFixed(0) }}%
      </div>
    </FormItem>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';

import {
  Button,
  Card,
  FormItem,
  Image,
  Input,
  Slider,
  Upload,
} from 'ant-design-vue';

import type { ImageLayer } from '../../../types/qrcode';

const props = defineProps<{
  layer: ImageLayer;
}>();

const emit = defineEmits<{
  update: [layer: ImageLayer];
}>();

const localLayer = reactive<ImageLayer>({ ...props.layer });

// 处理图片上传
const handleBeforeUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    localLayer.imageUrl = dataUrl;
  };
  reader.readAsDataURL(file);
  return false; // 阻止自动上传
};

// 移除图片
const removeImage = () => {
  localLayer.imageUrl = '';
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
.image-layer-editor {
  padding: 16px;
}

.preview-image {
  object-fit: cover;
  display: block;
}
</style>

