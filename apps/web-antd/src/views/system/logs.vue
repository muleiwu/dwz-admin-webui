<script setup lang="ts">
import type { OperationLog } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { Search } from '@vben/icons';

import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  DescriptionsItem,
  Input,
  message,
  Modal,
  Select,
  SelectOption,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { LogApi } from '#/api';

// 响应式数据
const loading = ref(false);
const dataSource = ref<OperationLog[]>([]);
const detailModalVisible = ref(false);
const currentRecord = ref<null | OperationLog>(null);

// 搜索参数
const searchParams = reactive({
  username: '',
  operation: undefined as string | undefined,
  resource: undefined as string | undefined,
  method: undefined as string | undefined,
  status: undefined as number | undefined,
  start_time: undefined as any,
  end_time: undefined as any,
});

// 分页
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

// 表格列定义
const columns = [
  {
    title: '操作时间',
    dataIndex: 'created_at',
    width: 150,
    customRender: ({ text }: { text: string }) => formatDate(text),
    sorter: true,
  },
  {
    title: '用户',
    dataIndex: 'username',
    width: 120,
  },
  {
    title: '操作',
    dataIndex: 'operation',
    width: 120,
    ellipsis: true,
  },
  {
    title: '资源',
    dataIndex: 'resource',
    width: 100,
  },
  {
    title: '方法',
    key: 'method',
    width: 80,
  },
  {
    title: '路径',
    dataIndex: 'path',
    width: 200,
    ellipsis: true,
  },
  {
    title: '状态码',
    key: 'response_code',
    width: 80,
  },
  {
    title: '执行时间',
    key: 'execute_time',
    width: 100,
    sorter: true,
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
  },
  {
    title: 'IP',
    dataIndex: 'ip',
    width: 120,
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    fixed: 'right' as const,
  },
];

// 方法
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      page_size: pagination.pageSize,
      username: searchParams.username,
      operation: searchParams.operation,
      resource: searchParams.resource,
      method: searchParams.method,
      status: searchParams.status,
      start_time: searchParams.start_time
        ? dayjs(searchParams.start_time).format('YYYY-MM-DD HH:mm:ss')
        : undefined,
      end_time: searchParams.end_time
        ? dayjs(searchParams.end_time).format('YYYY-MM-DD HH:mm:ss')
        : undefined,
    };
    const response = await LogApi.getList(params);
    dataSource.value = response.list;
    pagination.total = response.pagination.total;
    pagination.current = response.pagination.page;
    pagination.pageSize = response.pagination.page_size;
  } catch (error) {
    message.error('加载数据失败');
    console.error('Failed to load logs:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

const handleReset = () => {
  Object.assign(searchParams, {
    username: '',
    operation: undefined,
    resource: undefined,
    method: undefined,
    status: undefined,
    start_time: undefined,
    end_time: undefined,
  });
  pagination.current = 1;
  loadData();
};

const handleTableChange = (paginationData: any, filters: any, sorter: any) => {
  pagination.current = paginationData.current;
  pagination.pageSize = paginationData.pageSize;
  loadData();
};

const handleViewDetail = (record: OperationLog) => {
  currentRecord.value = record;
  detailModalVisible.value = true;
};

const getMethodColor = (method: string) => {
  const colors = {
    GET: 'blue',
    POST: 'green',
    PUT: 'orange',
    DELETE: 'red',
  };
  return colors[method as keyof typeof colors] || 'default';
};

const getResponseCodeColor = (code: number) => {
  if (code >= 200 && code < 300) return 'green';
  if (code >= 300 && code < 400) return 'blue';
  if (code >= 400 && code < 500) return 'orange';
  if (code >= 500) return 'red';
  return 'default';
};

const getExecuteTimeClass = (time: number) => {
  if (time < 100) return 'text-green-600';
  if (time < 500) return 'text-yellow-600';
  if (time < 1000) return 'text-orange-600';
  return 'text-red-600';
};

const formatDate = (dateString: string) => {
  return dayjs(dateString).format('MM-DD HH:mm:ss');
};

const formatJson = (jsonString: string) => {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, 2);
  } catch {
    return jsonString;
  }
};

// 生命周期
onMounted(() => {
  loadData();
});
</script>

<template>
  <Page
    description="查看系统操作日志，包括用户操作记录、API调用详情等信息"
    title="操作日志"
  >
    <!-- 搜索和筛选 -->
    <Card class="mb-4" title="搜索筛选">
      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Input
          v-model:value="searchParams.username"
          placeholder="搜索用户名"
          @press-enter="handleSearch"
        >
          <template #prefix>
            <Search class="h-4 w-4" />
          </template>
        </Input>
        <Select
          v-model:value="searchParams.operation"
          placeholder="选择操作类型"
          allow-clear
          @change="handleSearch"
        >
          <SelectOption value="创建短网址">创建短网址</SelectOption>
          <SelectOption value="更新短网址">更新短网址</SelectOption>
          <SelectOption value="删除短网址">删除短网址</SelectOption>
          <SelectOption value="创建域名">创建域名</SelectOption>
          <SelectOption value="更新域名">更新域名</SelectOption>
          <SelectOption value="删除域名">删除域名</SelectOption>
          <SelectOption value="创建用户">创建用户</SelectOption>
          <SelectOption value="更新用户">更新用户</SelectOption>
          <SelectOption value="删除用户">删除用户</SelectOption>
          <SelectOption value="创建AB测试">创建AB测试</SelectOption>
          <SelectOption value="更新AB测试">更新AB测试</SelectOption>
          <SelectOption value="删除AB测试">删除AB测试</SelectOption>
          <SelectOption value="用户登录">用户登录</SelectOption>
          <SelectOption value="用户登出">用户登出</SelectOption>
        </Select>
        <Select
          v-model:value="searchParams.resource"
          placeholder="选择资源类型"
          allow-clear
          @change="handleSearch"
        >
          <SelectOption value="short_link">短网址</SelectOption>
          <SelectOption value="domain">域名</SelectOption>
          <SelectOption value="user">用户</SelectOption>
          <SelectOption value="ab_test">AB测试</SelectOption>
          <SelectOption value="token">Token</SelectOption>
          <SelectOption value="auth">认证</SelectOption>
        </Select>
        <Select
          v-model:value="searchParams.method"
          placeholder="选择HTTP方法"
          allow-clear
          @change="handleSearch"
        >
          <SelectOption value="GET">GET</SelectOption>
          <SelectOption value="POST">POST</SelectOption>
          <SelectOption value="PUT">PUT</SelectOption>
          <SelectOption value="DELETE">DELETE</SelectOption>
        </Select>
      </div>
      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Select
          v-model:value="searchParams.status"
          placeholder="选择状态"
          allow-clear
          @change="handleSearch"
        >
          <SelectOption :value="1">成功</SelectOption>
          <SelectOption :value="0">失败</SelectOption>
        </Select>
        <DatePicker
          v-model:value="searchParams.start_time"
          placeholder="开始时间"
          show-time
          format="YYYY-MM-DD HH:mm:ss"
          @change="handleSearch"
        />
        <DatePicker
          v-model:value="searchParams.end_time"
          placeholder="结束时间"
          show-time
          format="YYYY-MM-DD HH:mm:ss"
          @change="handleSearch"
        />
      </div>
      <Space>
        <Button @click="handleReset">重置</Button>
        <Button type="primary" @click="handleSearch">查询</Button>
      </Space>
    </Card>

    <!-- 表格列表区域 -->
    <Card title="日志列表">
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'green' : 'red'">
              {{ record.status === 1 ? '成功' : '失败' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'method'">
            <Tag :color="getMethodColor(record.method)">
              {{ record.method }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'response_code'">
            <Tag :color="getResponseCodeColor(record.response_code)">
              {{ record.response_code }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'execute_time'">
            <span :class="getExecuteTimeClass(record.execute_time)">
              {{ record.execute_time }}ms
            </span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="flex space-x-2">
              <Button
                size="small"
                type="link"
                @click="handleViewDetail(record as OperationLog)"
              >
                详情
              </Button>
            </div>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailModalVisible"
      title="操作日志详情"
      width="800px"
      :footer="null"
    >
      <div v-if="currentRecord">
        <Descriptions :column="2" bordered size="small">
          <DescriptionsItem label="操作用户">
            {{ currentRecord.username }}
          </DescriptionsItem>
          <DescriptionsItem label="操作类型">
            {{ currentRecord.operation }}
          </DescriptionsItem>
          <DescriptionsItem label="资源类型">
            {{ currentRecord.resource }}
          </DescriptionsItem>
          <DescriptionsItem label="资源ID">
            {{ currentRecord.resource_id }}
          </DescriptionsItem>
          <DescriptionsItem label="HTTP方法">
            <Tag :color="getMethodColor(currentRecord.method)">
              {{ currentRecord.method }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="请求路径">
            {{ currentRecord.path }}
          </DescriptionsItem>
          <DescriptionsItem label="响应码">
            <Tag :color="getResponseCodeColor(currentRecord.response_code)">
              {{ currentRecord.response_code }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="执行时间">
            <span :class="getExecuteTimeClass(currentRecord.execute_time)">
              {{ currentRecord.execute_time }}ms
            </span>
          </DescriptionsItem>
          <DescriptionsItem label="客户端IP">
            {{ currentRecord.ip }}
          </DescriptionsItem>
          <DescriptionsItem label="状态">
            <Tag :color="currentRecord.status === 1 ? 'green' : 'red'">
              {{ currentRecord.status === 1 ? '成功' : '失败' }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="操作时间" :span="2">
            {{ formatDate(currentRecord.created_at) }}
          </DescriptionsItem>
        </Descriptions>

        <div class="mt-4">
          <h4 class="mb-2 font-semibold">User Agent</h4>
          <div class="rounded p-2 text-sm">
            {{ currentRecord.user_agent }}
          </div>
        </div>

        <div v-if="currentRecord.request_body" class="mt-4">
          <h4 class="mb-2 font-semibold">请求内容</h4>
          <pre class="max-h-40 overflow-auto rounded p-3 text-xs">{{
            formatJson(currentRecord.request_body)
          }}</pre>
        </div>

        <div v-if="currentRecord.response_body" class="mt-4">
          <h4 class="mb-2 font-semibold">响应内容</h4>
          <pre class="max-h-40 overflow-auto rounded p-3 text-xs">{{
            formatJson(currentRecord.response_body)
          }}</pre>
        </div>

        <div v-if="currentRecord.error_message" class="mt-4">
          <h4 class="mb-2 font-semibold text-red-600">错误信息</h4>
          <div
            class="rounded border border-red-200 p-3 text-sm text-red-800"
          >
            {{ currentRecord.error_message }}
          </div>
        </div>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
