-- Migration: Remove unused fields from maintenance_records table
-- Date: 2025-07-03
-- Description: Remove vendor, technician, cost fields, work order number, warranty work, and parts replaced

ALTER TABLE maintenance_records DROP COLUMN IF EXISTS vendor;
ALTER TABLE maintenance_records DROP COLUMN IF EXISTS technician;
ALTER TABLE maintenance_records DROP COLUMN IF EXISTS cost;
ALTER TABLE maintenance_records DROP COLUMN IF EXISTS labor_cost;
ALTER TABLE maintenance_records DROP COLUMN IF EXISTS parts_cost;
ALTER TABLE maintenance_records DROP COLUMN IF EXISTS work_order_number;
ALTER TABLE maintenance_records DROP COLUMN IF EXISTS warranty_work;
ALTER TABLE maintenance_records DROP COLUMN IF EXISTS parts_replaced; 