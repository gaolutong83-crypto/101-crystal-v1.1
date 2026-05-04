<template>
  <view class="page confirm-page">
    <view class="card">
      <text class="title">DIY方案</text>
      <view class="thumb-row">
        <image
          v-for="item in previewItems"
          :key="`${item.id}-${item.previewKey}`"
          class="thumb"
          :src="item.img_url"
          mode="aspectFill"
        />
      </view>

      <view class="detail-list">
        <view v-for="item in detailItems" :key="item.key" class="detail-item">
          <text class="detail-name">{{ item.label }}：{{ item.name }}</text>
          <text class="detail-price">¥{{ item.price }}</text>
        </view>
      </view>

      <view class="total-row">
        <text>合计</text>
        <text class="total">¥{{ payload.totalPrice || '0.00' }}</text>
      </view>
    </view>

    <view class="card address-card" @tap="chooseAddress">
      <text class="title">收货地址</text>
      <template v-if="address.userName">
        <text class="address-line">{{ address.userName }} {{ address.telNumber }}</text>
        <text class="address-line">
          {{ address.provinceName }}{{ address.cityName }}{{ address.countyName }}{{ address.detailInfo }}
        </text>
      </template>
      <text v-else class="placeholder">点击选择微信收货地址</text>
    </view>

    <button class="primary-btn submit-btn" :loading="submitting" @tap="submitOrder">
      提交订单
    </button>
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
const submitting = ref(false);

const previewItems = computed(() => {
  return [payload.rope, ...payload.beads, payload.pendant]
    .filter(Boolean)
    .map((item, index) => ({ ...item, previewKey: index }));
});

const detailItems = computed(() => {
  const items = [];

  if (payload.rope) {
    items.push({ ...payload.rope, key: 'rope', label: '绳结' });
  }

  payload.beads.forEach((bead, index) => {
    items.push({ ...bead, key: `bead-${index}`, label: `主珠${index + 1}` });
  });

  if (payload.pendant) {
    items.push({ ...payload.pendant, key: 'pendant', label: '配饰' });
  }

  return items;
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
  if (!payload.rope || payload.beads.length === 0) {
    uni.showToast({ title: 'DIY方案不完整', icon: 'none' });
    return;
  }

  if (!address.value.userName) {
    uni.showToast({ title: '请选择收货地址', icon: 'none' });
    return;
  }

  if (submitting.value) {
    return;
  }

  submitting.value = true;

  try {
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
      title: '模拟支付成功',
      content: `订单号：${res.data.orderNo}`,
      showCancel: false,
      success: () => {
        uni.switchTab({ url: '/pages/orders/index' });
      }
    });
  } finally {
    submitting.value = false;
  }
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
.confirm-page {
  padding-bottom: 40rpx;
}

.card {
  margin-bottom: 24rpx;
}

.title {
  display: block;
  margin-bottom: 18rpx;
  font-size: 32rpx;
  font-weight: 700;
}

.thumb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-bottom: 24rpx;
}

.thumb {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #eee4d8;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.detail-item,
.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-name {
  flex: 1;
  color: #2f2923;
}

.detail-price {
  color: #9b4d2e;
}

.total-row {
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 2rpx solid #f0e7dd;
}

.total {
  color: #9b4d2e;
  font-size: 40rpx;
  font-weight: 700;
}

.address-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.address-line {
  color: #2f2923;
  line-height: 1.5;
}

.placeholder {
  color: #9b9086;
}

.submit-btn {
  margin-top: 36rpx;
}
</style>
