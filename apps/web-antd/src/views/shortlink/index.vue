<script setup lang="ts">
import type {
  CreateShortLinkRequest,
  Domain,
  ShortLink,
  ShortLinkStatistics,
} from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { Copy, Search } from '@vben/icons';

import {
  Button,
  Card,
  DatePicker,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  SelectOption,
  Space,
  Switch,
  Table,
  Textarea,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { DomainApi, ShortLinkApi } from '#/api';
import QRCodeGenerator from '../../components/QRCodeGenerator/index.vue';

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
                (checked: boolean) => handleStatusChange(record as ShortLink, checked)
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

    <!-- 二维码生成器组件 -->
    <QRCodeGenerator v-model="qrModalVisible" :url="currentQRUrl" />
  </Page>
</template>

<style scoped></style>
