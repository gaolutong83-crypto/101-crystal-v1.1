<template>
  <view class="page">
    <view v-if="!token" class="card login">
      <text class="title">管理员登录</text>
      <input v-model="loginForm.username" class="input" placeholder="账号" />
      <input v-model="loginForm.password" class="input" password placeholder="密码" />
      <button class="primary-btn" @tap="login">登录</button>
    </view>

    <view v-else>
      <view class="card block">
        <text class="title">库存管理</text>
        <view v-for="item in components" :key="item.id" class="row">
          <text>{{ item.name }}</text>
          <input v-model.number="item.stock" class="stock-input" type="number" />
          <button size="mini" @tap="saveStock(item)">保存</button>
        </view>
      </view>

      <view class="card block">
        <text class="title">待发货订单</text>
        <view v-for="order in pendingOrders" :key="order.id" class="row">
          <text>{{ order.order_no }}</text>
          <text>¥{{ order.total_price }}</text>
          <button size="mini" @tap="ship(order.id)">发货</button>
        </view>
        <text v-if="pendingOrders.length === 0" class="empty">暂无待发货订单</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const token = ref(uni.getStorageSync('token'));
const components = ref([]);
const orders = ref([]);
const loginForm = reactive({
  username: 'admin',
  password: 'admin123'
});

const pendingOrders = computed(() => orders.value.filter((order) => order.status === 1));

async function login() {
  const res = await request({
    url: '/admin/login',
    method: 'POST',
    data: loginForm
  });
  uni.setStorageSync('token', res.data.token);
  token.value = res.data.token;
  await loadAdminData();
}

async function loadAdminData() {
  if (!token.value) {
    return;
  }

  const [componentRes, orderRes] = await Promise.all([
    request({ url: '/admin/components' }),
    request({ url: '/admin/orders' })
  ]);
  components.value = componentRes.data;
  orders.value = orderRes.data;
}

async function saveStock(item) {
  await request({
    url: `/admin/components/${item.id}/stock`,
    method: 'PATCH',
    data: { stock: item.stock }
  });
  uni.showToast({ title: '库存已更新', icon: 'success' });
}

async function ship(id) {
  await request({ url: `/admin/orders/${id}/ship`, method: 'PATCH' });
  await loadAdminData();
}

onShow(loadAdminData);
</script>

<style scoped>
.login,
.block {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.title {
  font-size: 32rpx;
  font-weight: 700;
}

.input,
.stock-input {
  height: 76rpx;
  padding: 0 20rpx;
  border-radius: 14rpx;
  background: #f7f3ee;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.row text:first-child {
  flex: 1;
}

.stock-input {
  width: 140rpx;
  text-align: center;
}

.empty {
  color: #9b9086;
}
</style>
