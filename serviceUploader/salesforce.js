require('dotenv').config();
const axios = require('axios');


class SalesforceConnection {

  async getToken(basicUrl){
    const url = basicUrl + '/services/oauth2/token';
    //const url = 'https://nosoftware-computing-6653--qa.sandbox.my.salesforce.com/services/oauth2/token';
 console.log('getToken 1111111', url);
 console.log('getToken 1111111', process.env.CLIENT_ID_SF);
 console.log('getToken 1111111', process.env.CLIENT_SECRET_SF);
 
 const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials'); 
    params.append('client_id', process.env.CLIENT_ID_SF);
    params.append('client_secret', process.env.CLIENT_SECRET_SF);
    
    const response = await axios.post(url, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
console.log('getToken 22222');
    console.log('Access Token:', response.data.access_token);
    return response.data.access_token;
  }

  async getFile(basicUrl, contVerId) {
    
    console.log(basicUrl);
    const accessToken = await this.getToken(basicUrl);
    //const idd = '0689V00000EbgZhQAJ';
   
    const url = `${basicUrl}/services/data/v58.0/sobjects/ContentVersion/${contVerId}/VersionData`
    console.log(url);
    console.log(basicUrl);
    console.log(contVerId);
    
    const response = await axios.get(url, {
        responseType: 'arraybuffer', 
        headers: {
          Authorization:`Bearer ${accessToken}`
        }
      }
    );
    const body = response.data;
    
    console.log('Downloaded bytes:', response);
    return body;
  }

}

module.exports = new SalesforceConnection();