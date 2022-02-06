const crypto = require("crypto");
const axios = require("axios").default;
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

exports.handler = async function (event, context) {
  accessToken = event.body;
  parts = accessToken.split(".");

  header = parts[0];
  payload = parts[1];
  signature = parts[2];

  const hash = crypto
    .createHmac("sha256", process.env.SUPA_JWT_SECRET)
    .update(header + "." + payload)
    .digest("base64url");

  if (hash !== signature) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: "jwt signature verification failed" }),
    };
  }

  const stripeID = await getStripeIDFromSupabase(accessToken);

  console.log("this is the stripe id", stripeID);
  //   const link = await getStripeSessionLink(stripeID);

  //   console.log("this is the link that came back", link);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: event.body }),
  };
};

const getStripeIDFromSupabase = async function (accessToken) {
  axios
    .get("https://uavpsmlmcsfcplfxuubi.supabase.co/rest/v1/stripe_customers", {
      headers: {
        apikey: process.env.SUPA_ANON_KEY,
        Authorization: "Bearer " + accessToken,
      },
    })
    .then((response) => {
      console.warn("this is the axios response", response);
    })
    .catch((error) => {
      console.error("so axios errored: ", error);
    });
};

const getStripeSessionLink = async function (stripeID) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeID,
    return_url: "https://jovial-borg-90bf04.netlify.app/",
  });

  return session.url;
};
