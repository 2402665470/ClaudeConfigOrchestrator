import { ThemeConfig } from 'antd';

export const antdTheme: ThemeConfig = {
  token: {
    // 主色调
    colorPrimary: '#3b82f6',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    
    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    
    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    
    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    
    // 阴影
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    
    // 颜色
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
    
    // 文本颜色
    colorText: '#1e293b',
    colorTextSecondary: '#64748b',
    colorTextTertiary: '#94a3b8',
    colorTextQuaternary: '#cbd5e1',
  },
  components: {
    Layout: {
      bodyBg: '#f8fafc',
      headerBg: '#ffffff',
      siderBg: '#ffffff',
      triggerBg: '#f1f5f9',
      triggerColor: '#64748b',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#eff6ff',
      itemSelectedColor: '#2563eb',
      itemHoverBg: '#f8fafc',
      itemHoverColor: '#1e293b',
      itemActiveBg: '#e0e7ff',
      iconSize: 16,
      fontSize: 14,
      itemHeight: 40,
      itemMarginInline: 8,
      itemBorderRadius: 6,
    },
    Card: {
      headerBg: '#ffffff',
      boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
    },
    Button: {
      borderRadius: 6,
      controlHeight: 36,
      controlHeightLG: 40,
      controlHeightSM: 28,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 36,
      controlHeightLG: 40,
      controlHeightSM: 28,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 36,
      controlHeightLG: 40,
      controlHeightSM: 28,
    },
    Tabs: {
      cardBg: '#ffffff',
      itemSelectedColor: '#2563eb',
      itemHoverColor: '#1e293b',
      inkBarColor: '#2563eb',
      itemActiveColor: '#2563eb',
    },
    Modal: {
      borderRadius: 8,
      headerBg: '#ffffff',
    },
    Drawer: {
      borderRadius: 8,
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#374151',
      rowHoverBg: '#f8fafc',
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Badge: {
      borderRadiusSM: 4,
    },
    Alert: {
      borderRadius: 6,
    },
    Progress: {
      remainingColor: '#f1f5f9',
    },
  },
};