const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const axios = require('axios');

async function runQuery() {
  // Read the JSON key file
  const jsonKeyFilePath = 'split-and-ga4-5a6eb1cc47f0.json';
  const jsonKeyFile = fs.readFileSync(jsonKeyFilePath, 'utf8');
  const credentials = JSON.parse(jsonKeyFile);

  // Create a client using the credentials object
  const bigqueryClient = new BigQuery({
    projectId: credentials.project_id,
    credentials: credentials,
  });

  // Set your dataset ID
  const datasetId = 'analytics_369415822';

  // Define your SQL query
  const table = '\`split-and-ga4.analytics_369415822.events_intraday_20230421\`';

  const sqlQuery = `
  select 
    ep.key as eventTypeId,
    ep.value.string_value as title,
    event_timestamp as ts,
    user_id as trafficKey,
    device.category as deviceCategory,
    device.mobile_brand_name as mobileBrandName,
    device.mobile_model_name as mobileModelName,
    device.operating_system as os,
    device.operating_system_version as osVersion,
    geo.continent as geoContinent,
    geo.country as geoCountry,
    geo.region as geoRegion,
    geo.city as geoCity,
    geo.sub_continent as geoSubcontinent,
    geo.metro as metro
  from ${table},
  unnest(event_params) as ep
  where user_id is not NULL`;
  
  console.log(sqlQuery);

  // Run the query as a job
  const [job] = await bigqueryClient.createQueryJob({
    query: sqlQuery
  });

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  // rows.forEach(row => console.log(row));
  rows.forEach(async row => {
    console.log(row);

    const props = {
      'event_params.value.string_value': row.title ? row.title : '',
      'device.category': row.deviceCategory,
      'device.mobile_brand_name': row.mobileBrandName,
      'device.mobile_model_name': row.mobileModelName,
      'device.operating_system': row.os,
      'device.operating_system_version': row.osVersion,
      'geo.continent': row.geoContinent,
      'geo.country': row.geoCountry,
      'geo.region': row.geoRegion,
      'geo.city': row.geoCity,
      'geo.sub_continent': row.geoSubcontinent,
      'geo.metro': row.metro
    }

    let data = [{
      eventTypeId: row.eventTypeId,
      trafficTypeName: 'user', // should this be more flexible?
      key: row.trafficKey,
      timestamp: row.ts / 1000,
      properties: props,
      source: 'BigQuery'
    }];

    const splitApiKey = fs.readFileSync('SPLIT_API_KEY', 'utf8').trim();
    console.log(data);
    await axios.post('https://events.split.io/api/events/bulk', data, 
      { headers: {'Authorization': 'Bearer ' + splitApiKey }}) 
    .then(function (response) {
        console.log(response.status);
    })
    .catch(function (error) {
        console.log(error);
    })
  });
}

runQuery().catch(console.error.response);
