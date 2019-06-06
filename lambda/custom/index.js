const Alexa = require('ask-sdk');

const skillName = 'Premium Hello World';

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = `Welcome to ${skillName}, you can say hello! How can I help?`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(skillName, speechText)
      .getResponse();
  },
};

const GetAnotherHelloHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'SimpleHelloIntent'));
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const preSpeechText = '';

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Use the helper function getResponseBasedOnAccessType to determine the response based on the products the customer has purchased
      return getResponseBasedOnAccessType(handlerInput, res, preSpeechText);
    });
  },
};

const NoIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent'
    );
  },
  handle(handlerInput) {
    const speechText = getRandomGoodbye();
    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

// Respond to the utterance "what can I buy"
const WhatCanIBuyIntentHandler = {
  canHandle(handlerInput) {
    return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'WhatCanIBuyIntent');
  },
  handle(handlerInput) {
    // Get the list of products available for in-skill purchase
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // res contains the list of all ISP products for this skill.
      // We now need to filter this to find the ISP products that are available for purchase (NOT ENTITLED)
      const purchasableProducts = res.inSkillProducts.filter(
        record => record.entitled === 'NOT_ENTITLED' &&
          record.purchasable === 'PURCHASABLE',
      );

      // Say the list of products
      if (purchasableProducts.length > 0) {
        // One or more products are available for purchase. say the list of products
        const speechText = `Products available for purchase at this time are ${getSpeakableListOfProducts(purchasableProducts)}. 
                            To learn more about a product, say 'Tell me more about' followed by the product name. 
                            If you are ready to buy, say, 'Buy' followed by the product name. So what can I help you with?`;
        const repromptOutput = 'I didn\'t catch that. What can I help you with?';
        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // no products are available for purchase. Ask if they would like to hear another greeting
      const speechText = 'There are no products to offer to you right now. Sorry about that. Would you like a greeting instead?';
      const repromptOutput = 'I didn\'t catch that. What can I help you with?';
      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(repromptOutput)
        .getResponse();
    });
  },
};

const TellMeMoreAboutGreetingsPackIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'TellMeMoreAboutGreetingsPackIntent';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
      const greetingsPackProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Greetings_Pack',
      );

      // const premiumSubscriptionProduct = res.inSkillProducts.filter(
      //   record => record.referenceName === 'Premium_Subscription'
      // );

      if (isEntitled(greetingsPackProduct)) {
        // Customer has bought the Greetings Pack. They don't need to buy the Greetings Pack.
        const speechText = `Good News! You're subscribed to the Premium Subscription, which includes all features of the Greetings Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
      // Make the upsell
      const speechText = 'Sure.';
      return makeUpsell(speechText, greetingsPackProduct, handlerInput);
    });
  },
};

const TellMeMoreAboutPremiumSubscriptionIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'TellMeMoreAboutPremiumSubscription';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
      // const greetingsPackProduct = res.inSkillProducts.filter(
      //   record => record.referenceName === 'Greetings_Pack'
      // );

      const premiumSubscriptionProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Premium_Subscription',
      );

      if (isEntitled(premiumSubscriptionProduct)) {
        // Customer has bought the Greetings Pack. They don't need to buy the Greetings Pack.
        const speechText = `Good News! You're subscribed to the Premium Subscription. ${premiumSubscriptionProduct[0].summary} ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
      // Make the upsell
      const speechText = 'Sure.';
      return makeUpsell(speechText, premiumSubscriptionProduct, handlerInput);
    });
  },
};

const BuyGreetingsPackIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'BuyGreetingsPackIntent';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
      const greetingsPackProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Greetings_Pack',
      );

      const premiumSubscriptionProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Premium_Subscription',
      );

      if (isEntitled(premiumSubscriptionProduct)) {
        // Customer has bought the Premium Subscription. They don't need to buy the Greetings Pack.
        const speechText = `Good News! You're subscribed to the Premium Subscription, which includes all features of the Greetings Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      } else if (isEntitled(greetingsPackProduct)) {
        // Customer has bought the Greetings Pack. Deliver the special greetings
        const speechText = `Good News! You've already bought the Greetings Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
      // Make the buy offer for Greetings Pack
      return makeBuyOffer(greetingsPackProduct, handlerInput);
    });
  },
};

const GetSpecialGreetingsIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'GetSpecialGreetingsIntent';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Greetings_Pack"
      const greetingsPackProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Greetings_Pack',
      );

      const premiumSubscriptionProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Premium_Subscription',
      );

      if (isEntitled(premiumSubscriptionProduct)) {
        // Customer has bought the Premium Subscription. They don't need to buy the Greetings Pack.
        const speechText = `Good News! You're subscribed to the Premium Subscription, which includes all features of the Greetings Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      } else if (isEntitled(greetingsPackProduct)) {
        // Customer has bought the Greetings Pack. Deliver the special greetings
        const speechText = `Good News! You've already bought the Greetings Pack. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `${getRandomYesNoQuestion()}`;

        return handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
      // Make the upsell
      const speechText = 'You need the Greetings Pack to get the special greeting.';
      return makeUpsell(speechText, greetingsPackProduct, handlerInput);
    });
  },
};

const BuyPremiumSubscriptionIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
           && handlerInput.requestEnvelope.request.intent.name === 'BuyPremiumSubscriptionIntent';
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      // Filter the list of products available for purchase to find the product with the reference name "Premium_Subscription"
      const premiumSubscriptionProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Premium_Subscription',
      );

      // Send Connections.SendRequest Directive back to Alexa to switch to Purchase Flow
      return makeBuyOffer(premiumSubscriptionProduct, handlerInput);
    });
  },
};

const BuyResponseHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'Connections.Response'
           && (handlerInput.requestEnvelope.request.name === 'Buy'
               || handlerInput.requestEnvelope.request.name === 'Upsell');
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const productId = handlerInput.requestEnvelope.request.payload.productId;

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      const product = res.inSkillProducts.filter(
        record => record.productId === productId,
      );

      if (handlerInput.requestEnvelope.request.status.code === '200') {
        let preSpeechText;

        // check the Buy status - accepted, declined, already purchased, or something went wrong.
        switch (handlerInput.requestEnvelope.request.payload.purchaseResult) {
          case 'ACCEPTED':
            preSpeechText = getBuyResponseText(product[0].referenceName, product[0].name);
            break;
          case 'DECLINED':
            preSpeechText = 'No Problem.';
            break;
          case 'ALREADY_PURCHASED':
            preSpeechText = getBuyResponseText(product[0].referenceName, product[0].name);
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
  },
};

const PurchaseHistoryIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PurchaseHistoryIntent'
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
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
  },
};

const RefundGreetingsPackIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'RefundGreetingsPackIntent'
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      const premiumProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Greetings_Pack',
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
  },
};

const CancelPremiumSubscriptionIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'CancelPremiumSubscriptionIntent'
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    return monetizationClient.getInSkillProducts(locale).then((res) => {
      const premiumProduct = res.inSkillProducts.filter(
        record => record.referenceName === 'Premium_Subscription',
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
  },
};

const CancelProductResponseHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'Connections.Response'
      && handlerInput.requestEnvelope.request.name === 'Cancel'
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const productId = handlerInput.requestEnvelope.request.payload.productId;
    let speechText;
    let repromptOutput;

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
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput) {
    const speechText = 'You can say hello to me! How can I help?';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(skillName, speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = getRandomGoodbye();

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard(skillName, speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

// *****************************************
// *********** HELPER FUNCTIONS ************
// *****************************************

function randomize(array) {
  const randomItem = array[Math.floor(Math.random() * array.length)];
  return randomItem;
}

function getSimpleHello() {
  const simpleGreetings = ['Howdy!', 'Hello!', 'How are you?', 'Hiya!'];
  return simpleGreetings[
    Math.floor(Math.random() * simpleGreetings.length)
  ];
}

function getSpecialHello() {
  const specialGreetings = [
    {
      language: 'hindi', greeting: 'Namaste', locale: 'en-IN', voice: ['Aditi', 'Raveena'],
    },
    {
      language: 'german', greeting: 'Hallo', locale: 'de-DE', voice: ['Hans', 'Marlene', 'Vicki'],
    },
    {
      language: 'spanish', greeting: 'Hola', locale: 'es-ES', voice: ['Conchita', 'Enrique'],
    },
    {
      language: 'french', greeting: 'Bonjour', locale: 'fr-FR', voice: ['Celine', 'Lea', 'Mathieu'],
    },
    {
      language: 'japanese', greeting: 'Konichiwa', locale: 'ja-JP', voice: ['Mizuki', 'Takumi'],
    },
    {
      language: 'italian', greeting: 'Ciao', locale: 'it-IT', voice: ['Carla', 'Giorgio'],
    },
  ];
  return randomize(specialGreetings);
}

function getRandomGoodbye() {
  const goodbyes = [
    'OK.  Goodbye!',
    'Have a great day!',
    'Come back again soon!',
  ];
  return randomize(goodbyes);
}

function getRandomYesNoQuestion() {
  const questions = [
    'Would you like another greeting?',
    'Can I give you another greeting?',
    'Do you want to hear another greeting?',
  ];
  return randomize(questions);
}

function getRandomLearnMorePrompt() {
  const questions = [
    'Want to learn more about it?',
    'Should I tell you more about it?',
    'Want to learn about it?',
    'Interested in learning more about it?',
  ];
  return randomize(questions);
}

function getSpeakableListOfProducts(entitleProductsList) {
  const productNameList = entitleProductsList.map(item => item.name);
  let productListSpeech = productNameList.join(', '); // Generate a single string with comma separated product names
  productListSpeech = productListSpeech.replace(/_([^_]*)$/, 'and $1'); // Replace last comma with an 'and '
  return productListSpeech;
}

function getResponseBasedOnAccessType(handlerInput, res, preSpeechText) {
  // The filter() method creates a new array with all elements that pass the test implemented by the provided function.
  const greetingsPackProduct = res.inSkillProducts.filter(
    record => record.referenceName === 'Greetings_Pack',
  );

  console.log(
    `GREETINGS PACK PRODUCT = ${JSON.stringify(greetingsPackProduct)}`,
  );

  const premiumSubscriptionProduct = res.inSkillProducts.filter(
    record => record.referenceName === 'Premium_Subscription',
  );

  console.log(
    `PREMIUM SUBSCRIPTION PRODUCT = ${JSON.stringify(premiumSubscriptionProduct)}`,
  );

  let speechText;
  let cardText;
  let repromptOutput;

  const specialGreeting = getSpecialHello();
  const preGreetingSpeechText = `${preSpeechText} Here's your special greeting: `;
  const postGreetingSpeechText = `That's hello in ${specialGreeting.language}.`;
  const langSpecialGreeting = switchLanguage(`${specialGreeting.greeting}!`, specialGreeting.locale);

  if (isEntitled(premiumSubscriptionProduct)) {
    // Customer has bought the Premium Subscription. Switch to Polly Voice, and return special hello
    cardText = `${preGreetingSpeechText} ${specialGreeting.greeting} ${postGreetingSpeechText}`;
    const randomVoice = randomize(specialGreeting.voice);
    speechText = `${preGreetingSpeechText} ${switchVoice(langSpecialGreeting, randomVoice)} ${postGreetingSpeechText} ${getRandomYesNoQuestion()}`;
    repromptOutput = `${getRandomYesNoQuestion()}`;
  } else if (isEntitled(greetingsPackProduct)) {
    // Customer has bought the Greetings Pack, but not the Premium Subscription. Return special hello greeting in Alexa voice
    cardText = `${preGreetingSpeechText} ${specialGreeting.greeting} ${postGreetingSpeechText}`;
    speechText = `${preGreetingSpeechText} ${langSpecialGreeting} ${postGreetingSpeechText} ${getRandomYesNoQuestion()}`;
    repromptOutput = `${getRandomYesNoQuestion()}`;
  } else {
    // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
    const theGreeting = getSimpleHello();
    // Determine if upsell should be made. returns true/false
    if (shouldUpsell(handlerInput)) {
      // Say the simple greeting, and then Upsell Greetings Pack
      speechText = `Here's your simple greeting: ${theGreeting}. By the way, you can now get greetings in more languages.`;
      return makeUpsell(speechText, greetingsPackProduct, handlerInput);
    }

    // Do not make the upsell. Just return Simple Hello Greeting.
    cardText = `Here's your simple greeting: ${theGreeting}.`;
    speechText = `Here's your simple greeting: ${theGreeting}. ${getRandomYesNoQuestion()}`;
    repromptOutput = `${getRandomYesNoQuestion()}`;
  }

  return handlerInput.responseBuilder
    .speak(speechText)
    .reprompt(repromptOutput)
    .withSimpleCard(skillName, cardText)
    .getResponse();
}

function isProduct(product) {
  return product && product.length > 0;
}
function isEntitled(product) {
  return isProduct(product) && product[0].entitled === 'ENTITLED';
}

function getAllEntitledProducts(inSkillProductList) {
  const entitledProductList = inSkillProductList.filter(record => record.entitled === 'ENTITLED');
  return entitledProductList;
}

function makeUpsell(preUpsellMessage, greetingsPackProduct, handlerInput) {
  const upsellMessage = `${preUpsellMessage}. ${greetingsPackProduct[0].summary}. ${getRandomLearnMorePrompt()}`;

  return handlerInput.responseBuilder
    .addDirective({
      type: 'Connections.SendRequest',
      name: 'Upsell',
      payload: {
        InSkillProduct: {
          productId: greetingsPackProduct[0].productId,
        },
        upsellMessage,
      },
      token: 'correlationToken',
    })
    .getResponse();
}

function makeBuyOffer(theProduct, handlerInput) {
  return handlerInput.responseBuilder
    .addDirective({
      type: 'Connections.SendRequest',
      name: 'Buy',
      payload: {
        InSkillProduct: {
          productId: theProduct[0].productId,
        },
      },
      token: 'correlationToken',
    })
    .getResponse();
}

function shouldUpsell(handlerInput) {
  if (handlerInput.requestEnvelope.request.intent === undefined) {
    // If the last intent was Connections.Response, do not upsell
    return false;
  }

  return randomize([true, false]); // randomize upsell
}

function switchVoice(speakOutput, voiceName) {
  if (speakOutput && voiceName) {
    return `<voice name="${voiceName}"> ${speakOutput} </voice>`;
  }
  return speakOutput;
}

function switchLanguage(speakOutput, locale) {
  if (speakOutput && locale) {
    return `<lang xml:lang="${locale}"> ${speakOutput} </lang>`;
  }
  return speakOutput;
}

function getBuyResponseText(productReferenceName, productName) {
  if (productReferenceName === 'Greetings_Pack') {
    return `With the ${productName}, I can now say hello in a variety of languages.`;
  } else if (productReferenceName === 'Premium_Subscription') {
    return `With the ${productName}, I can now say hello in a variety of languages, in different accents using Amazon Polly.`;
  }

  console.log('Product Undefined');
  return 'Sorry, that\'s not a valid product';
}

// *****************************************
// *********** Interceptors ************
// *****************************************
const LogResponseInterceptor = {
  process(handlerInput) {
    console.log(`RESPONSE = ${JSON.stringify(handlerInput.responseBuilder.getResponse())}`);
  },
};

const LogRequestInterceptor = {
  process(handlerInput) {
    console.log(`REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`);
  },
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    GetAnotherHelloHandler,
    NoIntentHandler,
    WhatCanIBuyIntentHandler,
    TellMeMoreAboutGreetingsPackIntentHandler,
    TellMeMoreAboutPremiumSubscriptionIntentHandler,
    BuyGreetingsPackIntentHandler,
    GetSpecialGreetingsIntentHandler,
    BuyPremiumSubscriptionIntentHandler,
    BuyResponseHandler,
    PurchaseHistoryIntentHandler,
    RefundGreetingsPackIntentHandler,
    CancelPremiumSubscriptionIntentHandler,
    CancelProductResponseHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LogRequestInterceptor)
  .addResponseInterceptors(LogResponseInterceptor)
  .lambda();
