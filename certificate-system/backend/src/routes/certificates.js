const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { renderTemplate, htmlToPdfBuffer, getBase64Logo } = require('../utils/pdfGenerator');
const { sha256Hex } = require('../utils/hash');


const STORAGE_DIR = path.join(__dirname, '..', 'pdfs');
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);

// POST /certificates - issue a certificate
router.post('/', async (req, res) => {
  try {
    const { name, track = 'default', template = 'default', issued_by = 'AI First Academy' } = req.body;

    
let templateFile = template; // from request
// Map track to template if template not explicitly given
if (!req.body.template) {
    const trackTemplateMap = {
        'AI Designer': 'designer',
        'AI Marketing': 'marketing',
        'AI Research': 'research',
        'AI Manager': 'manager',
        'AI Engineer': 'default',

    };
    templateFile = trackTemplateMap[track] || 'default';
}

    if (!name) return res.status(400).json({ error: 'name is required' });

    const certificate_id = uuidv4();
    const templatePath = path.join(__dirname, '..', 'templates', `${template}.hbs`);
    const logoPath = path.join(__dirname, '..', 'templates', 'assets', 'risidio-logo.png');
    const verifiedLogoPath = path.join(__dirname, '..', 'templates', 'assets', 'verified-logo.png');
    const html = await renderTemplate(templatePath, {
      name,
      track,
      issued_by,
      certificate_id,
      issue_date: new Date().toLocaleDateString(),
      logo: getBase64Logo(logoPath), // ✅ use Base64 logo here
      verifiedLogo: getBase64Logo(verifiedLogoPath)
    });


    const pdfBuffer = await htmlToPdfBuffer(html);
    const pdfHash = sha256Hex(pdfBuffer);

    const filename = `${certificate_id}.pdf`;
    const filePath = path.join(STORAGE_DIR, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    // Save metadata to DB
    const insertSQL = `
      INSERT INTO certificates (certificate_id, name, track, template, issued_by, pdf_path, pdf_hash)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`;
    const values = [certificate_id, name, track, template, issued_by, `/pdfs/${filename}`, pdfHash];
    await db.query(insertSQL, values);

    const publicUrl = `${req.protocol}://${req.get('host')}/pdfs/${filename}`;
    res.json({ certificate_id, publicUrl, pdfHash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// GET /certificates/verify/:certificate_id
router.get('/verify/:certificate_id', async (req, res) => {
  const cid = req.params.certificate_id;
  const q = 'SELECT certificate_id, name, track, issue_date, pdf_path, pdf_hash, revoked, revoked_at, revoked_reason FROM certificates WHERE certificate_id = $1';
  const r = await db.query(q, [cid]);
  if (r.rows.length === 0) return res.status(404).json({ error: 'Certificate not found' });
  const cert = r.rows[0];
  res.json(cert);
});

// Revoke a certificate
router.post('/:certificate_id/revoke', async (req, res) => {
  const { certificate_id } = req.params;
  const { reason } = req.body;

  try {
    const result = await db.query(
      `UPDATE certificates 
       SET revoked = TRUE, revoked_at = now(), revoked_reason = $1 
       WHERE certificate_id = $2
       RETURNING *`,
      [reason || null, certificate_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({ message: 'Certificate revoked', certificate: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-issue a revoked certificate
router.post('/:certificate_id/reissue', async (req, res) => {
  const { certificate_id } = req.params;

  try {
    // Fetch the revoked certificate
    const original = await db.query('SELECT * FROM certificates WHERE certificate_id=$1', [certificate_id]);
    if (original.rows.length === 0) return res.status(404).json({ error: 'Certificate not found' });

    const cert = original.rows[0];
    if (!cert.revoked) return res.status(400).json({ error: 'Certificate is not revoked' });

    // Generate new certificate ID and PDF
    const newCertificateId = uuidv4();
    const templatePath = path.join(__dirname, '..', 'templates', `${cert.template}.hbs`);
    const html = await renderTemplate(templatePath, {
      name: cert.name,
      track: cert.track,
      issued_by: cert.issued_by,
      certificate_id: newCertificateId,
      issue_date: new Date().toLocaleDateString()
    });

    const pdfBuffer = await htmlToPdfBuffer(html);
    const pdfHash = sha256Hex(pdfBuffer);

    const filename = `${newCertificateId}.pdf`;
    const filePath = path.join(STORAGE_DIR, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    // Insert new certificate linked to the revoked one
    const result = await db.query(
      `INSERT INTO certificates 
       (certificate_id, name, track, template, issued_by, pdf_path, pdf_hash, reissued_from, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
       RETURNING *`,
      [
        newCertificateId,
        cert.name,
        cert.track,
        cert.template,
        cert.issued_by,
        `/pdfs/${filename}`,
        pdfHash,
        cert.certificate_id
      ]
    );

    res.json({ message: 'Certificate reissued', certificate: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve PDFs
router.use('/pdfs', express.static(path.join(__dirname, '..', 'pdfs')));

module.exports = router;
