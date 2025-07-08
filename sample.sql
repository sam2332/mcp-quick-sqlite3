-- Sample SQLite database for testing the MCP server
-- This creates a simple database with users, orders, and products tables

-- Create users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT 1
);

-- Create products table
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0
);

-- Create orders table
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert sample users
INSERT INTO users (username, email, active) VALUES
    ('john_doe', 'john@example.com', 1),
    ('jane_smith', 'jane@example.com', 1),
    ('bob_wilson', 'bob@example.com', 0),
    ('alice_brown', 'alice@example.com', 1),
    ('charlie_davis', 'charlie@example.com', 1);

-- Insert sample products
INSERT INTO products (name, price, category, stock_quantity) VALUES
    ('Laptop Computer', 999.99, 'Electronics', 25),
    ('Wireless Mouse', 29.99, 'Electronics', 100),
    ('Office Chair', 199.99, 'Furniture', 15),
    ('Desk Lamp', 49.99, 'Furniture', 30),
    ('Coffee Mug', 12.99, 'Kitchen', 50),
    ('Notebook', 5.99, 'Office Supplies', 200),
    ('Pen Set', 15.99, 'Office Supplies', 75);

-- Insert sample orders
INSERT INTO orders (user_id, product_id, quantity, status) VALUES
    (1, 1, 1, 'completed'),
    (1, 2, 2, 'completed'),
    (2, 3, 1, 'shipped'),
    (2, 4, 1, 'shipped'),
    (3, 5, 3, 'cancelled'),
    (4, 6, 5, 'pending'),
    (4, 7, 2, 'pending'),
    (5, 1, 1, 'processing'),
    (1, 6, 10, 'completed'),
    (2, 2, 1, 'completed');

-- Create some indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
