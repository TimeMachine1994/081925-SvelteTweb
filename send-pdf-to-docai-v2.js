const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

// Configuration
const PROCESSOR_ENDPOINT = 'https://us-documentai.googleapis.com/v1/projects/784366500656/locations/us/processors/d80ff2927d42863f:process';
const MAX_PAGES_PER_REQUEST = 15;

async function getAccessToken() {
  const gcloudPath = path.join(process.env.LOCALAPPDATA, 'Google', 'Cloud SDK', 'google-cloud-sdk', 'bin', 'gcloud.cmd');
  try {
    const token = execSync(`"${gcloudPath}" auth application-default print-access-token`, { encoding: 'utf-8' }).trim();
    return token;
  } catch (error) {
    console.error('Error getting access token. Run: gcloud auth application-default login');
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

async function processChunk(base64Content, accessToken, retries = 3) {
  const requestBody = {
    skipHumanReview: true,
    rawDocument: {
      mimeType: 'application/pdf',
      content: base64Content
    }
  };
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(PROCESSOR_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    if (response.status === 429 && attempt < retries) {
      const waitTime = attempt * 30000; // 30s, 60s, 90s
      console.log(`    Rate limited, waiting ${waitTime/1000}s before retry ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }
}

async function processPDF(pdfPath) {
  console.log(`\nProcessing: ${pdfPath}`);
  
  const pdfBuffer = fs.readFileSync(pdfPath);
  const chunks = await splitPDF(pdfBuffer);
  const accessToken = await getAccessToken();
  
  const allResults = [];
  let combinedText = '';
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`  Processing chunk ${i + 1}/${chunks.length} (pages ${chunk.startPage}-${chunk.endPage})...`);
    
    try {
      const base64Content = chunk.buffer.toString('base64');
      const result = await processChunk(base64Content, accessToken);
      
      allResults.push({
        pages: `${chunk.startPage}-${chunk.endPage}`,
        result: result
      });
      
      if (result.document?.text) {
        combinedText += result.document.text + '\n\n';
        console.log(`    ✓ Extracted ${result.document.text.length} characters`);
      }
      
      // Longer delay to avoid rate limiting (10 seconds between chunks)
      if (i < chunks.length - 1) {
        console.log(`    Waiting 10s before next chunk...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    } catch (error) {
      console.error(`    ✗ Error on chunk ${i + 1}:`, error.message);
      allResults.push({
        pages: `${chunk.startPage}-${chunk.endPage}`,
        error: error.message
      });
    }
  }
  
  return {
    totalChunks: chunks.length,
    combinedText: combinedText,
    chunkResults: allResults
  };
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node send-pdf-to-docai-v2.js <pdf1> [pdf2] ...');
    console.log('Example: node send-pdf-to-docai-v2.js document.pdf');
    process.exit(1);
  }
  
  for (const pdfPath of args) {
    const fullPath = path.resolve(pdfPath);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      continue;
    }
    
    try {
      const result = await processPDF(fullPath);
      
      // Save combined JSON response
      const outputPath = fullPath.replace('.pdf', '-response.json');
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`\n✓ Saved response to: ${outputPath}`);
      console.log(`  Total text extracted: ${result.combinedText.length} characters`);
      
      // Also save just the combined text
      const textPath = fullPath.replace('.pdf', '-extracted.txt');
      fs.writeFileSync(textPath, result.combinedText);
      console.log(`✓ Saved extracted text to: ${textPath}`);
      
    } catch (error) {
      console.error(`✗ Error processing ${pdfPath}:`, error.message);
    }
  }
}

main();
