# React 模板协作约定

- 本仓库是 Npora Admin 的 React 模板。组件和页面使用 TSX，接口契约、数据处理和配置使用 TypeScript，UI 组件使用 Ant Design，请求沿用 Vue 模板的 `@npora/request`。
- React 与 Vue 模板当前页面及功能覆盖一致，共用接口、路由组件标识和权限语义；技术栈及个别 UI 控件实现不同。增删功能时同步两套模板，并以同一验收项检查功能覆盖，不要求框架原生组件细节完全相同。
- 初始化采用 npm 稳定版 React，依赖调整同时更新 package.json 与 package-lock.json。模板版本号与 Vue 模板和生成器同步；三者在同一轮功能变更中协作并使用相同版本号与 Git 标签。本仓库是公开 GitHub 源码仓库，发布 GitHub Release，不单独发布 npm 包。涉及功能、页面、配置或生成行为时，同步检查 Vue、生成器和 online-npora 对应展示入口。
- 与 Vue 模板共用后端 API、权限码和动态菜单组件标识。组件标识通过本地白名单映射到 React 页面，后端独立鉴权。
- 自绘 SVG 放在 src/icons。环境配置使用 .env、.env.development 和 .env.production。本地自定义可通过进程环境传入。
- GitHub Actions 在 main 和 PR 上执行 `npm run check:all`；发布 `vX.Y.Z` 标签时校验标签与 package.json 版本一致并创建 GitHub Release，不发布 npm。提交前执行 `npm run check:all`。涉及登录、路由、权限、偏好或日期控件时，使用隔离数据执行浏览器流程，并与 Vue 在同一视口对照。
- `@npora/create-admin` 已支持交互选择 Vue 或 React，也可通过 `--framework react` 选择 React；两种框架均生成纯净版。

## 公开演示联动

- 总官网为 https://www.npora.live/，React 演示为 https://react.npora.live/，Vue 演示为 https://admin.npora.live/。线上构建与部署配置归同级 `../online-npora/react/`，通过固定的源码提交构建。
- 修改页面、接口、权限、构建或配置时，同一任务检查 `online-npora/react/`，同步受影响的版本引用、文档、配置及验收。纯内部修改也要记录对演示的影响判断。
- 由主 agent 按工作区规则分派模板与线上站点工作，复核双方改动和验证结果。验证登录、路由、同源 API、PWA 和只读权限。React 公开演示使用独立后端与数据库，源码模板继续保留业务写入能力。
- 本仓库只维护纯净 React 前端、正式 MySQL 初始化和迁移脚本及开发文档。演示页面、演示 API、示例数据、Cloudflare 绑定和部署配置由 `../online-npora/react/` 维护。改动在线入口或数据库指南时，同步检查总官网 `../online-npora/www/`。

## 目录与路由

- `src/main.tsx` 负责启动。应用 Provider 放在 `src/app/`，后台公共框架放在 `src/layout/`，跨页面组件放在 `src/components/`。
- 页面按 Vue 主模板的目录与组件标识维护，入口使用 `src/views/<页面>/index.tsx` 或 `src/views/system/<模块>/index.tsx`。页面专用组件放在该页面下的 `components/`。
- `src/router/` 管理静态入口、动态路由解析和页面白名单。系统页面在 `system-pages.ts` 注册后，仍须匹配当前会话下发的路由和列表权限。
- `src/api/` 管理请求与接口类型，`src/auth/` 管理凭证和权限逻辑，`src/config/` 放共享配置。样式使用 Sass，界面词条在 `src/locales/` 同步维护。
- `database/` 维护正式 MySQL 初始化和迁移 SQL。其结构与 Vue 模板保持一致；修改时对照 `../admin-template/database/`，同时检查线上 React 演示所使用的独立数据模型及 [SQL 在线指南](https://react.npora.live/database/)是否受影响。


## 界面与构建

- 以 Vue 主模板为页面与功能对照基准，保持相同的功能覆盖和交互结果。页面使用 Ant Design，确认使用 Modal，表单校验使用 Form，图标使用 @ant-design/icons 或现有自绘图标库；允许组件库造成的控件细节差异。
- 界面文案同步维护简体中文和英文。国际化使用 i18next、react-i18next 和浏览器语言检测插件，按应用语言配置 Ant Design 与 Day.js。
- 个人中心与应用设置共用偏好配置。日期范围使用 Ant Design DatePicker 和 Day.js，跟随应用时区显示日历和时间，接口使用毫秒时间戳。
- Vite 默认开发端口为 9000，开启 strictPort。生产构建支持 gzip 产物和可选构建报告。PWA 更新先提示，用户确认后激活并刷新。
