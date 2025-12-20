import { requestClient } from './request';

/**
 * 短网址相关类型定义
 */
export interface ShortLink {
  id: number;
  short_code: string;
  domain: string;
  short_url: string;
  original_url: string;
  title?: string;
  description?: string;
  expire_at?: string | null;
  is_active: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateShortLinkRequest {
  original_url: string;
  domain?: string;
  custom_code?: string;
  title?: string;
  description?: string;
  expire_at?: string | null;
}

export interface UpdateShortLinkRequest {
  original_url?: string;
  title?: string;
  description?: string;
  expire_at?: string | null;
  is_active?: boolean;
}

export interface ShortLinkListResponse {
  list: ShortLink[];
  total: number;
  page: number;
  size: number;
}

export interface BatchCreateRequest {
  urls: string[];
  domain?: string;
}

export interface BatchCreateResponse {
  success: ShortLink[];
  failed: Array<{
    url: string;
    error: string;
  }>;
}

export interface ShortLinkStatistics {
  total_clicks: number;
  today_clicks: number;
  week_clicks: number;
  month_clicks: number;
  daily_statistics: Array<{
    date: string;
    click_count: number;
  }>;
}

export interface Domain {
  id: number;
  domain: string;
  protocol: string;
  site_name?: string;
  icp_number?: string;
  police_number?: string;
  is_active: boolean;
  pass_query_params: boolean;
  description?: string;
  random_suffix_length: number;
  enable_checksum: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDomainRequest {
  domain: string;
  protocol: string;
  site_name?: string;
  icp_number?: string;
  police_number?: string;
  is_active?: boolean;
  pass_query_params?: boolean;
  description?: string;
  random_suffix_length?: number;
  enable_checksum?: boolean;
}

export interface UpdateDomainRequest {
  protocol?: string;
  site_name?: string;
  icp_number?: string;
  police_number?: string;
  is_active?: boolean;
  pass_query_params?: boolean;
  description?: string;
  random_suffix_length?: number;
  enable_checksum?: boolean;
}

export interface UpdateStatusDomainRequest {
  is_active?: boolean;
}

/**
 * 短网址管理API
 */
export namespace ShortLinkApi {
  // 创建短网址
  export function create(data: CreateShortLinkRequest) {
    return requestClient.post<ShortLink>('/api/v1/short_links', data);
  }

  // 获取短网址列表
  export function getList(params: {
    domain?: string;
    keyword?: string;
    page?: number;
    page_size?: number;
  }) {
    return requestClient.get<ShortLinkListResponse>('/api/v1/short_links', {
      params,
    });
  }

  // 获取短网址详情
  export function getDetail(id: number) {
    return requestClient.get<ShortLink>(`/api/v1/short_links/${id}`);
  }

  // 更新短网址
  export function update(id: number, data: UpdateShortLinkRequest) {
    return requestClient.put<ShortLink>(`/api/v1/short_links/${id}`, data);
  }

  // 删除短网址
  export function remove(id: number) {
    return requestClient.delete(`/api/v1/short_links/${id}`);
  }

  // 批量创建短网址
  export function batchCreate(data: BatchCreateRequest) {
    return requestClient.post<BatchCreateResponse>(
      '/api/v1/short_links/batch',
      data,
    );
  }

  // 获取短网址统计
  export function getStatistics(id: number, days?: number) {
    return requestClient.get<ShortLinkStatistics>(
      `/api/v1/short_links/${id}/statistics`,
      {
        params: { days },
      },
    );
  }

  // 预览短网址
  export function preview(code: string) {
    return requestClient.get<{
      domain: string;
      original_url: string;
      short_code: string;
      short_url: string;
    }>(`/preview/${code}`);
  }
}

/**
 * 域名管理API
 */
export namespace DomainApi {
  // 创建域名配置
  export function create(data: CreateDomainRequest) {
    return requestClient.post<Domain>('/api/v1/domains', data);
  }

  // 获取域名列表
  export function getList() {
    return requestClient.get<{ list: Domain[] }>('/api/v1/domains');
  }

  // 获取活跃域名列表
  export function getActiveList() {
    return requestClient.get<{ list: Domain[] }>('/api/v1/domains/active');
  }

  // 更新域名配置
  export function update(id: number, data: UpdateDomainRequest) {
    return requestClient.put<Domain>(`/api/v1/domains/${id}`, data);
  }

  // 更新域名状态
  export function updateStatus(id: number, data: UpdateStatusDomainRequest) {
    return requestClient.put<Domain>(`/api/v1/domains/${id}/status`, data);
  }

  // 删除域名配置
  export function remove(id: number) {
    return requestClient.delete(`/api/v1/domains/${id}`);
  }
}
