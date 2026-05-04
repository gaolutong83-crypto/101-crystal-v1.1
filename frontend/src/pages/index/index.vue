<template>
  <view class="page">
    <view class="hero card">
      <text class="title">101水晶</text>
      <text class="subtitle">选择你的能量手串，或从零开始 DIY</text>
      <button class="primary-btn" @tap="goDiy">开始DIY定制</button>
    </view>

    <view class="section-title">成品灵感</view>
    <view class="grid">
      <view v-for="item in beads" :key="item.id" class="product card">
        <image class="product-img" :src="item.img_url" mode="aspectFill" />
        <text class="product-name">{{ item.name }}</text>
        <text class="price">¥{{ item.price }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const beads = ref([]);

function goDiy() {
  uni.navigateTo({ url: '/pages/diy/diy' });
}

async function loadBeads() {
  const res = await request({ url: '/components?type=2' });
  beads.value = res.data;
}

onShow(loadBeads);
</script>

<style scoped>
.hero {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.title {
  font-size: 48rpx;
  font-weight: 700;
}

.subtitle {
  color: #7c7167;
  font-size: 28rpx;
}

.section-title {
  margin: 20rpx 0;
  font-size: 32rpx;
  font-weight: 600;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.product {
  width: calc((100% - 20rpx) / 2);
  box-sizing: border-box;
}

.product-img {
  width: 100%;
  height: 220rpx;
  border-radius: 18rpx;
  background: #eee4d8;
}

.product-name,
.price {
  display: block;
  margin-top: 12rpx;
}

.price {
  color: #9b4d2e;
  font-weight: 700;
}
</style>
