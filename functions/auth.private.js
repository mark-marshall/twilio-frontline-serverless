const axios = require('axios');

const authenticate = async (token, context) => {
  const validateToken = async (token) => {
    const response = await axios.post(
      `https://iam.twilio.com/v2/Tokens/validate/${context.SSO_REALM_SID}`,
      {
        token,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        auth: {
          username: context.ACCOUNT_SID,
          password: context.AUTH_TOKEN,
        },
      }
    );
    return { identity: response.data.realm_user_id };
  };

  if (token) {
    try {
      const tokenInfo = await validateToken(token);
      if (tokenInfo.identity) {
        return tokenInfo.identity;
      }
    } catch (err) {
      return null;
    }
  }
};

module.exports = authenticate;
