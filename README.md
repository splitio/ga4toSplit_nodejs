# GA4 to Split - node.js

Using gtag in your pages?  Want to publish your GA4 event traffic to Split for use in experimentation?  Look no further!

GA can link to BigQuery tables natively.  Set up a transactional table for your gtag traffic, then let a Split lambda query the tables and load them into Split as events.  Once setup, you can forget it's there and just benefit from the flow of useful information into Split.

## To install 

Clone the repository and run 'npm install' to download dependencies.

 - Customer should use GA4 (gtag) in HTML/JS or similar
 - Verify that you can see the event traffic in Google
 - Link BigQuery to your GA project (follow Google's intstructions).

Choose "transactionally" instead of daily. The integration querys intraday events.

 - Create a SPLIT_API_KEY file and copy-and-paste your key, with no spaces or new lines, into your file
 - Create a new Service Account in Google and download a JSON key.
 - Call the JSON "service_account.json".  It should be in the same top-level directory as the SPLIT_API_KEY
 - Give the Service Account permissions to your dataset (use the client_email from your JSON key).

 - In AWS, create a new lambda.  Change the default configuration to a 5 minute timeout instead of 3 second default.
 - Zip and upload the code and keys to AWS

From the top-level directory you cloned,
```bash
zip -r split.zip *
```

The zip should include the node_modules subdirectory.

Use the "Upload from" button of your AWS Lambda to upload the ZIP file.

 - The lambda takes one parameter:
```json
{
  "datasetId": "split-and-ga4.analytics_369415822"
}
```

Or whatever is appropriate to your dataset.  The integration knows what tables to query using this configuration information.

 - Run your lambda using the test input params. Verify that it is finding events and posting them to Split.

The integration reads events in batches of two hundred, so will page through larger event results.  This also allows the integration to batch uploads of the events to Split.

 - Use EventBridge Rules to schedule the lambda.

EventBridge supports an easy-to-pick-up CRON syntax for scheduling runs.  I run mine every five minutes: 0,5,10,...55 et cetera.

Don't forget to put the datasetId parameter into the execution!  Use JSON just like what is shown above.

## What next?
 
## Questions?

david.martin@split.io
