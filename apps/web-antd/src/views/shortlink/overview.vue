<script setup lang="ts">
import type { DashboardData } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import {
  BookOpenText,
  Expand,
  ExternalLink,
  RotateCw,
  Settings,
  UserRoundPen,
} from '@vben/icons';

import { Button, Card, message, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// 启用dayjs相对时间插件
dayjs.extend(relativeTime);

// 响应式数据
const loading = ref(false);
const dashboardData = ref<DashboardData | null>(null);

// 计算属性
const systemStatus = computed(() => {
  // 简单的系统状态计算逻辑
  const stats = dashboardData.value?.statistics;
  if (!stats) {
    return { color: 'default', text: '未知' };
  }

  if (stats.active_users > 0 && stats.total_clicks > 0) {
    return { color: 'green', text: '正常' };
  } else if (stats.total_users > 0) {
    return { color: 'orange', text: '低活跃' };
  } else {
    return { color: 'red', text: '异常' };
  }
});

const lastUpdateTime = computed(() => {
  return dayjs().format('HH:mm:ss');
});

// 方法 - 移除仪表板数据加载，因为API接口不存在
const loadDashboardData = async () => {
  loading.value = true;
  try {
    // 模拟一些基础数据，实际应该从其他可用接口获取
    dashboardData.value = {
      statistics: {
        total_users: 0,
        active_users: 0,
        total_short_links: 0,
        total_clicks: 0,
        today_clicks: 0,
        week_clicks: 0,
        month_clicks: 0,
        total_domains: 0,
        active_domains: 0,
        total_ab_tests: 0,
        running_ab_tests: 0,
        total_tokens: 0,
        active_tokens: 0,
      },
      recent_activities: [],
      top_links: [],
    };
    message.info('当前为演示数据，统计接口暂未实现');
  } catch (error: any) {
    console.error('Failed to load dashboard data:', error);
    message.error('加载仪表板数据失败');
  } finally {
    loading.value = false;
  }
};

const formatNumber = (num: number) => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const formatTime = (timestamp: string) => {
  return dayjs(timestamp).fromNow();
};

// 生命周期
onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <Page
    description="系统运行状况总览，包括关键指标、近期活动和热门链接等信息"
    title="系统概览"
  >
    <!-- 关键指标 -->
    <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card class="text-center">
        <div class="flex flex-col items-center">
          <div
            class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100"
          >
            <UserRoundPen class="h-6 w-6 text-blue-600" />
          </div>
          <div class="mb-1 text-2xl font-bold text-gray-800">
            {{ dashboardData?.statistics?.total_users || 0 }}
          </div>
          <div class="text-sm text-gray-500">总用户数</div>
          <div class="mt-1 text-xs text-green-600">
            活跃: {{ dashboardData?.statistics?.active_users || 0 }}
          </div>
        </div>
      </Card>

      <Card class="text-center">
        <div class="flex flex-col items-center">
          <div
            class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
          >
            <ExternalLink class="h-6 w-6 text-green-600" />
          </div>
          <div class="mb-1 text-2xl font-bold text-gray-800">
            {{ dashboardData?.statistics?.total_short_links || 0 }}
          </div>
          <div class="text-sm text-gray-500">短链接数</div>
          <div class="mt-1 text-xs text-blue-600">
            今日: {{ dashboardData?.statistics?.today_clicks || 0 }} 次点击
          </div>
        </div>
      </Card>

      <Card class="text-center">
        <div class="flex flex-col items-center">
          <div
            class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100"
          >
            <Expand class="h-6 w-6 text-purple-600" />
          </div>
          <div class="mb-1 text-2xl font-bold text-gray-800">
            {{ formatNumber(dashboardData?.statistics?.total_clicks || 0) }}
          </div>
          <div class="text-sm text-gray-500">总点击量</div>
          <div class="mt-1 text-xs text-purple-600">
            本月:
            {{ formatNumber(dashboardData?.statistics?.month_clicks || 0) }}
          </div>
        </div>
      </Card>

      <Card class="text-center">
        <div class="flex flex-col items-center">
          <div
            class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100"
          >
            <Settings class="h-6 w-6 text-orange-600" />
          </div>
          <div class="mb-1 text-2xl font-bold text-gray-800">
            {{ dashboardData?.statistics?.total_ab_tests || 0 }}
          </div>
          <div class="text-sm text-gray-500">AB测试</div>
          <div class="mt-1 text-xs text-orange-600">
            运行中: {{ dashboardData?.statistics?.running_ab_tests || 0 }}
          </div>
        </div>
      </Card>
    </div>

    <div class="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- 近期活动 -->
      <Card title="近期活动" :loading="loading">
        <template #extra>
          <Button size="small" @click="loadDashboardData">
            <RotateCw class="h-4 w-4" />
          </Button>
        </template>

        <div v-if="dashboardData?.recent_activities?.length" class="space-y-3">
          <div
            v-for="activity in dashboardData.recent_activities.slice(0, 10)"
            :key="activity.id"
            class="flex items-start space-x-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
          >
            <div
              class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
            >
              <div class="h-2 w-2 rounded-full bg-blue-600"></div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">
                {{ activity.description }}
              </p>
              <p class="text-xs text-gray-500">
                {{ activity.user }} · {{ formatTime(activity.created_at) }}
              </p>
            </div>
          </div>
        </div>

        <div v-else class="py-8 text-center text-gray-500">
          <BookOpenText class="mx-auto mb-2 h-8 w-8" />
          <p>暂无近期活动</p>
        </div>
      </Card>

      <!-- 热门链接 -->
      <Card title="热门链接" :loading="loading">
        <template #extra>
          <Button size="small" @click="loadDashboardData">
            <RotateCw class="h-4 w-4" />
          </Button>
        </template>

        <div v-if="dashboardData?.top_links?.length" class="space-y-3">
          <div
            v-for="(link, index) in dashboardData.top_links.slice(0, 10)"
            :key="link.id"
            class="flex items-center space-x-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
          >
            <div
              class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-xs font-bold text-white"
              style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)"
            >
              {{ index + 1 }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900">
                {{ link.title || link.original_url }}
              </p>
              <p class="truncate text-xs text-gray-500">
                {{ link.short_url }}
              </p>
            </div>
            <div class="flex-shrink-0 text-right">
              <p class="text-sm font-bold text-blue-600">
                {{ formatNumber(link.click_count) }}
              </p>
              <p class="text-xs text-gray-500">点击</p>
            </div>
          </div>
        </div>

        <div v-else class="py-8 text-center text-gray-500">
          <ExternalLink class="mx-auto mb-2 h-8 w-8" />
          <p>暂无链接数据</p>
        </div>
      </Card>
    </div>

    <!-- 系统信息 -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <Card title="域名状态">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">总域名数</span>
            <span class="font-semibold">{{
              dashboardData?.statistics?.total_domains || 0
            }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">活跃域名</span>
            <span class="font-semibold text-green-600">{{
              dashboardData?.statistics?.active_domains || 0
            }}</span>
          </div>
        </div>
      </Card>

      <Card title="Token状态">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">总Token数</span>
            <span class="font-semibold">{{
              dashboardData?.statistics?.total_tokens || 0
            }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">活跃Token</span>
            <span class="font-semibold text-green-600">{{
              dashboardData?.statistics?.active_tokens || 0
            }}</span>
          </div>
        </div>
      </Card>

      <Card title="系统状态">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">系统状态</span>
            <Tag :color="systemStatus.color">{{ systemStatus.text }}</Tag>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">最后检查</span>
            <span class="text-xs text-gray-500">{{ lastUpdateTime }}</span>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.ant-card {
  @apply shadow-sm transition-shadow hover:shadow-md;
}
</style>
