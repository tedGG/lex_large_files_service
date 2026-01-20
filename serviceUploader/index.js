const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;

const salesforce = require("./salesforce");
const sharepoint = require("./sharepoint");

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `https://lexington-large-files-upload-1.onrender.com/oauth2callback`;

// Scopes - adjust based on what you need
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

app.get("/wakeup", async (req, res) => {
  try {
    console.log('wakeup');
    res.send("Hello API");
  } catch (error) {
    console.error(error);
    console.error(error.message);
  }
});

// Google Auth Routes
app.get('/auth', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).send(`
      <html>
        <body>
          <h1>❌ Configuration Error</h1>
          <p>GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables.</p>
          <p>Please configure them in your Render dashboard.</p>
        </body>
      </html>
    `);
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  console.log('Authorization URL generated:', authUrl);
  res.redirect(authUrl);
});

app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send(`
      <html>
        <body>
          <h1>❌ Error</h1>
          <p>No authorization code received</p>
        </body>
      </html>
    `);
  }

  try {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', GOOGLE_CLIENT_ID);
    params.append('client_secret', GOOGLE_CLIENT_SECRET);
    params.append('redirect_uri', GOOGLE_REDIRECT_URI);
    params.append('grant_type', 'authorization_code');

    const response = await axios.post(tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, refresh_token, expires_in, token_type } = response.data;

    console.log('\n=================================');
    console.log('✅ SUCCESS! Tokens received:');
    console.log('=================================');
    console.log('Access Token:', access_token);
    console.log('\nRefresh Token:', refresh_token);
    console.log('\nExpires in:', expires_in, 'seconds');
    console.log('Token Type:', token_type);
    console.log('=================================\n');
    console.log('⚠️  IMPORTANT: Save the refresh_token to your environment variables!');
    console.log(`GOOGLE_REFRESH_TOKEN=${refresh_token}`);
    console.log('=================================\n');

    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
            }
            .success {
              background: #d4edda;
              border: 1px solid #c3e6cb;
              color: #155724;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .token-box {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              padding: 15px;
              border-radius: 5px;
              word-break: break-all;
              font-family: monospace;
              margin: 10px 0;
            }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffeeba;
              color: #856404;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
            }
            h1 { color: #155724; }
            h2 { color: #333; }
            code {
              background: #e9ecef;
              padding: 2px 6px;
              border-radius: 3px;
            }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>✅ Authorization Successful!</h1>
          </div>
          
          <h2>Your Refresh Token:</h2>
          <div class="token-box">
            ${refresh_token}
          </div>
          
          <h2>Add to Render Environment Variables:</h2>
          <div class="token-box">
GOOGLE_REFRESH_TOKEN=${refresh_token}
          </div>
          
          <div class="warning">
            <h3>⚠️ Important Steps:</h3>
            <ol>
              <li>Go to your Render dashboard</li>
              <li>Navigate to your service settings</li>
              <li>Go to "Environment" tab</li>
              <li>Add new environment variable:
                <ul>
                  <li>Key: <code>GOOGLE_REFRESH_TOKEN</code></li>
                  <li>Value: <code>${refresh_token}</code></li>
                </ul>
              </li>
              <li>Save and redeploy your service</li>
            </ol>
            <p><strong>Security Note:</strong> Never commit this token to Git! Keep it only in environment variables.</p>
          </div>
          
          <p>The token has also been logged to the server console.</p>
          <p>You can close this window now.</p>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Error getting tokens:', error.response?.data || error.message);
    res.status(500).send(`
      <html>
        <body>
          <h1>❌ Error Getting Tokens</h1>
          <p>An error occurred while exchanging the authorization code for tokens.</p>
          <p>Error: ${error.message}</p>
          <p>Check server logs for more details.</p>
        </body>
      </html>
    `);
  }
});

app.get("/salesforce", async (req, res) => {
  console.log('/salesforce');
  const basicUrl = req.headers['basicurl'];
  const sharepointEndpoint = req.headers['sharepointendpoint'];
  const contVerId = req.headers['contverid'];
  console.log('OUTPUT : ', basicUrl);
  
  try {
    const token = await sharepoint.getAccessToken();
    console.log('token : ', token);
    
    const file = await salesforce.getFile(basicUrl, contVerId);
    console.log('file : ', file);
    
    const result = await sharepoint.createFile(file, token, sharepointEndpoint);
    console.log('result : ', result);
    
    res.send("salesforce");
  } catch (error) {
    console.error('Error in /salesforce route:', error);
    res.status(500).send('Error processing request: ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`\n🚀 Server running on port ${port}`);
  console.log(`\n📝 To get your Google refresh token:`);
  console.log(`   Visit: https://lexington-large-files-upload-1.onrender.com/auth`);
  console.log(`\n📋 Available routes:`);
  console.log(`   GET /wakeup - Health check`);
  console.log(`   GET /auth - Start Google OAuth flow`);
  console.log(`   GET /oauth2callback - OAuth callback (automatic)`);
  console.log(`   GET /salesforce - Process Salesforce file upload`);
  console.log('');
});