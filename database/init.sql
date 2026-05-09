CREATE DATABASE IF NOT EXISTS crystal_101
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE crystal_101;

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS components;

CREATE TABLE components (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL COMMENT '组件名称',
  type TINYINT UNSIGNED NOT NULL COMMENT '1绳结,2主珠,3配饰',
  img_url VARCHAR(500) NOT NULL COMMENT '图片地址',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '销售价格',
  stock INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '库存',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_components_type (type),
  CONSTRAINT chk_components_type CHECK (type IN (1, 2, 3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(40) NOT NULL COMMENT '订单号',
  diy_snapshot JSON NOT NULL COMMENT 'DIY搭配方案快照',
  address_snapshot JSON NULL COMMENT '微信地址快照',
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '订单总价',
  status TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0待付款,1待发货,2已发货',
  tracking_no VARCHAR(80) NULL COMMENT '快递单号',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_order_no (order_no),
  KEY idx_orders_status_created_at (status, created_at),
  CONSTRAINT chk_orders_status CHECK (status IN (0, 1, 2))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cart_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  diy_snapshot JSON NOT NULL COMMENT 'DIY搭配方案快照',
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '购物车项总价',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cart_items_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO components (name, type, img_url, price, stock) VALUES
('咖色平安结', 1, 'https://dummyimage.com/300x300/d8b894/ffffff&text=Rope-1', 12.00, 80),
('黑曜金刚结', 1, 'https://dummyimage.com/300x300/2d2926/ffffff&text=Rope-2', 15.00, 60),
('白水晶主珠', 2, 'https://dummyimage.com/300x300/e8f4ff/333333&text=Quartz', 18.00, 120),
('粉水晶主珠', 2, 'https://dummyimage.com/300x300/f8c8dc/333333&text=Rose', 22.00, 90),
('紫水晶主珠', 2, 'https://dummyimage.com/300x300/967bb6/ffffff&text=Amethyst', 26.00, 70),
('黄水晶主珠', 2, 'https://dummyimage.com/300x300/f7d774/333333&text=Citrine', 24.00, 75),
('海蓝宝主珠', 2, 'https://dummyimage.com/300x300/88c9e8/333333&text=Aqua', 28.00, 65),
('银色莲花配饰', 3, 'https://dummyimage.com/300x300/c9c9c9/333333&text=Lotus', 16.00, 50),
('金色星月配饰', 3, 'https://dummyimage.com/300x300/d6a64f/ffffff&text=Moon', 18.00, 45),
('玛瑙隔珠配饰', 3, 'https://dummyimage.com/300x300/9b2f2f/ffffff&text=Agate', 20.00, 40);
