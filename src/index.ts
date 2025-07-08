#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  TextContent,
  CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import Database from "better-sqlite3";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface DatabaseConfig {
  path: string;
  readonly?: boolean;
}

class SQLiteServer {
  private server: Server;
  private db: Database.Database | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "sqlite-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error: Error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      if (this.db) {
        this.db.close();
      }
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "connect_database",
            description: "Connect to a SQLite database file",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Path to the SQLite database file",
                },
                readonly: {
                  type: "boolean",
                  description: "Open database in read-only mode",
                  default: false,
                },
              },
              required: ["path"],
            },
          },
          {
            name: "list_tables",
            description: "List all tables in the connected database",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "describe_table",
            description: "Get the schema/structure of a specific table",
            inputSchema: {
              type: "object",
              properties: {
                table_name: {
                  type: "string",
                  description: "Name of the table to describe",
                },
              },
              required: ["table_name"],
            },
          },
          {
            name: "query_data",
            description: "Execute a SELECT query on the database",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "SQL SELECT query to execute",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of rows to return",
                  default: 100,
                },
              },
              required: ["query"],
            },
          },
          {
            name: "execute_query",
            description: "Execute any SQL query (INSERT, UPDATE, DELETE, etc.)",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "SQL query to execute",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "get_table_info",
            description: "Get comprehensive information about a table including schema, indexes, and sample data",
            inputSchema: {
              type: "object",
              properties: {
                table_name: {
                  type: "string",
                  description: "Name of the table to analyze",
                },
                sample_rows: {
                  type: "number",
                  description: "Number of sample rows to return",
                  default: 5,
                },
              },
              required: ["table_name"],
            },
          },
        ] satisfies Tool[],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "connect_database":
            return await this.connectDatabase(args as { path: string; readonly?: boolean });
          
          case "list_tables":
            return await this.listTables();
          
          case "describe_table":
            return await this.describeTable(args as { table_name: string });
          
          case "query_data":
            return await this.queryData(args as { query: string; limit?: number });
          
          case "execute_query":
            return await this.executeQuery(args as { query: string });
          
          case "get_table_info":
            return await this.getTableInfo(args as { table_name: string; sample_rows?: number });
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            } satisfies TextContent,
          ],
        } satisfies CallToolResult;
      }
    });
  }

  private async connectDatabase(args: { path: string; readonly?: boolean }): Promise<CallToolResult> {
    try {
      if (this.db) {
        this.db.close();
      }

      const dbPath = resolve(args.path);
      this.db = new Database(dbPath, { readonly: args.readonly || false });
      
      // Test the connection
      const result = this.db.prepare("SELECT sqlite_version() as version").get() as { version: string };
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully connected to database: ${dbPath}\nSQLite version: ${result.version}`,
          } satisfies TextContent,
        ],
      };
    } catch (error) {
      throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async listTables(): Promise<CallToolResult> {
    if (!this.db) {
      throw new Error("No database connected. Use connect_database first.");
    }

    try {
      const tables = this.db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
        .all() as { name: string }[];

      const tableList = tables.map(t => t.name).join(", ");
      
      return {
        content: [
          {
            type: "text",
            text: `Tables in database (${tables.length}): ${tableList || "No tables found"}`,
          } satisfies TextContent,
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tables: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async describeTable(args: { table_name: string }): Promise<CallToolResult> {
    if (!this.db) {
      throw new Error("No database connected. Use connect_database first.");
    }

    try {
      const columns = this.db
        .prepare("PRAGMA table_info(?)")
        .all(args.table_name) as {
          cid: number;
          name: string;
          type: string;
          notnull: number;
          dflt_value: any;
          pk: number;
        }[];

      if (columns.length === 0) {
        throw new Error(`Table '${args.table_name}' not found`);
      }

      const schema = columns
        .map(col => {
          const nullable = col.notnull === 0 ? "NULL" : "NOT NULL";
          const pk = col.pk > 0 ? " PRIMARY KEY" : "";
          const defaultVal = col.dflt_value !== null ? ` DEFAULT ${col.dflt_value}` : "";
          return `  ${col.name} ${col.type} ${nullable}${pk}${defaultVal}`;
        })
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Table: ${args.table_name}\n\nSchema:\n${schema}`,
          } satisfies TextContent,
        ],
      };
    } catch (error) {
      throw new Error(`Failed to describe table: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async queryData(args: { query: string; limit?: number }): Promise<CallToolResult> {
    if (!this.db) {
      throw new Error("No database connected. Use connect_database first.");
    }

    try {
      // Ensure it's a SELECT query
      const trimmedQuery = args.query.trim().toLowerCase();
      if (!trimmedQuery.startsWith("select")) {
        throw new Error("Only SELECT queries are allowed with query_data. Use execute_query for other operations.");
      }

      const limit = args.limit || 100;
      const queryWithLimit = args.query.toLowerCase().includes("limit") 
        ? args.query 
        : `${args.query} LIMIT ${limit}`;

      const results = this.db.prepare(queryWithLimit).all();
      
      if (results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Query executed successfully. No rows returned.",
            } satisfies TextContent,
          ],
        };
      }

      // Format results as a table
      const headers = Object.keys(results[0] as Record<string, unknown>);
      const rows = results.map((row) => 
        headers.map(header => String((row as Record<string, unknown>)[header] ?? "NULL")).join(" | ")
      );
      
      const headerRow = headers.join(" | ");
      const separator = headers.map(h => "-".repeat(h.length)).join("-|-");
      const table = [headerRow, separator, ...rows].join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Query results (${results.length} rows):\n\n${table}`,
          } satisfies TextContent,
        ],
      };
    } catch (error) {
      throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeQuery(args: { query: string }): Promise<CallToolResult> {
    if (!this.db) {
      throw new Error("No database connected. Use connect_database first.");
    }

    try {
      const result = this.db.prepare(args.query).run();
      
      return {
        content: [
          {
            type: "text",
            text: `Query executed successfully. Changes: ${result.changes}, Last insert row ID: ${result.lastInsertRowid}`,
          } satisfies TextContent,
        ],
      };
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getTableInfo(args: { table_name: string; sample_rows?: number }): Promise<CallToolResult> {
    if (!this.db) {
      throw new Error("No database connected. Use connect_database first.");
    }

    try {
      // Get table schema
      const columns = this.db
        .prepare("PRAGMA table_info(?)")
        .all(args.table_name) as {
          cid: number;
          name: string;
          type: string;
          notnull: number;
          dflt_value: any;
          pk: number;
        }[];

      if (columns.length === 0) {
        throw new Error(`Table '${args.table_name}' not found`);
      }

      // Get row count
      const countResult = this.db
        .prepare(`SELECT COUNT(*) as count FROM ${args.table_name}`)
        .get() as { count: number };

      // Get indexes
      const indexes = this.db
        .prepare("PRAGMA index_list(?)")
        .all(args.table_name) as { name: string; unique: number }[];

      // Get sample data
      const sampleRows = args.sample_rows || 5;
      const sampleData = this.db
        .prepare(`SELECT * FROM ${args.table_name} LIMIT ?`)
        .all(sampleRows);

      // Format schema
      const schema = columns
        .map(col => {
          const nullable = col.notnull === 0 ? "NULL" : "NOT NULL";
          const pk = col.pk > 0 ? " PRIMARY KEY" : "";
          const defaultVal = col.dflt_value !== null ? ` DEFAULT ${col.dflt_value}` : "";
          return `  ${col.name} ${col.type} ${nullable}${pk}${defaultVal}`;
        })
        .join("\n");

      // Format indexes
      const indexInfo = indexes.length > 0 
        ? indexes.map(idx => `  ${idx.name} (${idx.unique ? "UNIQUE" : "NON-UNIQUE"})`).join("\n")
        : "  No indexes";

      // Format sample data
      let sampleText = "";
      if (sampleData.length > 0) {
        const headers = Object.keys(sampleData[0] as Record<string, unknown>);
        const rows = sampleData.map((row) => 
          headers.map(header => String((row as Record<string, unknown>)[header] ?? "NULL")).join(" | ")
        );
        
        const headerRow = headers.join(" | ");
        const separator = headers.map(h => "-".repeat(Math.max(h.length, 4))).join("-|-");
        sampleText = [headerRow, separator, ...rows].join("\n");
      } else {
        sampleText = "No data in table";
      }

      const info = `Table: ${args.table_name}
Row count: ${countResult.count}

Schema:
${schema}

Indexes:
${indexInfo}

Sample data (${Math.min(sampleRows, sampleData.length)} rows):
${sampleText}`;

      return {
        content: [
          {
            type: "text",
            text: info,
          } satisfies TextContent,
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get table info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SQLite MCP server running on stdio");
  }
}

const server = new SQLiteServer();
server.run().catch(console.error);
