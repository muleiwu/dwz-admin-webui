import { requestClient } from './request';

/**
 * Token 类型枚举
 */
export type TokenType = 'bearer' | 'signature';

/**
 * API Token相关类型定义
 */
export interface Token {
  id: number;
  token_name: string;
  token_type: TokenType;
  token?: string; // 仅 bearer 类型，显示前8位
  app_id?: string; // 仅 signature 类型
  last_used_at?: string;
  expire_at?: string;
  status: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateTokenRequest {
  token_name: string;
  token_type?: TokenType; // 默认 signature
  expire_at?: string;
}

/**
 * 创建 Token 响应 - Bearer 类型
 */
export interface CreateBearerTokenResponse {
  id: number;
  token_name: string;
  token_type: 'bearer';
  token: string; // Bearer Token（仅创建时返回完整值）
  expire_at?: string;
  created_at: string;
}

/**
 * 创建 Token 响应 - Signature 类型
 */
export interface CreateSignatureTokenResponse {
  id: number;
  token_name: string;
  token_type: 'signature';
  app_id: string; // 签名认证 App ID
  app_secret: string; // 签名认证 App Secret（仅创建时返回）
  expire_at?: string;
  created_at: string;
}

/**
 * 创建 Token 响应联合类型
 */
export type CreateTokenResponse =
  | CreateBearerTokenResponse
  | CreateSignatureTokenResponse;

export interface TokenListResponse {
  list: Token[];
  total: number;
  page: number;
  size: number;
}

/**
 * API Token管理API
 */
export namespace TokenApi {
  // 创建Token
  export function create(data: CreateTokenRequest) {
    return requestClient.post<CreateTokenResponse>('/api/v1/tokens', data);
  }

  // 获取Token列表
  export function getList(params: {
    page?: number;
    page_size?: number;
    status?: number;
    token_name?: string;
  }) {
    return requestClient.get<TokenListResponse>('/api/v1/tokens', {
      params,
    });
  }

  // 删除Token
  export function remove(tokenId: number) {
    return requestClient.delete(`/api/v1/tokens/${tokenId}`);
  }
}

/**
 * 类型守卫：判断是否为 Signature 类型响应
 */
export function isSignatureTokenResponse(
  response: CreateTokenResponse,
): response is CreateSignatureTokenResponse {
  return response.token_type === 'signature';
}

/**
 * 类型守卫：判断是否为 Bearer 类型响应
 */
export function isBearerTokenResponse(
  response: CreateTokenResponse,
): response is CreateBearerTokenResponse {
  return response.token_type === 'bearer';
}
