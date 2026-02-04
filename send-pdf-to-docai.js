const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

// Configuration
const PROCESSOR_ENDPOINT = 'https://us-documentai.googleapis.com/v1/projects/784366500656/locations/us/processors/d80ff2927d42863f:process';
const MAX_PAGES_PER_REQUEST = 15;

async function getAccessToken() {
  // Use full path to gcloud in LocalAppData
  const gcloudPath = path.join(process.env.LOCALAPPDATA, 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin', 'gcloud.cmd');
  try {
    const token = execSync(`"${gcloudPath}" auth application-default print-access-token`, { encoding: 'utf-8' }).trim();
    return token;
  } catch (error) {
    console.error('Error getting access token. Run: gcloud auth application-default login');
    console.error('gcloud path:', gcloudPath);
    process.exit(1);
  }
}

async function splitPDF(pdfBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = pdfDoc.getPageCount();
  const chunks = [];
  
  console.log(`  PDF has ${totalPages} pages, splitting into chunks of ${MAX_PAGES_PER_REQUEST}...`);
  
  for (let start = 0; start < totalPages; start += MAX_PAGES_PER_REQUEST) {
    const end = Math.min(start + MAX_PAGES_PER_REQUEST, totalPages);
    const chunkDoc = await PDFDocument.create();
    const pages = await chunkDoc.copyPages(pdfDoc, Array.from({ length: end - start }, (_, i) => start + i));
    pages.forEach(page => chunkDoc.addPage(page));
    const chunkBytes = await chunkDoc.save();
    chunks.push({
      buffer: Buffer.from(chunkBytes),
      startPage: start + 1,
      endPage: end
    });
  }
  
  console.log(`  Created ${chunks.length} chunks`);
  return chunks;
}

async function processChunk(base64Content, accessToken, chunkInfo) {
  const requestBody = {
    skipHumanReview: true,
    rawDocument: {
      mimeType: 'application/pdf',
      content: base64Content
    }
  };
  
  const response = await fetch(PROCESSOR_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  
  return await response.json();
}

async function processPDF(pdfPath) {
  console.log(`\nProcessing: ${pdfPath}`);
  
  // Read PDF
  const pdfBuffer = fs.readFileSync(pdfPath);
  
  // Split into chunks
  const chunks = await splitPDF(pdfBuffer);
  
  // Get access token once
  const accessToken = await getAccessToken();
  
  // Process each chunk
  const allResults = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`  Processing chunk ${i + 1}/${chunks.length} (pages ${chunk.startPage}-${chunk.endPage})...`);
    
    const base64Content = chunk.buffer.toString('base64');
  
  // Build request body
  const requestBody = {
    skipHumanReview: true,
    rawDocument: {
      mimeType: 'application/pdf',
      content: base64Content
    }
  };
  
  // Get access token
  const accessToken = await getAccessToken();
  
  // Send request
  const response = await fetch(PROCESSOR_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
  
  const result = await response.json();
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node send-pdf-to-docai.js <pdf1> [pdf2] [pdf3] ...');
    console.log('Example: node send-pdf-to-docai.js document.pdf');
    process.exit(1);
  }
  
  // Process each PDF
  for (const pdfPath of args) {
    const fullPath = path.resolve(pdfPath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      continue;
    }
    
    try {
      const result = await processPDF(fullPath);
      
      // Save JSON response
      const outputPath = fullPath.replace('.pdf', '-response.json');
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`✓ Saved response to: ${outputPath}`);
      
      // Print summary
      if (result.document?.text) {
        console.log(`  Extracted ${result.document.text.length} characters of text`);
      }
    } catch (error) {
      console.error(`✗ Error processing ${pdfPath}:`, error.message);
    }
  }
}

main();
