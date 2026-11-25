# React 模板协作约定

- 本仓库是 Npora Admin 的 React 模板。组件和页面使用 TSX，接口契约、数据处理和配置使用 TypeScript，UI 组件使用 Ant Design，请求沿用 Vue 模板的 `@npora/request`。
- 初始化采用 npm 稳定版 React，依赖调整同时更新 package.json 与 package-lock.json。
- 与 Vue 模板共用后端 API、权限码和动态菜单组件标识。组件标识通过本地白名单映射到 React 页面，后端独立鉴权。
- 自绘 SVG 放在 src/icons。环境配置使用 .env、.env.development 和 .env.production。本地自定义可通过进程环境传入。
- 提交前执行 `npm run check:all`。涉及登录、路由、权限、偏好或日期控件时，使用隔离数据执行浏览器流程，并与 Vue 在同一视口对照。
- 生成器后续增加框架选择，Vue 保持默认，React 先开放 starter 预设。

## 目录与路由

- `src/main.tsx` 负责启动。应用 Provider 放在 `src/app/`，后台公共框架放在 `src/layout/`，跨页面组件放在 `src/components/`。
- 页面按 Vue 主模板的目录与组件标识维护，入口使用 `src/views/<页面>/index.tsx` 或 `src/views/system/<模块>/index.tsx`。页面专用组件放在该页面下的 `components/`。
- `src/router/` 管理静态入口、动态路由解析和页面白名单。系统页面在 `system-pages.ts` 注册后，仍须匹配当前会话下发的路由和列表权限。
- `src/api/` 管理请求与接口类型，`src/auth/` 管理凭证和权限逻辑，`src/config/` 放共享配置。样式使用 Sass，界面词条在 `src/locales/` 同步维护。


## 界面与构建

- 以 Vue 主模板为功能和交互对照基准。页面使用 Ant Design，确认使用 Modal，表单校验使用 Form，图标使用 @ant-design/icons 或现有自绘图标库。
- 界面文案同步维护简体中文和英文。国际化使用 i18next、react-i18next 和浏览器语言检测插件，按应用语言配置 Ant Design 与 Day.js。
- 个人中心与应用设置共用偏好配置。日期范围使用 Ant Design DatePicker 和 Day.js，跟随应用时区显示日历和时间，接口使用毫秒时间戳。
- Vite 默认开发端口为 9000，开启 strictPort。生产构建支持 gzip 产物和可选构建报告。PWA 更新先提示，用户确认后激活并刷新。
