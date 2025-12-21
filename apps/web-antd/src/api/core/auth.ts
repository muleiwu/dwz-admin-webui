import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    username: string;
    password: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    token: string;
    expires_at: string;
    user: {
      created_at: string;
      email: string;
      id: number;
      last_login: string;
      phone: string;
      real_name: string;
      status: number;
      updated_at: string;
      username: string;
    };
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }

  /** 速率限制错误响应 */
  export interface RateLimitError {
    code: number;
    message: string;
    limit_type: 'ip' | 'username';
    remaining_attempts: number;
    lockout_seconds: number;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/api/v1/auth/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/api/v1/auth/logout');
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
