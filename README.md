# GA4 to Split - node.js

WARNING!  This is an unfinished project!!!!

This is an unfinished, but working integration of GA4 event traffic to Split events.

## To install 

Clone the repository and run 'npm install' to download dependencies.

 - Customer should use GA4 (gtag) in HTML/JS or similar
 - Verify that you can see the event traffic in Google
 - Link BigQuery to your GA project

Choose "transactionally" over daily for best results.

 - Run a sample query in BigQuery console

```
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
  where user_id is not NULL
```

Where table should look like this (note the intraday timestamp):  

```
  const table = '\`split-and-ga4.analytics_369415822.events_intraday_20230420\`';
```

If you get back good looking results, you are ready for the next step.

 - Manually edit the right table name into index.js
 - Create a SPLIT_API_KEY file and copy-and-paste your key, with no spaces or new lines, into your file
 - Create a new Service Account in Google and download a JSON key.
 - Give the Service Account permissions to your dataset (use the client_email from your JSON key).
 - Edit the datasetId in the index.js to reflect your dataset

```
node index.js
```

## What next?

The script is unfinished.  It needs to discover the table by date automatically. 

Also, the events should be batched to Split.  Right now they're sent individually.
 
