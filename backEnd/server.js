const express = require('express');
const cors = require('cors');
const app = express();
const pool = require('./database'); 
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');

const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());

async function initializeDatabase() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Database initialization started...');

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Foreign key checks disabled.');

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

        const createProductsTableSQL = `
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(255),
                zone VARCHAR(255) NOT NULL,
                shelf VARCHAR(255),
                unit_value DECIMAL(10, 2) DEFAULT 0.00, -- Added for financial reporting
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

        const createGeneratedReportsTableSQL = `
            CREATE TABLE IF NOT EXISTS generated_reports (
                id VARCHAR(255) PRIMARY KEY,
                report_name VARCHAR(255) NOT NULL,
                report_type VARCHAR(50) NOT NULL,
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                file_format VARCHAR(10) DEFAULT 'PDF',
                file_size_kb INT DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Completed'
            );`;
        await connection.query(createGeneratedReportsTableSQL);
        console.log('Table "generated_reports" checked/created successfully.');

        const createSettingsTableSQL = `
            CREATE TABLE IF NOT EXISTS settings (
                setting_key VARCHAR(255) PRIMARY KEY,
                setting_value TEXT,
                lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );`;
        await connection.query(createSettingsTableSQL);
        console.log('Table "settings" checked/created successfully.');

        console.log('Inserting default settings if not present...');
        await connection.query(`
            INSERT INTO settings (setting_key, setting_value) VALUES
            ('warehouseName', 'Main Distribution Center'),
            ('timeZone', 'Eastern Time'),
            ('defaultCurrency', 'USD - US Dollar')
            ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
        `);
        console.log('Default settings ensured.');

        const warehouseConfigSettings = [
            { key: 'default_storage_temperature', value: '20' }, 
            { key: 'low_stock_threshold', value: '10' },          
            { key: 'auto_reorder_point', value: '5' },          
            { key: 'audit_frequency', value: 'Monthly' }        
        ];
        for (const setting of warehouseConfigSettings) {
            await connection.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', [setting.key, setting.value]);
        }

        const notificationSettings = [
            { key: 'notification_low_stock_email', value: 'true' },
            { key: 'notification_critical_issue_email', value: 'true' },
            { key: 'notification_daily_report_email', value: 'false' },
            { key: 'notification_shipment_update_email', value: 'true' },
            { key: 'notification_low_stock_in_app', value: 'true' },
            { key: 'notification_critical_issue_in_app', value: 'true' },
            { key: 'notification_shipment_update_in_app', value: 'true' }
        ];
        for (const setting of notificationSettings) {
            await connection.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [setting.key, setting.value, setting.value]);
        }

        console.log('Database initialized/verified successfully with general, warehouse, and notification settings.');

        const createUsersTableSQL = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );`;
        await connection.query(createUsersTableSQL);
        console.log('Table "users" checked/created successfully.');

        const createAppNotificationsTableSQL = `
            CREATE TABLE IF NOT EXISTS app_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                message TEXT NOT NULL,
                type VARCHAR(20) DEFAULT 'info', /* 'info', 'warning', 'error', 'success' */
                is_read BOOLEAN DEFAULT FALSE,
                link VARCHAR(255) NULL, /* Optional link for the notification */
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await connection.query(createAppNotificationsTableSQL);
        console.log('Table app_notifications ensured.');

        const [countResult] = await connection.query('SELECT COUNT(*) as count FROM app_notifications');
        if (countResult[0].count === 0) {
            await connection.query("INSERT INTO app_notifications (message, type) VALUES (?, ?)", ['Welcome to the new notification system!', 'info']);
            await connection.query("INSERT INTO app_notifications (message, type, is_read) VALUES (?, ?, ?)", ['Sample warning notification.', 'warning', false]);
            console.log('Added sample app notifications.');
        }

        console.log('Database initialized/verified successfully with general, warehouse, notification settings, and app_notifications table.');

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

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Foreign key checks re-enabled.');

        console.log('Database initialized successfully!');

    } catch (err) {
        console.error('CRITICAL DATABASE INITIALIZATION ERROR:');
        console.error(err); 
        if (connection) {
            try {
                await connection.query('SET FOREIGN_KEY_CHECKS = 1');
                console.log('Foreign key checks re-enabled after error.');
            } catch (reEnableErr) {
                console.error('Failed to re-enable foreign key checks:', reEnableErr);
            }
        }

        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}


app.get('/', (req, res) => {

    res.json({ message: 'Warehouse Management System API is running. Access API endpoints at /api/...' });
});

app.get('/api/check-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT CURRENT_TIME() AS `current_time`');
        res.json({ message: 'Database connected successfully', current_time: rows[0].current_time });
    } catch (err) {
        console.error('Database connection failed:', err);
        res.status(500).json({ message: 'Database connection failed', error: err.message });
    }
});

app.get('/api/dashboard-stats', async (req, res) => {
    try {

        const [skuRows] = await pool.query('SELECT COUNT(DISTINCT id) AS totalSkus FROM products');
        const totalSkus = skuRows[0]?.totalSkus || 0;

        const [zoneRows] = await pool.query("SELECT COUNT(*) AS warehouseZonesCount FROM warehouse_zones");
        const warehouseZonesCount = zoneRows[0]?.warehouseZonesCount || 0;

        const [auditRows] = await pool.query("SELECT COUNT(*) AS pendingAuditsCount FROM inventory_audits WHERE status = 'Scheduled'");
        const pendingAuditsCount = auditRows[0]?.pendingAuditsCount || 0;

        const [productQuantityRows] = await pool.query('SELECT SUM(quantity) AS totalProductQuantity FROM products');
        const totalProductQuantity = productQuantityRows[0]?.totalProductQuantity || 0;

        const [zoneCapacityRows] = await pool.query('SELECT SUM(max_capacity) AS totalMaxWarehouseCapacity FROM warehouse_zones');
        const totalMaxWarehouseCapacity = zoneCapacityRows[0]?.totalMaxWarehouseCapacity || 0;

        const storageCapacityPercentage = totalMaxWarehouseCapacity > 0
            ? parseFloat(((totalProductQuantity / totalMaxWarehouseCapacity) * 100).toFixed(1))
            : 0;

        res.json({
            totalSkus,
            warehouseZonesCount,
            pendingAuditsCount,
            storageCapacityPercentage
        });
    } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        res.status(500).json({ message: 'Error fetching dashboard stats', error: err.message });
    }
});

app.get('/api/reports/overview', async (req, res) => {
    try {
        const availableReportsCount = 5;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [generatedThisMonthRows] = await pool.query(
            'SELECT COUNT(*) AS count FROM generated_reports WHERE generated_at >= ?',
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
    console.log('GET /api/reports/recent: Fetching recent reports from database.'); 
    try {

        const [rows] = await pool.query(
            'SELECT id, report_name, report_type, generated_at, file_format, file_size_kb, status FROM generated_reports ORDER BY generated_at DESC LIMIT 10' // Fetching 10 as per previous setup
        );

        console.log('GET /api/reports/recent: Data being sent to frontend:', JSON.stringify(rows, null, 2));
        res.json(rows);
    } catch (err) {
        console.error('GET /api/reports/recent: Error fetching recent reports:', err);
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
        const generatedReportName = reportNameMap[reportType] || `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
        const fileFormat = 'PDF'; 
 
        const fileSizeInKB = Math.floor(Math.random() * (3000 - 100 + 1)) + 100;
        const status = 'Completed';

        await pool.query(
            `INSERT INTO generated_reports (id, report_name, report_type, file_format, file_size_kb, status, generated_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [newId, generatedReportName, reportType, fileFormat, fileSizeInKB, status]
        );
        
        const [newReportRows] = await pool.query('SELECT * FROM generated_reports WHERE id = ?', [newId]);
        const newReportData = newReportRows[0];

        console.log('POST /api/reports/generate: Report generated:', JSON.stringify(newReportData, null, 2));

        res.status(201).json({
            message: `Report "${generatedReportName}" generated successfully!`,
            newReport: {
                id: newReportData.id,
                report_name: newReportData.report_name,
                report_type: newReportData.report_type,
                generated_at: newReportData.generated_at, 
                file_format: newReportData.file_format,
                file_size_kb: newReportData.file_size_kb, 
                status: newReportData.status
            }
        });
    } catch (err) {
        console.error('Error generating report:', err);
        res.status(500).json({ message: 'Error generating report', error: err.message });
    }
});

app.get('/api/reports/download/:reportId', async (req, res) => {
    const { reportId } = req.params;
    try {

        const [reportRows] = await pool.query('SELECT report_name, report_type FROM generated_reports WHERE id = ?', [reportId]);
        if (reportRows.length === 0) {
            console.log(`GET /api/reports/download/${reportId}: Report with ID "${reportId}" not found in database.`);
            return res.status(404).json({ message: `Report with ID "${reportId}" not found.` });
        }
        const reportName = reportRows[0].report_name;
        const reportType = reportRows[0].report_type;

        if (reportType === 'inventory') {
            const [products] = await pool.query('SELECT id, name, quantity, zone FROM products ORDER BY id');

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Inventory Report');

            worksheet.columns = [
                { header: 'Product ID', key: 'id', width: 20 },
                { header: 'Product Name', key: 'name', width: 40 }, 
                { header: 'Quantity', key: 'quantity', width: 15, style: { numFmt: '0' } },
                { header: 'Zone', key: 'zone', width: 20 }
            ];

            worksheet.addRows(products);

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(1).fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFE0E0E0'} };
            worksheet.getRow(1).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

            const fileName = `Inventory Report - ${reportId} - ${new Date().toISOString().slice(0,10)}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            
            console.log(`GET /api/reports/download/${reportId}: Sending Excel file: ${fileName} for inventory report: ${reportName}`);
            await workbook.xlsx.write(res);
            res.end();
        } else if (reportType === 'audits') {

            const [audits] = await pool.query('SELECT id, zone, DATE_FORMAT(scheduled_date, "%Y-%m-%d") as scheduled_date, auditor, audit_type, status, discrepancies, accuracy, DATE_FORMAT(createdAt, "%Y-%m-%d %H:%i:%s") as createdAt FROM inventory_audits');

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Audit Results Report');

            worksheet.columns = [
                { header: 'Audit ID', key: 'id', width: 25 },
                { header: 'Zone', key: 'zone', width: 20 },
                { header: 'Scheduled Date', key: 'scheduled_date', width: 15 },
                { header: 'Auditor', key: 'auditor', width: 20 },
                { header: 'Audit Type', key: 'audit_type', width: 15 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Discrepancies', key: 'discrepancies', width: 15, style: { numFmt: '0' } },
                { header: 'Accuracy (%)', key: 'accuracy', width: 15, style: { numFmt: '0.00' } },
                { header: 'Created At', key: 'createdAt', width: 20 }
            ];

            worksheet.addRows(audits);

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(1).fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFE0E0E0'} };
            worksheet.getRow(1).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

            const fileName = `Audit Results - ${reportId} - ${new Date().toISOString().slice(0,10)}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            
            const buffer = await workbook.xlsx.writeBuffer();
            console.log(`GET /api/reports/download/${reportId}: Sending Excel file: ${fileName} for audit report: ${reportName}`);
            res.status(200).send(buffer);
        } else if (reportType === 'shipments') {

            const [shipments] = await pool.query('SELECT id, customer, DATE_FORMAT(departure, "%Y-%m-%d %H:%i:%s") as departure, items, value, destination, status, DATE_FORMAT(createdAt, "%Y-%m-%d %H:%i:%s") as createdAt FROM outgoing_shipments');

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Shipments Summary Report');

            worksheet.columns = [
                { header: 'Shipment ID', key: 'id', width: 25 },
                { header: 'Customer', key: 'customer', width: 30 },
                { header: 'Departure Date', key: 'departure', width: 20 },
                { header: 'Items', key: 'items', width: 10, style: { numFmt: '0' } },
                { header: 'Value', key: 'value', width: 15, style: { numFmt: '0.00' } },
                { header: 'Destination', key: 'destination', width: 30 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Created At', key: 'createdAt', width: 20 }
            ];

            worksheet.addRows(shipments);

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(1).fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFE0E0E0'} };
            worksheet.getRow(1).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

            const fileName = `Shipments Summary - ${reportId} - ${new Date().toISOString().slice(0,10)}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            
            const buffer = await workbook.xlsx.writeBuffer();
            console.log(`GET /api/reports/download/${reportId}: Sending Excel file: ${fileName} for shipments report: ${reportName}`);
            res.status(200).send(buffer);
        } else if (reportType === 'performance') {
            
            const [zonesData] = await pool.query('SELECT id, name, capacity, max_capacity, status, DATE_FORMAT(createdAt, "%Y-%m-%d %H:%i:%s") as createdAt FROM warehouse_zones');

            const processedZonesData = zonesData.map(zone => ({
                ...zone,
                utilization: zone.max_capacity > 0 ? ((zone.capacity / zone.max_capacity) * 100).toFixed(2) : 'N/A' // Calculate utilization
            }));

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Warehouse Performance Report');

            worksheet.columns = [
                { header: 'Zone ID', key: 'id', width: 25 },
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Current Items', key: 'capacity', width: 15, style: { numFmt: '0' } },
                { header: 'Max Capacity', key: 'max_capacity', width: 15, style: { numFmt: '0' } },
                { header: 'Utilization (%)', key: 'utilization', width: 15, style: { numFmt: '0.00' } },
                { header: 'Status', key: 'status', width: 20 },
                { header: 'Created At', key: 'createdAt', width: 20 }
            ];

            worksheet.addRows(processedZonesData);

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
            worksheet.getRow(1).fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFE0E0E0'} };
            worksheet.getRow(1).border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };

            const fileName = `Warehouse Performance - ${reportId} - ${new Date().toISOString().slice(0,10)}.xlsx`;
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            
            const buffer = await workbook.xlsx.writeBuffer();
            console.log(`GET /api/reports/download/${reportId}: Sending Excel file: ${fileName} for performance report: ${reportName}`);
            res.status(200).send(buffer);
        } else if (reportType === 'financial') {
            const [invValueRows] = await pool.query('SELECT COALESCE(SUM(quantity * unit_value), 0) AS totalInventoryValue FROM products');
            const [incShipValueRows] = await pool.query('SELECT COALESCE(SUM(value), 0) AS totalIncomingValue FROM incoming_shipments');
            const [outShipValueRows] = await pool.query('SELECT COALESCE(SUM(value), 0) AS totalOutgoingValue FROM outgoing_shipments');

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Financial Summary');
            const reportName = reportRows[0].report_name || 'Financial Report'; 
            worksheet.columns = [
                { header: 'Metric', key: 'metric', width: 40 },
                { header: 'Value', key: 'value', width: 20, style: { numFmt: '$#,##0.00' } } 
            ];

            const totalInventoryValue = parseFloat(invValueRows[0]?.totalInventoryValue ?? 0);
            const totalIncomingValue = parseFloat(incShipValueRows[0]?.totalIncomingValue ?? 0);
            const totalOutgoingValue = parseFloat(outShipValueRows[0]?.totalOutgoingValue ?? 0);

            worksheet.addRow({ metric: 'Total Inventory Value', value: totalInventoryValue });
            worksheet.addRow({ metric: 'Total Value of Incoming Shipments', value: totalIncomingValue });
            worksheet.addRow({ metric: 'Total Value of Outgoing Shipments', value: totalOutgoingValue });

            console.log(`GET /api/reports/download/${reportId}: Generating Excel for financial report "${reportName}".`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${reportName}.xlsx"`);
            await workbook.xlsx.write(res);
            res.end(); 
        } else {

            console.log(`GET /api/reports/download/${reportId}: Report type "${reportType}" not configured for Excel download.`);
            res.status(501).json({ message: `Excel download for report type "${reportType}" is not yet implemented.` });
        }
    } catch (err) {
        console.error(`Error downloading report ID ${reportId}:`, err);
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

// DELETE endpoint to remove a product by ID
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Product ID is required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.query('DELETE FROM products WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Product with ID ${id} not found.` });
        }

        // Also, update the products_count in the associated warehouse_zone
        // First, find the zone the product belonged to (if needed, though ON DELETE RESTRICT handles direct FK)
        // For simplicity, we'll assume products_count is updated via triggers or a separate mechanism if critical.
        // Or, if we want to explicitly do it here:
        // const [productRows] = await connection.query('SELECT zone FROM products_history WHERE id = ?', [id]); // Assuming a history table or log
        // if (productRows.length > 0) {
        //    const zoneId = productRows[0].zone;
        //    await connection.query('UPDATE warehouse_zones SET products_count = products_count - 1 WHERE id = ? AND products_count > 0', [zoneId]);
        // }

        res.status(200).json({ message: `Product with ID ${id} deleted successfully.` });
    } catch (err) {
        console.error(`Failed to delete product with ID ${id}:`, err);
        // Check for foreign key constraint violation if a product cannot be deleted due to dependencies
        // MySQL error code for foreign key constraint violation is 1451
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
            return res.status(409).json({ 
                message: `Cannot delete product ${id}. It is currently referenced by other records (e.g., in inventory audits or orders). Please resolve dependencies first.`, 
                error: err.message 
            });
        }
        res.status(500).json({ message: 'Error deleting product', error: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
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

// DELETE endpoint to remove an incoming shipment by ID
app.delete('/api/incoming-shipments/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Shipment ID is required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.query('DELETE FROM incoming_shipments WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Incoming shipment with ID ${id} not found.` });
        }

        res.status(200).json({ message: `Incoming shipment with ID ${id} deleted successfully.` });
    } catch (err) {
        console.error(`Failed to delete incoming shipment with ID ${id}:`, err);
        // Check for foreign key constraint violation (e.g., if shipment items are logged elsewhere)
        // MySQL error code for foreign key constraint violation is 1451
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
            return res.status(409).json({ 
                message: `Cannot delete incoming shipment ${id}. It may be referenced by other records (e.g., inventory logs). Please resolve dependencies first.`, 
                error: err.message 
            });
        }
        res.status(500).json({ message: 'Error deleting incoming shipment', error: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
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

// PUT endpoint to update an existing outgoing shipment
app.put('/api/outgoing-shipments/:id', async (req, res) => {
    const { id } = req.params;
    const { customer, departure, items, value, destination, status } = req.body;

    try {
        if (!customer || !departure || items === undefined || value === undefined || !destination || !status) {
            return res.status(400).json({ message: 'Missing required fields for outgoing shipment update (customer, departure, items, value, destination, status).' });
        }

        const updateQuery = `
            UPDATE outgoing_shipments
            SET customer = ?, departure = ?, items = ?, value = ?, destination = ?, status = ?
            WHERE id = ?
        `;
        const [result] = await pool.query(updateQuery, [customer, departure, items, value, destination, status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Outgoing shipment not found or no changes made.' });
        }
        // Optionally, fetch and return the updated shipment data
        const [updatedShipmentRows] = await pool.query('SELECT * FROM outgoing_shipments WHERE id = ?', [id]);
        res.status(200).json({
            message: 'Outgoing shipment updated successfully!',
            shipment: updatedShipmentRows[0] // Send back the updated shipment
        });
    } catch (err) {
        console.error('Failed to update outgoing shipment:', err);
        // Consider specific error codes like ER_DUP_ENTRY if you add unique constraints to outgoing shipments
        res.status(500).json({ message: 'Error updating outgoing shipment', error: err.message });
    }
});

// DELETE endpoint to remove an outgoing shipment by ID
app.delete('/api/outgoing-shipments/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ message: 'Outgoing shipment ID is required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.query('DELETE FROM outgoing_shipments WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `Outgoing shipment with ID ${id} not found.` });
        }

        res.status(200).json({ message: `Outgoing shipment with ID ${id} deleted successfully.` });
    } catch (err) {
        console.error(`Failed to delete outgoing shipment with ID ${id}:`, err);
        // Check for foreign key constraint violation (e.g., if shipment items are logged elsewhere)
        // MySQL error code for foreign key constraint violation is 1451
        if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
            return res.status(409).json({ 
                message: `Cannot delete outgoing shipment ${id}. It may be referenced by other records. Please resolve dependencies first.`,
                error: err.message 
            });
        }
        res.status(500).json({ message: 'Error deleting outgoing shipment', error: err.message });
    } finally {
        if (connection) {
            connection.release();
        }
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
    console.log('POST /api/inventory-audits: Full request body:', JSON.stringify(req.body, null, 2));

    // Destructure using the snake_case keys sent by the frontend
    const { zone_id, scheduled_date, auditor, audit_type } = req.body;
    // Log the destructured values to confirm
    console.log('POST /api/inventory-audits: Destructured values:', { zone_id, scheduled_date, auditor, audit_type });

    // Validate using the new variable names
    if (!zone_id || !scheduled_date || !auditor || !audit_type) {
        console.log('POST /api/inventory-audits: Missing required fields.');
        // Update error message to reflect expected snake_case keys for clarity if needed
        return res.status(400).json({ message: 'Missing required fields (zone_id, scheduled_date, auditor, audit_type).' });
    }

    try {
        let newId;
        const [lastIdRow] = await pool.query('SELECT id FROM inventory_audits ORDER BY id DESC LIMIT 1');
        if (lastIdRow.length > 0) {
            const lastId = lastIdRow[0].id;
            const lastNum = parseInt(lastId.replace('AUD-', '')) || 0; // Extract number and increment
            newId = `AUD-${String(lastNum + 1).padStart(3, '0')}`;
        } else {
            newId = 'AUD-001'; // First ID
        }
        console.log('POST /api/inventory-audits: Generated new ID:', newId);

        // Optional: Check if zone_id (the value for the 'zone' column) exists as a valid zone ID
        // This check assumes your warehouse_zones table has an 'id' column that matches the zone_id value
        const [zoneCheck] = await pool.query('SELECT id FROM warehouse_zones WHERE id = ?', [zone_id]);
        if (zoneCheck.length === 0) {
            console.warn(`POST /api/inventory-audits: Zone ID '${zone_id}' (for 'zone' column) not found in warehouse_zones.`);
            return res.status(400).json({ message: `Zone ID '${zone_id}' does not exist. Please select a valid zone.` });
        }

        // Insert the new audit into the inventory_audits table
        // SQL uses 'zone' as the column name, but we pass the value from 'zone_id'
        const insertQuery = `
            INSERT INTO inventory_audits (id, zone, scheduled_date, auditor, audit_type, status)
            VALUES (?, ?, ?, ?, ?, 'Scheduled')
        `;
        console.log('POST /api/inventory-audits: Executing insert query with values for (id, zone, scheduled_date, auditor, audit_type, status):', [newId, zone_id, scheduled_date, auditor, audit_type]);
        const [result] = await pool.query(insertQuery, [newId, zone_id, scheduled_date, auditor, audit_type]);

        if (result.affectedRows === 1) {
            console.log('POST /api/inventory-audits: Audit scheduled successfully with ID:', newId);
            // Fetch the newly created audit to return its full data
            const [newAuditData] = await pool.query('SELECT * FROM inventory_audits WHERE id = ?', [newId]);
            res.status(201).json({
                message: 'Inventory audit scheduled successfully!',
                audit: newAuditData[0] // Send the full audit object
            });
        } else {
            console.error('POST /api/inventory-audits: Failed to insert audit, affectedRows was not 1.');
            res.status(500).json({ message: 'Failed to schedule inventory audit (insert affected 0 rows).' });
        }
    } catch (err) {
        console.error('POST /api/inventory-audits: Error during audit scheduling process:', err);
        // Check for specific database errors, e.g., foreign key constraint if 'zone' column has one
        // The error code might be different if the constraint is on 'zone' vs 'zone_id'
        if (err.code === 'ER_NO_REFERENCED_ROW_2' || (err.message && err.message.includes("foreign key constraint fails"))) {
             return res.status(400).json({ message: `Invalid Zone ID: '${zone_id}' does not exist or another reference is invalid.`, error: err.message });
        }
        res.status(500).json({ message: 'Error scheduling inventory audit', error: err.message });
    }
});

// DELETE endpoint to delete an inventory audit
app.delete('/api/inventory-audits/:id', async (req, res) => {
    const { id } = req.params;
    try {
        console.log(`DELETE /api/inventory-audits/${id}: Attempting to delete audit.`);
        const [result] = await pool.query('DELETE FROM inventory_audits WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            console.warn(`DELETE /api/inventory-audits/${id}: Audit not found.`);
            return res.status(404).json({ message: 'Inventory audit not found.' });
        }
        console.log(`DELETE /api/inventory-audits/${id}: Audit deleted successfully.`);
        res.status(200).json({ message: 'Inventory audit deleted successfully.' });
    } catch (err) {
        console.error(`DELETE /api/inventory-audits/${id}: Failed to delete audit:`, err);
        res.status(500).json({ message: 'Error deleting inventory audit', error: err.message });
    }
});

// PUT endpoint to update an inventory audit (e.g., status, discrepancies)
app.put('/api/inventory-audits/:id', async (req, res) => {
    const { id } = req.params;
    const { zone_id, scheduled_date, auditor, audit_type, status, discrepancies, accuracy } = req.body;
    try {
        const updateQuery = `
            UPDATE inventory_audits
            SET zone_id = ?, scheduled_date = ?, auditor = ?, audit_type = ?, status = ?, discrepancies = ?, accuracy = ?
            WHERE id = ?
        `;
        const [result] = await pool.query(updateQuery, [zone_id, scheduled_date, auditor, audit_type, status, discrepancies, accuracy, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Inventory audit not found or no changes made.' });
        }
        res.status(200).json({ message: 'Inventory audit updated successfully!' });
    } catch (err) {
        console.error('Failed to update inventory audit:', err);
        res.status(500).json({ message: 'Error updating inventory audit', error: err.message });
    }
});

// --- API Endpoints for Warehouse Zones ---
// GET endpoint to fetch all warehouse zones
app.get('/api/warehouse-zones', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM warehouse_zones ORDER BY createdAt DESC');
        res.json(rows);
    } catch (err) {
        console.error('Failed to fetch warehouse zones:', err);
        res.status(500).json({ message: 'Error fetching warehouse zones', error: err.message });
    }
});

// POST endpoint to add a new warehouse zone
app.post('/api/warehouse-zones', async (req, res) => {
    const { id, name, max_capacity, temperature, humidity, status } = req.body;
    try {
        if (!id || !name || max_capacity === undefined) {
            return res.status(400).json({ message: 'Missing required warehouse zone fields (id, name, max_capacity).' });
        }

        const insertQuery = `
            INSERT INTO warehouse_zones (id, name, max_capacity, temperature, humidity, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(insertQuery, [id, name, max_capacity, temperature || 0, humidity || 0, status || 'Normal']);

        if (result.affectedRows === 1) {
            // Return the newly created zone object
            res.status(201).json({
                message: 'Warehouse zone added successfully!',
                zone: {
                    id: id,
                    name: name,
                    max_capacity: parseInt(max_capacity, 10), // Ensure it's a number for consistency
                    temperature: parseInt(temperature, 10) || 0,
                    humidity: parseInt(humidity, 10) || 0,
                    status: status || 'Normal',
                    capacity: 0, // Default for a new zone
                    products_count: 0, // Default for a new zone
                    // createdAt will be set by the database, but we can approximate for the response
                    createdAt: new Date().toISOString() 
                }
            });
        } else {
            res.status(500).json({ message: 'Failed to add warehouse zone.' });
        }
    } catch (err) {
        console.error('Failed to add warehouse zone:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Warehouse Zone ID or Name already exists. Please use a unique ID and Name.', error: err.message });
        }
        res.status(500).json({ message: 'Error adding warehouse zone', error: err.message });
    }
});

// PATCH endpoint to update stock for a specific warehouse zone
app.patch('/api/zones/:zoneId/stock', async (req, res) => {
    const { zoneId } = req.params;
    const { quantityChange } = req.body; // e.g., { quantityChange: 10 } or { quantityChange: -5 }

    if (typeof quantityChange !== 'number') {
        return res.status(400).json({ message: 'Invalid quantityChange. Must be a number.' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM warehouse_zones WHERE id = ?', [zoneId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Warehouse zone not found.' });
        }

        const zone = rows[0];
        let newCapacity = (zone.capacity || 0) + quantityChange;
        let newProductsCount = (zone.products_count || 0) + quantityChange;

        // Validate new capacity and products_count
        if (newCapacity > zone.max_capacity) {
            return res.status(400).json({ message: `Cannot add stock. New capacity (${newCapacity}) would exceed max capacity (${zone.max_capacity}). Available space: ${zone.max_capacity - (zone.capacity || 0)}` });
        }
        if (newCapacity < 0) {
            newCapacity = 0; // Prevent capacity from going below 0
        }
        if (newProductsCount < 0) {
            newProductsCount = 0; // Prevent products_count from going below 0
        }

        const updateQuery = 'UPDATE warehouse_zones SET capacity = ?, products_count = ? WHERE id = ?';
        const [result] = await pool.query(updateQuery, [newCapacity, newProductsCount, zoneId]);

        if (result.affectedRows === 1) {
            const [updatedZoneRows] = await pool.query('SELECT * FROM warehouse_zones WHERE id = ?', [zoneId]);
            res.status(200).json({
                message: 'Stock updated successfully!',
                zone: updatedZoneRows[0]
            });
        } else {
            res.status(500).json({ message: 'Failed to update stock.' });
        }
    } catch (err) {
        console.error('Error updating stock:', err);
        res.status(500).json({ message: 'Error updating stock.', error: err.message });
    }
});

// PUT endpoint to update an existing warehouse zone's details (not stock)
app.put('/api/warehouse-zones/:id', async (req, res) => {
    const { id } = req.params;
    const { name, capacity, max_capacity, temperature, humidity, status, products_count } = req.body;
    try {
        if (!name || max_capacity === undefined) {
            return res.status(400).json({ message: 'Missing required warehouse zone fields (name, max_capacity).' });
        }

        const updateQuery = `
            UPDATE warehouse_zones
            SET name = ?, capacity = ?, max_capacity = ?, temperature = ?, humidity = ?, status = ?, products_count = ?
            WHERE id = ?
        `;
        const [result] = await pool.query(updateQuery, [name, capacity, max_capacity, temperature, humidity, status, products_count, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Warehouse zone not found or no changes made.' });
        }
        res.status(200).json({ message: 'Warehouse zone updated successfully!' });
    } catch (err) {
        console.error('Failed to update warehouse zone:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Warehouse Zone Name already exists. Please use a unique Name.', error: err.message });
        }
        res.status(500).json({ message: 'Error updating warehouse zone', error: err.message });
    }
});

// DELETE endpoint to delete a warehouse zone
app.delete('/api/warehouse-zones/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Before deleting the zone, check if there are any products or audits associated with it
        const [productsInZone] = await pool.query('SELECT COUNT(*) AS count FROM products WHERE zone = ?', [id]);
        if (productsInZone[0].count > 0) {
            return res.status(409).json({ message: `Cannot delete zone '${id}'. There are ${productsInZone[0].count} products associated with it.` });
        }

        const [auditsInZone] = await pool.query('SELECT COUNT(*) AS count FROM inventory_audits WHERE zone = ?', [id]);
        if (auditsInZone[0].count > 0) {
            return res.status(409).json({ message: `Cannot delete zone '${id}'. There are ${auditsInZone[0].count} inventory audits scheduled for this zone.` });
        }

        const [result] = await pool.query('DELETE FROM warehouse_zones WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Warehouse zone not found.' });
        }
        res.status(200).json({ message: 'Warehouse zone deleted successfully.' });
    } catch (err) {
        console.error('Failed to delete warehouse zone:', err);
        res.status(500).json({ message: 'Error deleting warehouse zone', error: err.message });
    }
});

// --- API Endpoints for Orders ---
// GET endpoint to fetch all orders
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM orders ORDER BY order_date DESC');
        res.json(rows);
    } catch (err) {
        console.error('Failed to fetch orders:', err);
        res.status(500).json({ message: 'Error fetching orders', error: err.message });
    }
});

// POST endpoint to add a new order
app.post('/api/orders', async (req, res) => {
    console.log('POST /api/orders: Received request to create new order.');
    console.log('POST /api/orders: Full request body:', JSON.stringify(req.body, null, 2));

    const { customer, items, value, order_date, status, priority } = req.body;

    // Basic validation - ensure all expected fields from the error message are present
    if (!customer || items === undefined || value === undefined || !order_date) {
        console.log('POST /api/orders: Missing required fields.');
        // The error message from your screenshot mentioned customer, items, value, order_date
        return res.status(400).json({ message: 'Missing required order fields (customer, items, value, order_date).' });
    }

    try {
        // Generate a new order ID (e.g., ORD-001, ORD-002)
        let newOrderId;
        const [lastIdRow] = await pool.query('SELECT id FROM orders ORDER BY id DESC LIMIT 1');
        if (lastIdRow.length > 0) {
            const lastId = lastIdRow[0].id;
            const lastNum = parseInt(lastId.replace('ORD-', '')) || 0;
            newOrderId = `ORD-${String(lastNum + 1).padStart(3, '0')}`;
        } else {
            newOrderId = 'ORD-001';
        }
        console.log('POST /api/orders: Generated new Order ID:', newOrderId);

        const insertQuery = `
            INSERT INTO orders (id, customer, items, value, order_date, status, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Use provided status and priority, or default if not sent/needed
        const orderStatus = status || 'Pending'; 
        const orderPriority = priority || 'Low';

        console.log('POST /api/orders: Executing insert query with values:', 
            [newOrderId, customer, items, value, order_date, orderStatus, orderPriority]);

        const [result] = await pool.query(insertQuery, 
            [newOrderId, customer, items, value, order_date, orderStatus, orderPriority]);

        if (result.affectedRows === 1) {
            console.log('POST /api/orders: Order created successfully with ID:', newOrderId);
            // Fetch the newly created order to return its full data
            const [newOrderData] = await pool.query('SELECT * FROM orders WHERE id = ?', [newOrderId]);
            res.status(201).json(newOrderData[0]); // Send the full new order object
        } else {
            console.error('POST /api/orders: Failed to insert order, affectedRows was not 1.');
            res.status(500).json({ message: 'Failed to create order (database insert error).' });
        }
    } catch (err) {
        console.error('POST /api/orders: Error creating order:', err);
        res.status(500).json({ message: 'Error creating order', error: err.message });
    }
});

// GET endpoint to fetch a single order by ID
app.get('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`GET /api/orders/${id}: Failed to fetch order:`, err);
        res.status(500).json({ message: 'Error fetching order', error: err.message });
    }
});

// PUT endpoint to update an existing order
app.put('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { customer, items, value, order_date, status, priority } = req.body;
    console.log(`PUT /api/orders/${id}: Received request to update order.`);
    console.log(`PUT /api/orders/${id}: Full request body:`, JSON.stringify(req.body, null, 2));

    // Basic validation
    if (!customer || items === undefined || value === undefined || !order_date || !status || !priority) {
        return res.status(400).json({ message: 'Missing required fields for update (customer, items, value, order_date, status, priority).' });
    }

    try {
        const updateQuery = `
            UPDATE orders 
            SET customer = ?, items = ?, value = ?, order_date = ?, status = ?, priority = ?
            WHERE id = ?
        `;
        const [result] = await pool.query(updateQuery, [customer, items, value, order_date, status, priority, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found or no changes made' });
        }
        
        // Fetch the updated order to return its full data
        const [updatedOrderData] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
        res.json({ message: 'Order updated successfully!', order: updatedOrderData[0] });

    } catch (err) {
        console.error(`PUT /api/orders/${id}: Error updating order:`, err);
        res.status(500).json({ message: 'Error updating order', error: err.message });
    }
});

// DELETE endpoint to delete an order
app.delete('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`DELETE /api/orders/${id}: Received request to delete order.`);

    try {
        const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully!' });
    } catch (err) {
        console.error(`DELETE /api/orders/${id}: Error deleting order:`, err);
        // Handle potential foreign key constraint errors if orders are linked to other tables
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Cannot delete order. It is referenced by other records.', error: err.message });
        }
        res.status(500).json({ message: 'Error deleting order', error: err.message });
    }
});

// --- API Endpoints for Actual Notifications ---

// GET all notifications (e.g., for the notification bell)
app.get('/api/notifications', async (req, res) => {
    try {
        // Fetch notifications, ordering by creation date (newest first)
        // You might want to add pagination or limit the number of notifications fetched
        // Also, consider fetching only unread notifications or a mix based on your requirements
        const [notifications] = await pool.query('SELECT id, message, type, is_read, created_at, link FROM app_notifications ORDER BY created_at DESC');
        
        // The frontend expects 'read' and 'timestamp'
        const formattedNotifications = notifications.map(n => ({
            ...n,
            read: !!n.is_read, // Convert TINYINT/INT to boolean
            timestamp: n.created_at
        }));
        
        res.json(formattedNotifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
});

// PUT to mark a specific notification as read
app.put('/api/notifications/:id/mark-read', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('UPDATE app_notifications SET is_read = 1 WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification marked as read successfully' });
    } catch (error) {
        console.error(`Error marking notification ${id} as read:`, error);
        res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
    }
});

// PUT to mark all notifications as read
app.put('/api/notifications/mark-all-read', async (req, res) => {
    try {
        // This will mark all notifications as read. 
        // If you have user-specific notifications, you'd add a WHERE clause for user_id.
        await pool.query('UPDATE app_notifications SET is_read = 1 WHERE is_read = 0');
        res.json({ message: 'All notifications marked as read successfully' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
    }
});

// DELETE all notifications (or clear them)
app.delete('/api/notifications', async (req, res) => {
    try {
        // This deletes all notifications. 
        // Consider if you want to only delete read notifications or implement soft delete/archiving.
        // If user-specific, add a WHERE clause for user_id.
        await pool.query('DELETE FROM app_notifications'); 
        res.json({ message: 'All notifications cleared successfully' });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ message: 'Failed to clear notifications', error: error.message });
    }
});

// --- API Endpoints for Settings ---
// GET endpoint to fetch all settings
app.get('/api/settings', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
        // Convert the array of objects into a single object for easier consumption on the frontend
        const settings = rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});
        res.json(settings);
    } catch (err) {
        console.error('Failed to fetch settings:', err);
        res.status(500).json({ message: 'Error fetching settings', error: err.message });
    }
});

// GET endpoint for general settings (MUST BE BEFORE /api/settings/:key)
app.get('/api/settings/general', async (req, res) => {
    try {
        const keysToFetch = ['warehouseName', 'timeZone', 'defaultCurrency'];
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?)', [keysToFetch]);
        
        const settings = rows.reduce((acc, row) => {
            acc[row.setting_key] = row.setting_value;
            return acc;
        }, {});

        keysToFetch.forEach(key => {
            if (!settings.hasOwnProperty(key)) {
                settings[key] = null; // Or some default if not found
            }
        });

        console.log('GET /api/settings/general: Fetched settings:', settings);
        res.json(settings);
    } catch (err) {
        console.error('Error fetching general settings:', err);
        res.status(500).json({ message: 'Error fetching general settings', error: err.message });
    }
});

// PUT endpoint for general settings
app.put('/api/settings/general', async (req, res) => {
    const { warehouseName, timeZone, defaultCurrency } = req.body;
    console.log('PUT /api/settings/general: Received data:', req.body);

    if (warehouseName === undefined || timeZone === undefined || defaultCurrency === undefined) {
        return res.status(400).json({ message: 'Missing required settings fields (warehouseName, timeZone, defaultCurrency).' });
    }

    try {
        const settingsToUpdate = [
            { key: 'warehouseName', value: warehouseName },
            { key: 'timeZone', value: timeZone },
            { key: 'defaultCurrency', value: defaultCurrency }
        ];

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const setting of settingsToUpdate) {
                await connection.query(
                    'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
                    [setting.key, setting.value]
                );
            }
            await connection.commit();
            console.log('PUT /api/settings/general: Settings updated successfully.');
            res.status(200).json({ message: 'General settings updated successfully!' });
        } catch (err) {
            await connection.rollback();
            console.error('Error updating general settings during transaction:', err);
            throw err; // Re-throw to be caught by outer catch block
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error updating general settings:', err);
        res.status(500).json({ message: 'Error updating general settings', error: err.message });
    }
});

// --- API Endpoints for Warehouse Configuration Settings ---
app.get('/api/settings/warehouse', async (req, res) => {
    try {
        const keysToFetch = [
            'default_storage_temperature',
            'low_stock_threshold',
            'auto_reorder_point',
            'audit_frequency'
        ];
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?)', [keysToFetch]);
        
        const warehouseSettings = {};
        rows.forEach(row => {
            warehouseSettings[row.setting_key] = row.setting_value;
        });

        // Ensure all expected keys are present in the response
        keysToFetch.forEach(key => {
            if (!(key in warehouseSettings)) {
                warehouseSettings[key] = null; 
            }
        });

        console.log('GET /api/settings/warehouse: Responding with:', warehouseSettings);
        res.json(warehouseSettings);
    } catch (error) {
        console.error('Error fetching warehouse settings:', error);
        res.status(500).json({ message: 'Failed to fetch warehouse settings', error: error.message });
    }
});

app.put('/api/settings/warehouse', async (req, res) => {
    const { 
        default_storage_temperature,
        low_stock_threshold,
        auto_reorder_point,
        audit_frequency 
    } = req.body;
    console.log('PUT /api/settings/warehouse: Received payload:', req.body);

    const settingsToUpdate = {};
    if (default_storage_temperature !== undefined) settingsToUpdate.default_storage_temperature = default_storage_temperature;
    if (low_stock_threshold !== undefined) settingsToUpdate.low_stock_threshold = low_stock_threshold;
    if (auto_reorder_point !== undefined) settingsToUpdate.auto_reorder_point = auto_reorder_point;
    if (audit_frequency !== undefined) settingsToUpdate.audit_frequency = audit_frequency;

    if (Object.keys(settingsToUpdate).length === 0) {
        return res.status(400).json({ message: 'No valid settings provided for update.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        for (const [key, value] of Object.entries(settingsToUpdate)) {
            await connection.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
                [key, String(value)] // Ensure value is stored as string
            );
            console.log(`PUT /api/settings/warehouse: Updated ${key} to ${value}`);
        }

        await connection.commit();
        res.json({ message: 'Warehouse settings updated successfully!' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error updating warehouse settings:', error);
        res.status(500).json({ message: 'Failed to update warehouse settings', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// --- API Endpoints for Notification Preferences Settings ---
app.get('/api/settings/notifications', async (req, res) => {
    try {
        const keysToFetch = [
            'notification_low_stock_email',
            'notification_critical_issue_email',
            'notification_daily_report_email',
            'notification_shipment_update_email',
            'notification_low_stock_in_app',
            'notification_critical_issue_in_app',
            'notification_shipment_update_in_app'
        ];
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?)', [keysToFetch]);
        
        const notificationSettings = {};
        rows.forEach(row => {
            // Convert 'true'/'false' strings to booleans, otherwise keep as string
            if (row.setting_value === 'true') {
                notificationSettings[row.setting_key] = true;
            } else if (row.setting_value === 'false') {
                notificationSettings[row.setting_key] = false;
            } else {
                notificationSettings[row.setting_key] = row.setting_value;
            }
        });

        // Ensure all expected keys are present in the response, defaulting to false for booleans
        keysToFetch.forEach(key => {
            if (!(key in notificationSettings)) {
                notificationSettings[key] = false; 
            }
        });

        console.log('GET /api/settings/notifications: Responding with:', notificationSettings);
        res.json(notificationSettings);
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({ message: 'Failed to fetch notification settings', error: error.message });
    }
});

app.put('/api/settings/notifications', async (req, res) => {
    const { 
        notification_low_stock_email,
        notification_critical_issue_email,
        notification_daily_report_email,
        notification_shipment_update_email,
        notification_low_stock_in_app,
        notification_critical_issue_in_app,
        notification_shipment_update_in_app
    } = req.body;
    console.log('PUT /api/settings/notifications: Received payload:', req.body);

    const settingsToUpdate = {
        notification_low_stock_email,
        notification_critical_issue_email,
        notification_daily_report_email,
        notification_shipment_update_email,
        notification_low_stock_in_app,
        notification_critical_issue_in_app,
        notification_shipment_update_in_app
    };

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        for (const [key, value] of Object.entries(settingsToUpdate)) {
            if (value !== undefined) { // Only update if a value was provided
                await connection.query(
                    'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
                    [key, String(value)] // Store boolean as 'true'/'false' strings
                );
                console.log(`PUT /api/settings/notifications: Updated ${key} to ${value}`);
            }
        }

        await connection.commit();
        res.json({ message: 'Notification preferences updated successfully!' });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error updating notification settings:', error);
        res.status(500).json({ message: 'Failed to update notification settings', error: error.message });
    } finally {
        if (connection) connection.release();
    }
});

// --- Generic API Endpoints for Individual Settings (MUST BE DEFINED LAST) ---
// GET endpoint for a single setting by key
app.get('/api/settings/:key', async (req, res) => {
    const { key } = req.params;
    try {
        const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings WHERE setting_key = ?', [key]);
        if (rows.length > 0) {
            // Return the single setting as an object { key: value }
            res.json({ [rows[0].setting_key]: rows[0].setting_value }); 
        } else {
            console.log(`GET /api/settings/${key}: Setting not found.`);
            res.status(404).json({ message: `Setting '${key}' not found.` });
        }
    } catch (err) {
        console.error(`Failed to fetch setting ${key}:`, err);
        res.status(500).json({ message: `Error fetching setting ${key}`, error: err.message });
    }
});

// PUT endpoint to update or create a specific setting by key
app.put('/api/settings/:key', async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
        return res.status(400).json({ message: 'Setting value is required.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
            [key, String(value)] // Ensure value is stored as string
        );
        
        // For ON DUPLICATE KEY UPDATE, affectedRows is 1 for an insert, 2 for an update if the value changed.
        if (result.affectedRows > 0) {
            console.log(`PUT /api/settings/${key}: Setting '${key}' processed. Affected rows: ${result.affectedRows}`);
            res.status(200).json({ message: `Setting '${key}' updated/created successfully.` });
        } else { // affectedRows is 0 if the value was the same and no update occurred.
            console.log(`PUT /api/settings/${key}: Setting '${key}' value unchanged. Affected rows: ${result.affectedRows}`);
            res.status(200).json({ message: `Setting '${key}' value unchanged or already up to date.` });
        }
    } catch (err) {
        console.error(`Error updating setting '${key}':`, err);
        res.status(500).json({ message: `Error updating setting '${key}'`, error: err.message });
    }
});


// --- API Endpoints for Users ---
// GET all users
app.get('/api/users', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, name, email, role, status, created_at, updated_at FROM users');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users.', error: error.message });
    }
});

// POST create a new user
app.post('/api/users', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields (name, email, password, role) are required.' });
    }

    try {
        const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash password with salt rounds
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );
        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Failed to create user.', error: error.message });
    }
});

// PUT update user (excluding password)
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    if (!name || !email || !role || !status) {
        return res.status(400).json({ message: 'All fields (name, email, role, status) are required for update.' });
    }

    try {
        // Check for email uniqueness if email is being changed
        const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Another user with this email already exists.' });
        }

        const [result] = await pool.query(
            'UPDATE users SET name = ?, email = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, email, role, status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or no changes made.' });
        }
        res.status(200).json({ message: 'User updated successfully.' });
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        res.status(500).json({ message: 'Failed to update user.', error: error.message });
    }
});

// DELETE a user
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        res.status(500).json({ message: 'Failed to delete user.', error: error.message });
    }
});

// --- API Endpoints for App Notifications ---
// GET all notifications
app.get('/api/app-notifications', async (req, res) => {
    try {
        // Optionally filter by is_read status, e.g., /api/app-notifications?is_read=false
        const { is_read } = req.query;
        let query = 'SELECT * FROM app_notifications ORDER BY created_at DESC';
        let queryParams = [];

        if (is_read !== undefined) {
            query = 'SELECT * FROM app_notifications WHERE is_read = ? ORDER BY created_at DESC';
            queryParams.push(is_read === 'true' || is_read === '1');
        }

        const [notifications] = await pool.query(query, queryParams);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching app notifications:', error);
        res.status(500).json({ message: 'Failed to fetch app notifications.', error: error.message });
    }
});

// POST create a new notification
app.post('/api/app-notifications', async (req, res) => {
    const { message, type, is_read, link } = req.body;

    if (!message) {
        return res.status(400).json({ message: 'Notification message is required.' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO app_notifications (message, type, is_read, link) VALUES (?, ?, ?, ?)',
            [message, type || 'info', is_read || false, link || null]
        );
        res.status(201).json({ message: 'Notification created successfully', notificationId: result.insertId });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ message: 'Failed to create notification.', error: error.message });
    }
});

// PUT update notification status (e.g., mark as read)
app.put('/api/app-notifications/:id', async (req, res) => {
    const { id } = req.params;
    const { message, type, is_read, link } = req.body; // Allow updating any field

    try {
        const [currentNotification] = await pool.query('SELECT * FROM app_notifications WHERE id = ?', [id]);
        if (currentNotification.length === 0) {
            return res.status(404).json({ message: 'Notification not found.' });
        }

        const updatedMessage = message !== undefined ? message : currentNotification[0].message;
        const updatedType = type !== undefined ? type : currentNotification[0].type;
        const updatedIsRead = is_read !== undefined ? (is_read === true || is_read === 'true' || is_read === 1) : currentNotification[0].is_read;
        const updatedLink = link !== undefined ? link : currentNotification[0].link;

        const [result] = await pool.query(
            'UPDATE app_notifications SET message = ?, type = ?, is_read = ?, link = ? WHERE id = ?',
            [updatedMessage, updatedType, updatedIsRead, updatedLink, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found or no changes made.' });
        }
        res.status(200).json({ message: 'Notification updated successfully.' });
    } catch (error) {
        console.error(`Error updating notification ${id}:`, error);
        res.status(500).json({ message: 'Failed to update notification.', error: error.message });
    }
});

// DELETE a notification
app.delete('/api/app-notifications/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM app_notifications WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found.' });
        }
        res.status(200).json({ message: 'Notification deleted successfully.' });
    } catch (error) {
        console.error(`Error deleting notification ${id}:`, error);
        res.status(500).json({ message: 'Failed to delete notification.', error: error.message });
    }
});

// --- API Endpoints for Reports Dashboard ---
app.get('/api/reports/overview-stats', async (req, res) => {
  console.log('GET /api/reports/overview-stats: Fetching report overview stats.');
  try {
    // Calculate 'Generated This Month'
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [generatedThisMonthRows] = await pool.query(
      'SELECT COUNT(*) as count FROM generated_reports WHERE generated_at >= ? AND generated_at <= ?',
      [firstDayOfMonth, lastDayOfMonth]
    );
    const generatedThisMonth = generatedThisMonthRows[0].count;

    const stats = {
      availableReports: 5, // Static for now, could be dynamic later
      generatedThisMonth: generatedThisMonth,
      recentDownloads: 0, // Static for now, requires download tracking
      storageUsedGB: 2.8 // Static for now, requires actual file storage and calculation
    };
    res.json(stats);
  } catch (err) {
    console.error('GET /api/reports/overview-stats: Error fetching stats:', err);
    res.status(500).json({ message: 'Error fetching report overview stats', error: err.message });
  }
});

app.get('/api/reports/recent', async (req, res) => {
  console.log('GET /api/reports/recent: Fetching recent reports from database.');
  try {
    const [reports] = await pool.query('SELECT id, report_name, report_type, generated_at, file_format, file_size_kb, status FROM generated_reports ORDER BY generated_at DESC LIMIT 10');
    res.json(reports);
  } catch (err) {
    console.error('GET /api/reports/recent: Error fetching recent reports:', err);
    res.status(500).json({ message: 'Error fetching recent reports', error: err.message });
  }
});

// POST /api/reports/generate - Generate a new report and add to DB
app.post('/api/reports/generate', async (req, res) => {
  const { reportType } = req.body;
  console.log(`POST /api/reports/generate: Received request to generate report of type: ${reportType}`);

  if (!reportType) {
    return res.status(400).json({ message: 'reportType is required.' });
  }

  try {
    // Generate new ID for the report
    let newId;
    const [lastIdRow] = await pool.query('SELECT id FROM generated_reports ORDER BY id DESC LIMIT 1');
    if (lastIdRow.length > 0 && lastIdRow[0].id) {
      const lastNum = parseInt(lastIdRow[0].id.replace('REP-', ''), 10) || 0;
      newId = `REP-${String(lastNum + 1).padStart(3, '0')}`;
    } else {
      newId = 'REP-001';
    }

    // Construct report name
    const reportTypeFormatted = reportType.charAt(0).toUpperCase() + reportType.slice(1);
    const currentDate = new Date().toISOString().split('T')[0];
    const report_name = `${reportTypeFormatted} Report - ${currentDate}`;

    // Mock file size for now
    const mockFileSizeKB = Math.floor(Math.random() * (2048 - 512 + 1)) + 512; // Random size between 0.5MB and 2MB

    const insertQuery = `
      INSERT INTO generated_reports (id, report_name, report_type, file_format, file_size_kb, status)
      VALUES (?, ?, ?, 'PDF', ?, 'Completed')
    `;
    await pool.query(insertQuery, [newId, report_name, reportType, mockFileSizeKB]);

    const [newReport] = await pool.query('SELECT * FROM generated_reports WHERE id = ?', [newId]);

    res.status(201).json({
      message: `Report '${report_name}' generated successfully!`,
      report: newReport[0]
    });

  } catch (err) {
    console.error(`POST /api/reports/generate: Error generating ${reportType} report:`, err);
    res.status(500).json({ message: `Error generating ${reportType} report`, error: err.message });
  }
});

// END: Reports & Analytics Endpoints
// Start the server only after the database has been initialized
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Access the API at http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to start server due to database initialization error:', err);
    process.exit(1); // Exit if DB connection fails
});