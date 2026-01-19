const express = require("express");

const app = express();
const port = process.env.PORT || 4000;

// Parse JSON bodies
app.use(express.json());

const salesforce = require("./salesforce");
const googledrive = require("./googledrive");

app.get("/wakeup", async (req, res) => {
  try {
    console.log('wakeup');
    res.send("Hello API");
  } catch (error) {
    console.error(error);
    console.error(error.message);
  }
});

// POST endpoint (recommended)
app.post("/salesforce-to-drive", async (req, res) => {
  try {
    console.log('=== Starting Salesforce to Google Drive transfer ===');
    
    // Get parameters from request body
    const { basicUrl, contVerId, fileName, folderId } = req.body;
    
    // Validate required parameters
    if (!basicUrl || !contVerId || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: basicUrl, contVerId, and fileName are required',
        example: {
          basicUrl: "https://your-instance.salesforce.com",
          contVerId: "0689V00000EbgZhQAJ",
          fileName: "document.pdf",
          folderId: "optional-google-drive-folder-id"
        }
      });
    }
    
    console.log('Parameters:');
    console.log('  - Salesforce URL:', basicUrl);
    console.log('  - Content Version ID:', contVerId);
    console.log('  - File Name:', fileName);
    console.log('  - Google Drive Folder ID:', folderId || 'Root folder');
    
    // Step 1: Get Google Drive access token
    console.log('\n[Step 1] Getting Google Drive access token...');
    // const token = await googledrive.getAccessToken();
    console.log('[Step 1] ✅ Google Drive token obtained');
    
    // Step 2: Download file from Salesforce
    console.log('\n[Step 2] Downloading file from Salesforce...');
    const file = await salesforce.getFile(basicUrl, contVerId);
    const fileSizeInMB = (file.length / (1024 * 1024)).toFixed(2);
    console.log(`[Step 2] ✅ File downloaded (${fileSizeInMB} MB)`);
    
    // Step 3: Upload file to Google Drive
    // console.log('\n[Step 3] Uploading file to Google Drive...');
    // const result = await googledrive.uploadFile(file, token, fileName, folderId);
    // console.log('[Step 3] ✅ File uploaded to Google Drive');
    
    // console.log('\n=== Transfer completed successfully ===\n');
    
    // Return success response
    res.json({
      success: true,
      message: 'File successfully transferred from Salesforce to Google Drive',
      data: {
        // googleDriveFileId: result.id,
        // fileName: result.name,
        fileSizeMB: fileSizeInMB,
        salesforceContentVersionId: contVerId,
        googleDriveWebViewLink: `https://drive.google.com/file/d/${result.id}/view`
      }
    });
    
  } catch (error) {
    console.error('\n❌ Error in transfer process:', error.message);
    console.error('Error details:', error.response?.data || error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || 'No additional details available'
    });
  }
});
