const customerPath = Runtime.getFunctions().customers.path;
const { fetchCRM, getCustomerById, getCustomersList } = require(customerPath);

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
  const handleGetCustomersListCallback = async () => {
    const { Worker: worker, PageSize: pageSize, Anchor: anchor } = event;
    const customersList = await getCustomersList(
      context,
      worker,
      pageSize,
      anchor
    );
    // Respond with Customers object
    response.setBody({
      objects: {
        customers: customersList,
      },
    });
    response.setStatusCode(200);
  };

  const handleGetCustomerDetailsByCustomerIdCallback = async () => {
    const { CustomerId: customerId } = event;
    const customer = await getCustomerById(context, customerId);
    // Respond with Contact object
    response.setBody({
      objects: {
        customer,
      },
    });
    response.setStatusCode(200);
  };

  switch (event.Location) {
    case 'GetCustomersList':
      await handleGetCustomersListCallback();
      break;
    case 'GetCustomerDetailsByCustomerId':
      await handleGetCustomerDetailsByCustomerIdCallback();
      break;
    default:
      response.setBody({ message: 'Unknown App Location' });
      response.setStatusCode(422);
      break;
  }

  return callback(null, response);
};
