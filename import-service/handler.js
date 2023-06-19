const AWS = require('aws-sdk');

const s3 = new AWS.S3();

module.exports.importProductsFile = async (event) => {
  const { name } = event.queryStringParameters;

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
