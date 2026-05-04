const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export function request(options) {
  const token = uni.getStorageSync('token');

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.header || {})
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }

        uni.showToast({
          title: res.data?.message || '请求失败',
          icon: 'none'
        });
        reject(res.data);
      },
      fail: (error) => {
        uni.showToast({
          title: '网络异常',
          icon: 'none'
        });
        reject(error);
      }
    });
  });
}
