<template>
  <view class="page cart-page">
    <view class="header card">
      <text class="title">购物车</text>
      <text class="subtitle">保存还没付款的 DIY 方案，确认后再提交订单</text>
    </view>

    <view v-if="cartItems.length === 0" class="empty card">
      <text class="empty-title">购物车为空</text>
      <button class="primary-btn empty-btn" @tap="goDiy">去DIY定制</button>
    </view>

    <view v-for="item in cartItems" :key="item.id" class="cart-item card">
      <view class="item-head">
        <text class="item-title">DIY方案 #{{ item.id }}</text>
        <text class="price">¥{{ item.total_price }}</text>
      </view>

      <scroll-view scroll-x class="preview-scroll">
        <view class="preview-row">
          <image
            v-for="part in snapshotItems(item.diy_snapshot)"
            :key="`${item.id}-${part.id}-${part.previewKey}`"
            class="preview-img"
            :src="part.img_url"
            mode="aspectFill"
          />
        </view>
      </scroll-view>

      <view class="detail-list">
        <view v-for="part in detailItems(item.diy_snapshot)" :key="part.key" class="detail-item">
          <text class="detail-name">{{ part.label }}：{{ part.name }}</text>
          <text class="detail-price">¥{{ part.price }}</text>
        </view>
      </view>

      <view class="actions">
        <button class="secondary-btn" size="mini" @tap="removeItem(item.id)">删除</button>
        <button class="secondary-btn" size="mini" @tap="editItem(item)">继续编辑</button>
        <button class="primary-mini-btn" size="mini" @tap="checkout(item)">去结算</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const cartItems = ref([]);

function parseSnapshot(snapshot) {
  if (!snapshot) {
    return {};
  }

  if (typeof snapshot === 'string') {
    try {
      return JSON.parse(snapshot);
    } catch (error) {
      console.warn('购物车DIY快照解析失败', error);
      return {};
    }
  }

  return snapshot;
}

function snapshotItems(snapshot) {
  const data = parseSnapshot(snapshot);
  return [data?.rope, ...(data?.beads || []), data?.pendant]
    .filter(Boolean)
    .map((part, index) => ({ ...part, previewKey: index }));
}

function detailItems(snapshot) {
  const data = parseSnapshot(snapshot);
  const items = [];

  if (data.rope) {
    items.push({ ...data.rope, key: 'rope', label: '绳结' });
  }

  (data.beads || []).forEach((bead, index) => {
    items.push({ ...bead, key: `bead-${index}`, label: `主珠${index + 1}` });
  });

  if (data.pendant) {
    items.push({ ...data.pendant, key: 'pendant', label: '配饰' });
  }

  return items;
}

async function loadCartItems() {
  const res = await request({ url: '/cart/items' });
  cartItems.value = res.data;
}

async function removeItem(id) {
  await request({ url: `/cart/items/${id}`, method: 'DELETE' });
  await loadCartItems();
}

function checkout(item) {
  const data = parseSnapshot(item.diy_snapshot);
  const payload = encodeURIComponent(
    JSON.stringify({
      rope: data.rope,
      beads: data.beads || [],
      pendant: data.pendant,
      totalPrice: item.total_price
    })
  );

  uni.navigateTo({
    url: `/pages/order/confirm?payload=${payload}&cartItemId=${item.id}`
  });
}

function editItem(item) {
  const data = parseSnapshot(item.diy_snapshot);
  const payload = encodeURIComponent(
    JSON.stringify({
      rope: data.rope,
      beads: data.beads || [],
      pendant: data.pendant,
      totalPrice: item.total_price
    })
  );

  uni.navigateTo({ url: `/pages/diy/diy?payload=${payload}` });
}

function goDiy() {
  uni.navigateTo({ url: '/pages/diy/diy' });
}

onShow(loadCartItems);
</script>

<style scoped>
.cart-page {
  padding-bottom: 40rpx;
}

.header,
.empty,
.cart-item {
  margin-bottom: 24rpx;
}

.title,
.empty-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
}

.subtitle {
  display: block;
  margin-top: 12rpx;
  color: #7c7167;
  font-size: 26rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.empty-btn {
  margin: 0;
}

.item-head,
.detail-item,
.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-title {
  font-size: 30rpx;
  font-weight: 700;
}

.price {
  color: #9b4d2e;
  font-size: 34rpx;
  font-weight: 700;
}

.preview-scroll {
  width: 100%;
  margin: 24rpx 0;
  white-space: nowrap;
}

.preview-row {
  display: flex;
  gap: 12rpx;
}

.preview-img {
  flex: 0 0 auto;
  width: 86rpx;
  height: 86rpx;
  border-radius: 50%;
  background: #eee4d8;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.detail-name {
  flex: 1;
  color: #2f2923;
  font-size: 24rpx;
}

.detail-price {
  color: #9b4d2e;
  font-size: 24rpx;
}

.actions {
  gap: 12rpx;
}

.secondary-btn,
.primary-mini-btn {
  margin: 0;
  flex: 1;
}

.secondary-btn {
  color: #8c5a3c;
  background: #fbf4ee;
}

.primary-mini-btn {
  color: #fff;
  background: #8c5a3c;
}
</style>
