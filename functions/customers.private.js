const Airtable = require('airtable');

const fetchCRM = async (context) => {
  Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: context.AIRTABLE_AUTH_KEY,
  });
  try {
    const records = await Airtable.base(context.AIRTABLE_BASE)('CRM')
      .select({ view: 'Grid view' })
      .firstPage();
    const formattedRecords = records.map((c) => {
      const {
        customer_id,
        customer_display_name: display_name,
        customer_sms,
        customer_whatsapp,
        customer_email,
        customer_facebook,
        customer_avatar: avatar,
        worker_id: worker,
      } = c.fields;
      const channels = [
        {
          type: 'email',
          value: customer_email,
        },
        {
          type: 'sms',
          value: customer_sms,
        },
        {
          type: 'whatsapp',
          value: `whatsapp:${customer_whatsapp}`,
        },
      ];
      const links = [
        {
          type: 'Facebook',
          value: customer_facebook,
          display_name: 'Social Media Profile',
        },
      ];
      const record = {
        customer_id,
        display_name,
        channels,
        links,
        worker,
        avatar,
      };
      return record;
    });
    return formattedRecords;
  } catch (e) {
    console.error(e);
  }
};

const findWorkerForCustomer = async (context, customerNumber) => {
  const customer = await getCustomerByNumber(context, customerNumber);
  return customer.worker;
};

const findRandomWorker = async (context) => {
  const customers = await fetchCRM(context);
  return customers[Math.floor(Math.random() * workers.length)].worker;
};

const getCustomersList = async (context, worker, pageSize, anchor) => {
  const customers = await fetchCRM(context);
  const workerCustomers = customers.filter((c) => c.worker === worker);
  const list = workerCustomers.map((c) => ({
    display_name: c.display_name,
    customer_id: c.customer_id,
    avatar: c.avatar,
  }));

  if (!pageSize) {
    return list;
  }

  if (anchor) {
    const lastIndex = list.findIndex(
      (c) => String(c.customer_id) === String(anchor)
    );
    const nextIndex = lastIndex + 1;
    return list.slice(nextIndex, nextIndex + pageSize);
  } else {
    return list.slice(0, pageSize);
  }
};

const getCustomerByNumber = async (context, customerNumber) => {
  const customers = await fetchCRM(context);
  return customers.find((customer) =>
    customer.channels.find(
      (channel) => String(channel.value) === String(customerNumber)
    )
  );
};

const getCustomerById = async (context, customerId) => {
  const customers = await fetchCRM(context);
  return customers.find((c) => String(c.customer_id) === String(customerId));
};

module.exports = {
  fetchCRM,
  findWorkerForCustomer,
  findRandomWorker,
  getCustomersList,
  getCustomerByNumber,
  getCustomerById,
};
