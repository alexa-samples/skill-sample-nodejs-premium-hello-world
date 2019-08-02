const Alexa = require('ask-sdk');

const {
  isEntitled,
  isPurchasable,
  makeUpsell,
  getAllEntitledProducts,
  getAllPurchasableProducts,
  makeBuyOffer,
  SaveAttributesResponseInterceptor,
  LoadAttributesRequestInterceptor,
  getBuyResponseText,
  getResponseBasedOnAccessType,
  getSpeakableListOfProducts,
  getRandomYesNoQuestion,
  getPremiumOrRandomGoodbye,
  getGoodbyesCount,
  skillName} = require("./utils");

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    console.log('Handler: LaunchRequestHandler');
    const speechText = `Welcome to ${skillName}, you can say hello! How can I help?`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(skillName, speechText)
      .getResponse();
  }
};

const GetAnotherHelloHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'SimpleHelloIntent'));
  },
  handle(handlerInput) {
    console.log('Handler: GetAnotherHelloHandler');
    const {locale} = handlerInput.requestEnvelope.request;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const preSpeechText = '';

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Use the helper function getResponseBasedOnAccessType to determine the response based on the products the customer has purchased
      return getResponseBasedOnAccessType(handlerInput, res, preSpeechText);
    });
  }
};

// Respond to the utterance "what can I buy"
const AvailableProductsIntentHandler = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AvailableProductsIntent');
  },
  async handle(handlerInput) {
    console.log('Handler: AvailableProductsIntentHandler');
    // Get the list of products available for in-skill purchase
    const {locale} = handlerInput.requestEnvelope.request;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    // res contains the list of all ISP products for this skill.
    const res = await monetizationClient.getInSkillProducts(locale);
    // We now need to filter this to find the ISP products that are available for purchase
    const purchasableProducts = getAllPurchasableProducts(res.inSkillProducts);
    // Say the list of products
    let speechText, repromptOutput;
    if (purchasableProducts.length > 0) {
      // One or more products are available for purchase. say the list of products
      speechText = `Products available for purchase at this time are ${getSpeakableListOfProducts(purchasableProducts)}. 
                    To learn more about a product, say 'Tell me more about' followed by the product name. 
                    If you are ready to buy, say, 'Buy' followed by the product name. So what can I help you with?`;
      repromptOutput = 'I didn\'t catch that. What can I help you with?';
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptOutput)
        .getResponse();
    }
    console.log(5);
    // no products are available for purchase. Ask if they would like to hear another greeting
    speechText = 'There are no products to offer to you right now. Sorry about that. Would you like a greeting instead?';
    repromptOutput = 'I didn\'t catch that. What can I help you with?';
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptOutput)
      .getResponse();
  }
};

const DescribeProductIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'DescribeProductIntent';
  },
  handle(handlerInput) {
    console.log('Handler: DescribeProductIntentHandler');
    const {intent} = handlerInput.requestEnvelope.request;
    const productId = intent.slots.product.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    const productName = intent.slots.product.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    const {locale} = handlerInput.requestEnvelope.request;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    let speechText, repromptOutput;

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with a matching id
      const product = res.inSkillProducts.filter(
        record => record.referenceName === productId
      );
      if (!isPurchasable(product)) {
        // Product previously bought
        speechText = `Good News! You already have the ${productName}. ${getRandomYesNoQuestion()}`;
        repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Purchasable. Make the upsell
      speechText = 'Sure.';
      if (product.length > 0){
        return makeUpsell(speechText, product, handlerInput);
      } else {
        speechText = `There are no products to offer to you right now. Sorry about that. ${getRandomYesNoQuestion()}`;
        repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
    });
  }
};

const BuyProductIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'BuyProductIntent';
  },
  handle(handlerInput) {
    console.log('Handler: BuyProductIntentHandler');
    const {intent} = handlerInput.requestEnvelope.request;
    const productId = intent.slots.product.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    const productName = intent.slots.product.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    const {locale} = handlerInput.requestEnvelope.request;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    let speechText, repromptOutput;

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with a matching id
      const product = res.inSkillProducts.filter(
        record => record.referenceName === productId
      );
      if (!isPurchasable(product)) {
        // Product previously bought
        speechText = `Good News! You already have the ${productName}. ${getRandomYesNoQuestion()}`;
        repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      };
      // Purchasable. Make the buy offer
      if (product.length > 0){
        return makeBuyOffer(product, handlerInput);
      } else {
        speechText = `There are no products to offer to you right now. Sorry about that. ${getRandomYesNoQuestion()}`;
        repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      };
    });
  }
};

const UpsellBuyResponseHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'Connections.Response'
           && (handlerInput.requestEnvelope.request.name === 'Buy'
               || handlerInput.requestEnvelope.request.name === 'Upsell');
  },
  handle(handlerInput) {
    console.log('Handler: UpsellBuyResponseHandler');
    const {locale} = handlerInput.requestEnvelope.request;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const {productId} = handlerInput.requestEnvelope.request.payload;

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      const product = res.inSkillProducts.filter(
        record => record.productId === productId,
      );

      if (handlerInput.requestEnvelope.request.status.code === '200') {
        let preSpeechText;

        // check the Buy status - accepted, declined, already purchased, or something went wrong.
        console.log(handlerInput.requestEnvelope.request.name + ' connections payload: ' + handlerInput.requestEnvelope.request.payload);
        switch (handlerInput.requestEnvelope.request.payload.purchaseResult) {
          case 'ACCEPTED':
          case 'ALREADY_PURCHASED':
            preSpeechText = getBuyResponseText(product[0].referenceName, product[0].name);
            break;
          case 'DECLINED':
            preSpeechText = 'No Problem.';
            break;
          default:
            preSpeechText = `Something unexpected happened, but thanks for your interest in the ${product[0].name}.`;
            break;
        }
        // respond back to the customer
        return getResponseBasedOnAccessType(handlerInput, res, preSpeechText);
      }
      // Request Status Code NOT 200. Something has failed with the connection.
      console.log(
        `Connections.Response indicated failure. error: + ${handlerInput.requestEnvelope.request.status.message}`,
      );
      return handlerInput.responseBuilder
        .speak('There was an error handling your purchase request. Please try again or contact us for help.')
        .getResponse();
    });
  }
};

const PurchaseHistoryIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PurchaseHistoryIntent'
    );
  },
  handle(handlerInput) {
    console.log('Handler: PurchaseHistoryIntentHandler');
    const {locale} = handlerInput.requestEnvelope.request;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then(function (result) {
      const entitledProducts = getAllEntitledProducts(result.inSkillProducts);
      if (entitledProducts && entitledProducts.length > 0) {
        const speechText = `You have bought the following items: ${getSpeakableListOfProducts(entitledProducts)}. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `You asked me for a what you've bought, here's a list ${getSpeakableListOfProducts(entitledProducts)}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }

      const speechText = 'You haven\'t purchased anything yet. To learn more about the products you can buy, say - what can I buy. How can I help?';
      const repromptOutput = `You asked me for a what you've bought, but you haven't purchased anything yet. You can say - what can I buy, or say yes to get another greeting. ${getRandomYesNoQuestion()}`;

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptOutput)
        .getResponse();
    });
  }
};

const InventoryIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'InventoryIntent'
    );
  },
  handle(handlerInput) {
    console.log('Handler: InventoryIntentHandler');
    const {locale} = handlerInput.requestEnvelope.request;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then(function (res) {
      const goodbyesPackProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Goodbyes_Pack'
      );
      const availableGoodbyes = parseInt(getGoodbyesCount(handlerInput, goodbyesPackProduct)) || 0;
      const speechText = `You have ${availableGoodbyes} premium goodbyes left`;
      const repromptOutput = `${getRandomYesNoQuestion()}`;
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptOutput)
        .getResponse();
    });
  }
};

const RefundProductIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RefundProductIntent'
    );
  },
  handle(handlerInput) {
    console.log('Handler: RefundProductIntentHandler');
    const {intent} = handlerInput.requestEnvelope.request;
    const productId = intent.slots.product.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    const productName = intent.slots.product.resolutions.resolutionsPerAuthority[0].values[0].value.name;
    const {locale} = handlerInput.requestEnvelope.request;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      const premiumProduct = res.inSkillProducts.filter(
        record => record.referenceName === productId
      );
      return handlerInput.responseBuilder
        .addDirective({
          type: 'Connections.SendRequest',
          name: 'Cancel',
          payload: {
            InSkillProduct: {
              productId: premiumProduct[0].productId,
            },
          },
          token: 'correlationToken',
        })
        .getResponse();
    });
  }
};

const CancelProductResponseHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'Connections.Response'
      && handlerInput.requestEnvelope.request.name === 'Cancel'
    );
  },
  handle(handlerInput) {
    console.log('Handler: CancelProductResponseHandler');
    const {locale} = handlerInput.requestEnvelope.request;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const productId = handlerInput.requestEnvelope.request.payload.productId;
    let speechText;
    let repromptOutput;

    console.log('Cancel connections payload: ' + handlerInput.requestEnvelope.request.payload);
    return monetizationClient.getInSkillProducts(locale).then((res) => {
      const product = res.inSkillProducts.filter(
        record => record.productId === productId,
      );

      console.log(
        `PRODUCT = ${JSON.stringify(product)}`,
      );

      if (handlerInput.requestEnvelope.request.status.code === '200') {
        // Alexa handles the speech response immediately following the cancellation request.
        // It then passes the control to our CancelProductResponseHandler() along with the status code (ACCEPTED, DECLINED, NOT_ENTITLED)
        // We use the status code to stitch additional speech at the end of Alexa's cancellation response.
        // Currently, we have the same additional speech (getRandomYesNoQuestion)for accepted, canceled, and not_entitled. You may edit these below, if you like.
        if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'ACCEPTED') {
          // The cancellation confirmation response is handled by Alexa's Purchase Experience Flow.
          // Simply add to that with getRandomYesNoQuestion()
          speechText = `${getRandomYesNoQuestion()}`;
          repromptOutput = getRandomYesNoQuestion();
        } else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'DECLINED') {
          speechText = `${getRandomYesNoQuestion()}`;
          repromptOutput = getRandomYesNoQuestion();
        } else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'NOT_ENTITLED') {
          // No subscription to cancel.
          // The "No subscription to cancel" response is handled by Alexa's Purchase Experience Flow.
          // Simply add to that with getRandomYesNoQuestion()
          speechText = `${getRandomYesNoQuestion()}`;
          repromptOutput = getRandomYesNoQuestion();
        }
        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Something failed.
      console.log(`Connections.Response indicated failure. error: ${handlerInput.requestEnvelope.request.status.message}`);

      return handlerInput.responseBuilder
        .speak('There was an error handling your purchase request. Please try again or contact us for help.')
        .getResponse();
    });
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput) {
    console.log('Handler: HelpIntentHandler');
    const speechText = 'You can say hello to me! How can I help?';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(skillName, speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent');
  },
  handle(handlerInput) {
    console.log('Handler: CancelAndStopIntentHandler');
    const {locale} = handlerInput.requestEnvelope.request;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      return getPremiumOrRandomGoodbye(handlerInput, res.inSkillProducts);
    });
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${JSON.stringify(error)}`);

    return handlerInput.responseBuilder
      .speak('Sorry, there was an error. Please try again.')
      .reprompt('Sorry, there was an error. Please try again.')
      .getResponse();
  }
};


const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    GetAnotherHelloHandler,
    AvailableProductsIntentHandler,
    DescribeProductIntentHandler,
    BuyProductIntentHandler,
    UpsellBuyResponseHandler,
    PurchaseHistoryIntentHandler,
    InventoryIntentHandler,
    RefundProductIntentHandler,
    CancelProductResponseHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LoadAttributesRequestInterceptor)
  .addResponseInterceptors(SaveAttributesResponseInterceptor)
  .withTableName("premium-hello-world") // requires DynamoDB access in your Lambda role!
  .withAutoCreateTable(true)
  .lambda();
