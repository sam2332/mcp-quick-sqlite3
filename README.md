# SQLite MCP Server

A Model Context Protocol (MCP) server that provides tools for querying SQLite databases. This server allows AI assistants to interact with SQLite databases by listing tables, describing schemas, and executing queries.

## Features

- **Connect to SQLite databases**: Connect to any SQLite database file
- **List tables**: Get all table names in the database  
- **Describe table schemas**: View column definitions, types, and constraints
- **Query data**: Execute SELECT queries with automatic result formatting
- **Execute queries**: Run INSERT, UPDATE, DELETE and other SQL operations
- **Get comprehensive table info**: View schema, indexes, row counts, and sample data

## Installation

```bash
npm install
npm run build
```

## Usage

### As an MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {}
    }
  }
}
```

### Available Tools

1. **connect_database** - Connect to a SQLite database file
   - `path`: Path to the SQLite database file
   - `readonly`: Optional boolean to open in read-only mode

2. **list_tables** - List all tables in the connected database

3. **describe_table** - Get the schema/structure of a specific table
   - `table_name`: Name of the table to describe

4. **query_data** - Execute a SELECT query on the database
   - `query`: SQL SELECT query to execute
   - `limit`: Optional maximum number of rows to return (default: 100)

5. **execute_query** - Execute any SQL query (INSERT, UPDATE, DELETE, etc.)
   - `query`: SQL query to execute

6. **get_table_info** - Get comprehensive information about a table
   - `table_name`: Name of the table to analyze
   - `sample_rows`: Optional number of sample rows to return (default: 5)

## Example Usage

1. First connect to a database:
   ```
   Tool: connect_database
   Args: {"path": "./sample.db"}
   ```

2. List all tables:
   ```
   Tool: list_tables
   ```

3. Get detailed information about a table:
   ```
   Tool: get_table_info
   Args: {"table_name": "users", "sample_rows": 3}
   ```

4. Query data:
   ```
   Tool: query_data
   Args: {"query": "SELECT * FROM users WHERE active = 1", "limit": 10}
   ```

## Development

```bash
# Build TypeScript
npm run build

# Watch for changes during development
npm run dev

# Start the server
npm start
```

## Requirements

- Node.js 18 or higher
- SQLite database files

## Security Notes

- The server can execute any SQL query, so ensure proper access controls
- Consider using read-only mode for sensitive databases
- SQL injection protection is the responsibility of the query author
