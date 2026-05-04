<template>
  <view class="page diy-page">
    <view class="preview card">
      <scroll-view scroll-x class="preview-scroll">
        <view class="preview-row">
          <image
            v-for="item in previewItems"
            :key="`${item.id}-${item.previewKey}`"
            class="preview-img"
            :src="item.img_url"
            mode="aspectFill"
          />
        </view>
      </scroll-view>
      <text class="empty" v-if="previewItems.length === 0">请选择绳结和水晶珠</text>
    </view>

    <view class="picker card">
      <text class="group-title">选绳结</text>
      <view class="option-row">
        <view
          v-for="item in ropes"
          :key="item.id"
          class="option"
          :class="{ active: diyState.rope?.id === item.id }"
          @tap="diyState.rope = item"
        >
          <image class="option-img" :src="item.img_url" mode="aspectFill" />
          <text>{{ item.name }}</text>
        </view>
      </view>

      <text class="group-title">选主珠（可多点添加）</text>
      <view class="option-row">
        <view v-for="item in beads" :key="item.id" class="option" @tap="addBead(item)">
          <image class="option-img" :src="item.img_url" mode="aspectFill" />
          <text>{{ item.name }}</text>
          <text class="price">¥{{ item.price }}</text>
        </view>
      </view>

      <text class="group-title">选配饰（单选）</text>
      <view class="option-row">
        <view
          v-for="item in pendants"
          :key="item.id"
          class="option"
          :class="{ active: diyState.pendant?.id === item.id }"
          @tap="diyState.pendant = item"
        >
          <image class="option-img" :src="item.img_url" mode="aspectFill" />
          <text>{{ item.name }}</text>
        </view>
      </view>
    </view>

    <view class="footer">
      <view>
        <text class="total-label">总价</text>
        <text class="total">¥{{ totalPrice }}</text>
      </view>
      <button class="primary-btn submit-btn" @tap="goConfirm">确认方案</button>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const ropes = ref([]);
const beads = ref([]);
const pendants = ref([]);
const diyState = reactive({
  rope: null,
  beads: [],
  pendant: null
});

const previewItems = computed(() => {
  return [diyState.rope, ...diyState.beads, diyState.pendant]
    .filter(Boolean)
    .map((item, index) => ({ ...item, previewKey: index }));
});

const totalPrice = computed(() => {
  return previewItems.value
    .reduce((sum, item) => sum + Number(item.price), 0)
    .toFixed(2);
});

function addBead(item) {
  diyState.beads.push(item);
}

function goConfirm() {
  if (!diyState.rope || diyState.beads.length === 0) {
    uni.showToast({ title: '请选择绳结并添加主珠', icon: 'none' });
    return;
  }

  const payload = encodeURIComponent(
    JSON.stringify({
      rope: diyState.rope,
      beads: diyState.beads,
      pendant: diyState.pendant,
      totalPrice: totalPrice.value
    })
  );
  uni.navigateTo({ url: `/pages/order-confirm/index?payload=${payload}` });
}

async function loadComponents() {
  const [ropeRes, beadRes, pendantRes] = await Promise.all([
    request({ url: '/components?type=1' }),
    request({ url: '/components?type=2' }),
    request({ url: '/components?type=3' })
  ]);

  ropes.value = ropeRes.data;
  beads.value = beadRes.data;
  pendants.value = pendantRes.data;
}

onLoad(loadComponents);
</script>

<style scoped>
.diy-page {
  padding-bottom: 140rpx;
}

.preview {
  margin-bottom: 24rpx;
}

.preview-scroll {
  width: 100%;
  white-space: nowrap;
}

.preview-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-height: 120rpx;
}

.preview-img {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #eee4d8;
}

.empty {
  color: #9b9086;
}

.picker {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.group-title {
  font-size: 30rpx;
  font-weight: 700;
}

.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.option {
  width: 30%;
  padding: 16rpx;
  border: 2rpx solid #eee4d8;
  border-radius: 18rpx;
  box-sizing: border-box;
  font-size: 24rpx;
}

.option.active {
  border-color: #8c5a3c;
  background: #fbf4ee;
}

.option-img {
  width: 100%;
  height: 110rpx;
  border-radius: 12rpx;
  background: #eee4d8;
}

.price {
  display: block;
  margin-top: 6rpx;
  color: #9b4d2e;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: #fff;
  box-shadow: 0 -8rpx 24rpx rgba(68, 50, 33, 0.08);
}

.total-label {
  display: block;
  color: #7c7167;
  font-size: 24rpx;
}

.total {
  color: #9b4d2e;
  font-size: 40rpx;
  font-weight: 700;
}

.submit-btn {
  width: 300rpx;
  margin: 0;
}
</style>
