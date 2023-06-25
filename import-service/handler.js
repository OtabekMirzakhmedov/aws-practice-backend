const AWS = require('aws-sdk');
const csv = require('csv-parser');

const s3 = new AWS.S3();
const SQS = new AWS.SQS();

module.exports.importProductsFile = async (event) => {
  const { name } = event.queryStringParameters;

  if (!name) {
    return {
      statusCode: 400,
      body: 'Missing query parameter: name',
    };
  }

  try {
    // Generate a pre-signed URL for the S3 bucket with the provided key
    const params = {
      Bucket: 'uploaded-rsschool',
      Key: `uploaded/${name}`,
      Expires: 3600, // URL expires in 1 hour
      ContentType: 'text/csv', // Modify the content type if needed
    };

    const signedUrl = await s3.getSignedUrlPromise('putObject', params);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Enable CORS if needed
      },
      body: signedUrl,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*', // Enable CORS if needed
      },
      body: JSON.stringify({ error: 'Failed to generate signed URL.' }),
    };
  }
};



module.exports.importFileParser = async (event) => {
  try {
    // Iterate through each record in the event
    for (const record of event.Records) {
      // Retrieve the bucket and key information
      const bucketName = record.s3.bucket.name;
      const key = record.s3.object.key;

      // Skip the event if it's not from the 'uploaded' folder
      if (!key.startsWith('uploaded/')) {
        continue;
      }

      // Create a readable stream to read the file from S3
      const s3Stream = s3.getObject({ Bucket: bucketName, Key: key }).createReadStream();

      // Parse the CSV file using csv-parser
      s3Stream.pipe(csv())
        .on('data', async (data) => {
          // Send each record to SQS
          try {
            const params = {
              QueueUrl: 'https://sqs.us-east-1.amazonaws.com/427059129602/catologItemsQueue', // Replace with your SQS queue URL
              MessageBody: JSON.stringify(data),
            };
            await SQS.sendMessage(params).promise();
          } catch (error) {
            console.error('Failed to send message to SQS:', error);
          }
        })
        .on('end', () => {
          console.log('CSV parsing finished.');
        });
    }

    return {
      statusCode: 200,
      body: 'CSV parsing initiated.',
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: 'Internal Server Error',
    };
  }
};


