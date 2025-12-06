# Database Migrations

This directory contains SQL migration files and a script to run them.

## Running Migrations

### Option 1: Using Node.js Script (Recommended)

```bash
cd /opt/lampp/htdocs/FixZone/backend/migrations
node run_migrations.js
```

Or from the project root:

```bash
node backend/migrations/run_migrations.js
```

### Option 2: Using MySQL Command Line

You can also run the SQL files directly using MySQL:

```bash
mysql -u root -p FZ < create_messaging_log_table.sql
mysql -u root -p FZ < add_shipping_amount_to_invoice.sql
# ... etc
```

## Migration Files

The script runs the following migrations in order:

1. **create_messaging_log_table.sql** - Creates the MessagingLog table for tracking message sending attempts
2. **add_shipping_amount_to_invoice.sql** - Adds shippingAmount column to Invoice table (with IF check)
3. **PRODUCTION_ADD_SHIPPING_AMOUNT.sql** - Production migration for shippingAmount
4. **add_shipping_amount_production.sql** - Alternative production migration
5. **add_shipping_amount_production_final.sql** - Final production migration
6. **add_shipping_amount_local.sql** - Local development migration

## Notes

- The script handles errors gracefully and continues even if some migrations fail (e.g., if a column already exists)
- Duplicate column/table errors are treated as warnings, not failures
- SELECT statements (verification queries) are executed but logged as informational
- The script uses environment variables from `.env` file for database connection

## Environment Variables

Make sure your `.env` file contains:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=FZ
DB_PORT=3306
```

## Production Deployment

Before running on production:

1. Backup your database
2. Ensure `DB_PASSWORD` is set in production environment
3. Run the migration script
4. Verify the changes

