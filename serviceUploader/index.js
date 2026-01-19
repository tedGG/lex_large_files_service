const express = require("express");

const app = express();
const port = process.env.PORT || 4000;

const salesforce = require("./salesforce");
const sharepoint = require("./sharepoint");

app.get("/wakeup", async (req, res) => {
  try {
    console.log('wakeup');
    res.send("Hello API");
  } catch (error) {
    console.error(error);
    console.error(error.message);
  }
});

// OLD ENDPOINT - Keep working as before
app.get("/salesforce", async (req, res) => {
  console.log('/salesforce');
  console.log('Success request!');
  const basicUrl = req.headers['basicurl'];
  const sharepointEndpoint = req.headers['sharepointendpoint'];
  const contVerId = req.headers['contverid'];
  console.log('OUTPUT : ',basicUrl);
  // const token = await sharepoint.getAccessToken();
  // console.log('token : ',token);
  const file = await salesforce.getFile(basicUrl, contVerId);
  console.log('file : ',file);
  // const result = await sharepoint.createFile(file, token, sharepointEndpoint);
  // console.log('result : ',result);
  res.send("salesforce");
});

// NEW ENDPOINT - Google Drive (loads googledrive.js only when called)
app.get("/salesforce-to-drive", async (req, res) => {
  try {
    console.log('=== Starting Salesforce to Google Drive transfer ===');
    
    // Load googledrive module only when this endpoint is called
    const googledrive = require("./googledrive");
    
    const basicUrl = req.headers['basicurl'];
    const fileName = req.headers['filename'];
    const folderId = req.headers['folderid'];
    const contVerId = req.headers['contverid'];
    
    if (!basicUrl || !contVerId || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required headers: basicurl, contverid, and filename are required'
      });
    }
    
    console.log('Parameters:');
    console.log('  - Salesforce URL:', basicUrl);
    console.log('  - Content Version ID:', contVerId);
    console.log('  - File Name:', fileName);
    console.log('  - Google Drive Folder ID:', folderId || 'Root folder');
    
    console.log('\n[Step 1] Getting Google Drive access token...');
    const token = await googledrive.getAccessToken();
    console.log('[Step 1] ✅ Token obtained');
    
    console.log('\n[Step 2] Downloading from Salesforce...');
    const file = await salesforce.getFile(basicUrl, contVerId);
    const fileSizeInMB = (file.length / (1024 * 1024)).toFixed(2);
    console.log(`[Step 2] ✅ Downloaded (${fileSizeInMB} MB)`);
    
    console.log('\n[Step 3] Uploading to Google Drive...');
    const result = await googledrive.uploadFile(file, token, fileName, folderId);
    console.log('[Step 3] ✅ Uploaded');
    
    console.log('\n=== Transfer completed ===\n');
    
    res.json({
      success: true,
      message: 'File successfully transferred from Salesforce to Google Drive',
      data: {
        googleDriveFileId: result.id,
        fileName: result.name,
        fileSizeMB: fileSizeInMB,
        salesforceContentVersionId: contVerId,
        googleDriveWebViewLink: `https://drive.google.com/file/d/${result.id}/view`
      }
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Error details:', error.response?.data || error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
});

app.listen(port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   📁 Salesforce to Google Drive Transfer Service          ║
║   🚀 Server running on port ${port}                           ║
║                                                            ║
║   Endpoints:                                               ║
║   GET  /wakeup              - Health check                 ║
║   GET  /salesforce          - Old SharePoint endpoint      ║
║   GET  /salesforce-to-drive - New Google Drive endpoint    ║
╚════════════════════════════════════════════════════════════╝
  `);
});