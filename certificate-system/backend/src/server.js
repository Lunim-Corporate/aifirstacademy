// server.js
require('dotenv').config();
const express = require('express');
const cors = require("cors");
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ✅ Serve PDF only if not revoked
app.get('/pdfs/:file', async (req, res) => {
    const fileName = req.params.file; // e.g. f4d71c63-f7a1-4192-998d-c318f2f76227.pdf
    const certificateId = fileName.replace('.pdf', '');

    try {
        const result = await pool.query(
            'SELECT revoked FROM certificates WHERE certificate_id = $1',
            [certificateId]
        );

        if (result.rows.length === 0) return res.status(404).send('Certificate not found');
        if (result.rows[0].revoked) return res.status(403).send('Certificate revoked');

        // ✅ Fix: correct relative path to your actual pdf folder
        const filePath = path.join(__dirname, 'pdfs', fileName);
        if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

        res.sendFile(filePath);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// ✅ Certificate routes
const certificatesRouter = require('./routes/certificates');
app.use('/certificates', certificatesRouter);

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
