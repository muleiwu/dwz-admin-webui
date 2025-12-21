<script setup lang="ts">
import type { Dayjs } from 'dayjs';

// 使用 API 定义的类型
import type {
  CreateTokenRequest,
  CreateTokenResponse,
  Token,
  TokenType,
} from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  CircleAlert,
  CircleCheckBig,
  Copy,
  Plus,
  Search,
  ShieldCheck,
} from '@vben/icons';

import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  RadioGroup,
  Select,
  SelectOption,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  isBearerTokenResponse,
  isSignatureTokenResponse,
  TokenApi,
} from '#/api';

// 响应式数据
const loading = ref(false);
const createLoading = ref(false);
const dataSource = ref<Token[]>([]);
const createModalVisible = ref(false);
const successModalVisible = ref(false);
const createdTokenResponse = ref<CreateTokenResponse | null>(null);
const createFormRef = ref();

// 搜索参数
const searchParams = reactive({
  token_name: '',
  status: undefined as number | undefined,
});

// 创建表单
const createForm = reactive<CreateTokenRequest>({
  token_name: '',
  token_type: 'signature' as TokenType,
  expire_at: undefined,
});

// 分页配置
const paginationConfig = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条记录`,
});

// 创建表单验证规则
const createRules = {
  token_name: [
    { required: true, message: '请输入Token名称', trigger: 'blur' as const },
    { max: 100, message: 'Token名称不能超过100字符', trigger: 'blur' as const },
  ],
  token_type: [
    { required: true, message: '请选择Token类型', trigger: 'change' as const },
  ],
} as any;

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: 'Token名称',
    dataIndex: 'token_name',
    width: 180,
  },
  {
    title: '认证类型',
    key: 'token_type',
    width: 140,
  },
  {
    title: 'Token / AppID',
    key: 'token_or_appid',
    width: 280,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '过期时间',
    key: 'expire_at',
    width: 160,
  },
  {
    title: '最后使用',
    key: 'last_used_at',
    width: 160,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 160,
    customRender: ({ text }: { text: string }) => formatDate(text),
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    fixed: 'right' as const,
  },
];

// 加载Token列表
const loadTokens = async () => {
  loading.value = true;
  try {
    const params = {
      page: paginationConfig.current,
      page_size: paginationConfig.pageSize,
      token_name: searchParams.token_name || undefined,
      status: searchParams.status,
    };

    const response = await TokenApi.getList(params);

    dataSource.value = response.list;
    paginationConfig.total = response.total;
    paginationConfig.current = response.page;
    paginationConfig.pageSize = response.size;
  } catch (error: any) {
    console.error('加载Token列表失败:', error);
    message.error(error?.message || '加载数据失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  paginationConfig.current = 1;
  loadTokens();
};

// 重置搜索
const handleReset = () => {
  searchParams.token_name = '';
  searchParams.status = undefined;
  paginationConfig.current = 1;
  loadTokens();
};

// 打开创建弹窗
const handleOpenCreateModal = () => {
  resetCreateForm();
  createModalVisible.value = true;
};

// 创建Token
const handleCreate = async () => {
  try {
    await createFormRef.value.validate();
    createLoading.value = true;

    const requestData: CreateTokenRequest = {
      token_name: createForm.token_name,
      token_type: createForm.token_type,
      expire_at: createForm.expire_at
        ? dayjs(createForm.expire_at).toISOString()
        : undefined,
    };

    const response = await TokenApi.create(requestData);

    message.success('Token创建成功');
    createdTokenResponse.value = response;
    createModalVisible.value = false;
    successModalVisible.value = true;

    // 刷新列表
    loadTokens();
  } catch (error: any) {
    console.error('创建Token失败:', error);
    message.error(error?.message || 'Token创建失败');
  } finally {
    createLoading.value = false;
  }
};

// 取消创建
const handleCreateCancel = () => {
  createModalVisible.value = false;
  resetCreateForm();
};

// 删除Token
const handleDelete = async (record: Token) => {
  try {
    await TokenApi.remove(record.id);
    message.success('Token删除成功');
    loadTokens();
  } catch (error: any) {
    console.error('删除Token失败:', error);
    message.error(error?.message || '删除失败');
  }
};

// 表格变化处理
const handleTableChange = (pagination: any) => {
  paginationConfig.current = pagination.current;
  paginationConfig.pageSize = pagination.pageSize;
  loadTokens();
};

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    message.success('复制成功');
  } catch (error) {
    console.error('复制失败:', error);
    message.error('复制失败，请手动复制');
  }
};

// 关闭成功弹窗
const closeSuccessModal = () => {
  successModalVisible.value = false;
  createdTokenResponse.value = null;
};

// 重置创建表单
const resetCreateForm = () => {
  createForm.token_name = '';
  createForm.token_type = 'signature';
  createForm.expire_at = undefined;
  createFormRef.value?.resetFields();
};

// 禁用日期（只能选择未来的日期）
const disabledDate = (current: Dayjs) => {
  return current && current < dayjs().endOf('day');
};

// Token掩码显示
const maskToken = (token?: string) => {
  if (!token) return '***';
  if (token.length <= 12) return token;
  return `${token.slice(0, 8)}...${token.slice(Math.max(0, token.length - 4))}`;
};

// 格式化日期
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 获取Token类型显示文本
const getTokenTypeLabel = (tokenType: TokenType) => {
  return tokenType === 'signature' ? '签名认证' : 'Bearer Token';
};

// 获取Token类型颜色
const getTokenTypeColor = (tokenType: TokenType) => {
  return tokenType === 'signature' ? 'green' : 'orange';
};

// 生命周期
onMounted(() => {
  loadTokens();
});
</script>

<template>
  <Page
    description="管理API Token，包括创建、查看和删除Token等功能"
    title="API Token管理"
  >
    <!-- 搜索和操作区域 -->
    <Card title="搜索筛选" class="mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <Input
            v-model:value="searchParams.token_name"
            placeholder="请输入Token名称"
            style="width: 200px"
            @press-enter="handleSearch"
          >
            <template #prefix>
              <Search class="h-4 w-4" />
            </template>
          </Input>

          <Select
            v-model:value="searchParams.status"
            placeholder="选择状态"
            style="width: 120px"
            allow-clear
          >
            <SelectOption :value="1">启用</SelectOption>
            <SelectOption :value="0">禁用</SelectOption>
          </Select>

          <Button type="primary" @click="handleSearch" :loading="loading">
            搜索
          </Button>

          <Button @click="handleReset"> 重置 </Button>
        </div>

        <Button type="primary" @click="handleOpenCreateModal">
          <Plus class="mr-1 h-4 w-4" />
          创建Token
        </Button>
      </div>
    </Card>

    <!-- 表格列表区域 -->
    <Card title="Token列表">
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="paginationConfig"
        row-key="id"
        :scroll="{ x: 1400 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 认证类型列 -->
          <template v-if="column.key === 'token_type'">
            <div class="flex items-center space-x-1">
              <Tag :color="getTokenTypeColor(record.token_type || 'bearer')">
                <template v-if="record.token_type === 'signature'">
                  <ShieldCheck class="mr-1 inline h-3 w-3" />
                </template>
                {{ getTokenTypeLabel(record.token_type || 'bearer') }}
              </Tag>
              <Tooltip
                v-if="record.token_type === 'bearer' || !record.token_type"
                title="Bearer Token 安全性较低，建议升级为签名认证"
              >
                <CircleAlert class="h-4 w-4 text-orange-500" />
              </Tooltip>
            </div>
          </template>

          <!-- Token / AppID 列 -->
          <template v-else-if="column.key === 'token_or_appid'">
            <div class="flex items-center space-x-2">
              <template v-if="record.token_type === 'signature'">
                <code
                  class="rounded bg-green-50 px-2 py-1 text-xs text-green-700"
                >
                  {{ record.app_id || '***' }}
                </code>
                <Button
                  v-if="record.app_id"
                  size="small"
                  type="link"
                  @click="copyToClipboard(record.app_id)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </template>
              <template v-else>
                <code class="rounded bg-gray-100 px-2 py-1 text-xs">
                  {{ maskToken(record.token) }}
                </code>
                <Button
                  v-if="record.token"
                  size="small"
                  type="link"
                  @click="copyToClipboard(record.token)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </template>
            </div>
          </template>

          <template v-else-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </Tag>
          </template>

          <template v-else-if="column.key === 'expire_at'">
            <span v-if="record.expire_at">
              {{ formatDate(record.expire_at) }}
            </span>
            <span v-else class="text-gray-500">永不过期</span>
          </template>

          <template v-else-if="column.key === 'last_used_at'">
            <span v-if="record.last_used_at">
              {{ formatDate(record.last_used_at) }}
            </span>
            <span v-else class="text-gray-500">从未使用</span>
          </template>

          <template v-else-if="column.key === 'actions'">
            <Popconfirm
              title="确定要删除这个Token吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="handleDelete(record as Token)"
            >
              <Button size="small" type="link" danger> 删除 </Button>
            </Popconfirm>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 创建Token弹窗 -->
    <Modal
      v-model:open="createModalVisible"
      title="创建API Token"
      width="520px"
      @ok="handleCreate"
      @cancel="handleCreateCancel"
      :confirm-loading="createLoading"
    >
      <Form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        layout="vertical"
      >
        <FormItem label="Token名称" name="token_name">
          <Input
            v-model:value="createForm.token_name"
            placeholder="请输入Token名称"
            :maxlength="100"
          />
        </FormItem>

        <FormItem label="认证类型" name="token_type">
          <RadioGroup v-model:value="createForm.token_type">
            <div class="space-y-3">
              <div
                class="flex items-start rounded-lg border p-3"
                :class="
                  createForm.token_type === 'signature'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200'
                "
              >
                <Radio value="signature" class="mt-0.5">
                  <div class="ml-1">
                    <div class="flex items-center font-medium">
                      <ShieldCheck class="mr-1 h-4 w-4 text-green-600" />
                      签名认证
                      <Tag color="green" class="ml-2">推荐</Tag>
                    </div>
                    <div class="mt-1 text-xs text-gray-500">
                      使用 HMAC-SHA256 签名验证，密钥不在网络传输，安全性更高
                    </div>
                  </div>
                </Radio>
              </div>
              <div
                class="flex items-start rounded-lg border p-3"
                :class="
                  createForm.token_type === 'bearer'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200'
                "
              >
                <Radio value="bearer" class="mt-0.5">
                  <div class="ml-1">
                    <div class="flex items-center font-medium">
                      Bearer Token
                    </div>
                    <div class="mt-1 text-xs text-gray-500">
                      传统 Token 认证方式，Token 直接在请求头中传输
                    </div>
                  </div>
                </Radio>
              </div>
            </div>
          </RadioGroup>
          <Alert
            v-if="createForm.token_type === 'bearer'"
            type="warning"
            show-icon
            class="mt-3"
            message="安全提示"
            description="Bearer Token 在网络传输中可能被截获，建议仅在内网环境或测试场景使用。生产环境推荐使用签名认证。"
          />
        </FormItem>

        <FormItem label="过期时间" name="expire_at">
          <DatePicker
            v-model:value="createForm.expire_at"
            show-time
            placeholder="选择过期时间，留空则永不过期"
            style="width: 100%"
            :disabled-date="disabledDate"
          />
        </FormItem>
      </Form>
    </Modal>

    <!-- Token创建成功弹窗 - 签名认证类型 -->
    <Modal
      v-model:open="successModalVisible"
      title="Token创建成功"
      width="640px"
      :footer="null"
      :mask-closable="false"
      :closable="false"
    >
      <div class="text-center">
        <div class="mb-4">
          <CircleCheckBig class="mx-auto h-12 w-12 text-green-500" />
        </div>
        <h3 class="mb-4 text-lg font-semibold">Token创建成功！</h3>

        <!-- 签名认证类型成功提示 -->
        <template
          v-if="
            createdTokenResponse &&
            isSignatureTokenResponse(createdTokenResponse)
          "
        >
          <div class="mb-4 rounded border border-yellow-200 bg-yellow-50 p-4">
            <p class="text-sm text-yellow-800">
              <strong>重要提示：</strong>
              请立即复制并安全保存您的 App ID 和 App
              Secret，离开此页面后将无法再次查看 App Secret！
            </p>
          </div>

          <div class="space-y-4 text-left">
            <!-- App ID -->
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                App ID
              </label>
              <div class="rounded border bg-gray-50 p-3">
                <div class="flex items-center justify-between">
                  <code class="mr-2 flex-1 break-all font-mono text-sm">
                    {{ createdTokenResponse.app_id }}
                  </code>
                  <Button
                    type="primary"
                    size="small"
                    @click="copyToClipboard(createdTokenResponse.app_id)"
                  >
                    <Copy class="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
              </div>
            </div>

            <!-- App Secret -->
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700">
                App Secret
                <Tag color="red" class="ml-2">仅显示一次</Tag>
              </label>
              <div class="rounded border border-red-200 bg-red-50 p-3">
                <div class="flex items-center justify-between">
                  <code
                    class="mr-2 flex-1 break-all font-mono text-sm text-red-700"
                  >
                    {{ createdTokenResponse.app_secret }}
                  </code>
                  <Button
                    type="primary"
                    danger
                    size="small"
                    @click="copyToClipboard(createdTokenResponse.app_secret)"
                  >
                    <Copy class="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Bearer Token 类型成功提示 -->
        <template
          v-else-if="
            createdTokenResponse && isBearerTokenResponse(createdTokenResponse)
          "
        >
          <div class="mb-4 rounded border border-yellow-200 bg-yellow-50 p-4">
            <p class="text-sm text-yellow-800">
              <strong>重要提示：</strong>
              请立即复制并保存您的 Token，离开此页面后将无法再次查看完整 Token！
            </p>
          </div>

          <div class="text-left">
            <label class="mb-1 block text-sm font-medium text-gray-700">
              Bearer Token
              <Tag color="red" class="ml-2">仅显示一次</Tag>
            </label>
            <div class="rounded border bg-gray-50 p-3">
              <div class="flex items-center justify-between">
                <code class="mr-2 flex-1 break-all font-mono text-sm">
                  {{ createdTokenResponse.token }}
                </code>
                <Button
                  type="primary"
                  @click="copyToClipboard(createdTokenResponse.token)"
                >
                  <Copy class="mr-1 h-4 w-4" />
                  复制
                </Button>
              </div>
            </div>
          </div>
        </template>

        <div class="mt-6 flex justify-center">
          <Button type="primary" size="large" @click="closeSuccessModal">
            我已安全保存
          </Button>
        </div>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
code {
  @apply font-mono;
}
</style>
