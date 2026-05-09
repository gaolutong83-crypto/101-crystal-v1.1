<template>
  <view class="page">
    <view class="tabs card">
      <view
        v-for="tab in tabs"
        :key="tab.status"
        class="tab"
        :class="{ active: activeStatus === tab.status }"
        @tap="switchTab(tab.status)"
      >
        {{ tab.label }}
      </view>
    </view>

    <view v-if="orders.length === 0" class="empty card">暂无订单</view>

    <view v-for="order in orders" :key="order.id" class="order card">
      <view class="order-head">
        <text>{{ order.order_no }}</text>
        <text>{{ statusText(order.status) }}</text>
      </view>
      <view class="preview-row">
        <image
          v-for="item in snapshotItems(order.diy_snapshot)"
          :key="`${order.id}-${item.id}-${item.previewKey}`"
          class="preview-img"
          :src="item.img_url"
          mode="aspectFill"
        />
      </view>
      <view class="order-foot">
        <text class="price">¥{{ order.total_price }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const tabs = [
  { label: '待发货', status: 1 },
  { label: '已发货', status: 2 }
];
const activeStatus = ref(1);
const orders = ref([]);

function statusText(status) {
  return tabs.find((tab) => tab.status === status)?.label || '未知';
}

function snapshotItems(snapshot) {
  const data = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
  return [data?.rope, ...(data?.beads || []), data?.pendant]
    .filter(Boolean)
    .map((item, index) => ({ ...item, previewKey: index }));
}

async function loadOrders() {
  const res = await request({ url: `/orders?status=${activeStatus.value}` });
  orders.value = res.data;
}

function switchTab(status) {
  activeStatus.value = status;
  loadOrders();
}

onShow(loadOrders);
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.tab {
  flex: 1;
  padding: 18rpx 0;
  border-radius: 999rpx;
  text-align: center;
  color: #7c7167;
  background: #f7f3ee;
}

.tab.active {
  color: #fff;
  background: #8c5a3c;
}

.empty,
.order {
  margin-bottom: 20rpx;
}

.order-head,
.order-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-row {
  display: flex;
  gap: 12rpx;
  margin: 24rpx 0;
}

.preview-img {
  width: 82rpx;
  height: 82rpx;
  border-radius: 50%;
  background: #eee4d8;
}

.price {
  color: #9b4d2e;
  font-size: 34rpx;
  font-weight: 700;
}

</style>
