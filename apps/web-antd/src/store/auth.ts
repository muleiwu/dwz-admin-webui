import type { UserInfo } from '@vben/types';

import type { AuthApi } from '#/api';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 格式化剩余锁定时间
   * @param seconds 剩余秒数
   */
  function formatLockoutTime(seconds: number): string {
    if (seconds >= 60) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} 分钟`;
    }
    return `${seconds} 秒`;
  }

  /**
   * 处理速率限制错误
   * @param error 错误响应
   */
  function handleRateLimitError(error: AuthApi.RateLimitError): void {
    const { limit_type, lockout_seconds, remaining_attempts } = error;

    if (lockout_seconds > 0) {
      // 已被锁定
      const lockoutTime = formatLockoutTime(lockout_seconds);
      const message =
        limit_type === 'ip'
          ? `您的 IP 地址已被临时锁定，请在 ${lockoutTime} 后重试`
          : `该账户已被临时锁定，请在 ${lockoutTime} 后重试`;

      notification.error({
        description: message,
        duration: 5,
        message: '登录受限',
      });
    } else if (remaining_attempts > 0) {
      // 还有剩余尝试次数
      const message =
        limit_type === 'ip'
          ? `登录失败，您还有 ${remaining_attempts} 次尝试机会`
          : `登录失败，该账户还有 ${remaining_attempts} 次尝试机会`;

      notification.warning({
        description: message,
        duration: 5,
        message: '登录失败',
      });
    }
  }

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   // eslint-disable-next-line jsdoc/check-param-names
   * @param params 登录表单数据
   * @param onSuccess
   */
  async function authLogin(
    params: { password: string; username: string },
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { token, user } = await loginApi(params);

      // 如果成功获取到 token
      if (token) {
        accessStore.setAccessToken(token);

        // 获取用户信息并存储到 accessStore 中
        // eslint-disable-next-line unicorn/no-single-promise-in-promise-methods
        const [fetchUserInfoResult] = await Promise.all([
          fetchUserInfo(),
          // getAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;

        userStore.setUserInfo(userInfo);
        // accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (user?.real_name) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${user?.real_name}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } catch (error: any) {
      // 处理速率限制错误 (HTTP 429)
      if (error?.response?.status === 429) {
        const rateLimitError = error.response.data as AuthApi.RateLimitError;
        handleRateLimitError(rateLimitError);
      } else {
        // 其他错误由全局错误处理器处理
        throw error;
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
