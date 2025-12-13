# Database Migrations

This project uses a manual migration strategy. The `migrations/` directory contains SQL files that should be executed in order.

## How to Apply Migrations

### Option 1: Supabase Dashboard (Easiest)
1. Copy the content of the `.sql` file you want to apply.
2. Go to the **SQL Editor** in your Supabase Dashboard.
3. Paste and Run.

### Option 2: Supabase CLI (Recommended for Devs)
If you have the Supabase CLI installed and linked:
```bash
supabase db push
```

## Migration History

| File | Description | Status |
|------|-------------|--------|
| `000_init.sql` | Initial schema setup (Tables: accounts, knowledge, etc.) | ✅ Applied |
| `001_add_performance_indexes.sql` | Added critical performance indexes and unique constraints | ⏳ Pending |

## Schema Reference
The `schema.sql` (if present) represents the *current* desired state of the database, but `migrations/` is the source of truth for changes.
