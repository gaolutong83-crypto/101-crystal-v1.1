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

    <view class="card address-card">
      <view class="address-head">
        <text class="title">收货地址</text>
        <view class="address-actions">
          <button class="mini-btn" size="mini" @tap="chooseAddress">微信地址</button>
          <button class="mini-btn" size="mini" @tap="showManualAddress">手填地址</button>
        </view>
      </view>
      <template v-if="address.userName">
        <text class="address-line">{{ address.userName }} {{ address.telNumber }}</text>
        <text class="address-line">
          {{ address.provinceName }}{{ address.cityName }}{{ address.countyName }}{{ address.detailInfo }}
        </text>
      </template>
      <text v-else class="placeholder">请选择微信地址；开发者工具不可用时可手填地址</text>

      <view v-if="manualVisible" class="manual-form">
        <input v-model="manualAddress.userName" class="input" placeholder="收货人姓名" />
        <input v-model="manualAddress.telNumber" class="input" type="number" placeholder="手机号" />
        <input v-model="manualAddress.detailInfo" class="input" placeholder="省市区 + 详细地址" />
        <button class="primary-btn manual-btn" @tap="saveManualAddress">保存手填地址</button>
      </view>
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
const manualVisible = ref(false);
const cartItemId = ref(0);
const manualAddress = reactive({
  userName: '',
  telNumber: '',
  detailInfo: ''
});

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
      manualVisible.value = false;
    },
    fail: () => {
      manualVisible.value = true;
      uni.showToast({ title: '请手填地址继续测试', icon: 'none' });
    }
  });
}

function showManualAddress() {
  manualVisible.value = true;
}

function saveManualAddress() {
  if (!manualAddress.userName || !manualAddress.telNumber || !manualAddress.detailInfo) {
    uni.showToast({ title: '请填写完整地址', icon: 'none' });
    return;
  }

  address.value = {
    userName: manualAddress.userName,
    telNumber: manualAddress.telNumber,
    provinceName: '',
    cityName: '',
    countyName: '',
    detailInfo: manualAddress.detailInfo,
    source: 'manual'
  };
  manualVisible.value = false;
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
        address_snapshot: address.value,
        cart_item_id: cartItemId.value || undefined
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

  try {
    const parsed = JSON.parse(decodeURIComponent(query.payload));
    Object.assign(payload, parsed);
    cartItemId.value = Number(query.cartItemId || query.cart_item_id || 0);
  } catch (error) {
    uni.showToast({ title: 'DIY方案解析失败', icon: 'none' });
    console.warn('订单确认页payload解析失败', error);
  }
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

.address-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.address-actions {
  display: flex;
  gap: 12rpx;
}

.mini-btn {
  margin: 0;
  color: #8c5a3c;
  background: #fbf4ee;
}

.address-line {
  color: #2f2923;
  line-height: 1.5;
}

.placeholder {
  color: #9b9086;
}

.manual-form {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 12rpx;
}

.input {
  height: 76rpx;
  padding: 0 20rpx;
  border-radius: 14rpx;
  background: #f7f3ee;
}

.manual-btn {
  margin-top: 8rpx;
}

.submit-btn {
  margin-top: 36rpx;
}
</style>
