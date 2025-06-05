// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const pool = require('./database'); // Assuming 'database.js' exports your MySQL pool

// Define the port for the server
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (important for frontend development)
app.use(cors());
// Enable parsing of JSON request bodies
app.use(express.json());

/**
 * Function to create tables and stored procedures.
 * This is now fully idempotent and handles foreign key constraints more robustly.
 * It will drop tables first, then recreate them, ensuring a clean state.
 */
async function initializeDatabase() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Database initialization started...');

        // Temporarily disable foreign key checks for robust schema changes
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Foreign key checks disabled.');

        // --- Drop tables if they exist (for a clean slate during development/re-runs) ---
        // Drop in reverse dependency order to avoid foreign key constraint errors
        console.log('Dropping existing tables (if any)...');
        await connection.query('DROP TABLE IF EXISTS settings');
        await connection.query('DROP TABLE IF EXISTS generated_reports');
        await connection.query('DROP TABLE IF EXISTS products');
        await connection.query('DROP TABLE IF EXISTS inventory_audits');
        await connection.query('DROP TABLE IF EXISTS orders');
        await connection.query('DROP TABLE IF EXISTS incoming_shipments'); // Renamed table
        await connection.query('DROP TABLE IF EXISTS outgoing_shipments');
        await connection.query('DROP TABLE IF EXISTS warehouse_zones');
        console.log('Tables dropped.');

        // --- Create tables in dependency order ---
        // 1. warehouse_zones (parent for products and inventory_audits)
        const createWarehouseZonesTableSQL = `
            CREATE TABLE IF NOT EXISTS warehouse_zones (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                capacity INT DEFAULT 0,
                max_capacity INT NOT NULL,
                temperature INT DEFAULT 0,
                humidity INT DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Normal',
                products_count INT DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );`;
        await connection.query(createWarehouseZonesTableSQL);
        console.log('Table "warehouse_zones" checked/created successfully.');

        // 2. products (references warehouse_zones.id)
        const createProductsTableSQL = `
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                zone VARCHAR(255) NOT NULL,
                shelf VARCHAR(255),
                quantity INT DEFAULT 0,
                minStock INT DEFAULT 0,
                maxStock INT DEFAULT 0,
                lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_product_zone (zone),
                CONSTRAINT fk_product_zone
                    FOREIGN KEY (zone) REFERENCES warehouse_zones(id)
                    ON DELETE RESTRICT ON UPDATE CASCADE
            );`;
        await connection.query(createProductsTableSQL);
        console.log('Table "products" checked/created successfully.');

        // 3. inventory_audits (corresponds to recent_audits on frontend)
        const createInventoryAuditsTableSQL = `
            CREATE TABLE IF NOT EXISTS inventory_audits (
                id VARCHAR(255) PRIMARY KEY,
                zone VARCHAR(255) NOT NULL,
                scheduled_date DATE NOT NULL,
                auditor VARCHAR(255) NOT NULL,
                audit_type VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Scheduled',
                discrepancies INT DEFAULT 0,
                accuracy DECIMAL(5, 2) DEFAULT 100.00,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_audit_zone (zone),
                CONSTRAINT fk_audit_zone
                    FOREIGN KEY (zone) REFERENCES warehouse_zones(id)
                    ON DELETE RESTRICT ON UPDATE CASCADE
            );`;
        await connection.query(createInventoryAuditsTableSQL);
        console.log('Table "inventory_audits" checked/created successfully.');

        // 4. incoming_shipments (renamed from 'shipments')
        const createIncomingShipmentsTableSQL = `
            CREATE TABLE IF NOT EXISTS incoming_shipments (
                id VARCHAR(255) PRIMARY KEY,
                supplier VARCHAR(255) NOT NULL,
                eta DATETIME NOT NULL,
                items INT DEFAULT 0,
                value DECIMAL(10, 2) DEFAULT 0.00,
                tracking VARCHAR(255) UNIQUE,
                status VARCHAR(50) DEFAULT 'SCHEDULED',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );`;
        await connection.query(createIncomingShipmentsTableSQL);
        console.log('Table "incoming_shipments" checked/created successfully.');

        // 5. outgoing_shipments
        // Corrected: Changed PRIMARY_KEY to PRIMARY KEY (added space)
        const createOutgoingShipmentsTableSQL = `
            CREATE TABLE IF NOT EXISTS outgoing_shipments (
                id VARCHAR(255) PRIMARY KEY,
                customer VARCHAR(255) NOT NULL,
                departure DATETIME NOT NULL,
                items INT DEFAULT 0,
                value DECIMAL(10, 2) DEFAULT 0.00,
                destination VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'SCHEDULED',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );`;
        await connection.query(createOutgoingShipmentsTableSQL);
        console.log('Table "outgoing_shipments" checked/created successfully.');

        // 6. orders
        const createOrdersTableSQL = `
            CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(255) PRIMARY KEY,
                customer VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'Pending',
                items INT DEFAULT 0,
                value DECIMAL(10, 2) DEFAULT 0.00,
                order_date DATE NOT NULL,
                priority VARCHAR(50) DEFAULT 'Low',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );`;
        await connection.query(createOrdersTableSQL);
        console.log('Table "orders" checked/created successfully.');

        // 7. generated_reports
        const createGeneratedReportsTableSQL = `
            CREATE TABLE IF NOT EXISTS generated_reports (
                id VARCHAR(255) PRIMARY KEY,
                report_name VARCHAR(255) NOT NULL,
                report_type VARCHAR(50) NOT NULL,
                generated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_type VARCHAR(10) DEFAULT 'PDF',
                file_size VARCHAR(20) DEFAULT '0 MB',
                download_count INT DEFAULT 0
            );`;
        await connection.query(createGeneratedReportsTableSQL);
        console.log('Table "generated_reports" checked/created successfully.');

        // 8. settings
        const createSettingsTableSQL = `
            CREATE TABLE IF NOT EXISTS settings (
                setting_key VARCHAR(255) PRIMARY KEY,
                setting_value TEXT,
                lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );`;
        await connection.query(createSettingsTableSQL);
        console.log('Table "settings" checked/created successfully.');

        // Insert default settings if they don't exist
        console.log('Inserting default settings if not present...');
        await connection.query(`
            INSERT INTO settings (setting_key, setting_value) VALUES
            ('warehouseName', 'Main Distribution Center'),
            ('timeZone', 'Eastern Time'),
            ('defaultCurrency', 'USD - US Dollar')
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
        `);
        console.log('Default settings ensured.');

        // --- Create/Recreate stored procedures ---
        await connection.query(`DROP PROCEDURE IF EXISTS AddProductToStorage;`);
        const createProcedureSQL = `
            CREATE PROCEDURE AddProductToStorage(
                IN p_id VARCHAR(255),
                IN p_name VARCHAR(255),
                IN p_category VARCHAR(255),
                IN p_zone VARCHAR(255),
                IN p_shelf VARCHAR(255),
                IN p_quantity INT,
                IN p_minStock INT,
                IN p_maxStock INT
            )
            BEGIN
                INSERT INTO products (id, name, category, zone, shelf, quantity, minStock, maxStock)
                VALUES (p_id, p_name, p_category, p_zone, p_shelf, p_quantity, p_minStock, p_maxStock)
                ON DUPLICATE KEY UPDATE
                    name = p_name,
                    category = p_category,
                    zone = p_zone,
                    shelf = p_shelf,
                    quantity = p_quantity,
                    minStock = p_minStock,
                    maxStock = p_maxStock;
            END;`;
        await connection.query(createProcedureSQL);
        console.log('Stored procedure "AddProductToStorage" checked/created successfully.');

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Foreign key checks re-enabled.');

        console.log('Database initialized successfully!');

    } catch (err) {
        console.error('CRITICAL DATABASE INITIALIZATION ERROR:');
        console.error(err); // Log the full error object for more detail
        if (connection) {
            try {
                await connection.query('SET FOREIGN_KEY_CHECKS = 1');
                console.log('Foreign key checks re-enabled after error.');
            } catch (reEnableErr) {
                console.error('Failed to re-enable foreign key checks:', reEnableErr);
            }
        }
        // Re-throw to prevent server from starting if DB init fails, and ensure the process exits with an error code
        process.exit(1); 
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Root route to confirm server is running
app.get('/', (req, res) => {
    // Changed to send JSON response instead of plain text
    res.json({ message: 'Warehouse Management System API is running. Access API endpoints at /api/...' });
});

// API endpoint to check database connection
app.get('/api/check-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT CURRENT_TIME() AS `current_time`');
        res.json({ message: 'Database connected successfully', current_time: rows[0].current_time });
    } catch (err) {
        console.error('Database connection failed:', err);
        res.status(500).json({ message: 'Database connection failed', error: err.message });
    }
});

// --- API Endpoints for Reports Dashboard ---
app.get('/api/reports/overview', async (req, res) => {
    try {
        const availableReportsCount = 5;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [generatedThisMonthRows] = await pool.query(
            'SELECT COUNT(*) AS count FROM generated_reports WHERE generated_date >= ?',
            [startOfMonth]
        );
        const generatedThisMonth = generatedThisMonthRows[0].count;

        const [recentDownloadsRows] = await pool.query(
            'SELECT SUM(download_count) AS total_downloads FROM generated_reports'
        );
        const recentDownloads = recentDownloadsRows[0].total_downloads || 0;
        const storageUsed = '2.8 GB';

        res.json({
            availableReports: availableReportsCount,
            generatedThisMonth,
            recentDownloads,
            storageUsed,
        });
    } catch (err) {
        console.error('Error fetching reports overview:', err);
        res.status(500).json({ message: 'Error fetching reports overview', error: err.message });
    }
});

app.get('/api/reports/types', (req, res) => {
    const reportTypes = [
        { id: 'inventory', name: 'Inventory Report', description: 'Current stock levels and locations' },
        { id: 'shipments', name: 'Shipments Report', description: 'Incoming and outgoing shipment summary' },
        { id: 'audits', name: 'Audit Report', description: 'Inventory audit results and accuracy metrics' },
        { id: 'performance', name: 'Performance Report', description: 'Warehouse efficiency and KPI metrics' },
        { id: 'financial', name: 'Financial Report', description: 'Cost analysis and value reports' },
    ];
    res.json(reportTypes);
});

app.get('/api/reports/recent', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT report_name AS name, DATE_FORMAT(generated_date, "%Y-%m-%d") AS date, file_type AS type, file_size AS size FROM generated_reports ORDER BY generated_date DESC LIMIT 5'
        );
        res.json(rows);
    } catch (err) {
        console.error('Error fetching recent reports:', err);
        res.status(500).json({ message: 'Error fetching recent reports', error: err.message });
    }
});

app.post('/api/reports/generate', async (req, res) => {
    const { reportType } = req.body;
    if (!reportType) {
        return res.status(400).json({ message: 'Report type is required.' });
    }
    try {
        let newId;
        const [lastIdRow] = await pool.query('SELECT id FROM generated_reports ORDER BY id DESC LIMIT 1');
        if (lastIdRow.length > 0) {
            const lastId = lastIdRow[0].id;
            const lastNum = parseInt(lastId.replace('REP-', '')) || 0;
            newId = `REP-${String(lastNum + 1).padStart(3, '0')}`;
        } else {
            newId = 'REP-001';
        }

        const reportNameMap = {
            'inventory': 'Inventory Stock Report',
            'shipments': 'Shipments Summary',
            'audits': 'Audit Results',
            'performance': 'Warehouse Performance',
            'financial': 'Financial Overview',
        };
        const generatedReportName = reportNameMap[reportType] || `${reportType} Report`;
        const fileType = 'PDF';
        const fileSize = `${(Math.random() * 3 + 1).toFixed(1)} MB`;

        await pool.query(
            `INSERT INTO generated_reports (id, report_name, report_type, file_type, file_size) VALUES (?, ?, ?, ?, ?)`,
            [newId, generatedReportName, reportType, fileType, fileSize]
        );
        res.status(200).json({
            message: `Report "${generatedReportName}" generated successfully!`,
            newReport: {
                name: generatedReportName,
                date: new Date().toISOString().slice(0, 10),
                type: fileType,
                size: fileSize,
            }
        });
    } catch (err) {
        console.error('Error generating report:', err);
        res.status(500).json({ message: 'Error generating report', error: err.message });
    }
});

app.get('/api/reports/download/:reportName', async (req, res) => {
    const { reportName } = req.params;
    try {
        await pool.query(
            'UPDATE generated_reports SET download_count = download_count + 1 WHERE report_name = ?',
            [reportName]
        );
        res.status(200).json({ message: `Downloading "${reportName}"... (Simulated)` });
    } catch (err) {
        console.error('Error downloading report:', err);
        res.status(500).json({ message: 'Error downloading report', error: err.message });
    }
});

app.post('/api/reports/share', async (req, res) => {
    const { reportName, recipient } = req.body;
    if (!reportName || !recipient) {
        return res.status(400).json({ message: 'Report name and recipient are required.' });
    }
    res.status(200).json({ message: `Report "${reportName}" shared with ${recipient}. (Simulated)` });
});

// --- API Endpoints for Products ---
app.post('/api/products', async (req, res) => {
    const { id, name, category, zone, shelf, quantity, minStock, maxStock } = req.body;
    try {
        if (!id || !name || !category || !zone || !shelf || quantity === undefined || minStock === undefined || maxStock === undefined) {
            return res.status(400).json({ message: 'Missing required product fields.' });
        }
        const [zoneCheck] = await pool.query('SELECT id FROM warehouse_zones WHERE id = ?', [zone]);
        if (zoneCheck.length === 0) {
            return res.status(400).json({ message: `Zone '${zone}' does not exist. Please use a valid zone.` });
        }
        await pool.query(
            `CALL AddProductToStorage(?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, name, category, zone, shelf, quantity, minStock, maxStock]
        );
        res.status(201).json({ message: 'Product added/updated successfully' });
    } catch (err) {
        console.error('Failed to add product:', err);
        res.status(500).json({ message: 'Error adding product', error: err.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products ORDER BY lastUpdated DESC');
        res.json(rows);
    } catch (err) {
        console.error('Failed to fetch products:', err);
        res.status(500).json({ message: 'Error fetching products', error: err.message });
    }
});

// --- API Endpoints for Incoming Shipments ---
// POST endpoint to add a new incoming shipment
app.post('/api/incoming-shipments', async (req, res) => {
    const { supplier, eta, items, value, tracking, status } = req.body;
    try {
        if (!supplier || !eta || items === undefined || value === undefined || !tracking) {
            return res.status(400).json({ message: 'Missing required shipment fields (supplier, eta, items, value, tracking).' });
        }
        
        let newId;
        const [lastIdRow] = await pool.query('SELECT id FROM incoming_shipments ORDER BY id DESC LIMIT 1');
        if (lastIdRow.length > 0) {
            const lastId = lastIdRow[0].id;
            const lastNum = parseInt(lastId.replace('INC-', '')) || 0;
            newId = `INC-${String(lastNum + 1).padStart(3, '0')}`;
        } else {
            newId = 'INC-001';
        }

        const insertQuery = `
            INSERT INTO incoming_shipments (id, supplier, eta, items, value, tracking, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        await pool.query(insertQuery, [newId, supplier, eta, items, value, tracking, status]);
        res.status(201).json({ message: 'Incoming shipment added successfully!', shipmentId: newId });
    } catch (err) {
        console.error('Failed to add incoming shipment:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Tracking number already exists. Please use a unique tracking number.', error: err.message });
        }
        res.status(500).json({ message: 'Error adding incoming shipment', error: err.message });
    }
});

// GET endpoint to fetch all incoming shipments
app.get('/api/incoming-shipments', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM incoming_shipments ORDER BY createdAt DESC');
        res.json(rows);
    } catch (err) {
        console.error('Failed to fetch incoming shipments:', err);
        res.status(500).json({ message: 'Error fetching incoming shipments', error: err.message });
    }
});

// PUT endpoint to update an existing incoming shipment
app.put('/api/incoming-shipments/:id', async (req, res) => {
    const { id } = req.params;
    const { supplier, eta, items, value, tracking, status } = req.body;
    try {
        if (!supplier || !eta || items === undefined || value === undefined || !tracking || !status) {
            return res.status(400).json({ message: 'Missing required fields for shipment update.' });
        }

        const updateQuery = `
            UPDATE incoming_shipments
            SET supplier = ?, eta = ?, items = ?, value = ?, tracking = ?, status = ?
            WHERE id = ?
        `;
        const [result] = await pool.query(updateQuery, [supplier, eta, items, value, tracking, status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Shipment not found or no changes made.' });
        }
        res.status(200).json({ message: 'Incoming shipment updated successfully!' });
    } catch (err) {
        console.error('Failed to update incoming shipment:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Tracking number already exists for another shipment. Please use a unique tracking number.', error: err.message });
        }
        res.status(500).json({ message: 'Error updating incoming shipment', error: err.message });
    }
});

// --- API Endpoints for Outgoing Shipments ---
app.post('/api/outgoing-shipments', async (req, res) => {
    const { customer, departure, items, value, destination, status } = req.body;
    try {
        if (!customer || !departure || items === undefined || value === undefined || !destination) {
            return res.status(400).json({ message: 'Missing required outgoing shipment fields (customer, departure, items, value, destination).' });
        }
        let newId;
        const [lastIdRow] = await pool.query('SELECT id FROM outgoing_shipments ORDER BY id DESC LIMIT 1');
        if (lastIdRow.length > 0) {
            const lastId = lastIdRow[0].id;
            const lastNum = parseInt(lastId.replace('OUT-', '')) || 0;
            newId = `OUT-${String(lastNum + 1).padStart(3, '0')}`;
        } else {
            newId = 'OUT-001';
        }
        const [result] = await pool.query(
            `INSERT INTO outgoing_shipments (id, customer, departure, items, value, destination, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [newId, customer, departure, items, value, destination, status || 'SCHEDULED']
        );
        res.status(201).json({
            message: 'Outgoing shipment added successfully',
            id: newId,
            customer,
            departure,
            items,
            value,
            destination,
            status: status || 'SCHEDULED',
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Failed to add outgoing shipment:', err);
        res.status(500).json({ message: 'Error adding outgoing shipment', error: err.message });
    }
});

app.get('/api/outgoing-shipments', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM outgoing_shipments ORDER BY createdAt DESC');
        res.json(rows);
    } catch (err) {
        console.error('Failed to fetch outgoing shipments:', err);
        res.status(500).json({ message: 'Error fetching outgoing shipments', error: err.message });
    }
});

// --- API Endpoints for Inventory Audits ---
// GET endpoint to fetch all inventory audits
app.get('/api/inventory-audits', async (req, res) => {
    try {
        console.log('GET /api/inventory-audits: Attempting to fetch all audits.');
        const { limit } = req.query; // Get the limit from query parameters
        let query = 'SELECT * FROM inventory_audits ORDER BY createdAt DESC';
        let queryParams = [];

        if (limit) {
            const parsedLimit = parseInt(limit, 10);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                query += ` LIMIT ?`; // Add limit if provided
                queryParams.push(parsedLimit);
            }
        }
        const [rows] = await pool.query(query, queryParams);
        console.log('GET /api/inventory-audits: Successfully fetched audits, count:', rows.length);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/inventory-audits: Failed to fetch inventory audits:', err);
        res.status(500).json({ message: 'Error fetching inventory audits', error: err.message });
    }
});

// POST endpoint to add a new inventory audit
app.post('/api/inventory-audits', async (req, res) => {
    console.log('POST /api/inventory-audits: Received request to schedule new audit.');
    // Destructure the data from the request body. Note scheduledDate and auditType from frontend.
    const { zone, scheduledDate, auditor, auditType } = req.body;
    console.log('POST /api/inventory-audits: Request body:', { zone, scheduledDate, auditor, auditType });

    try {
        // Basic validation for required fields
        if (!zone || !scheduledDate || !auditor || !auditType) {
            console.warn('POST /api/inventory-audits: Missing required fields.');
            return res.status(400).json({ message: 'Missing required audit fields (zone, scheduledDate, auditor, auditType).' });
        }

        // Check if the provided zone exists in warehouse_zones table
        console.log(`POST /api/inventory-audits: Checking if zone '${zone}' exists.`);
        const [zoneCheck] = await pool.query('SELECT id FROM warehouse_zones WHERE id = ?', [zone]);
        if (zoneCheck.length === 0) {
            console.warn(`POST /api/inventory-audits: Zone '${zone}' not found.`);
            return res.status(400).json({ message: `Zone '${zone}' does not exist. Please select a valid zone.` });
        }
        console.log(`POST /api/inventory-audits: Zone '${zone}' found.`);

        // Generate a new unique ID for the audit (e.g., AUD-001, AUD-002)
        console.log('POST /api/inventory-audits: Generating new audit ID.');
        let newId;
        const [lastIdRow] = await pool.query('SELECT id FROM inventory_audits ORDER BY id DESC LIMIT 1');
        if (lastIdRow.length > 0) {
            const lastId = lastIdRow[0].id;
            const lastNum = parseInt(lastId.replace('AUD-', '')) || 0; // Extract number and convert
            newId = `AUD-${String(lastNum + 1).padStart(3, '0')}`; // Increment and format
        } else {
            newId = 'AUD-001'; // First audit
        }
        console.log('POST /api/inventory-audits: New audit ID generated:', newId);

        // Insert the new audit into the database
        const insertQuery = `
            INSERT INTO inventory_audits (id, zone, scheduled_date, auditor, audit_type, status, discrepancies, accuracy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        // Default values for status, discrepancies, and accuracy on creation
        console.log('POST /api/inventory-audits: Inserting audit into database with values:', [newId, zone, scheduledDate, auditor, auditType, 'Scheduled', 0, 100.00]);
        await pool.query(insertQuery, [newId, zone, scheduledDate, auditor, auditType, 'Scheduled', 0, 100.00]);
        console.log('POST /api/inventory-audits: Audit successfully inserted into database.');

        // Respond with the newly created audit object including its ID and default values
        // Ensure the response matches the database column names (snake_case)
        res.status(201).json({
            message: 'Inventory audit scheduled successfully!',
            id: newId,
            zone,
            scheduled_date: scheduledDate, // Use scheduled_date to match database column
            auditor,
            audit_type: auditType,       // Use audit_type to match database column
            status: 'Scheduled',
            discrepancies: 0,
            accuracy: 100.00,
            createdAt: new Date().toISOString() // Provide creation timestamp
        });
        console.log('POST /api/inventory-audits: Successfully responded to client.');
    } catch (err) {
        console.error('POST /api/inventory-audits: Failed to schedule inventory audit:', err);
        // Generic error response for other server-side issues
        res.status(500).json({ message: 'Error scheduling inventory audit', error: err.message });
    }
});


// --- API Endpoints for Warehouse Zones ---
app.post('/api/warehouse-zones', async (req, res) => {
    const { id, name, maxCapacity, temperature, humidity } = req.body;
    try {
        if (!id || !name || maxCapacity === undefined || temperature === undefined || humidity === undefined) {
            return res.status(400).json({ message: 'Missing required zone fields (id, name, maxCapacity, temperature, humidity).' });
        }
        const capacity = 0;
        const status = 'Normal';
        const products_count = 0;
        const [result] = await pool.query(
            `INSERT INTO warehouse_zones (id, name, capacity, max_capacity, temperature, humidity, status, products_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, name, capacity, maxCapacity, temperature, humidity, status, products_count]
        );
        res.status(201).json({
            message: 'Zone added successfully',
            id,
            name,
            capacity,
            maxCapacity,
            temperature,
            humidity,
            status,
            products: products_count,
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Failed to add zone:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: `Zone ID '${id}' already exists. Please use a unique ID.`, error: err.message });
        }
        if (err.message.includes('Duplicate entry') && err.message.includes('for key \'warehouse_zones.name\'')) {
            return res.status(409).json({ message: `Zone Name '${name}' already exists. Please use a unique name.`, error: err.message });
        }
        res.status(500).json({ message: 'Error adding zone', error: err.message });
    }
});

app.get('/api/warehouse-zones', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT *, max_capacity AS maxCapacity, products_count AS products FROM warehouse_zones ORDER BY createdAt ASC');
        res.json(rows);
    } catch (err) {
        console.error('Failed to fetch zones:', err);
        res.status(500).json({ message: 'Error fetching zones', error: err.message });
    }
});


// --- API Endpoints for Orders ---
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT *, order_date AS date FROM orders ORDER BY createdAt DESC');
        res.json(rows);
    }  catch (err) {
        console.error('Failed to fetch orders:', err);
        res.status(500).json({ message: 'Error fetching orders', error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    const { customer, status, items, value, date, priority } = req.body;
    try {
        if (!customer || !date || items === undefined || value === undefined || !priority) {
            return res.status(400).json({ message: 'Missing required order fields (customer, date, items, value, priority).' });
        }
        let newId;
        const [lastIdRow] = await pool.query('SELECT id FROM orders ORDER BY id DESC LIMIT 1');
        if (lastIdRow.length > 0) {
            const lastId = lastIdRow[0].id;
            const lastNum = parseInt(lastId.replace('ORD-', '')) || 0;
            newId = `ORD-${String(lastNum + 1).padStart(3, '0')}`;
        } else {
            newId = 'ORD-001';
        }
        const orderStatus = status || 'Pending';
        await pool.query(
            `INSERT INTO orders (id, customer, status, items, value, order_date, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [newId, customer, orderStatus, items, value, date, priority]
        );
        res.status(201).json({
            message: 'Order created successfully',
            id: newId,
            customer,
            status: orderStatus,
            items,
            value,
            date,
            priority,
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('Failed to create order:', err);
        res.status(500).json({ message: 'Error creating order', error: err.message });
    }
});

app.put('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { customer, status, items, value, date, priority } = req.body;
    try {
        const fieldsToUpdate = [];
        const queryParams = [];
        if (customer !== undefined) {
            fieldsToUpdate.push('customer = ?');
            queryParams.push(customer);
        }
        if (status !== undefined) {
            fieldsToUpdate.push('status = ?');
            queryParams.push(status);
        }
        if (items !== undefined) {
            fieldsToUpdate.push('items = ?');
            queryParams.push(items);
        }
        if (value !== undefined) {
            fieldsToUpdate.push('value = ?');
            queryParams.push(value);
        }
        if (date !== undefined) {
            fieldsToUpdate.push('order_date = ?');
            queryParams.push(date);
        }
        if (priority !== undefined) {
            fieldsToUpdate.push('priority = ?');
            queryParams.push(priority);
        }
        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }
        const updateSQL = `UPDATE orders SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
        queryParams.push(id);
        const [result] = await pool.query(updateSQL, queryParams);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.json({ message: 'Order updated successfully' });
    } catch (err) {
        console.error('Failed to update order:', err);
        res.status(500).json({ message: 'Error updating order', error: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        console.error('Failed to delete order:', err);
        res.status(500).json({ message: 'Error deleting order', error: err.message });
    }
});

// --- NEW API Endpoints for Settings ---

app.get('/api/settings/general', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
        const settings = rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
        res.json(settings);
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ message: 'Error fetching settings', error: err.message });
    }
});

app.put('/api/settings/general', async (req, res) => {
    const settingsToUpdate = req.body;
    try {
        if (Object.keys(settingsToUpdate).length === 0) {
            return res.status(400).json({ message: 'No settings provided for update.' });
        }
        for (const key in settingsToUpdate) {
            if (Object.hasOwnProperty.call(settingsToUpdate, key)) {
                const value = settingsToUpdate[key];
                await pool.query(
                    `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                    [key, value]
                );
            }
        }
        res.status(200).json({ message: 'Settings updated successfully' });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ message: 'Error updating settings', error: err.message });
    }
});

// Start the server after database initialization
async function startServer() {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Access the API at http://localhost:${PORT}/api/...`);
        });
    } catch (err) {
        console.error('Failed to start server due to database initialization error:', err);
        process.exit(1); // Exit the process if database initialization fails
    }
}

startServer();                                                            