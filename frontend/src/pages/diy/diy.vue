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

    <view class="card action-card">
      <view class="action-row">
        <button class="action-btn" :disabled="undoStack.length === 0" @tap="undo">撤销</button>
        <button class="action-btn" :disabled="redoStack.length === 0" @tap="redo">重做</button>
        <button class="action-btn" @tap="saveTemplate">保存模板</button>
      </view>
      <text class="action-tip">
        历史 {{ undoStack.length }} 步，可重做 {{ redoStack.length }} 步
      </text>
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
        <view v-if="diyState.beads.length > 0" class="selected-beads">
          <view class="selected-head">
            <text class="selected-title">已选主珠</text>
            <text class="clear-link" @tap="clearBeads">清空</text>
          </view>
          <view class="selected-list">
            <view v-for="(item, index) in diyState.beads" :key="`${item.id}-${index}`" class="selected-item">
              <text class="selected-name">{{ item.name }}</text>
              <text class="remove-link" @tap="removeBead(index)">删除</text>
            </view>
          </view>
        </view>
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

      <view class="group">
        <text class="group-title">DIY模板</text>
        <text v-if="templates.length === 0" class="empty">暂无模板，先保存一个吧</text>
        <view v-else class="template-list">
          <view v-for="item in templates" :key="item.id" class="template-item">
            <text class="template-name">{{ item.name }}</text>
            <view class="template-actions">
              <text class="template-link" @tap="applyTemplate(item)">套用</text>
              <text class="template-link danger" @tap="removeTemplate(item.id)">删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="footer">
      <view>
        <text class="total-label">总价</text>
        <text class="total">¥{{ totalPrice }}</text>
      </view>
      <view class="footer-actions">
        <button class="cart-btn" :loading="cartSubmitting" @tap="addToCart">加入购物车</button>
        <button class="primary-btn submit-btn" @tap="goConfirm">确认方案</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { onHide, onLoad, onUnload } from '@dcloudio/uni-app';
import { request } from '../../utils/request';

const HISTORY_LIMIT = 30;
const TEMPLATE_LIMIT = 5;
const DRAFT_KEY = 'diy_draft_v1';
const TEMPLATE_KEY = 'diy_templates_v1';
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DRAFT_DEBOUNCE_MS = 300;

const ropes = ref([]);
const beads = ref([]);
const pendants = ref([]);
const templates = ref([]);
const undoStack = ref([]);
const redoStack = ref([]);
const cartSubmitting = ref(false);

let draftTimer = null;

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

function cloneComponent(item) {
  if (!item) {
    return null;
  }
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    price: item.price,
    img_url: item.img_url
  };
}

function createSnapshot() {
  return {
    rope: cloneComponent(diyState.rope),
    beads: diyState.beads.map((item) => cloneComponent(item)),
    pendant: cloneComponent(diyState.pendant)
  };
}

function snapshotSignature(snapshot) {
  const ropeId = snapshot.rope?.id || 0;
  const pendantId = snapshot.pendant?.id || 0;
  const beadIds = snapshot.beads.map((item) => item.id).join(',');
  return `${ropeId}|${beadIds}|${pendantId}`;
}

function pushUndoSnapshot(snapshot) {
  undoStack.value.push(snapshot);
  if (undoStack.value.length > HISTORY_LIMIT) {
    undoStack.value.shift();
  }
}

function findById(list, id) {
  return list.find((item) => Number(item.id) === Number(id)) || null;
}

function normalizeSnapshot(raw) {
  const rope = raw?.rope ? findById(ropes.value, raw.rope.id) : null;
  const pendant = raw?.pendant ? findById(pendants.value, raw.pendant.id) : null;
  const beadItems = Array.isArray(raw?.beads) ? raw.beads : [];

  return {
    rope: cloneComponent(rope),
    beads: beadItems
      .map((item) => findById(beads.value, item?.id))
      .filter(Boolean)
      .map((item) => cloneComponent(item)),
    pendant: cloneComponent(pendant)
  };
}

function applySnapshot(snapshot) {
  diyState.rope = snapshot.rope;
  diyState.beads = snapshot.beads;
  diyState.pendant = snapshot.pendant;
}

function hasAnySelection(snapshot) {
  return Boolean(snapshot.rope || snapshot.pendant || snapshot.beads.length > 0);
}

function saveDraftNow() {
  try {
    uni.setStorageSync(
      DRAFT_KEY,
      JSON.stringify({
        version: 1,
        updatedAt: Date.now(),
        snapshot: createSnapshot()
      })
    );
  } catch (error) {
    console.warn('保存DIY草稿失败', error);
  }
}

function queueDraftSave() {
  if (draftTimer) {
    clearTimeout(draftTimer);
  }
  draftTimer = setTimeout(() => {
    saveDraftNow();
    draftTimer = null;
  }, DRAFT_DEBOUNCE_MS);
}

function flushDraftSave() {
  if (draftTimer) {
    clearTimeout(draftTimer);
    draftTimer = null;
  }
  saveDraftNow();
}

function commitMutation(mutator) {
  const before = createSnapshot();
  const beforeSig = snapshotSignature(before);

  mutator();

  const after = createSnapshot();
  if (snapshotSignature(after) === beforeSig) {
    return;
  }

  pushUndoSnapshot(before);
  redoStack.value = [];
  queueDraftSave();
}

function selectRope(item) {
  commitMutation(() => {
    diyState.rope = cloneComponent(item);
  });
}

function addBead(item) {
  commitMutation(() => {
    diyState.beads.push(cloneComponent(item));
  });
}

function removeBead(index) {
  commitMutation(() => {
    diyState.beads.splice(index, 1);
  });
}

function clearBeads() {
  if (diyState.beads.length === 0) {
    return;
  }
  commitMutation(() => {
    diyState.beads = [];
  });
}

function selectPendant(item) {
  commitMutation(() => {
    diyState.pendant = diyState.pendant?.id === item.id ? null : cloneComponent(item);
  });
}

function undo() {
  if (undoStack.value.length === 0) {
    return;
  }

  const previous = undoStack.value.pop();
  redoStack.value.push(createSnapshot());
  applySnapshot(previous);
  queueDraftSave();
}

function redo() {
  if (redoStack.value.length === 0) {
    return;
  }

  const next = redoStack.value.pop();
  pushUndoSnapshot(createSnapshot());
  applySnapshot(next);
  queueDraftSave();
}

function loadTemplates() {
  try {
    const saved = uni.getStorageSync(TEMPLATE_KEY);
    if (!saved) {
      templates.value = [];
      return;
    }

    const parsed = JSON.parse(saved);
    templates.value = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    templates.value = [];
    console.warn('读取DIY模板失败', error);
  }
}

function persistTemplates() {
  try {
    uni.setStorageSync(TEMPLATE_KEY, JSON.stringify(templates.value));
  } catch (error) {
    console.warn('保存DIY模板失败', error);
  }
}

function saveTemplate() {
  const snapshot = createSnapshot();
  if (!hasAnySelection(snapshot)) {
    uni.showToast({ title: '当前方案为空', icon: 'none' });
    return;
  }

  const now = new Date();
  const name = `模板${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const next = [
    {
      id: `tpl_${Date.now()}`,
      name,
      createdAt: Date.now(),
      snapshot
    },
    ...templates.value
  ].slice(0, TEMPLATE_LIMIT);

  templates.value = next;
  persistTemplates();
  uni.showToast({ title: '模板已保存', icon: 'none' });
}

function applyTemplate(templateItem) {
  const normalized = normalizeSnapshot(templateItem.snapshot);
  if (!hasAnySelection(normalized)) {
    uni.showToast({ title: '模板已失效', icon: 'none' });
    return;
  }

  pushUndoSnapshot(createSnapshot());
  redoStack.value = [];
  applySnapshot(normalized);
  queueDraftSave();
  uni.showToast({ title: '已套用模板', icon: 'none' });
}

function removeTemplate(templateId) {
  templates.value = templates.value.filter((item) => item.id !== templateId);
  persistTemplates();
}

function restoreDraft() {
  try {
    const saved = uni.getStorageSync(DRAFT_KEY);
    if (!saved) {
      return;
    }

    const parsed = JSON.parse(saved);
    const isExpired = Date.now() - Number(parsed.updatedAt || 0) > DRAFT_TTL_MS;
    if (parsed.version !== 1 || isExpired) {
      uni.removeStorageSync(DRAFT_KEY);
      return;
    }

    const normalized = normalizeSnapshot(parsed.snapshot);
    if (!hasAnySelection(normalized)) {
      return;
    }

    applySnapshot(normalized);
    uni.showToast({ title: '已恢复上次草稿', icon: 'none' });
  } catch (error) {
    console.warn('恢复DIY草稿失败', error);
  }
}

function restoreFromPayload(payload) {
  try {
    const parsed = JSON.parse(decodeURIComponent(payload));
    const normalized = normalizeSnapshot(parsed);

    if (!hasAnySelection(normalized)) {
      return false;
    }

    applySnapshot(normalized);
    return true;
  } catch (error) {
    console.warn('恢复购物车DIY方案失败', error);
    return false;
  }
}

function isDiyComplete() {
  if (!diyState.rope || diyState.beads.length === 0) {
    uni.showToast({ title: '请选择绳结并添加主珠', icon: 'none' });
    return false;
  }

  return true;
}

async function addToCart() {
  if (!isDiyComplete() || cartSubmitting.value) {
    return;
  }

  cartSubmitting.value = true;

  try {
    await request({
      url: '/cart/items',
      method: 'POST',
      data: {
        diy_snapshot: {
          rope: diyState.rope,
          beads: diyState.beads,
          pendant: diyState.pendant
        }
      }
    });

    uni.showToast({ title: '已加入购物车', icon: 'none' });
  } finally {
    cartSubmitting.value = false;
  }
}

function goConfirm() {
  if (!isDiyComplete()) {
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

onLoad(async (query) => {
  await loadComponents();
  loadTemplates();

  if (query?.payload && restoreFromPayload(query.payload)) {
    return;
  }

  restoreDraft();
});

onHide(flushDraftSave);
onUnload(flushDraftSave);
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

.action-card {
  margin-bottom: 24rpx;
}

.action-row {
  display: flex;
  gap: 16rpx;
}

.action-btn {
  margin: 0;
  flex: 1;
  border: 2rpx solid #eee4d8;
  background: #fff;
  color: #5c4a3f;
}

.action-tip {
  display: block;
  margin-top: 10rpx;
  color: #9b9086;
  font-size: 22rpx;
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

.selected-beads {
  margin-top: 16rpx;
  padding: 12rpx;
  border-radius: 14rpx;
  background: #f9f4ee;
}

.selected-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.selected-title {
  font-size: 24rpx;
  color: #5f554b;
}

.clear-link,
.remove-link,
.template-link {
  color: #9b4d2e;
  font-size: 24rpx;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.selected-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-name {
  flex: 1;
  color: #2f2923;
  font-size: 24rpx;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.template-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 14rpx;
  border-radius: 14rpx;
  background: #f9f4ee;
}

.template-name {
  color: #2f2923;
  font-size: 24rpx;
}

.template-actions {
  display: flex;
  gap: 14rpx;
}

.template-link.danger {
  color: #b4442f;
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

.footer-actions {
  display: flex;
  gap: 14rpx;
}

.cart-btn {
  width: 210rpx;
  height: 88rpx;
  line-height: 88rpx;
  margin: 0;
  border-radius: 999rpx;
  color: #8c5a3c;
  background: #fbf4ee;
  font-size: 28rpx;
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
  width: 220rpx;
  margin: 0;
}
</style>
