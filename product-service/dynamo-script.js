const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' }); // Replace 'your_region' with the appropriate AWS region

async function populateTables() {
  try {
    const products = [
      {
        id: '1',
        title: 'Product 1',
        description: 'Description for Product 1',
        price: 10
      },
      {
        id: '2',
        title: 'Product 2',
        description: 'Description for Product 2',
        price: 20
      },
      // Add more products as needed
    ];

    for (const product of products) {
      const params = {
        TableName: 'products',
        Item: marshall(product)
      };

      await client.send(new PutItemCommand(params));
    }

    const stocks = [
      {
        product_id: '1',
        count: 100
      },
      {
        product_id: '2',
        count: 50
      },
      // Add more stocks as needed
    ];

    for (const stock of stocks) {
      const params = {
        TableName: 'stocks',
        Item: marshall(stock)
      };

      await client.send(new PutItemCommand(params));
    }

    console.log('Data population completed.');
  } catch (error) {
    console.error('Error populating data:', error);
  }
}

populateTables();
