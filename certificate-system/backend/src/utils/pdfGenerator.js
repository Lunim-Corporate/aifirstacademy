const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');

// ✅ Convert image to Base64 so it always works
function getBase64Logo(logoPath) {
  try {
    const image = fs.readFileSync(logoPath);
    const ext = path.extname(logoPath).substring(1); // e.g., 'png'
    return `data:image/${ext};base64,${image.toString('base64')}`;
  } catch (err) {
    console.error('❌ Logo not found at', logoPath);
    return ''; // fallback to blank if not found
  }
}

async function renderTemplate(templatePath, data) {
  const html = fs.readFileSync(templatePath, 'utf8');
  const compiled = Handlebars.compile(html);
  return compiled(data);
}

async function htmlToPdfBuffer(html) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
    format: 'A4',
    landscape: true,              // ✅ make it horizontal
    printBackground: true,
    margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' }
  });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}


// ✅ MAIN FUNCTION — called from route
async function pdfGenerator(certData) {
  const templatePath = path.join(__dirname, '../templates/certificateTemplate.html');

  const logoPath = path.join(__dirname, '../assets/risidio-logo.png');
  const verifiedPath = path.join(__dirname, '../assets/verified-badge.png');
  const signaturePath = path.join(__dirname, '../assets/sarah-signature.png');

  const data = {
    ...certData,
    risidioLogo: getBase64Logo(logoPath),
    verifiedBadge: getBase64Logo(verifiedPath),
    signature: getBase64Logo(signaturePath),
  };

  const html = await renderTemplate(templatePath, data);
  return await htmlToPdfBuffer(html);
}

export default pdfGenerator;