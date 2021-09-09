const authPath = Runtime.getFunctions().auth.path;
const authenticate = require(authPath);

exports.handler = async function (context, event, callback) {
  const response = new Twilio.Response();
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  response.setHeaders(headers);

  const workerIdentity = await authenticate(event.Token, context);

  if (workerIdentity) {
    // Route handlers
    const getCustomerProxyAddress = (channelName) => {
      if (channelName === 'whatsapp') {
        return context.WHATSAPP_NUMBER;
      } else {
        return context.SMS_NUMBER;
      }
    };

    const handleGetProxyAddress = () => {
      const { CustomerId: customerId, Channel: channel } = event;
      const { type: channelName, value: channelAddress } = channel;

      const proxyAddress = getCustomerProxyAddress(channelName);

      // In order to start a new conversation ConversationsApp need a proxy address
      // otherwise the app doesn't know from which number send a message to a customer
      if (proxyAddress) {
        response.setBody({ proxy_address: proxyAddress });
        response.setStatusCode(200);
      } else {
        response.setBody({ message: 'Proxy address not found' });
        response.setStatusCode(403);
      }
      return;
    };
    switch (event.location) {
      case 'GetProxyAddress':
        handleGetProxyAddress();
        break;
      default:
        response.setBody({ message: 'Unknown App Location' });
        response.setStatusCode(422);
        break;
    }
  } else {
    response.setBody({ message: 'Unauthorised access' });
    response.setStatusCode(401);
  }

  return callback(null, response);
};
