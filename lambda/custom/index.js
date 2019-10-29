const Alexa = require('ask-sdk');
const utils = require("./utils");

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return  Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    console.log('Handler: LaunchRequestHandler');
    const speechOutput = `Welcome to Premium Hello World! You can say hello! How can I help?`;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .withSimpleCard('Premium Hello World', speechOutput)
      .getResponse();
  }
};

const GetAnotherHelloHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && ( Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
          ||  Alexa.getIntentName(handlerInput.requestEnvelope) === 'SimpleHelloIntent'));
  },
  handle(handlerInput) {
    console.log('Handler: GetAnotherHelloHandler');
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const preSpeechText = '';

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Use the helper function getResponseBasedOnAccessType to determine the response based on the products the customer has purchased
      return utils.getResponseBasedOnAccessType(handlerInput, res, preSpeechText);
    });
  }
};

// Respond to the utterance "what can I buy"
const AvailableProductsIntentHandler = {
  canHandle(handlerInput) {
    return ( Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      &&  Alexa.getIntentName(handlerInput.requestEnvelope) === 'AvailableProductsIntent');
  },
  async handle(handlerInput) {
    console.log('Handler: AvailableProductsIntentHandler');
    // Get the list of products available for in-skill purchase
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    // res contains the list of all ISP products for this skill.
    const res = await monetizationClient.getInSkillProducts(locale);
    // We now need to filter this to find the ISP products that are available for purchase
    const purchasableProducts = utils.getAllPurchasableProducts(res.inSkillProducts);
    // Say the list of products
    let speechOutput, repromptOutput;
    if (purchasableProducts.length > 0) {
      // One or more products are available for purchase. say the list of products
      speechOutput = `Products available for purchase at this time are ${utils.getSpeakableListOfProducts(purchasableProducts)}. 
                    To learn more about a product, say 'Tell me more about' followed by the product name. 
                    If you are ready to buy, say 'Buy' followed by the product name. So what can I help you with?`;
      repromptOutput = 'I didn\'t catch that. What can I help you with?';
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(repromptOutput)
        .getResponse();
    }
    // no products are available for purchase. Ask if they would like to hear another greeting
    speechOutput = 'There are no products to offer to you right now. Sorry about that. Would you like a greeting instead?';
    repromptOutput = 'I didn\'t catch that. What can I help you with?';
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(repromptOutput)
      .getResponse();
  }
};

const DescribeProductIntentHandler = {
  canHandle(handlerInput) {
    return  Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
          &&  Alexa.getIntentName(handlerInput.requestEnvelope) === 'DescribeProductIntent';
  },
  async handle(handlerInput) {
    console.log('Handler: DescribeProductIntentHandler');
    const productName = Alexa.getSlotValue(handlerInput.requestEnvelope, 'product');
    const productId = Alexa.getSlot(handlerInput.requestEnvelope, 'product').resolutions.resolutionsPerAuthority[0].values[0].value.id;
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    let speechOutput, repromptOutput;

    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    // res contains the list of all ISP products for this skill.
    const res = await monetizationClient.getInSkillProducts(locale);
    // Filter the list of products available for purchase to find the product with a matching id
    const product = res.inSkillProducts.filter(
      record => record.referenceName === productId
    );
    if (!utils.isPurchasable(product)) {
      // Product previously bought
      speechOutput = `Good News! You already have the ${productName}. ${utils.getRandomYesNoQuestion()}`;
      repromptOutput = `${utils.getRandomYesNoQuestion()}`;

      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(repromptOutput)
        .getResponse();
    }
    // Purchasable. Make the upsell
    speechOutput = 'Sure.';
    if (product.length > 0){
      return utils.makeUpsell(speechOutput, product, handlerInput);
    } else {
      speechOutput = `There are no products to offer to you right now. Sorry about that. ${utils.getRandomYesNoQuestion()}`;
      repromptOutput = `${utils.getRandomYesNoQuestion()}`;

      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(repromptOutput)
        .getResponse();
    }
  }
};

const BuyProductIntentHandler = {
  canHandle(handlerInput) {
    return  Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
          &&  Alexa.getIntentName(handlerInput.requestEnvelope) === 'BuyProductIntent';
  },
  async handle(handlerInput) {
    console.log('Handler: BuyProductIntentHandler');
    const productName = Alexa.getSlotValue(handlerInput.requestEnvelope, 'product');
    const productId = Alexa.getSlot(handlerInput.requestEnvelope, 'product').resolutions.resolutionsPerAuthority[0].values[0].value.id;
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    let speechOutput, repromptOutput;

    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    // res contains the list of all ISP products for this skill.
    const res = await monetizationClient.getInSkillProducts(locale);
    // Filter the list of products available for purchase to find the product with a matching id
    const product = res.inSkillProducts.filter(
      record => record.referenceName === productId
    );
    if (!utils.isPurchasable(product)) {
      // Product previously bought
      speechOutput = `Good News! You already have the ${productName}. ${utils.getRandomYesNoQuestion()}`;
      repromptOutput = `${utils.getRandomYesNoQuestion()}`;

      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(repromptOutput)
        .getResponse();
    };
    // Purchasable. Make the buy offer
    if (product.length > 0){
      return utils.makeBuyOffer(product, handlerInput);
    } else {
      speechOutput = `There are no products to offer to you right now. Sorry about that. ${utils.getRandomYesNoQuestion()}`;
      repromptOutput = `${utils.getRandomYesNoQuestion()}`;

      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(repromptOutput)
        .getResponse();
    };
  }
};

const UpsellBuyResponseHandler = {
  canHandle(handlerInput) {
    return  Alexa.getRequestType(handlerInput.requestEnvelope) === 'Connections.Response'
          && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'Buy'
              || Alexa.getIntentName(handlerInput.requestEnvelope) === 'Upsell');
  },
  async handle(handlerInput) {
    console.log('Handler: UpsellBuyResponseHandler');
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const {productId} = handlerInput.requestEnvelope.request.payload;

    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    // res contains the list of all ISP products for this skill.
    const res = await monetizationClient.getInSkillProducts(locale);
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
          preSpeechText = utils.getBuyResponseText(product[0].referenceName, product[0].name);
          break;
        case 'DECLINED':
          preSpeechText = '';
          break;
        default:
          preSpeechText = `Something unexpected happened, but thanks for your interest in the ${product[0].name}.`;
          break;
      }
      // respond back to the customer
      return utils.getResponseBasedOnAccessType(handlerInput, res, preSpeechText);
    }
    // Request Status Code NOT 200. Something has failed with the connection.
    console.log(
      `Connections.Response indicated failure. error: + ${handlerInput.requestEnvelope.request.status.message}`,
    );
    return handlerInput.responseBuilder
      .speak('There was an error handling your request. Please try again or contact us for help.')
      .getResponse();
  }
};

const PurchaseHistoryIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      &&  Alexa.getIntentName(handlerInput.requestEnvelope) === 'PurchaseHistoryIntent'
    );
  },
  async handle(handlerInput) {
    console.log('Handler: PurchaseHistoryIntentHandler');
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);

    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    // res contains the list of all ISP products for this skill.
    const res = await monetizationClient.getInSkillProducts(locale);
    const entitledProducts = utils.getAllEntitledProducts(res.inSkillProducts);
    if (entitledProducts && entitledProducts.length > 0) {
      const speechOutput = `You have bought the following items: ${utils.getSpeakableListOfProducts(entitledProducts)}. ${utils.getRandomYesNoQuestion()}`;
      const repromptOutput = `You asked me for a what you've bought, here's a list ${utils.getSpeakableListOfProducts(entitledProducts)}`;

      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(repromptOutput)
        .getResponse();
    }

    const speechOutput = 'You haven\'t purchased anything yet. To learn more about the products you can buy, say - what can I buy. How can I help?';
    const repromptOutput = `You asked me for a what you've bought, but you haven't purchased anything yet. You can say - what can I buy, or say yes to get another greeting. ${utils.getRandomYesNoQuestion()}`;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(repromptOutput)
      .getResponse();
  }
};

const InventoryIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      &&  Alexa.getIntentName(handlerInput.requestEnvelope) === 'InventoryIntent'
    );
  },
  async handle(handlerInput) {
    console.log('Handler: InventoryIntentHandler');
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);

    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    // res contains the list of all ISP products for this skill.
    const res = await monetizationClient.getInSkillProducts(locale);
    const goodbyesPackProduct = res.inSkillProducts.filter(
      record => record.referenceName === 'Goodbyes_Pack'
    );
    const availableGoodbyes = parseInt(utils.getRemainingCredits(handlerInput, goodbyesPackProduct, 'goodbyesUsed', utils.GOODBYES_PER_ENTITLEMENT).availableCredits) || 0;
    let speechOutput = `You have ${availableGoodbyes} premium goodbyes left. `;
    availableGoodbyes ? speechOutput += `Just say stop and you'll use one!` : speechOutput += 'You can buy more by saying, buy goodbyes pack.';
    const repromptOutput = `${utils.getRandomYesNoQuestion()}`;
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(repromptOutput)
      .getResponse();
  }
};

const RefundProductIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      &&  Alexa.getIntentName(handlerInput.requestEnvelope) === 'RefundProductIntent'
    );
  },
  async handle(handlerInput) {
    console.log('Handler: RefundProductIntentHandler');
    const productId = Alexa.getSlot(handlerInput.requestEnvelope, 'product').resolutions.resolutionsPerAuthority[0].values[0].value.id;
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);

    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    // res contains the list of all ISP products for this skill.
    const res = await monetizationClient.getInSkillProducts(locale);
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
  }
};

const CancelProductResponseHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'Connections.Response'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Cancel'
    );
  },
  async handle(handlerInput) {
    console.log('Handler: CancelProductResponseHandler');
    const productId = Alexa.getSlot(handlerInput.requestEnvelope, 'product').resolutions.resolutionsPerAuthority[0].values[0].value.id;
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    let speechOutput, repromptOutput;
    console.log('Cancel connections payload: ' + handlerInput.requestEnvelope.request.payload);

    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    // res contains the list of all ISP products for this skill.
    const res = await monetizationClient.getInSkillProducts(locale);
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
        speechOutput = `${utils.getRandomYesNoQuestion()}`;
        repromptOutput = utils.getRandomYesNoQuestion();
      } else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'DECLINED') {
        speechOutput = `${utils.getRandomYesNoQuestion()}`;
        repromptOutput = utils.getRandomYesNoQuestion();
      } else if (handlerInput.requestEnvelope.request.payload.purchaseResult === 'NOT_ENTITLED') {
        // No subscription to cancel.
        // The "No subscription to cancel" response is handled by Alexa's Purchase Experience Flow.
        // Simply add to that with getRandomYesNoQuestion()
        speechOutput = `${utils.getRandomYesNoQuestion()}`;
        repromptOutput = utils.getRandomYesNoQuestion();
      }
      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(repromptOutput)
        .getResponse();
    }
    // Something failed.
    console.log(`Connections.Response indicated failure. error: ${handlerInput.requestEnvelope.request.status.message}`);

    return handlerInput.responseBuilder
      .speak('There was an error handling your request. Please try again or contact us for help.')
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      &&  Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput) {
    console.log('Handler: HelpIntentHandler');
    const speechOutput = 'You can say hello to me! How can I help?';

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .withSimpleCard('Premium Hello World', speechOutput)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return  Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && ( Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        ||  Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
        ||  Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent');
  },
  handle(handlerInput) {
    console.log('Handler: CancelAndStopIntentHandler');
    const locale = Alexa.getLocale(handlerInput.requestEnvelope);
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      return utils.getPremiumOrRandomGoodbye(handlerInput, res.inSkillProducts);
    });
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return  Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
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
  .addRequestInterceptors(utils.LoadAttributesRequestInterceptor)
  .addResponseInterceptors(utils.SaveAttributesResponseInterceptor)
  .withTableName("premium-hello-world") // requires that you allow DynamoDB access in your Lambda role!
  .withAutoCreateTable(true)
  .lambda();
