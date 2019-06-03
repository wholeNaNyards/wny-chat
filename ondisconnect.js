import AWS from "aws-sdk";

AWS.config.update({ region: process.env.AWS_REGION });
var DDB = new AWS.DynamoDB({ apiVersion: "2012-10-08" });

export function main(event, context, callback) {
  var deleteParams = {
    TableName: process.env.tableName,
    Key: {
      connectionId: { S: event.requestContext.connectionId }
    }
  };

  DDB.deleteItem(deleteParams, function(err) {
    callback(null, {
      statusCode: err ? 500 : 200,
      body: err
        ? "Failed to disconnect: " + JSON.stringify(err)
        : "Disconnected."
    });
  });
}
