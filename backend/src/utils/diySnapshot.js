import { httpError } from './httpError.js';

export function getSnapshotFromBody(body) {
  return body.diy_snapshot || body.diySnapshot;
}

export function normalizeDiySnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw httpError(400, 'DIY方案不能为空');
  }

  const rope = snapshot?.rope || null;
  const beads = Array.isArray(snapshot?.beads) ? snapshot.beads : [];
  const pendant = snapshot?.pendant || null;

  if (!rope || beads.length === 0) {
    throw httpError(400, '请选择绳结并至少添加一颗主珠');
  }

  const parts = [
    { key: 'rope', expectedType: 1, id: Number(rope.id) },
    ...beads.map((bead) => ({ key: 'beads', expectedType: 2, id: Number(bead.id) })),
    ...(pendant ? [{ key: 'pendant', expectedType: 3, id: Number(pendant.id) }] : [])
  ];

  if (parts.some((part) => !Number.isInteger(part.id) || part.id <= 0)) {
    throw httpError(400, 'DIY方案中存在无效组件');
  }

  return parts;
}

export function buildCountMap(parts) {
  return parts.reduce((map, part) => {
    map.set(part.id, (map.get(part.id) || 0) + 1);
    return map;
  }, new Map());
}

function buildPlaceholders(values) {
  return values.map(() => '?').join(', ');
}

function assertComponentTypes(parts, componentMap) {
  for (const part of parts) {
    const component = componentMap.get(part.id);

    if (!component) {
      throw httpError(400, '存在不可用的水晶组件');
    }

    if (component.type !== part.expectedType) {
      throw httpError(400, `${component.name} 组件类型不匹配`);
    }
  }
}

function assertComponentStock(components, countMap) {
  for (const component of components) {
    const count = countMap.get(component.id);

    if (component.stock < count) {
      throw httpError(409, `${component.name} 库存不足`);
    }
  }
}

function buildServerSnapshot(parts, componentMap) {
  const snapshot = {
    rope: null,
    beads: [],
    pendant: null
  };

  for (const part of parts) {
    const component = componentMap.get(part.id);
    const item = {
      id: component.id,
      name: component.name,
      type: component.type,
      img_url: component.img_url,
      price: component.price
    };

    if (part.key === 'rope') {
      snapshot.rope = item;
    } else if (part.key === 'beads') {
      snapshot.beads.push(item);
    } else {
      snapshot.pendant = item;
    }
  }

  return snapshot;
}

function calculateTotalCents(components, countMap) {
  return components.reduce((sum, component) => {
    const count = countMap.get(component.id);
    return sum + Math.round(Number(component.price) * 100) * count;
  }, 0);
}

export async function prepareDiySnapshot(db, snapshot, options = {}) {
  const { forUpdate = false, checkStock = true } = options;
  const parts = normalizeDiySnapshot(snapshot);
  const countMap = buildCountMap(parts);
  const uniqueIds = [...countMap.keys()];
  const lockSql = forUpdate ? ' FOR UPDATE' : '';

  const [components] = await db.query(
    `
      SELECT id, name, type, img_url, price, stock
      FROM components
      WHERE id IN (${buildPlaceholders(uniqueIds)})${lockSql}
    `,
    uniqueIds
  );

  if (components.length !== uniqueIds.length) {
    throw httpError(400, '存在不可用的水晶组件');
  }

  const componentMap = new Map(components.map((component) => [component.id, component]));
  assertComponentTypes(parts, componentMap);

  if (checkStock) {
    assertComponentStock(components, countMap);
  }

  const totalCents = calculateTotalCents(components, countMap);

  return {
    parts,
    countMap,
    components,
    serverSnapshot: buildServerSnapshot(parts, componentMap),
    totalPrice: (totalCents / 100).toFixed(2)
  };
}
