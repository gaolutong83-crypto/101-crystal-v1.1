<template>
  <view class="page diy-page">
    <view class="preview card">
      <text class="section-title">实时预览</text>
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
      <text v-if="previewItems.length === 0" class="empty">请选择绳结、主珠和配饰</text>
    </view>

    <view class="selector card">
      <view class="group">
        <text class="group-title">选绳结</text>
        <scroll-view scroll-x class="option-scroll">
          <view class="option-row">
            <view
              v-for="item in ropes"
              :key="item.id"
              class="option"
              :class="{ active: diyState.rope?.id === item.id }"
              @tap="selectRope(item)"
            >
              <image class="option-img" :src="item.img_url" mode="aspectFill" />
              <text class="option-name">{{ item.name }}</text>
              <text class="option-price">¥{{ item.price }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="group">
        <text class="group-title">选主珠（可多点添加）</text>
        <scroll-view scroll-x class="option-scroll">
          <view class="option-row">
            <view v-for="item in beads" :key="item.id" class="option" @tap="addBead(item)">
              <image class="option-img" :src="item.img_url" mode="aspectFill" />
              <text class="option-name">{{ item.name }}</text>
              <text class="option-price">¥{{ item.price }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="group">
        <text class="group-title">选配饰（单选）</text>
        <scroll-view scroll-x class="option-scroll">
          <view class="option-row">
            <view
              v-for="item in pendants"
              :key="item.id"
              class="option"
              :class="{ active: diyState.pendant?.id === item.id }"
              @tap="selectPendant(item)"
            >
              <image class="option-img" :src="item.img_url" mode="aspectFill" />
              <text class="option-name">{{ item.name }}</text>
              <text class="option-price">¥{{ item.price }}</text>
            </view>
          </view>
        </scroll-view>
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

function selectRope(item) {
  diyState.rope = item;
}

function addBead(item) {
  diyState.beads.push(item);
}

function selectPendant(item) {
  diyState.pendant = item;
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

  uni.navigateTo({ url: `/pages/order/confirm?payload=${payload}` });
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
  padding-bottom: 150rpx;
}

.preview {
  margin-bottom: 24rpx;
}

.section-title,
.group-title {
  display: block;
  margin-bottom: 18rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.preview-scroll {
  width: 100%;
  white-space: nowrap;
}

.preview-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  min-height: 128rpx;
}

.preview-img {
  flex: 0 0 auto;
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: #eee4d8;
}

.empty {
  color: #9b9086;
  font-size: 26rpx;
}

.selector {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.option-scroll {
  width: 100%;
  white-space: nowrap;
}

.option-row {
  display: flex;
  gap: 18rpx;
}

.option {
  flex: 0 0 auto;
  width: 190rpx;
  padding: 16rpx;
  border: 2rpx solid #eee4d8;
  border-radius: 20rpx;
  box-sizing: border-box;
  background: #fff;
}

.option.active {
  border-color: #8c5a3c;
  background: #fbf4ee;
}

.option-img {
  width: 100%;
  height: 140rpx;
  border-radius: 14rpx;
  background: #eee4d8;
}

.option-name,
.option-price {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
}

.option-name {
  color: #2f2923;
}

.option-price {
  color: #9b4d2e;
  font-weight: 700;
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
