import { defineOverridesPreferences } from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    defaultHomePath: '/shortlink/list',
    layout: 'sidebar-mixed-nav',
    enablePreferences: false,
  },
  copyright: {
    companyName: '合肥木雷坞信息技术有限公司',
    companySiteLink: 'https://www.mliev.com',
    date: '2025',
  },
  footer: {
    enable: true,
  },
  shortcutKeys: {
    enable: false,
    globalLockScreen: false,
    globalSearch: false,
  },
  theme: {
    mode: 'light',
  },
  widget: {
    fullscreen: false,
    globalSearch: false,
    languageToggle: false,
    lockScreen: false,
    notification: false,
    themeToggle: false,
  },
});
