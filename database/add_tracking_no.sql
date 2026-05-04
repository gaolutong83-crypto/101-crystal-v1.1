USE crystal_101;

ALTER TABLE orders
  ADD COLUMN tracking_no VARCHAR(80) NULL COMMENT '快递单号' AFTER status;
