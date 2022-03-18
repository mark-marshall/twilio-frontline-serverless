exports.handler = async function (context, event, callback) {
  const response = new Twilio.Response();
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  response.setHeaders(headers);

  // Route handlers
  const getCustomerProxyAddress = (channelType) => {
    if (channelType === 'whatsapp') {
      return context.WHATSAPP_NUMBER;
    } else {
      return context.SMS_NUMBER;
    }
  };

  const handleGetProxyAddress = () => {
    console.log(event);

    const { CustomerId: customerId, ChannelType: channelType } = event;

    const proxyAddress = getCustomerProxyAddress(channelType);

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
  switch (event.Location) {
    case 'GetProxyAddress':
      handleGetProxyAddress();
      break;
    default:
      response.setBody({ message: 'Unknown App Location' });
      response.setStatusCode(422);
      break;
  }

  return callback(null, response);
};
