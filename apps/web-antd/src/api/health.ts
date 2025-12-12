import { requestClient } from './request';

/**
 * 健康检查相关类型定义
 */
export interface VersionInfo {
  version: string;
  git_commit: string;
  build_time: string;
}

export interface HealthStatus {
  status: string;
  timestamp: number;
  version?: VersionInfo;
  services: {
    database: {
      status: string;
    };
    database_driver: string;
    redis: {
      status: string;
    };
  };
}

export interface SimpleHealthStatus {
  message: string;
}

/**
 * 健康检查API
 */
export namespace HealthApi {
  // 获取健康状态详细信息
  export function getHealthStatus() {
    return requestClient.get<HealthStatus>('/health');
  }

  // 简单健康检查
  export function getSimpleHealth() {
    return requestClient.get<SimpleHealthStatus>('/health/simple');
  }
}
