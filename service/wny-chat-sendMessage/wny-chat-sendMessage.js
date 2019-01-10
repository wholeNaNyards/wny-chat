const AWS = require("aws-sdk");

// Add ApiGatewayManagementApi to the AWS namespace
require("aws-sdk/clients/apigatewaymanagementapi");

const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

const { TABLE_NAME } = process.env;

exports.handler = async (event, context) => {
  let connectionData;

  try {
    connectionData = await ddb
      .scan({
        TableName: TABLE_NAME,
        ProjectionExpression: "connectionId"
      })
      .promise();
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: event.requestContext.domainName + "/" + event.requestContext.stage
  });

  const senderConnectionId = event.requestContext.connectionId;

  const postData = JSON.stringify({
    message: JSON.parse(event.body).data,
    senderConnectionId: senderConnectionId
  });

  const postCalls = connectionData.Items.map(async ({ connectionId }) => {
    try {
      await apigwManagementApi
        .postToConnection({ ConnectionId: connectionId, Data: postData })
        .promise();
    } catch (e) {
      if (e.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        await ddb
          .delete({
            TableName: TABLE_NAME,
            Key: { connectionId }
          })
          .promise();
      } else {
        throw e;
      }
    }
  });

  try {
    await Promise.all(postCalls);
  } catch (e) {
    return { statusCode: 500, body: e.stack };
  }

  return { statusCode: 200, body: "Data sent." };
};
