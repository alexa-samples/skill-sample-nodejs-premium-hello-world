const Alexa = require(`ask-sdk`);
const skillName = "Premium Hello World";
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === `LaunchRequest`;
  },
  handle(handlerInput) {
    const speakOutput = `Welcome to ${skillName}. To hear a greeting, you can say hello, or to hear about the premium categories for purchase, say 'What can I buy'. For help, say , 'Help me'... So, What can I help you with?'`;
    let response = handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
    return response;
  }
};
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === `IntentRequest` &&
      handlerInput.requestEnvelope.request.intent.name === `AMAZON.HelpIntent`
    );
  },
  handle(handlerInput) {
    //TODO: write  better response
    const speakOutput = `You can say hello to me! How can I help?`;
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === `IntentRequest` &&
      (handlerInput.requestEnvelope.request.intent.name ===
        `AMAZON.CancelIntent` ||
        handlerInput.requestEnvelope.request.intent.name ===
          `AMAZON.StopIntent`)
    );
  },
  handle(handlerInput) {
    const speakOutput = `${getRandomGoodbye()}`;
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};
const WelcomeIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "WelcomeIntent"
    );
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const isUpsellNeeded = sessionAttributes.shouldUpsell;
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    return monetizationClient.getInSkillProducts(locale).then(function(result) {
      return checkForProductAccess(handlerInput, result, isUpsellNeeded);
    });
  }
};
// IF THE USER SAYS YES, THEY WANT ANOTHER GREETING.
const AnotherGreetingHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.YesIntent"
    );
  },
  handle(handlerInput) {
    //Get the locale for the request
    const locale = handlerInput.requestEnvelope.request.locale;

    //Instantiate a new MonetizationServiceClient object to invoke the inSkillPurchaseAPI
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    //Check if upsell should be done. You can set your own upsell timing logic inside the shouldUpsell() function.
    const isUpsellNeeded = false;

    //Get list of products the customer has bought, and then respond accordingly
    return monetizationClient.getInSkillProducts(locale).then(function(result) {
      //Pass the handlerInput, list of products customer has access to (result), and the flag for upsell to the helper function checkForProductAccess to determine the response.
      let response = checkForProductAccess(
        handlerInput,
        result,
        isUpsellNeeded
      );
      return response;
    });
  }
};
const AnotherGreetingWithUpsellHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.YesIntent" &&
      handlerInput.attributesManager.getSessionAttributes().shouldUpsell ===
        true
    );
  },
  handle(handlerInput) {
    //Get the locale for the request
    const locale = handlerInput.requestEnvelope.request.locale;

    //Instantiate a new MonetizationServiceClient object to invoke the inSkillPurchaseAPI
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();

    //Check if upsell should be done. You can set your own upsell timing logic inside the shouldUpsell() function.
    const isUpsellNeeded = true;

    //Get list of products the customer has bought, and then respond accordingly
    return monetizationClient.getInSkillProducts(locale).then(function(result) {
      //Pass the handlerInput, list of products customer has access to (result), and the flag for upsell to the helper function checkForProductAccess to determine the response.
      let response = checkForProductAccess(
        handlerInput,
        result,
        isUpsellNeeded
      );
      //Modify the Upsell message so we hear a standard greeting before it
      const originalUpsellMessage =
        response.directives[0].payload.upsellMessage;
      const newUpsellMessage = `Here's your standard greeting: ${getStandardGreeting()} <break/> ${originalUpsellMessage}`;
      // Setting a Session Attribute to keep track of the number of times the customer has said heard a standard greeting.
      // We will use this to determine if an upsell is required.
      const attributeNameToIncrement = `numberOfStandardGreetingsOfferedInThisSession`;
      incrementCountInSession(handlerInput, attributeNameToIncrement);
      response.directives[0].payload.upsellMessage = newUpsellMessage;
      return response;
    });
  }
};
// IF THE USER SAYS NO, THEY DON'T WANT ANOTHER GREETING.  EXIT THE SKILL.
const NoIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AMAZON.NoIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = getRandomGoodbye();
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};
const BuyIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "BuyIntent"
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return monetizationClient.getInSkillProducts(locale).then(function(result) {
      const premiumProduct = result.inSkillProducts.filter(
        record => record.referenceName === `Premium_Greeting`
      );
      return handlerInput.responseBuilder
        .addDirective({
          type: "Connections.SendRequest",
          name: "Buy",
          payload: {
            InSkillProduct: {
              productId: premiumProduct[0].productId
            }
          },
          token: JSON.stringify(sessionAttributes)
        })
        .getResponse();
    });
  }
};
const RefundIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "RefundIntent"
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return monetizationClient.getInSkillProducts(locale).then(function(result) {
      const premiumProduct = result.inSkillProducts.filter(
        record => record.referenceName === `Premium_Greeting`
      );
      return handlerInput.responseBuilder
        .addDirective({
          type: "Connections.SendRequest",
          name: "Cancel",
          payload: {
            InSkillProduct: {
              productId: premiumProduct[0].productId
            }
          },
          token: JSON.stringify(sessionAttributes)
        })
        .getResponse();
    });
  }
};
const PremiumGreetingHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      (handlerInput.requestEnvelope.request.intent.name ===
        "PremiumGreetingIntent" ||
        handlerInput.requestEnvelope.request.intent.name === "BuyIntent")
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const isUpsellNeeded = true;
    return monetizationClient.getInSkillProducts(locale).then(function(result) {
      return checkForProductAccess(handlerInput, result, isUpsellNeeded);
    });
  }
};
// THIS HANDLES THE CONNECTIONS.RESPONSE EVENT AFTER A BUY or UPSELL OCCURS.
const ConnectionsResponseHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "Connections.Response" &&
      (handlerInput.requestEnvelope.request.name === "Buy" ||
        handlerInput.requestEnvelope.request.name === "Upsell")
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    const productId = handlerInput.requestEnvelope.request.payload.productId;
    return monetizationClient.getInSkillProducts(locale).then(function(result) {
      handlerInput.attributesManager.setSessionAttributes(
        JSON.parse(handlerInput.requestEnvelope.request.token)
      );
      if (handlerInput.requestEnvelope.request.status.code === "200") {
        let speakOutput;
        let repromptOutput;
        let theGreeting;
        const premiumProduct = result.inSkillProducts.filter(
          record => record.productId === productId
        );
        switch (handlerInput.requestEnvelope.request.payload.purchaseResult) {
          case "ACCEPTED":
            theGreeting = getPremiumGreeting();
            speakOutput = `You have unlocked the Premium Greeting Pack. Here's your Premium greeting: ${
              theGreeting["greeting"]
            } ! That's hello in ${
              theGreeting["language"]
            }. ${getRandomYesNoQuestion()}`;
            const attributeNameToSave = `entitledProducts`;
            saveToSession(handlerInput, attributeNameToSave, premiumProduct);
            repromptOutput = getRandomYesNoQuestion();
            // resetting the count of standard greetings to avoid hitting upsell logic
            const secondAttributeNameToSave = `numberOfStandardGreetingsOfferedInThisSession`;
            const numberOfStandardGreetingsOfferedInThisSession = 1;
            saveToSession(
              handlerInput,
              secondAttributeNameToSave,
              numberOfStandardGreetingsOfferedInThisSession
            );
            break;
          case "DECLINED":
            if (handlerInput.requestEnvelope.request.name === "Buy") {
              // response when declined buy request
              speakOutput = `Thanks for your interest in the ${
                premiumProduct[0].name
              }.  Would you like to listen to the standard greeting?`;
              repromptOutput =
                "Would you like to listen to the standard greeting?";
              break;
            }
            // response when declined upsell request
            speakOutput = `Here's your standard greeting: ${getStandardGreeting()} Would you like another greeting?`;
            // Setting a Session Attribute to keep track of the number of times the customer has said heard a standard greeting.
            // We will use this to determine if an upsell is required.
            const attributeNameToIncrement = `numberOfStandardGreetingsOfferedInThisSession`;
            incrementCountInSession(handlerInput, attributeNameToIncrement);
            repromptOutput = "Would you like another greeting?";
            break;
          case "ALREADY_PURCHASED":
            theGreeting = getPremiumGreeting();
            speakOutput = `You already own the ${
              premiumProduct[0].name
            }. Here's a Premium greeting: ${
              theGreeting["greeting"]
            } ! That's hello in ${
              theGreeting["language"]
            }. ${getRandomYesNoQuestion()}`;
            repromptOutput = getRandomYesNoQuestion();
            break;
          default:
            speakOutput = `Something unexpected happened, but thanks for your interest in the ${
              premiumProduct[0].name
            }.  Would you like another random greeting?`;
            repromptOutput = "Would you like another random greeting?";
            break;
        }
        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(repromptOutput)
          .getResponse();
      }
      // Something failed.
      console.error(
        `Connections.Response indicated failure. error: ${
          handlerInput.requestEnvelope.request.status.message
        }`
      );
      return handlerInput.responseBuilder
        .speak(
          "There was an error handling your purchase request. Please try again or contact us for help."
        )
        .getResponse();
    });
  }
};
const CancelfromConnectionsHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "Connections.Response" &&
      handlerInput.requestEnvelope.request.name === "Cancel"
    );
  },
  handle(handlerInput) {
    // Since the skill only has entitlements we cannot refund ourselves.
    // Directing to customer support, the customer already got a card from the Monetization service
    const speakOutput = `You will find details for contacting customer support in the card. ${getRandomGoodbye()}.`;
    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  }
};
// Following handler demonstrates how skills can handle user requests to discover what
// products are available for purchase in-skill.
// Use says: Alexa, ask Greetings helper what can I buy
const WhatCanIBuyHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "WhatCanIBuyIntent"
    );
  },
  handle(handlerInput) {
    // Inform the user about what products are available for purchase
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    return monetizationClient
      .getInSkillProducts(locale)
      .then(function fetchPurchasableProducts(result) {
        const purchasableProducts = result.inSkillProducts.filter(
          record =>
            record.entitled === "NOT_ENTITLED" &&
            record.purchasable === "PURCHASABLE"
        );
        if (purchasableProducts.length > 0) {
          const speakOutput = `Products available for purchase at this time are ${getSpeakableListOfProducts(
            purchasableProducts
          )}. To learn more about a product, say 'Tell me more about' followed by the product name. If you are ready to buy, say, 'Buy' followed by the product name. So what can I help you with?`;
          const repromptOutput = `I didn't catch that. What can I help you with?`;
          return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptOutput)
            .getResponse();
        }
        const speakOutput = `There are no products to offer to you right now. Sorry about that. Would you like a greeting instead?`;
        const repromptOutput = `I didn't catch that. What can I help you with?`;
        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(repromptOutput)
          .getResponse();
      });
  }
};
const PurchaseHistoryHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name ===
        "PurchaseHistoryIntent"
    );
  },
  handle(handlerInput) {
    const locale = handlerInput.requestEnvelope.request.locale;
    const monetizationClient = handlerInput.serviceClientFactory.getMonetizationServiceClient();
    return monetizationClient.getInSkillProducts(locale).then(function(result) {
      const entitledProducts = getAllEntitledProducts(result.inSkillProducts);
      if (entitledProducts && entitledProducts.length > 0) {
        const speakOutput = `You have bought the following items: ${getSpeakableListOfProducts(
          entitledProducts
        )}. ${getRandomYesNoQuestion()}`;
        const repromptOutput = `You asked me for a what you've bought, here's a list ${getSpeakableListOfProducts(
          entitledProducts
        )}`;
        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(repromptOutput)
          .getResponse();
      }
      const speakOutput = `You haven't purchased anything yet. Would you like a standard greeting or premium greeting`;
      const repromptOutput = `You asked me for a what you've bought, but you haven't purchased anything yet. You can say - what can I buy, or say yes to get another greeting. ${getRandomYesNoQuestion()}`;
      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(repromptOutput)
        .getResponse();
    });
  }
};
// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or added it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error(`~~~~ Error handled: ${error.stack}`);
    const speechText = `Sorry, I couldn't understand what you said. Please try again.`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  }
};
/*
   Helper function that returns a speakable list of product names from a list of
   entitled products.
*/
function getSpeakableListOfProducts(entitleProductsList) {
  const productNameList = entitleProductsList.map(item => item.name);
  let productListSpeech = productNameList.join(", "); // Generate a single string with comma separated product names
  productListSpeech = productListSpeech.replace(/_([^_]*)$/, "and $1"); // Replace last comma with an 'and '
  return productListSpeech;
}
function getStandardGreeting() {
  const standard_greetings = ["Howdy!", "Hello!", "How are you?", "Hiya!"];
  return standard_greetings[
    Math.floor(Math.random() * standard_greetings.length)
  ];
}
function getPremiumGreeting() {
  //TODO: Add more greetings
  const premium_greetings = [
    { language: "hindi", greeting: "Namaste" },
    { language: "french", greeting: "Bonjour" },
    { language: "spanish", greeting: "Hola" },
    { language: "japanese", greeting: "Konichiwa" },
    { language: "italian", greeting: "Ciao" }
  ];
  return premium_greetings[
    Math.floor(Math.random() * premium_greetings.length)
  ];
}
function getRandomGoodbye() {
  const goodbyes = [
    "OK.  Goodbye!",
    "Have a great day!",
    "Come back again soon!"
  ];
  return goodbyes[Math.floor(Math.random() * goodbyes.length)];
}
function isProduct(product) {
  return product && product.length > 0;
}
function isEntitled(product) {
  return isProduct(product) && product[0].entitled === "ENTITLED";
}
function getResponseBasedOnAccessType(
  handlerInput,
  premiumProduct,
  isUpsellNeeded
) {
  const repromptOutput = getRandomYesNoQuestion();
  //Customer has bought the Premium Product. Return the response with Premium Greeting.
  if (isEntitled(premiumProduct)) {
    const theGreeting = getPremiumGreeting();
    const speakOutput = `Here's your Premium greeting: ${
      theGreeting["greeting"]
    } ! That's hello in ${
      theGreeting["language"]
    }. ${getRandomYesNoQuestion()}`;
    const attributeNameToSave = `entitledProducts`;
    saveToSession(handlerInput, attributeNameToSave, premiumProduct);

    let response = handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
    return response;
  }
  //Customer has not bought the Premium Product. Upsell should be made.
  if (isUpsellNeeded) {
    const upsellMessage = `You don't currently own the Premium Greeting pack. ${
      premiumProduct[0].summary
    }. ${getRandomLearnMorePrompt()}`;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return handlerInput.responseBuilder
      .addDirective({
        type: "Connections.SendRequest",
        name: "Upsell",
        payload: {
          InSkillProduct: {
            productId: premiumProduct[0].productId
          },
          upsellMessage
        },
        token: JSON.stringify(sessionAttributes)
      })
      .getResponse();
  }
  //Customer has not bought the Premium Product. Upsell should not be done.
  const speakOutput = `Here's your Standard Greeting: ${getStandardGreeting()} ${getRandomYesNoQuestion()}`;
  // Setting a Session Attribute to keep track of the number of times the customer has said heard a standard greeting.
  // We will use this to determine if an upsell is required.
  const attributeNameToIncrement = `numberOfStandardGreetingsOfferedInThisSession`;
  incrementCountInSession(handlerInput, attributeNameToIncrement);
  return handlerInput.responseBuilder
    .speak(speakOutput)
    .reprompt(repromptOutput)
    .getResponse();
}
function checkForProductAccess(handlerInput, result, isUpsellNeeded) {
  const premiumProduct = result.inSkillProducts.filter(
    record => record.referenceName === `Premium_Greeting`
  );
  const response = getResponseBasedOnAccessType(
    handlerInput,
    premiumProduct,
    isUpsellNeeded
  );
  return response;
}
function getRandomYesNoQuestion() {
  const questions = [
    "Would you like another greeting?",
    "Can I give you another greeting?",
    "Do you want to hear another greeting?"
  ];
  return questions[Math.floor(Math.random() * questions.length)];
}
function getRandomLearnMorePrompt() {
  const questions = [
    "Want to learn more about it?",
    "Should I tell you more about it?",
    "Want to learn about it?",
    "Interested in learning more about it?"
  ];
  return questions[Math.floor(Math.random() * questions.length)];
}
function saveToSession(handlerInput, attributeNameToSave, fieldValue) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  sessionAttributes[attributeNameToSave] = fieldValue;
  handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
}
function shouldUpsell(handlerInput) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  const numberOfStandardGreetingsOfferedInThisSession =
    sessionAttributes.numberOfStandardGreetingsOfferedInThisSession;
  if (numberOfStandardGreetingsOfferedInThisSession % 2 === 0) {
    return true;
  }
  return false;
}
function incrementCountInSession(handlerInput, attributeNameToIncrement) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  const currentValue = sessionAttributes[attributeNameToIncrement];
  let newValue;
  if (currentValue === null || currentValue === undefined) {
    newValue = 1;
  } else {
    newValue = currentValue + 1;
  }
  saveToSession(handlerInput, attributeNameToIncrement, newValue);
}
function getAllEntitledProducts(inSkillProductList) {
  const entitledProductList = inSkillProductList.filter(
    record => record.entitled === "ENTITLED"
  );
  return entitledProductList;
}
const LogResponseInterceptor = {
  process(handlerInput) {
    console.log(
      `RESPONSE = ${JSON.stringify(handlerInput.responseBuilder.getResponse())}`
    );
  }
};
const LogRequestInterceptor = {
  process(handlerInput) {
    console.log(
      `REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`
    );
  }
};
const UpSellInterceptor = {
  process(handlerInput) {
    const attributeNameToSave = `shouldUpsell`;
    let fieldValue = false;
    if (shouldUpsell(handlerInput)) {
      fieldValue = true;
    }
    saveToSession(handlerInput, attributeNameToSave, fieldValue);
  }
};
// This is the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.standard()
  .addRequestHandlers(
    CancelfromConnectionsHandler,
    ConnectionsResponseHandler,
    LaunchRequestHandler,
    AnotherGreetingWithUpsellHandler,
    AnotherGreetingHandler,
    NoIntentHandler,
    WelcomeIntentHandler,
    BuyIntentHandler,
    PremiumGreetingHandler,
    WhatCanIBuyHandler,
    PurchaseHistoryHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    RefundIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LogRequestInterceptor, UpSellInterceptor)
  .addResponseInterceptors(LogResponseInterceptor)
  .lambda();
