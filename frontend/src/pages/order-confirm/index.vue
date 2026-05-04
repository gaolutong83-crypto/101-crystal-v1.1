<template>
  <view class="page">
    <view class="card">
      <text class="title">DIY方案</text>
      <view class="preview-row">
        <image
          v-for="item in previewItems"
          :key="`${item.id}-${item.previewKey}`"
          class="preview-img"
          :src="item.img_url"
          mode="aspectFill"
        />
      </view>
      <text class="total">¥{{ payload.totalPrice || '0.00' }}</text>
    </view>

    <view class="card address" @tap="chooseAddress">
      <text class="title">收货地址</text>
      <text v-if="address.userName">{{ address.userName }} {{ address.telNumber }}</text>
      <text v-if="address.detailInfo">{{ address.provinceName }}{{ address.cityName }}{{ address.countyName }}{{ address.detailInfo }}</text>
      <text v-else class="placeholder">点击调用微信原生地址</text>
    </view>

    <button class="primary-btn submit" @tap="submitOrder">提交订单</button>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const payload = reactive({
  rope: null,
  beads: [],
  pendant: null,
  totalPrice: '0.00'
});
const address = ref({});

const previewItems = computed(() => {
  return [payload.rope, ...payload.beads, payload.pendant]
    .filter(Boolean)
    .map((item, index) => ({ ...item, previewKey: index }));
});

function chooseAddress() {
  uni.chooseAddress({
    success: (res) => {
      address.value = res;
    },
    fail: () => {
      uni.showToast({ title: '未选择地址', icon: 'none' });
    }
  });
}

async function submitOrder() {
  if (!address.value.userName) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' });
    return;
  }

  const res = await request({
    url: '/orders/create',
    method: 'POST',
    data: {
      diy_snapshot: {
        rope: payload.rope,
        beads: payload.beads,
        pendant: payload.pendant
      },
      address_snapshot: address.value
    }
  });

  uni.showModal({
    title: '订单已提交',
    content: `订单号：${res.data.orderNo}`,
    showCancel: false,
    success: () => {
      uni.switchTab({ url: '/pages/orders/index' });
    }
  });
}

onLoad((query) => {
  if (!query.payload) {
    return;
  }

  const parsed = JSON.parse(decodeURIComponent(query.payload));
  Object.assign(payload, parsed);
});
</script>

<style scoped>
.card {
  margin-bottom: 24rpx;
}

.title {
  display: block;
  margin-bottom: 18rpx;
  font-size: 32rpx;
  font-weight: 700;
}

.preview-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.preview-img {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #eee4d8;
}

.total {
  display: block;
  margin-top: 20rpx;
  color: #9b4d2e;
  font-size: 40rpx;
  font-weight: 700;
}

.address {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.placeholder {
  color: #9b9086;
}

.submit {
  margin-top: 40rpx;
}
</style>
