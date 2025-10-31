<script setup lang="ts">
import type {
  CreateShortLinkRequest,
  Domain,
  ShortLink,
  ShortLinkStatistics,
} from '#/api';

import { nextTick, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { Copy, Search } from '@vben/icons';
import { useStorage } from '@vueuse/core';

import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  SelectOption,
  Slider,
  Space,
  Switch,
  Table,
  Textarea,
  Tooltip,
  Upload,
} from 'ant-design-vue';
import dayjs from 'dayjs';
import { qrcanvas } from 'qrcanvas';

import { DomainApi, ShortLinkApi } from '#/api';

// 二维码配置接口
interface QRCodeConfig {
  size: number;
  colorDark: string;
  colorLight: string;
  correctLevel: 'L' | 'M' | 'Q' | 'H';
  // 高级配置
  useGradient: boolean;
  gradientStartColor: string;
  gradientEndColor: string;
  gradientDirection: 'horizontal' | 'vertical' | 'diagonal';
  dotScale: number;
  logoImage: string | null;
  backgroundImage: string | null;
}

// 响应式数据
const loading = ref(false);
const dataSource = ref<ShortLink[]>([]);
const domains = ref<Domain[]>([]);
const activeDomains = ref<Domain[]>([]);
const modalVisible = ref(false);
const batchModalVisible = ref(false);
const statsModalVisible = ref(false);
const isEdit = ref(false);
const currentRecord = ref<null | ShortLink>(null);
const currentStats = ref<null | ShortLinkStatistics>(null);
const formRef = ref();

// 二维码相关状态
const qrModalVisible = ref(false);
const currentQRUrl = ref('');
const qrCanvasRef = ref<HTMLCanvasElement | null>(null);

// 默认二维码配置
const defaultQRConfig: QRCodeConfig = {
  size: 400,
  colorDark: '#000000',
  colorLight: '#ffffff',
  correctLevel: 'M',
  useGradient: false,
  gradientStartColor: '#000000',
  gradientEndColor: '#0066ff',
  gradientDirection: 'diagonal',
  dotScale: 1.0,
  logoImage: null,
  backgroundImage: null,
};

// 使用 useStorage 保存配置到 localStorage
const qrConfig = useStorage<QRCodeConfig>('shortlink-qr-config', {
  ...defaultQRConfig,
});

// 搜索参数
const searchParams = reactive({
  keyword: '',
  domain: undefined as string | undefined,
});

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 表单数据
const formData = reactive<
  Omit<CreateShortLinkRequest, 'expire_at'> & {
    expire_at?: any;
    is_active?: boolean;
  }
>({
  original_url: '',
  domain: undefined,
  custom_code: '',
  title: '',
  description: '',
  expire_at: undefined,
  is_active: true,
});

// 批量创建表单
const batchFormData = reactive({
  domain: undefined as string | undefined,
});
const batchUrls = ref('');

// 表单验证规则
const formRules = {
  original_url: [
    { required: true, message: '请输入原始URL', trigger: 'blur' as const },
  ],
};

// 表格列定义
const columns = [
  {
    title: '短网址',
    key: 'short_url',
    dataIndex: 'short_url',
    width: 200,
  },
  {
    title: '原始URL',
    key: 'original_url',
    dataIndex: 'original_url',
    width: 250,
  },
  {
    title: '标题',
    dataIndex: 'title',
    width: 150,
  },
  {
    title: '点击数',
    dataIndex: 'click_count',
    width: 80,
  },
  {
    title: '状态',
    key: 'is_active',
    width: 80,
  },
  {
    title: '过期时间',
    key: 'expire_at',
    width: 120,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 120,
    customRender: ({ text }: { text: string }) => formatDate(text),
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    fixed: 'right' as const,
  },
];

// 统计表格列
const statsColumns = [
  {
    title: '日期',
    dataIndex: 'date',
  },
  {
    title: '点击数',
    dataIndex: 'click_count',
  },
];

// 方法
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      page_size: pagination.pageSize,
      keyword: searchParams.keyword,
      domain: searchParams.domain,
    };
    const response = await ShortLinkApi.getList(params);
    dataSource.value = response.list;
    pagination.total = response.total;
  } catch {
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

const loadDomains = async () => {
  try {
    const [allDomains, activeDomainList] = await Promise.all([
      DomainApi.getList(),
      DomainApi.getActiveList(),
    ]);

    // 检查响应数据结构并适配不同的返回格式
    let allDomainsArray: Domain[] = [];
    let activeDomainsArray: Domain[] = [];

    // 处理所有域名数据
    if (Array.isArray(allDomains)) {
      allDomainsArray = allDomains;
    } else if (allDomains && Array.isArray(allDomains.list)) {
      allDomainsArray = allDomains.list;
    } else {
      console.error('所有域名响应格式错误:', allDomains);
      throw new Error('所有域名数据格式错误');
    }

    // 处理活跃域名数据
    if (Array.isArray(activeDomainList)) {
      activeDomainsArray = activeDomainList;
    } else if (activeDomainList && Array.isArray(activeDomainList.list)) {
      activeDomainsArray = activeDomainList.list;
    } else {
      console.error('活跃域名响应格式错误:', activeDomainList);
      throw new Error('活跃域名数据格式错误');
    }

    domains.value = allDomainsArray;
    activeDomains.value = activeDomainsArray;

    if (activeDomainsArray.length === 0) {
      message.warning('当前没有可用的活跃域名，请先在域名管理中添加并启用域名');
    }
  } catch (error) {
    console.error('加载域名失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    message.error(`加载域名失败: ${errorMessage}`);
  }
};

const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

const handleReset = () => {
  searchParams.keyword = '';
  searchParams.domain = undefined;
  pagination.current = 1;
  loadData();
};

const handleTableChange = (paginationData: any) => {
  pagination.current = paginationData.current;
  pagination.pageSize = paginationData.pageSize;
  loadData();
};

const handleCreate = () => {
  isEdit.value = false;
  resetForm();
  modalVisible.value = true;
};

const handleEdit = (record: ShortLink) => {
  isEdit.value = true;
  currentRecord.value = record;
  Object.assign(formData, {
    original_url: record.original_url,
    domain: record.domain,
    custom_code: '', // 编辑时不允许修改短代码
    title: record.title,
    description: record.description,
    expire_at: record.expire_at ? dayjs(record.expire_at) : undefined,
    is_active: record.is_active,
  });
  modalVisible.value = true;
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    const data = {
      ...formData,
      expire_at: formData.expire_at
        ? dayjs(formData.expire_at).toISOString()
        : null,
    };

    if (isEdit.value && currentRecord.value) {
      await ShortLinkApi.update(currentRecord.value.id, data);
      message.success('更新成功');
    } else {
      await ShortLinkApi.create(data);
      message.success('创建成功');
    }

    modalVisible.value = false;
    loadData();
  } catch {
    message.error(isEdit.value ? '更新失败' : '创建失败');
  }
};

const handleCancel = () => {
  modalVisible.value = false;
  resetForm();
};

const handleDelete = async (record: ShortLink) => {
  try {
    await ShortLinkApi.remove(record.id);
    message.success('删除成功');
    loadData();
  } catch {
    message.error('删除失败');
  }
};

const handleStatusChange = async (record: ShortLink, checked: boolean) => {
  try {
    await ShortLinkApi.update(record.id, { is_active: checked });
    message.success('状态更新成功');
    loadData();
  } catch {
    message.error('状态更新失败');
  }
};

const handleBatchCreate = () => {
  batchFormData.domain = undefined;
  batchUrls.value = '';
  batchModalVisible.value = true;
};

const handleBatchSubmit = async () => {
  try {
    const urls = batchUrls.value
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      message.error('请输入至少一个URL');
      return;
    }

    const response = await ShortLinkApi.batchCreate({
      urls,
      domain: batchFormData.domain,
    });

    message.success(`成功创建 ${response.success.length} 个短网址`);
    if (response.failed.length > 0) {
      message.warning(`失败 ${response.failed.length} 个`);
    }

    batchModalVisible.value = false;
    loadData();
  } catch {
    message.error('批量创建失败');
  }
};

const handleBatchCancel = () => {
  batchModalVisible.value = false;
};

const handleViewStats = async (record: ShortLink) => {
  try {
    const stats = await ShortLinkApi.getStatistics(record.id, 30);
    currentStats.value = stats;
    statsModalVisible.value = true;
  } catch {
    message.error('获取统计数据失败');
  }
};

const handleCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
};

const resetForm = () => {
  Object.assign(formData, {
    original_url: '',
    domain: undefined,
    custom_code: '',
    title: '',
    description: '',
    expire_at: null,
    is_active: true,
  });
};

const truncateUrl = (url: string, maxLength = 50) => {
  return url.length > maxLength
    ? `${url.slice(0, Math.max(0, maxLength))}...`
    : url;
};

const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

// 二维码相关方法
const handleShowQRCode = (record: ShortLink) => {
  currentQRUrl.value = record.short_url;
  qrModalVisible.value = true;
  // 使用 nextTick 确保 DOM 已更新
  nextTick(() => {
    generateQRCode();
  });
};

const generateQRCode = () => {
  if (!qrCanvasRef.value || !currentQRUrl.value) return;

  const canvas = qrCanvasRef.value;
  const config = qrConfig.value;

  try {
    // 基础配置
    const options: any = {
      data: currentQRUrl.value,
      size: config.size,
      correctLevel: config.correctLevel,
    };

    // 如果启用渐变色
    if (config.useGradient) {
      options.foreground = createGradient(
        config.gradientStartColor,
        config.gradientEndColor,
        config.gradientDirection,
        config.size,
      );
    } else {
      options.foreground = config.colorDark;
    }

    options.background = config.colorLight;

    // 点缩放
    if (config.dotScale !== 1.0) {
      options.cellSize = config.dotScale;
    }

    // 生成二维码
    qrcanvas(options, canvas);

    // 如果有 logo 或背景图片，需要在生成后处理
    if (config.logoImage || config.backgroundImage) {
      addImagesToQRCode(canvas, config);
    }
  } catch (error) {
    console.error('生成二维码失败:', error);
    message.error('生成二维码失败');
  }
};

// 创建渐变色
const createGradient = (
  startColor: string,
  endColor: string,
  direction: string,
  size: number,
): CanvasGradient | string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return startColor;

  let gradient: CanvasGradient;

  switch (direction) {
    case 'horizontal':
      gradient = ctx.createLinearGradient(0, 0, size, 0);
      break;
    case 'vertical':
      gradient = ctx.createLinearGradient(0, 0, 0, size);
      break;
    case 'diagonal':
    default:
      gradient = ctx.createLinearGradient(0, 0, size, size);
      break;
  }

  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);

  return gradient;
};

// 在二维码上添加图片（logo 或背景）
const addImagesToQRCode = async (
  canvas: HTMLCanvasElement,
  config: QRCodeConfig,
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 添加背景图片
  if (config.backgroundImage) {
    try {
      const bgImg = new Image();
      bgImg.src = config.backgroundImage;
      await new Promise((resolve, reject) => {
        bgImg.onload = resolve;
        bgImg.onerror = reject;
      });
      ctx.globalAlpha = 0.1;
      ctx.drawImage(bgImg, 0, 0, config.size, config.size);
      ctx.globalAlpha = 1.0;
    } catch (error) {
      console.error('加载背景图片失败:', error);
    }
  }

  // 添加 logo
  if (config.logoImage) {
    try {
      const logoImg = new Image();
      logoImg.src = config.logoImage;
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });

      // Logo 大小约为二维码的 20%
      const logoSize = config.size * 0.2;
      const logoX = (config.size - logoSize) / 2;
      const logoY = (config.size - logoSize) / 2;

      // 绘制白色背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);

      // 绘制 logo
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.error('加载 Logo 失败:', error);
    }
  }
};

// 监听配置变化，自动重新生成二维码
watch(
  () => qrConfig.value,
  () => {
    if (qrModalVisible.value) {
      generateQRCode();
    }
  },
  { deep: true },
);

// 下载二维码
const handleDownloadQR = () => {
  if (!qrCanvasRef.value) return;

  try {
    qrCanvasRef.value.toBlob((blob) => {
      if (!blob) {
        message.error('生成图片失败');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const shortCode = currentQRUrl.value.split('/').pop() || 'qrcode';
      const timestamp = Date.now();
      link.download = `qrcode-${shortCode}-${timestamp}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      message.success('下载成功');
    });
  } catch (error) {
    console.error('下载失败:', error);
    message.error('下载失败');
  }
};

// 重置配置
const handleResetQRConfig = () => {
  qrConfig.value = { ...defaultQRConfig };
  message.success('已重置为默认配置');
};

// 处理图片上传
const handleImageUpload = (type: 'logo' | 'background') => {
  return {
    beforeUpload: (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (type === 'logo') {
          qrConfig.value.logoImage = dataUrl;
        } else {
          qrConfig.value.backgroundImage = dataUrl;
        }
      };
      reader.readAsDataURL(file);
      return false; // 阻止自动上传
    },
  };
};

// 移除图片
const handleRemoveImage = (type: 'logo' | 'background') => {
  if (type === 'logo') {
    qrConfig.value.logoImage = null;
  } else {
    qrConfig.value.backgroundImage = null;
  }
};

// 生命周期
onMounted(() => {
  loadData();
  loadDomains();
});
</script>

<template>
  <Page
    description="管理和监控您的短网址，支持批量创建、统计分析等功能"
    title="短网址管理"
  >
    <Card class="mb-4">
      <template #extra>
        <Space>
          <Button @click="handleBatchCreate">批量创建</Button>
          <Button type="primary" @click="handleCreate">创建短网址</Button>
        </Space>
      </template>

      <!-- 搜索和筛选 -->
      <Space class="mb-4">
        <Input
          v-model:value="searchParams.keyword"
          placeholder="搜索URL、标题或描述"
          style="width: 300px"
          @change="handleSearch"
        >
          <template #prefix>
            <Search class="h-4 w-4" />
          </template>
        </Input>
        <Select
          v-model:value="searchParams.domain"
          placeholder="选择域名"
          style="width: 200px"
          allow-clear
          @change="handleSearch"
        >
          <SelectOption
            v-for="domain in domains"
            :key="domain.id"
            :value="domain.domain"
          >
            {{ domain.domain }}
          </SelectOption>
        </Select>
        <Button @click="handleReset">重置</Button>
      </Space>
    </Card>

    <!-- 表格 -->
    <Card title="短网址列表">
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'short_url'">
            <Space>
              {{ record.short_url }}
              <Button
                size="small"
                type="link"
                @click="handleCopy(record.short_url)"
              >
                <Copy class="h-4 w-4" />
              </Button>
            </Space>
          </template>
          <template v-else-if="column.key === 'original_url'">
            <Tooltip :title="record.original_url">
              {{ truncateUrl(record.original_url) }}
            </Tooltip>
          </template>
          <template v-else-if="column.key === 'is_active'">
            <Switch
              :checked="record.is_active"
              @change="
                (checked) => handleStatusChange(record as ShortLink, !!checked)
              "
            />
          </template>
          <template v-else-if="column.key === 'expire_at'">
            <span v-if="record.expire_at">
              {{ formatDate(record.expire_at) }}
            </span>
            <span v-else class="text-gray-500">永不过期</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="flex space-x-2">
              <Button
                size="small"
                type="link"
                @click="handleShowQRCode(record as ShortLink)"
              >
                二维码
              </Button>
              <Button
                size="small"
                type="link"
                @click="handleViewStats(record as ShortLink)"
              >
                统计
              </Button>
              <Button
                size="small"
                type="link"
                @click="handleEdit(record as ShortLink)"
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个短网址吗？"
                @confirm="handleDelete(record as ShortLink)"
              >
                <Button size="small" type="link" danger>删除</Button>
              </Popconfirm>
            </div>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 创建/编辑弹窗 -->
    <Modal
      v-model:open="modalVisible"
      :title="isEdit ? '编辑短网址' : '创建短网址'"
      width="600px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <Form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <FormItem label="原始URL" name="original_url">
          <Input
            v-model:value="formData.original_url"
            placeholder="请输入原始URL"
          />
        </FormItem>
        <FormItem label="域名" name="domain">
          <Select
            v-model:value="formData.domain"
            placeholder="选择域名"
            allow-clear
          >
            <SelectOption
              v-for="domain in activeDomains"
              :key="domain.id"
              :value="domain.domain"
            >
              {{ domain.domain }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="自定义短代码" name="custom_code">
          <Input
            v-model:value="formData.custom_code"
            placeholder="留空则自动生成"
            :disabled="isEdit"
          />
          <div v-if="isEdit" class="mt-1 text-sm text-gray-500">
            编辑时不可修改短代码
          </div>
        </FormItem>
        <FormItem label="标题" name="title">
          <Input v-model:value="formData.title" placeholder="可选" />
        </FormItem>
        <FormItem label="描述" name="description">
          <Textarea
            v-model:value="formData.description"
            placeholder="可选"
            :rows="3"
          />
        </FormItem>
        <FormItem label="过期时间" name="expire_at">
          <DatePicker
            v-model:value="formData.expire_at"
            show-time
            placeholder="选择过期时间，留空则永不过期"
            style="width: 100%"
          />
        </FormItem>
        <FormItem v-if="isEdit" label="状态" name="is_active">
          <Switch
            v-model:checked="formData.is_active"
            checked-children="启用"
            un-checked-children="禁用"
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- 批量创建弹窗 -->
    <Modal
      v-model:open="batchModalVisible"
      title="批量创建短网址"
      width="600px"
      @ok="handleBatchSubmit"
      @cancel="handleBatchCancel"
    >
      <Form :model="batchFormData" layout="vertical">
        <FormItem label="域名">
          <Select
            v-model:value="batchFormData.domain"
            placeholder="选择域名"
            allow-clear
          >
            <SelectOption
              v-for="domain in activeDomains"
              :key="domain.id"
              :value="domain.domain"
            >
              {{ domain.domain }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="URL列表">
          <Textarea
            v-model:value="batchUrls"
            placeholder="每行一个URL"
            :rows="10"
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- 统计弹窗 -->
    <Modal
      v-model:open="statsModalVisible"
      title="短网址统计"
      width="800px"
      :footer="null"
    >
      <div v-if="currentStats">
        <div class="mb-4 grid grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">
              {{ currentStats.total_clicks }}
            </div>
            <div class="text-gray-500">总点击数</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">
              {{ currentStats.today_clicks }}
            </div>
            <div class="text-gray-500">今日点击</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600">
              {{ currentStats.week_clicks }}
            </div>
            <div class="text-gray-500">本周点击</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-purple-600">
              {{ currentStats.month_clicks }}
            </div>
            <div class="text-gray-500">本月点击</div>
          </div>
        </div>
        <div>
          <h3 class="mb-2 text-lg font-semibold">每日统计</h3>
          <Table
            :columns="statsColumns"
            :data-source="currentStats.daily_statistics"
            :pagination="false"
            size="small"
          />
        </div>
      </div>
    </Modal>

    <!-- 二维码弹窗 -->
    <Modal
      v-model:open="qrModalVisible"
      title="二维码生成器"
      width="1000px"
      :footer="null"
    >
      <div class="flex gap-6">
        <!-- 左侧：二维码显示区 -->
        <div class="flex-shrink-0">
          <div
            class="flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 p-4"
            :style="{ width: qrConfig.size + 40 + 'px', height: qrConfig.size + 40 + 'px' }"
          >
            <canvas ref="qrCanvasRef" />
          </div>
          <div class="mt-4 flex gap-2">
            <Button type="primary" block @click="handleDownloadQR">
              下载 PNG
            </Button>
            <Button block @click="handleResetQRConfig">重置默认</Button>
          </div>
        </div>

        <!-- 右侧：配置面板 -->
        <div class="flex-1 overflow-y-auto" style="max-height: 600px">
          <Form layout="vertical">
            <!-- 基础配置 -->
            <div class="mb-4">
              <h3 class="mb-3 text-base font-semibold">基础配置</h3>

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
                />
              </FormItem>

              <FormItem label="前景色">
                <div class="flex items-center gap-2">
                  <Input
                    v-model:value="qrConfig.colorDark"
                    type="color"
                    class="w-20"
                    :disabled="qrConfig.useGradient"
                  />
                  <Input
                    v-model:value="qrConfig.colorDark"
                    class="flex-1"
                    placeholder="#000000"
                    :disabled="qrConfig.useGradient"
                  />
                </div>
                <div v-if="qrConfig.useGradient" class="mt-1 text-sm text-gray-500">
                  启用渐变色后此选项被禁用
                </div>
              </FormItem>

              <FormItem label="背景色">
                <div class="flex items-center gap-2">
                  <Input
                    v-model:value="qrConfig.colorLight"
                    type="color"
                    class="w-20"
                  />
                  <Input
                    v-model:value="qrConfig.colorLight"
                    class="flex-1"
                    placeholder="#ffffff"
                  />
                </div>
              </FormItem>

              <FormItem label="容错率">
                <Select v-model:value="qrConfig.correctLevel">
                  <SelectOption value="L">L - 低 (约 7%)</SelectOption>
                  <SelectOption value="M">M - 中 (约 15%)</SelectOption>
                  <SelectOption value="Q">Q - 高 (约 25%)</SelectOption>
                  <SelectOption value="H">H - 最高 (约 30%)</SelectOption>
                </Select>
              </FormItem>
            </div>

            <Divider />

            <!-- 高级配置 -->
            <div class="mb-4">
              <h3 class="mb-3 text-base font-semibold">高级配置</h3>

              <FormItem label="启用渐变色">
                <Switch
                  v-model:checked="qrConfig.useGradient"
                  checked-children="开"
                  un-checked-children="关"
                />
              </FormItem>

              <template v-if="qrConfig.useGradient">
                <FormItem label="渐变起始色">
                  <div class="flex items-center gap-2">
                    <Input
                      v-model:value="qrConfig.gradientStartColor"
                      type="color"
                      class="w-20"
                    />
                    <Input
                      v-model:value="qrConfig.gradientStartColor"
                      class="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </FormItem>

                <FormItem label="渐变结束色">
                  <div class="flex items-center gap-2">
                    <Input
                      v-model:value="qrConfig.gradientEndColor"
                      type="color"
                      class="w-20"
                    />
                    <Input
                      v-model:value="qrConfig.gradientEndColor"
                      class="flex-1"
                      placeholder="#0066ff"
                    />
                  </div>
                </FormItem>

                <FormItem label="渐变方向">
                  <Select v-model:value="qrConfig.gradientDirection">
                    <SelectOption value="horizontal">水平</SelectOption>
                    <SelectOption value="vertical">垂直</SelectOption>
                    <SelectOption value="diagonal">对角线</SelectOption>
                  </Select>
                </FormItem>
              </template>

              <FormItem label="点缩放比例">
                <Slider
                  v-model:value="qrConfig.dotScale"
                  :min="0.5"
                  :max="1.0"
                  :step="0.05"
                />
                <div class="mt-1 text-sm text-gray-500">
                  当前: {{ qrConfig.dotScale.toFixed(2) }}
                </div>
              </FormItem>

              <FormItem label="Logo 图片">
                <Upload
                  :show-upload-list="false"
                  accept="image/*"
                  v-bind="handleImageUpload('logo')"
                >
                  <Button>
                    {{ qrConfig.logoImage ? '更换 Logo' : '上传 Logo' }}
                  </Button>
                </Upload>
                <div v-if="qrConfig.logoImage" class="mt-2">
                  <img
                    :src="qrConfig.logoImage"
                    alt="Logo"
                    class="h-16 w-16 rounded border"
                  />
                  <Button
                    size="small"
                    danger
                    class="ml-2"
                    @click="handleRemoveImage('logo')"
                  >
                    移除
                  </Button>
                </div>
              </FormItem>

              <FormItem label="背景图片">
                <Upload
                  :show-upload-list="false"
                  accept="image/*"
                  v-bind="handleImageUpload('background')"
                >
                  <Button>
                    {{
                      qrConfig.backgroundImage ? '更换背景' : '上传背景'
                    }}
                  </Button>
                </Upload>
                <div v-if="qrConfig.backgroundImage" class="mt-2">
                  <img
                    :src="qrConfig.backgroundImage"
                    alt="Background"
                    class="h-16 w-16 rounded border"
                  />
                  <Button
                    size="small"
                    danger
                    class="ml-2"
                    @click="handleRemoveImage('background')"
                  >
                    移除
                  </Button>
                </div>
                <div class="mt-1 text-sm text-gray-500">
                  背景图片会以低透明度显示
                </div>
              </FormItem>
            </div>
          </Form>
        </div>
      </div>
    </Modal>
  </Page>
</template>

<style scoped></style>
