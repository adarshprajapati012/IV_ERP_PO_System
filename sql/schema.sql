CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    rating NUMERIC(3, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    stock_level INTEGER NOT NULL DEFAULT 0,
    description TEXT
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    reference_no VARCHAR(100) UNIQUE NOT NULL,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE RESTRICT,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(15, 2) NOT NULL CHECK (line_total >= 0)
);
