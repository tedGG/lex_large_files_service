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

app.get("/salesforce", async (req, res) => {
  console.log('/salesforce');
  const basicUrl = req.headers['basicurl'];
  const sharepointEndpoint = req.headers['sharepointendpoint'];
  const contVerId = req.headers['contverid'];
  console.log('OUTPUT : ',basicUrl);
  const token = await sharepoint.getAccessToken();
 console.log('token : ',token);
  const file = await salesforce.getFile(basicUrl, contVerId);
console.log('file : ',file);
  const result = await sharepoint.createFile(file, token, sharepointEndpoint);
console.log('result : ',result);
  res.send("salesforce");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});