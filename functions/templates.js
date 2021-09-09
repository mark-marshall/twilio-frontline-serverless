const authPath = Runtime.getFunctions().auth.path;
const authenticate = require(authPath);

const customerPath = Runtime.getFunctions().customers.path;
const { getCustomerById } = require(customerPath);

const OPENER_NEXT_STEPS =
  'Hello {{Name}} we have now processed your documents and would like to move you on to the next step. Drop me a message. {{Author}}.';
const OPENER_NEW_PRODUCT =
  'Hello {{Name}} we have a new product out which may be of interest to your business. Drop me a message. {{Author}}.';
const OPENER_ON_MY_WAY =
  'Just to confirm I am on my way to your office. {{Name}}.';
const OPENER_BOILER_FOLLOWUP =
  'Hi {{Name}}, Im pleased to say that your boiler passed its service. Please let me know any other questions regarding the certificate or carrying out additional works.';

const REPLY_SENT = 'This has now been sent. {{Author}}.';
const REPLY_RATES =
  'Our rates for any loan are 20% or 30% over $30,000. You can read more at https://example.com. {{Author}}.';
const REPLY_OMW = 'Just to confirm I am on my way to your office. {{Author}}.';
const REPLY_OPTIONS =
  'Would you like me to go over some options with you {{Name}}? {{Author}}.';
const REPLY_ASK_DOCUMENTS =
  'We have a secure drop box for documents. Can you attach and upload them here: https://example.com. {{Author}}';

const CLOSING_ASK_REVIEW =
  'Happy to help, {{Name}}. If you have a moment could you leave a review about our interaction at this link: https://example.com. {{Author}}.';

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
    const handleGetTemplatesByCustomerIdCallback = async () => {
      const customerDetails = await getCustomerById(context, event.CustomerId);

      if (!customerDetails) {
        return res.status(404).send('Customer not found');
      }

      const compileTemplate = (template, customer) => {
        let compiledTemplate = template.replace(
          /{{Name}}/,
          customer.display_name
        );
        compiledTemplate = compiledTemplate.replace(
          /{{Author}}/,
          customer.worker
        );
        return compiledTemplate;
      };

      // Prepare templates categories
      const openersCategory = {
        display_name: 'Openers', // Category name
        templates: [
          { content: compileTemplate(OPENER_NEXT_STEPS, customerDetails) }, // Compiled template
          {
            content: compileTemplate(OPENER_NEW_PRODUCT, customerDetails),
            whatsAppApproved: true,
          },
          { content: compileTemplate(OPENER_ON_MY_WAY, customerDetails) },
          {
            content: compileTemplate(OPENER_BOILER_FOLLOWUP, customerDetails),
            whatsAppApproved: true,
          },
        ],
      };

      const repliesCategory = {
        display_name: 'Replies',
        templates: [
          { content: compileTemplate(REPLY_SENT, customerDetails) },
          { content: compileTemplate(REPLY_RATES, customerDetails) },
          { content: compileTemplate(REPLY_OMW, customerDetails) },
          { content: compileTemplate(REPLY_OPTIONS, customerDetails) },
          { content: compileTemplate(REPLY_ASK_DOCUMENTS, customerDetails) },
        ],
      };
      const closingCategory = {
        display_name: 'Closing',
        templates: [
          { content: compileTemplate(CLOSING_ASK_REVIEW, customerDetails) },
        ],
      };

      response.setBody([openersCategory, repliesCategory, closingCategory]);
      response.setStatusCode(200);
    };

    switch (event.location) {
      case 'GetTemplatesByCustomerId':
        await handleGetTemplatesByCustomerIdCallback();
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
