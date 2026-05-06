# 101水晶微信小程序 MVP

101水晶是一个手串 DIY 定制微信小程序 MVP，目标是跑通“浏览成品/灵感 - DIY搭配 - 确认地址 - 提交订单 - 后台发货”的核心闭环。

## 技术栈

- 前端：Uni-app + Vue3 + Vite + `<script setup>`
- 后端：Node.js + Express
- 数据库：MySQL 5.7+
- 通信：RESTful API + JSON
- 小程序调试：微信开发者工具

## 项目目录结构

```text
.
├── backend
│   ├── .env.example
│   ├── package.json
│   └── src
│       ├── app.js
│       ├── server.js
│       ├── config
│       │   └── db.js
│       ├── middleware
│       │   └── auth.js
│       ├── routes
│       │   ├── admin.js
│       │   ├── components.js
│       │   └── orders.js
│       └── utils
│           └── httpError.js
├── database
│   ├── add_tracking_no.sql
│   └── init.sql
├── admin
│   └── index.html
└── frontend
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src
        ├── App.vue
        ├── main.js
        ├── manifest.json
        ├── pages.json
        ├── pages
        │   ├── admin
        │   │   └── index.vue
        │   ├── diy
        │   │   ├── diy.vue
        │   │   └── index.vue
        │   ├── index
        │   │   └── index.vue
        │   ├── order
        │   │   └── confirm.vue
        │   ├── order-confirm
        │   │   └── index.vue
        │   └── orders
        │       └── index.vue
        └── utils
            └── request.js
```

## 初始化命令

```bash
cd backend
npm install express mysql2 jsonwebtoken cors dotenv

cd ../frontend
npm install @dcloudio/uni-app@vue3 @dcloudio/uni-components@vue3 @dcloudio/uni-h5@vue3 @dcloudio/uni-mp-weixin@vue3 vue
npm install -D @dcloudio/vite-plugin-uni@vue3 vite
```

## 快速开始

1. 初始化数据库：

```bash
mysql -u root -p < database/init.sql
```

如果是旧库升级，需要额外执行：

```bash
mysql -u root -p < database/add_tracking_no.sql
```

2. 启动后端：

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

3. 启动前端 H5 调试：

```bash
cd frontend
npm install
npm run dev:h5
```

4. 启动微信小程序调试：

```bash
cd frontend
npm run dev:mp-weixin
```

然后在微信开发者工具中导入 `frontend/dist/dev/mp-weixin`。

5. 打开独立后台：

```bash
open admin/index.html
```

默认后台账号为 `admin`，密码为 `admin123`。

## MVP 页面

- 首页：展示主珠成品灵感，跳转 DIY 定制入口。
- DIY 定制页：选择绳结、主珠多点添加、配饰单选，顶部 Flex 横向实时预览，底部实时计算总价。
- 订单确认页：展示 DIY 方案，优先调用 `uni.chooseAddress` 获取微信原生地址；开发者工具不可用时支持手填地址兜底，提交订单。
- 我的订单页：按待付款、待发货、已发货 Tab 查询订单。
- 极简后台：管理员登录、管理库存、处理待发货订单。

## API 摘要

- `GET /api/components?type=1|2|3`：获取可售组件。
- `POST /api/orders/create`：提交订单，后端使用事务和 `FOR UPDATE` 锁定库存并计算总价。
- `GET /api/orders?status=0|1|2`：按状态查询订单。
- `PATCH /api/orders/:id/pay`：MVP 模拟付款，将订单改为待发货。
- `POST /api/admin/login`：管理员登录，返回 JWT。
- `GET /api/admin/components`：后台组件列表。
- `PATCH /api/admin/components/:id/stock`：更新库存。
- `GET /api/admin/orders`：后台订单列表。
- `PATCH /api/admin/orders/:id/ship`：待发货订单发货，提交 `tracking_no` 快递单号。

## 本地配置

后端复制 `backend/.env.example` 为 `backend/.env` 后修改 MySQL 配置：

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crystal_101
JWT_SECRET=replace_with_a_long_random_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

前端默认请求 `http://localhost:3000/api`。如需修改，设置 `VITE_API_BASE_URL`。
