# Example Usage of SQLite MCP Server

This document shows example interactions with the SQLite MCP server.

## Setup

1. Build the project: `npm run build`
2. Create sample database: `npm run setup-sample`
3. Start the server: `npm start` (or use via MCP client)

## Tool Usage Examples

### 1. Connect to Database

```json
{
  "tool": "connect_database",
  "arguments": {
    "path": "./sample.db",
    "readonly": false
  }
}
```

**Response:**
```
Successfully connected to database: d:\mcp\quick-sqlite3\sample.db
SQLite version: 3.46.0
```

### 2. List All Tables

```json
{
  "tool": "list_tables",
  "arguments": {}
}
```

**Response:**
```
Tables in database (3): orders, products, users
```

### 3. Describe Table Structure

```json
{
  "tool": "describe_table",
  "arguments": {
    "table_name": "users"
  }
}
```

**Response:**
```
Table: users

Schema:
  id INTEGER NOT NULL PRIMARY KEY
  username VARCHAR(50) NOT NULL
  email VARCHAR(100) NOT NULL
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP
  active BOOLEAN NULL DEFAULT 1
```

### 4. Get Comprehensive Table Information

```json
{
  "tool": "get_table_info",
  "arguments": {
    "table_name": "users",
    "sample_rows": 3
  }
}
```

**Response:**
```
Table: users
Row count: 5

Schema:
  id INTEGER NOT NULL PRIMARY KEY
  username VARCHAR(50) NOT NULL
  email VARCHAR(100) NOT NULL
  created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP
  active BOOLEAN NULL DEFAULT 1

Indexes:
  idx_users_email (NON-UNIQUE)

Sample data (3 rows):
id | username | email | created_at | active
----|----------|-------|------------|-------
1 | john_doe | john@example.com | 2025-01-07 15:30:45 | 1
2 | jane_smith | jane@example.com | 2025-01-07 15:30:45 | 1
3 | bob_wilson | bob@example.com | 2025-01-07 15:30:45 | 0
```

### 5. Query Data

```json
{
  "tool": "query_data",
  "arguments": {
    "query": "SELECT u.username, p.name as product, o.quantity, o.status FROM orders o JOIN users u ON o.user_id = u.id JOIN products p ON o.product_id = p.id WHERE o.status = 'completed'",
    "limit": 10
  }
}
```

**Response:**
```
Query results (4 rows):

username | product | quantity | status
---------|---------|----------|----------
john_doe | Laptop Computer | 1 | completed
john_doe | Wireless Mouse | 2 | completed
john_doe | Notebook | 10 | completed
jane_smith | Wireless Mouse | 1 | completed
```

### 6. Execute Insert Query

```json
{
  "tool": "execute_query",
  "arguments": {
    "query": "INSERT INTO users (username, email) VALUES ('new_user', 'newuser@example.com')"
  }
}
```

**Response:**
```
Query executed successfully. Changes: 1, Last insert row ID: 6
```

### 7. Complex Analytical Query

```json
{
  "tool": "query_data",
  "arguments": {
    "query": "SELECT p.category, COUNT(*) as order_count, SUM(o.quantity * p.price) as total_revenue FROM orders o JOIN products p ON o.product_id = p.id WHERE o.status != 'cancelled' GROUP BY p.category ORDER BY total_revenue DESC"
  }
}
```

**Response:**
```
Query results (3 rows):

category | order_count | total_revenue
---------|-------------|---------------
Electronics | 4 | 1119.96
Office Supplies | 3 | 91.93
Furniture | 2 | 249.98
```

## Common Use Cases

### Database Analysis
- Use `list_tables` to discover available data
- Use `get_table_info` to understand table structure and relationships
- Use analytical queries to find patterns and insights

### Data Exploration
- Use `query_data` with simple SELECT statements to browse data
- Apply filters and joins to answer specific questions
- Use LIMIT to prevent overwhelming results

### Data Modification
- Use `execute_query` for INSERT, UPDATE, DELETE operations
- Be careful with destructive operations
- Consider using transactions for complex changes

## Tips for AI Assistants

1. **Always connect first**: Use `connect_database` before any other operations
2. **Explore structure**: Use `list_tables` and `get_table_info` to understand the database
3. **Start simple**: Begin with basic queries before attempting complex joins
4. **Use limits**: Add appropriate LIMIT clauses to prevent large result sets
5. **Format results**: The server automatically formats results in readable tables
6. **Handle errors**: Check tool responses for error messages and adjust queries accordingly

## Security Considerations

- The server can execute any SQL - use with trusted databases only
- Consider using `readonly: true` when connecting to sensitive databases
- SQL injection is possible - validate inputs when building dynamic queries
- Monitor for performance issues with large datasets
