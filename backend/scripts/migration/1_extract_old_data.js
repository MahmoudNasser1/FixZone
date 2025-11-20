#!/usr/bin/env node
/**
 * استخراج البيانات من النظام القديم
 * Extract Data from Old System
 * 
 * هذا السكريبت يقوم بـ:
 * 1. قراءة ملف SQL القديم
 * 2. استخراج البيانات من جداول clients, workorders, lookups
 * 3. تحويلها إلى JSON للمعالجة
 * 4. حفظها في ملفات منفصلة
 */

const fs = require('fs');
const path = require('path');

// المسارات
const OLD_SYSTEM_FILE = path.join(__dirname, '../../../IN/FZ Data From Old System 2025-11-20_u539485933_maintain_dump.sql');
const OUTPUT_DIR = path.join(__dirname, 'extracted_data');

// إنشاء مجلد الإخراج
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🚀 بدء استخراج البيانات من النظام القديم...\n');

/**
 * استخراج INSERT statements من SQL
 */
function extractInsertStatements(sqlContent, tableName) {
  const regex = new RegExp(`INSERT INTO \`${tableName}\` VALUES ([^;]+);`, 'g');
  const matches = [];
  let match;
  
  while ((match = regex.exec(sqlContent)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

/**
 * تحويل INSERT values إلى array of objects
 */
function parseInsertValues(valuesString, columns) {
  const rows = [];
  
  // تقسيم القيم - البحث عن (...)
  const rowRegex = /\(([^)]+)\)/g;
  let match;
  
  while ((match = rowRegex.exec(valuesString)) !== null) {
    const values = match[1].split(',').map(v => {
      v = v.trim();
      // إزالة النصوص المحاطة بعلامات اقتباس
      if (v.startsWith("'") && v.endsWith("'")) {
        return v.slice(1, -1).replace(/\\'/g, "'");
      }
      // NULL
      if (v === 'NULL') {
        return null;
      }
      // أرقام
      if (!isNaN(v)) {
        return parseFloat(v);
      }
      return v;
    });
    
    const row = {};
    columns.forEach((col, idx) => {
      row[col] = values[idx] !== undefined ? values[idx] : null;
    });
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * استخراج بنية الجدول (columns)
 */
function extractTableStructure(sqlContent, tableName) {
  const createTableRegex = new RegExp(
    `CREATE TABLE \`${tableName}\`\\s*\\(([^;]+)\\)`,
    's'
  );
  
  const match = sqlContent.match(createTableRegex);
  if (!match) return null;
  
  const columnDefinitions = match[1];
  const columns = [];
  
  // استخراج أسماء الأعمدة
  const lines = columnDefinitions.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('`')) {
      const colName = trimmed.match(/`([^`]+)`/)?.[1];
      if (colName && !['PRIMARY', 'KEY', 'CONSTRAINT', 'UNIQUE'].includes(colName)) {
        columns.push(colName);
      }
    }
  }
  
  return columns;
}

/**
 * استخراج جدول معين
 */
function extractTable(sqlContent, tableName) {
  console.log(`📋 استخراج جدول ${tableName}...`);
  
  // الحصول على بنية الجدول
  const columns = extractTableStructure(sqlContent, tableName);
  if (!columns) {
    console.log(`⚠️  لم يتم العثور على بنية جدول ${tableName}`);
    return { columns: [], rows: [] };
  }
  
  console.log(`   الأعمدة: ${columns.length}`);
  
  // استخراج البيانات
  const insertStatements = extractInsertStatements(sqlContent, tableName);
  console.log(`   عدد INSERT statements: ${insertStatements.length}`);
  
  let allRows = [];
  for (const statement of insertStatements) {
    const rows = parseInsertValues(statement, columns);
    allRows = allRows.concat(rows);
  }
  
  console.log(`   ✅ تم استخراج ${allRows.length} سجل\n`);
  
  return {
    tableName,
    columns,
    rowCount: allRows.length,
    rows: allRows
  };
}

// البدء
try {
  console.log(`📄 قراءة الملف: ${OLD_SYSTEM_FILE}\n`);
  
  if (!fs.existsSync(OLD_SYSTEM_FILE)) {
    console.error('❌ الملف غير موجود!');
    process.exit(1);
  }
  
  const sqlContent = fs.readFileSync(OLD_SYSTEM_FILE, 'utf8');
  console.log(`✅ تم قراءة الملف (${(sqlContent.length / 1024 / 1024).toFixed(2)} MB)\n`);
  
  // استخراج الجداول الرئيسية
  const tables = ['clients', 'workorders', 'lookups', 'branches', 'invoices'];
  const extractedData = {};
  
  for (const tableName of tables) {
    const tableData = extractTable(sqlContent, tableName);
    extractedData[tableName] = tableData;
    
    // حفظ في ملف منفصل
    const outputFile = path.join(OUTPUT_DIR, `${tableName}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(tableData, null, 2), 'utf8');
    console.log(`💾 تم حفظ: ${outputFile}`);
  }
  
  // حفظ ملخص
  const summary = {
    extractionDate: new Date().toISOString(),
    sourceFile: OLD_SYSTEM_FILE,
    tables: Object.keys(extractedData).map(tableName => ({
      name: tableName,
      columns: extractedData[tableName].columns.length,
      rows: extractedData[tableName].rowCount
    }))
  };
  
  const summaryFile = path.join(OUTPUT_DIR, '_summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), 'utf8');
  
  console.log('\n' + '═'.repeat(50));
  console.log('✅ تم الاستخراج بنجاح!');
  console.log('═'.repeat(50));
  console.log('\n📊 الملخص:');
  summary.tables.forEach(t => {
    console.log(`   ${t.name}: ${t.rows} سجل (${t.columns} عمود)`);
  });
  console.log(`\n📁 الملفات المحفوظة في: ${OUTPUT_DIR}`);
  
} catch (error) {
  console.error('❌ خطأ:', error.message);
  console.error(error.stack);
  process.exit(1);
}

