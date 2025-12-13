-- ============================================================================
-- Migration: Enhance InspectionComponent table
-- Date: 2025-01-27
-- Description: Add soft delete, improve structure, add new fields for better tracking
-- Production Safe: Can be run multiple times without errors
-- ============================================================================

SET @dbname = DATABASE();
SET @tablename = 'InspectionComponent';

-- Step 1: Add deletedAt column (if not exists)
SET @columnname = 'deletedAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1 AS column_already_exists',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' datetime DEFAULT NULL COMMENT ''Soft delete timestamp'' AFTER createdAt')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 2: Add updatedAt column (if not exists)
SET @columnname = 'updatedAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1 AS column_already_exists',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' datetime DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT ''Last update timestamp'' AFTER createdAt')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 3: Add componentType column (if not exists)
SET @columnname = 'componentType';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1 AS column_already_exists',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' varchar(100) DEFAULT NULL COMMENT ''نوع المكون (screen, battery, keyboard, etc.)'' AFTER name')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 4: Add condition column (if not exists)
SET @columnname = 'condition';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1 AS column_already_exists',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' varchar(50) DEFAULT NULL COMMENT ''حالة المكون (excellent, good, fair, poor)'' AFTER status')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 5: Add estimatedCost column (if not exists)
SET @columnname = 'estimatedCost';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1 AS column_already_exists',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' decimal(10,2) DEFAULT NULL COMMENT ''التكلفة المتوقعة للإصلاح'' AFTER priority')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 6: Add partsUsedId column (if not exists)
SET @columnname = 'partsUsedId';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1 AS column_already_exists',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' int(11) DEFAULT NULL COMMENT ''رابط بقطع الغيار المستخدمة'' AFTER photo')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 7: Add isReplaced column (if not exists)
SET @columnname = 'isReplaced';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1 AS column_already_exists',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' tinyint(1) DEFAULT 0 COMMENT ''هل تم استبدال المكون'' AFTER partsUsedId')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 8: Add replacedAt column (if not exists)
SET @columnname = 'replacedAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1 AS column_already_exists',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' datetime DEFAULT NULL COMMENT ''تاريخ الاستبدال'' AFTER isReplaced')
));

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 9: Add indexes for better performance
SET @indexname = 'idx_inspectioncomponent_deletedAt';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  'SELECT 1 AS index_already_exists',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, '(deletedAt)')
));

PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

SET @indexname = 'idx_inspectioncomponent_reportId';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  'SELECT 1 AS index_already_exists',
  CONCAT('CREATE INDEX ', @indexname, ' ON ', @tablename, '(inspectionReportId)')
));

PREPARE createIndexIfNotExists FROM @preparedStatement;
EXECUTE createIndexIfNotExists;
DEALLOCATE PREPARE createIndexIfNotExists;

-- Step 10: Add foreign key for partsUsedId (if PartsUsed table exists and FK doesn't exist)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_NAME = 'fk_inspectioncomponent_partsused' 
  AND TABLE_NAME = @tablename 
  AND TABLE_SCHEMA = @dbname);

SET @partsused_table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_NAME = 'PartsUsed'
  AND TABLE_SCHEMA = @dbname);

SET @preparedStatement = IF(@fk_exists > 0 OR @partsused_table_exists = 0,
  'SELECT 1 AS fk_already_exists_or_table_not_found',
  'ALTER TABLE InspectionComponent ADD CONSTRAINT fk_inspectioncomponent_partsused FOREIGN KEY (partsUsedId) REFERENCES PartsUsed(id) ON DELETE SET NULL');

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Step 11: Update notes column to TEXT if it's still VARCHAR(255) to allow longer notes
SET @columnname = 'notes';
SET @current_type = (SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @dbname
  AND TABLE_NAME = @tablename
  AND COLUMN_NAME = @columnname);

SET @preparedStatement = IF(@current_type = 'varchar',
  CONCAT('ALTER TABLE ', @tablename, ' MODIFY COLUMN ', @columnname, ' text DEFAULT NULL COMMENT ''ملاحظات المكون'''),
  'SELECT 1 AS column_already_text');

PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Verification queries (optional - for checking results)
-- Uncomment these lines to verify the migration:
-- SELECT 'Migration completed successfully!' AS status;
-- DESCRIBE InspectionComponent;
-- SHOW INDEXES FROM InspectionComponent;


