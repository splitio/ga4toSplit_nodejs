import { BigQuery } from '@google-cloud/bigquery';
import fs from 'fs';
import axios from 'axios';

export const handler = async(event) => {
  // console.log('event', event);

  // Read the JSON key file
  const jsonKeyFilePath = 'service_account.json';
  const jsonKeyFile = fs.readFileSync(jsonKeyFilePath, 'utf8');
  const credentials = JSON.parse(jsonKeyFile);

  // Create a client using the credentials object
  const bigqueryClient = new BigQuery({
    projectId: credentials.project_id,
    credentials: credentials,
  });

  const datasetId = event.datasetId;
  console.log('datasetId', datasetId);

  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  const today = `${year}${month}${day}`;  
  console.log('today', today);

  // Define your SQL query
  const table = `${datasetId}.events_intraday_` + today;

  let offset = 0;
  const limit = 200;
  let rowsFound = 0;
  let totalCount = 0;
  do {
    const minutes = 1;
    const lastNminutes = getTimestampMicroseconds(10);

    let sqlQuery = `
    select 
      event_name as eventTypeId,
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
    from \`${table}\`,
    unnest(event_params) as ep
    where user_id is not NULL
    AND event_timestamp > ${lastNminutes}
    ORDER BY ts DESC
    LIMIT ${limit}
    OFFSET ${offset}`

    offset += limit; // for next pass
    
    console.log(sqlQuery);

    // Run the query as a job
    const [job] = await bigqueryClient.createQueryJob({
      query: sqlQuery
    });

    // Wait for the query to finish
    const [rows] = await job.getQueryResults();
    console.log('found ' + rows.length + ' events for export to Split.');    
    rowsFound = rows.length;
    if(rowsFound > 0) {
      let data = [];
      rows.forEach(async row => {
        // console.log(row);

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

        data.push({
          eventTypeId: row.eventTypeId,
          trafficTypeName: 'user', // should this be more flexible?
          key: row.trafficKey,
          timestamp: row.ts / 1000,
          properties: props,
          source: 'BigQuery'
        });
      });

      const splitApiKey = fs.readFileSync('SPLIT_API_KEY', 'utf8').trim();
      // console.log(data);
      await axios.post('https://events.split.io/api/events/bulk', data, 
        { headers: {'Authorization': 'Bearer ' + splitApiKey }}) 
      .then(function (response) {
          // console.log(response.status);
      })
      .catch(function (error) {
          console.log(error);
      })
      .finally(() => {
        console.log('posted ' + data.length + ' events to Split');
        totalCount += data.length;
      });
    }
  } while (rowsFound >= limit);

  const response = {
      statusCode: 200,
      body: JSON.stringify('finished export of ' + totalCount + ' events to Split'),
  };

  return response;
}

const getTimestampMicroseconds = (minutesAgo) => {
  const millisecondsAgo = minutesAgo * 60 * 1000;
  const timestampMilliseconds = Date.now() - millisecondsAgo;
  const timestampMicroseconds = timestampMilliseconds * 1000;

  return timestampMicroseconds;
};
