<template>
  <slot />
</template>

<style>
page {
  background: #f7f3ee;
  color: #2f2923;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.page {
  min-height: 100vh;
  padding: 24rpx;
  box-sizing: border-box;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(68, 50, 33, 0.08);
}

.primary-btn {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 999rpx;
  background: #8c5a3c;
  color: #fff;
  font-size: 30rpx;
}
</style>
