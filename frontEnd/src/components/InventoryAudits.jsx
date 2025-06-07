import React, { useEffect, useState } from 'react';
import './InventoryAudits.css';

const InventoryAudits = () => {
    const [audits, setAudits] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAudit, setNewAudit] = useState({
        zone: '',
        scheduledDate: '',
        auditor: '',
        auditType: '',
    });
    const [warehouseZones, setWarehouseZones] = useState([]);

    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const showMessage = (msg, type = 'info') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 3000);
    };

    useEffect(() => {
        const fetchAudits = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/inventory-audits');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
                }
                const data = await response.json();
                setAudits(data);
            } catch (error) {
                console.error('Error fetching audits:', error);
                showMessage(`Failed to load audits: ${error.message}`, 'error');
            }
        };

        fetchAudits();
    }, []);

    useEffect(() => {
        const fetchWarehouseZones = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/warehouse-zones');
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
                }
                const data = await response.json();
                setWarehouseZones(data);
            } catch (error) {
                console.error('Error fetching warehouse zones:', error);
                showMessage(`Failed to load warehouse zones: ${error.message}`, 'error');
            }
        };

        fetchWarehouseZones();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewAudit(prevAudit => ({
            ...prevAudit,
            [name]: value
        }));
    };

    const handleAddAudit = async (e) => {
        e.preventDefault();

        if (!newAudit.zone || !newAudit.scheduledDate || !newAudit.auditor || !newAudit.auditType) {
            showMessage('Please fill in all required fields.', 'error');
            return;
        }

        try {
            const payload = {
                zone_id: newAudit.zone,
                scheduled_date: newAudit.scheduledDate,
                auditor: newAudit.auditor,
                audit_type: newAudit.auditType,
            };

            const response = await fetch('http://localhost:3000/api/inventory-audits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }

            const responseData = await response.json();

            if (responseData.audit && responseData.audit.id) {
                setAudits(prevAudits => [...prevAudits, responseData.audit]);
            } else {
                console.warn('New audit data not found in response, refetching all audits.');
                const fetchAudits = async () => {
                    try {
                        const response = await fetch('http://localhost:3000/api/inventory-audits');
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
                        }
                        const data = await response.json();
                        setAudits(data);
                    } catch (error) {
                        console.error('Error fetching audits:', error);
                        showMessage(`Failed to load audits: ${error.message}`, 'error');
                    }
                };
                fetchAudits();
            }

            setNewAudit({
                zone: '',
                scheduledDate: '',
                auditor: '',
                auditType: '',
            });
            setShowAddForm(false);
            showMessage('New Audit Scheduled Successfully!', 'success');
        } catch (error) {
            console.error('Error scheduling audit:', error);
            showMessage(`Failed to schedule audit: ${error.message}`, 'error');
        }
    };

    const handleDeleteAudit = async (auditId) => {
        if (!window.confirm(`Are you sure you want to delete audit ${auditId}? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/inventory-audits/${auditId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Failed to delete audit'}`);
            }

            setAudits(prevAudits => prevAudits.filter(audit => audit.id !== auditId));
            showMessage(`Audit ${auditId} deleted successfully.`, 'success');
        } catch (error) {
            console.error('Error deleting audit:', error);
            showMessage(`Failed to delete audit ${auditId}: ${error.message}`, 'error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return '#38a169';
            case 'Scheduled': return '#d69e2e';
            case 'Overdue': return '#e53e3e';
            case 'In Progress': return '#3182ce';
            default: return '#718096';
        }
    };

    const totalAudits = audits.length;
    const completedAudits = audits.filter(audit => audit.status === 'Completed').length;
    const overdueAudits = audits.filter(audit =>
        new Date(audit.scheduled_date) < new Date() &&
        (audit.status === 'Scheduled' || audit.status === 'In Progress')
    ).length;
    const avgAccuracy = audits.length > 0
        ? (audits.reduce((acc, audit) => acc + (audit.accuracy || 0), 0) / audits.length).toFixed(2)
        : 'N/A';

    return (
        <div className="inventory-audits">
            {message && (
                <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${messageType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {message}
                </div>
            )}

            <div className="page-header">
                <h1>Inventory Audits</h1>
                <button className="add-btn" onClick={() => setShowAddForm(true)}>
                    + Schedule New Audit
                </button>
            </div>

            <div className="audits-overview">
                <div className="overview-card">
                    <h3>Total Audits</h3>
                    <div className="overview-value">{totalAudits}</div>
                </div>
                <div className="overview-card">
                    <h3>Completed Audits</h3>
                    <div className="overview-value">{completedAudits}</div>
                </div>
                <div className="overview-card">
                    <h3>Overdue Audits</h3>
                    <div className="overview-value">{overdueAudits}</div>
                </div>
                <div className="overview-card">
                    <h3>Average Accuracy</h3>
                    <div className="overview-value">{avgAccuracy}%</div>
                </div>
            </div>

            <div className="audits-grid">
                {audits.length === 0 ? (
                    <p className="no-audits-message">No inventory audits scheduled yet. Click "Schedule New Audit" to add one.</p>
                ) : (
                    audits.map((audit) => (
                        <div key={audit.id} className="audit-card">
                            <div className="audit-header">
                                <h3>Audit {audit.id}</h3>
                                <span className="audit-status" style={{ backgroundColor: getStatusColor(audit.status) }}>
                                    {audit.status}
                                </span>
                            </div>
                            <p><strong>Zone:</strong> {audit.zone}</p>
                            <p><strong>Scheduled Date:</strong> {new Date(audit.scheduled_date).toLocaleDateString()}</p>
                            <p><strong>Auditor:</strong> {audit.auditor}</p>
                            <p><strong>Type:</strong> {audit.audit_type}</p>
                            <p><strong>Discrepancies:</strong> {audit.discrepancies}</p>
                            <p><strong>Accuracy:</strong> {audit.accuracy}%</p>
                            <div className="audit-actions">
                                {audit.id && (
                                    <button
                                        className="action-btn danger"
                                        onClick={() => handleDeleteAudit(audit.id)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showAddForm && (
                <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Schedule New Inventory Audit</h2>
                            <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddAudit}>
                            <div className="form-group">
                                <label>Zone ID</label>
                                <input
                                    type="text"
                                    list="zone-datalist"
                                    name="zone"
                                    value={newAudit.zone}
                                    onChange={handleInputChange}
                                    placeholder="Type or select Zone ID"
                                    required
                                />
                                <datalist id="zone-datalist">
                                    {warehouseZones.map((zone) => (
                                        <option key={zone.id} value={zone.id}>
                                            {zone.name} ({zone.id})
                                        </option>
                                    ))}
                                </datalist>
                            </div>
                            <div className="form-group">
                                <label>Scheduled Date</label>
                                <input
                                    type="date"
                                    name="scheduledDate"
                                    value={newAudit.scheduledDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Auditor</label>
                                <input
                                    type="text"
                                    name="auditor"
                                    value={newAudit.auditor}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Audit Type</label>
                                <select
                                    name="auditType"
                                    value={newAudit.auditType}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Audit Type</option>
                                    <option value="Full">Full Audit</option>
                                    <option value="Cycle Count">Cycle Count</option>
                                    <option value="Spot Check">Spot Check</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button type="submit">Schedule Audit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryAudits;