<script setup lang="ts">
import type { CreateDomainRequest, Domain } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  SelectOption,
  Switch,
  Table,
  Tag,
  Textarea,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { DomainApi } from '#/api';

// 响应式数据
const loading = ref(false);
const dataSource = ref<Domain[]>([]);
const modalVisible = ref(false);
const isEdit = ref(false);
const currentRecord = ref<Domain | null>(null);
const formRef = ref();

// 表单数据
const formData = reactive<CreateDomainRequest & { is_active?: boolean }>({
  domain: '',
  protocol: 'https',
  site_name: '',
  icp_number: '',
  police_number: '',
  pass_query_params: false,
  description: '',
  is_active: true,
  random_suffix_length: 2,
  enable_checksum: true,
});

// 表单验证规则
const formRules = {
  domain: [
    { required: true, message: '请输入域名', trigger: 'blur' as const },
    {
      type: 'string' as const,
      required: true,
      message: '请输入有效的域名，如：short.ly 或 dwz.example.com',
      trigger: 'blur' as const,
    },
  ],
  protocol: [
    { required: true, message: '请选择协议', trigger: 'change' as const },
  ],
};

// 表格列定义
const columns = [
  {
    title: '域名',
    key: 'domain',
    dataIndex: 'domain',
    width: 200,
  },
  {
    title: '协议',
    dataIndex: 'protocol',
    width: 80,
  },
  {
    title: '网站名称',
    dataIndex: 'site_name',
    width: 150,
    ellipsis: true,
  },
  {
    title: '状态',
    key: 'is_active',
    width: 80,
  },
  {
    title: '查询参数',
    key: 'pass_query_params',
    width: 100,
  },
  {
    title: '随机后缀位数',
    dataIndex: 'random_suffix_length',
    width: 120,
  },
  {
    title: '校验位',
    key: 'enable_checksum',
    width: 80,
  },
  {
    title: '描述',
    dataIndex: 'description',
    width: 150,
    ellipsis: true,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    width: 150,
    customRender: ({ text }: { text: string }) => formatDate(text),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right' as const,
  },
];

// 方法
const loadData = async () => {
  loading.value = true;
  try {
    const response = await DomainApi.getList();
    dataSource.value = response.list;
  } catch {
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

const handleCreate = () => {
  isEdit.value = false;
  resetForm();
  modalVisible.value = true;
};

const handleEdit = (record: Domain) => {
  isEdit.value = true;
  currentRecord.value = record;
  Object.assign(formData, {
    domain: record.domain,
    protocol: record.protocol,
    site_name: record.site_name,
    icp_number: record.icp_number,
    police_number: record.police_number,
    pass_query_params: record.pass_query_params,
    description: record.description,
    is_active: record.is_active,
    random_suffix_length: record.random_suffix_length ?? 2,
    enable_checksum: record.enable_checksum ?? true,
  });
  modalVisible.value = true;
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();

    if (isEdit.value && currentRecord.value) {
      await DomainApi.update(currentRecord.value.id, formData);
      message.success('更新成功');
    } else {
      await DomainApi.create(formData);
      message.success('创建成功');
    }

    modalVisible.value = false;
    await loadData();
  } catch {
    message.error(isEdit.value ? '更新失败' : '创建失败');
  }
};

const handleCancel = () => {
  modalVisible.value = false;
  resetForm();
};

const handleDelete = async (record: Domain) => {
  try {
    await DomainApi.remove(record.id);
    message.success('删除成功');
    loadData();
  } catch {
    message.error('删除失败');
  }
};

const handleStatusChange = async (record: Domain, checked: boolean) => {
  try {
    await DomainApi.updateStatus(record.id, { is_active: checked });
    message.success('状态更新成功');
    await loadData();
  } catch {
    message.error('状态更新失败');
  }
};

const resetForm = () => {
  Object.assign(formData, {
    domain: '',
    protocol: 'https',
    site_name: '',
    icp_number: '',
    police_number: '',
    pass_query_params: false,
    description: '',
    is_active: true,
    random_suffix_length: 2,
    enable_checksum: true,
  });
};

const formatDate = (dateString: string) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss');
};

// 生命周期
onMounted(() => {
  loadData();
});
</script>

<template>
  <Page
    description="管理短网址使用的域名配置，支持多协议和备案信息设置"
    title="域名管理"
  >
    <Card title="域名列表">
      <template #extra>
        <Button type="primary" @click="handleCreate">添加域名</Button>
      </template>

      <!-- 表格 -->
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        row-key="id"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'domain'">
            <a
              :href="`${record.protocol}://${record.domain}`"
              target="_blank"
              class="text-blue-600 hover:text-blue-800"
            >
              {{ record.domain }}
            </a>
          </template>
          <template v-else-if="column.key === 'is_active'">
            <Switch
              :checked="record.is_active"
              @change="
                (checked) => handleStatusChange(record as Domain, !!checked)
              "
            />
          </template>
          <template v-else-if="column.key === 'pass_query_params'">
            <Tag :color="record.pass_query_params ? 'green' : 'red'">
              {{ record.pass_query_params ? '透传' : '不透传' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'enable_checksum'">
            <Tag :color="record.enable_checksum ? 'green' : 'default'">
              {{ record.enable_checksum ? '启用' : '禁用' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="flex space-x-2">
              <Button
                size="small"
                type="link"
                @click="handleEdit(record as Domain)"
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个域名配置吗？"
                @confirm="handleDelete(record as Domain)"
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
      :title="isEdit ? '编辑域名' : '添加域名'"
      width="500px"
      @ok="handleSubmit"
      @cancel="handleCancel"
    >
      <Form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <FormItem label="域名" name="domain">
          <Input
            v-model:value="formData.domain"
            placeholder="请输入域名，如：short.ly 或 dwz.example.com"
            :disabled="isEdit"
          />
        </FormItem>
        <FormItem label="协议" name="protocol">
          <Select v-model:value="formData.protocol">
            <SelectOption value="https">HTTPS</SelectOption>
            <SelectOption value="http">HTTP</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="网站名称" name="site_name">
          <Input
            v-model:value="formData.site_name"
            placeholder="可选，网站名称"
          />
        </FormItem>
        <FormItem label="ICP备案号" name="icp_number">
          <Input
            v-model:value="formData.icp_number"
            placeholder="可选，ICP备案号"
          />
        </FormItem>
        <FormItem label="公安备案号" name="police_number">
          <Input
            v-model:value="formData.police_number"
            placeholder="可选，公安备案号"
          />
        </FormItem>
        <FormItem label="透传查询参数" name="pass_query_params">
          <Switch
            v-model:checked="formData.pass_query_params"
            checked-children="启用"
            un-checked-children="禁用"
          />
          <div class="mt-2 text-sm text-gray-500">
            启用后，跳转时会将短网址的查询参数透传给原始URL
          </div>
        </FormItem>
        <FormItem name="random_suffix_length">
          <template #label>
            <span>随机后缀位数</span>
            <Tooltip title="设置短码随机后缀的字符数量，0表示不添加随机后缀，范围0-10">
              <span class="ml-1 cursor-help text-gray-400">ⓘ</span>
            </Tooltip>
          </template>
          <InputNumber
            v-model:value="formData.random_suffix_length"
            :min="0"
            :max="10"
            placeholder="0-10，默认2"
            style="width: 100%"
          />
          <div class="mt-2 text-sm text-gray-500">
            设置短码随机后缀的字符数量，0表示不添加随机后缀
          </div>
        </FormItem>
        <FormItem name="enable_checksum">
          <template #label>
            <span>启用校验位</span>
            <Tooltip title="启用后会在短码末尾添加校验字符，用于验证短码完整性">
              <span class="ml-1 cursor-help text-gray-400">ⓘ</span>
            </Tooltip>
          </template>
          <Switch
            v-model:checked="formData.enable_checksum"
            checked-children="启用"
            un-checked-children="禁用"
          />
          <div class="mt-2 text-sm text-gray-500">
            启用后会在短码末尾添加校验字符，用于验证短码完整性
          </div>
        </FormItem>
        <FormItem label="描述" name="description">
          <Textarea
            v-model:value="formData.description"
            placeholder="可选，域名用途描述"
            :rows="3"
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
  </Page>
</template>

<style scoped></style>
