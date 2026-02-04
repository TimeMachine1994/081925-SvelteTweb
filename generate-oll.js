const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function generateOLL() {
  const pdfPath = 'TimelineCreator/pdfs/A. Records Paradise Palms Chiropractic.pdf';
  const filename = 'A. Records Paradise Palms Chiropractic.pdf';
  const volumeLabel = '00 Ps\' Trial Exhibits';
  
  // Starting Document ID and Image ID (you can adjust this)
  const startingDocId = '0001';  // First exhibit number for this document
  const startingImageId = 1;     // Starting Bates number
  
  // Read PDF to get page count
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  
  console.log(`PDF has ${pageCount} pages`);
  
  // Generate OLL lines
  const lines = [];
  
  for (let page = 1; page <= pageCount; page++) {
    const docId = startingDocId;
    const imageId = String(startingImageId + page - 1).padStart(4, '0');
    const pageSeq = String(page);
    
    // Format: "2","DocID","ImageID","PageSeq","","","VolumeLabel","Filename",""
    const line = `"2","${docId}","${imageId}","${pageSeq}","","","${volumeLabel}","${filename}",""`;
    lines.push(line);
  }
  
  // Write OLL file
  const ollContent = lines.join('\n');
  const ollPath = 'TimelineCreator/pdfs/A. Records Paradise Palms Chiropractic.oll';
  fs.writeFileSync(ollPath, ollContent);
  
  console.log(`\nGenerated OLL file: ${ollPath}`);
  console.log(`Total lines: ${lines.length}`);
  console.log('\nFirst 5 lines:');
  lines.slice(0, 5).forEach(l => console.log(l));
  console.log('\nLast 5 lines:');
  lines.slice(-5).forEach(l => console.log(l));
}

generateOLL().catch(console.error);
