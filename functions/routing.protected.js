const customerPath = Runtime.getFunctions().customers.path;
const {
  findWorkerForCustomer,
  getCustomerByNumber,
  findRandomWorker,
} = require(customerPath);

exports.handler = async function (context, event, callback) {
  const twilioClient = context.getTwilioClient();

  const response = new Twilio.Response();
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  response.setHeaders(headers);

  const routeConversationToWorker = async (conversationSid, workerIdentity) => {
    // Add worker to the conversation with a customer
    await twilioClient.conversations
      .conversations(conversationSid)
      .participants.create({ identity: workerIdentity });
  };

  const routeConversation = async (conversationSid, customerNumber) => {
    let workerIdentity = await findWorkerForCustomer(context, customerNumber);
    if (!workerIdentity) {
      // Customer doesn't have a worker

      // Select a random worker
      workerIdentity = await findRandomWorker(context);

      // Or you can define default worker for unknown customers.
      // workerIdentity = 'john@example.com'

      if (!workerIdentity) {
        console.warn(
          'Routing failed, please add workers to customersToWorkersMap or define a default worker',
          { conversationSid: conversationSid }
        );
        return;
      }
    }

    await routeConversationToWorker(conversationSid, workerIdentity);
  };

  const {
    ConversationSid: conversationSid,
    'MessagingBinding.Address': customerNumber,
  } = event;
  await routeConversation(conversationSid, customerNumber);
  response.setStatusCode(200);

  return callback(null, response);
};
