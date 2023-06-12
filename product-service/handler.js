const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

module.exports.getProductsList = async (event) => {
  try {
    // Define the DynamoDB scan parameters for the products table
    const productsParams = {
      TableName: 'products',
    };

    // Retrieve the list of products from the products table
    const productsResult = await dynamodb.scan(productsParams).promise();
    const products = productsResult.Items;

    // Define the DynamoDB scan parameters for the stocks table
    const stocksParams = {
      TableName: 'stocks',
    };

    // Retrieve the list of stocks from the stocks table
    const stocksResult = await dynamodb.scan(stocksParams).promise();
    const stocks = stocksResult.Items;

    // Combine the product and stock information
    const productsWithStock = products.map((product) => {
      const stock = stocks.find((item) => item.product_id === product.id);
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        count: stock ? stock.count : 0,
      };
    });

    // Return the list of products with stock information as the response
    return {
      statusCode: 200,
      body: JSON.stringify(productsWithStock),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

module.exports.getProductById = async (event) => {
  try {
    // Retrieve the productId from the path parameters
    const productId = event.pathParameters.productId;

    // Define the DynamoDB query parameters for retrieving the product
    const productParams = {
      TableName: 'products',
      Key: { id: productId },
    };

    // Retrieve the product from the database
    const productResult = await dynamodb.get(productParams).promise();
    console.log(productResult);

    // Return 404 if the product doesn't exist
    if (!productResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    // Define the DynamoDB query parameters for retrieving the stock
    const stockParams = {
      TableName: 'stocks',
      Key: { product_id: productId },
    };



    // Retrieve the stock from the database
    const stockResult = await dynamodb.get(stockParams).promise();

    console.log(stockResult);

    // Create an object to hold the product with stock information
    const productWithStock = {
      id: productResult.Item.id,
      title: productResult.Item.title,
      description: productResult.Item.description,
      price: productResult.Item.price,
      count: stockResult.Item ? stockResult.Item.count : 0,
    };

    // Return the product with stock information as the response
    return {
      statusCode: 200,
      body: JSON.stringify(productWithStock),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

exports.createProduct = async (event, context) => {
  try {
    const { title, description, price } = JSON.parse(event.body);

    const id = uuidv4(); // Generate a UUID

    const params = {
      TableName: 'products',
      Item: {
        id,
        title,
        description,
        price,
      },
    };

    await dynamodb.put(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Product created successfully', id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create product' }),
    };
  }
};


