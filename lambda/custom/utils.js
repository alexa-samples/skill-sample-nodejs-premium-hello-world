const skillName = 'Premium Hello World';
const GOODBYES_PER_ENTITLEMENT = 3;

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

function getSpecialGoodbye() {
  const specialGoodbyes = [
    {
      language: 'hindi', greeting: 'alavida', locale: 'en-IN', voice: ['Aditi', 'Raveena']
    },
    {
      language: 'german', greeting: 'auf wiedersehen', locale: 'de-DE', voice: ['Hans', 'Marlene', 'Vicki']
    },
    {
      language: 'spanish', greeting: 'hasta luego', locale: 'es-ES', voice: ['Conchita', 'Enrique']
    },
    {
      language: 'french', greeting: 'au revoir', locale: 'fr-FR', voice: ['Celine', 'Lea', 'Mathieu']
    },
    {
      language: 'japanese', greeting: 'sayonara', locale: 'ja-JP', voice: ['Mizuki', 'Takumi']
    },
    {
      language: 'italian', greeting: 'arrivederci', locale: 'it-IT', voice: ['Carla', 'Giorgio']
    }
  ];
  return randomize(specialGoodbyes);
}

function getSpecialHello() {
  const specialGreetings = [
    {
      language: 'hindi', greeting: 'Namaste', locale: 'en-IN', voice: ['Aditi', 'Raveena']
    },
    {
      language: 'german', greeting: 'Hallo', locale: 'de-DE', voice: ['Hans', 'Marlene', 'Vicki']
    },
    {
      language: 'spanish', greeting: 'Hola', locale: 'es-ES', voice: ['Conchita', 'Enrique']
    },
    {
      language: 'french', greeting: 'Bonjour', locale: 'fr-FR', voice: ['Celine', 'Lea', 'Mathieu']
    },
    {
      language: 'japanese', greeting: 'Konichiwa', locale: 'ja-JP', voice: ['Mizuki', 'Takumi']
    },
    {
      language: 'italian', greeting: 'Ciao', locale: 'it-IT', voice: ['Carla', 'Giorgio']
    }
  ];
  return randomize(specialGreetings);
}

function getRemainingCredits(handlerInput, consumable, usedSessionAttributeName, creditsPerEntitlement){
  console.log('Function: getRemainingCredits');
  const {attributesManager} = handlerInput;
  const sessionAttributes = attributesManager.getSessionAttributes();
  if(!sessionAttributes[usedSessionAttributeName])
    sessionAttributes[usedSessionAttributeName] = 0;
  const activeEntitlementCount = consumable[0] ? consumable[0].activeEntitlementCount : 0;
  let usedCredits = parseInt(sessionAttributes[usedSessionAttributeName]);
  const ownedCredits = activeEntitlementCount * creditsPerEntitlement;
  if(ownedCredits < usedCredits) {
    // we assume the ISP was reset so we also reset the used count
    sessionAttributes[usedSessionAttributeName] = 0;
    usedCredits = 0;
  }
  const availableCredits = Math.max(0, ownedCredits - usedCredits);
  const creditStatus = {
    activeEntitlementCount: activeEntitlementCount,
    creditsPerEntitlement: creditsPerEntitlement,
    ownedCredits: ownedCredits,
    usedCredits: usedCredits,
    availableCredits: availableCredits
  };
  console.log(creditStatus);
  
  return creditStatus;
}

function getPremiumOrRandomGoodbye(handlerInput, inSkillProducts) {
  console.log('Function: getPremiumOrRandomGoodbye');
  const {attributesManager} = handlerInput;
  const sessionAttributes = attributesManager.getSessionAttributes();
  const goodbyesPackProduct = inSkillProducts.filter(
    record => record.referenceName === 'Goodbyes_Pack'
  );

  const availableGoodbyes = parseInt(getRemainingCredits(handlerInput, goodbyesPackProduct, 'goodbyesUsed', GOODBYES_PER_ENTITLEMENT).availableCredits) || 0;

  let speechOutput;
  let cardText;

  if (availableGoodbyes > 0){
    const specialGoodbye = getSpecialGoodbye();
    const preGoodbyeSpeechText = `Here's your special goodbye: `;
    const postGoodbyeSpeechText = `That's goodbye in ${specialGoodbye.language}`;
    const langSpecialGoodbye = switchLanguage(`${specialGoodbye.greeting}!`, specialGoodbye.locale);
    cardText = `${preGoodbyeSpeechText} ${specialGoodbye.greeting} ${postGoodbyeSpeechText}`;
    const randomVoice = randomize(specialGoodbye.voice);
    speechOutput = `${preGoodbyeSpeechText} ${switchVoice(langSpecialGoodbye, randomVoice)} ${postGoodbyeSpeechText}.`;
    sessionAttributes.goodbyesUsed += 1;
    attributesManager.setSessionAttributes(sessionAttributes);
  } else {
    console.log("No premium goodbyes available");
    const goodbyes = [
      'OK.  Goodbye!',
      'Have a great day!',
      'Come back again soon!',
    ];
    speechOutput = randomize(goodbyes);
  }

  return handlerInput.responseBuilder
    .speak(speechOutput)
    .withShouldEndSession(true)
    .getResponse();

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

function getSpeakableListOfProducts(entitledProductsList) {
  console.log('Function: getSpeakableListOfProducts');
  const productNameList = entitledProductsList.map(item => item.name);
  let productListSpeech = productNameList.join(', '); // Generate a single string with comma separated product names
  productListSpeech = productListSpeech.replace(/_([^_]*)$/, 'and $1'); // Replace last comma with an 'and '
  return productListSpeech;
}

function getResponseBasedOnAccessType(handlerInput, res, preSpeechText) {
  console.log('Function: getResponseBasedOnAccessType');
  // The filter() method creates a new array with all elements that pass the test implemented by the provided function.
  const greetingsPackProduct = res.inSkillProducts.filter(
    record => record.referenceName === 'Greetings_Pack',
  );

  const premiumSubscriptionProduct = res.inSkillProducts.filter(
    record => record.referenceName === 'Premium_Subscription',
  );

  let speechOutput;
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
    speechOutput = `${preGreetingSpeechText} ${switchVoice(langSpecialGreeting, randomVoice)} ${postGreetingSpeechText} ${getRandomYesNoQuestion()}`;
    repromptOutput = `${getRandomYesNoQuestion()}`;
  } else if (isEntitled(greetingsPackProduct)) {
    // Customer has bought the Greetings Pack, but not the Premium Subscription. Return special hello greeting in Alexa voice
    cardText = `${preGreetingSpeechText} ${specialGreeting.greeting} ${postGreetingSpeechText}`;
    speechOutput = `${preGreetingSpeechText} ${langSpecialGreeting} ${postGreetingSpeechText} ${getRandomYesNoQuestion()}`;
    repromptOutput = `${getRandomYesNoQuestion()}`;
  } else {
    // Customer has bought neither the Premium Subscription nor the Greetings Pack Product.
    const theGreeting = getSimpleHello();
    // Determine if upsell should be made. returns true/false
    if (shouldUpsell(handlerInput) && greetingsPackProduct[0]) {
      console.log("Triggering upsell" + JSON.stringify(greetingsPackProduct));
      // Say the simple greeting, and then Upsell Greetings Pack
      speechOutput = `Here's your simple greeting: ${theGreeting}. By the way, you can now get greetings in more languages.`;
      return makeUpsell(speechOutput, greetingsPackProduct, handlerInput);
    }

    // Do not make the upsell. Just return Simple Hello Greeting.
    cardText = `Here's your simple greeting: ${theGreeting}.`;
    speechOutput = `Here's your simple greeting: ${theGreeting}. ${getRandomYesNoQuestion()}`;
    repromptOutput = `${getRandomYesNoQuestion()}`;
  }

  return handlerInput.responseBuilder
    .speak(speechOutput)
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

function isPurchasable(product) {
  return isProduct(product) && product[0].purchasable === 'PURCHASABLE';
}

function getAllEntitledProducts(inSkillProductList) {
  console.log('Function: getAllEntitledProducts');
  return inSkillProductList.filter(record => record.entitled === 'ENTITLED');
}

function getAllPurchasableProducts(inSkillProductList) {
  console.log('Function: getAllPurchasableProducts');
  return inSkillProductList.filter(record => record.purchasable === 'PURCHASABLE');
}

function makeUpsell(preUpsellMessage, product, handlerInput) {
  console.log('Function: makeUpsell');
  const upsellMessage = `${preUpsellMessage} ${product[0].summary} ${getRandomLearnMorePrompt()}`;

  return handlerInput.responseBuilder
    .addDirective({
      type: 'Connections.SendRequest',
      name: 'Upsell',
      payload: {
        InSkillProduct: {
          productId: product[0].productId,
        },
        upsellMessage,
      },
      token: 'correlationToken',
    })
    .getResponse();
}

function makeBuyOffer(theProduct, handlerInput) {
  console.log('Function: makeBuyOffer');
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
  console.log('Function: shouldUpsell');
  if (handlerInput.requestEnvelope.request.intent === undefined) {
    // If the last intent was Connections.Response, do not upsell
    return false;
  }
  return randomize([true, false]); // randomize upsell
}

function switchVoice(speakOutput, voiceName) {
  if (speakOutput && voiceName) {
    return `<voice name="${voiceName}">${speakOutput}</voice>`;
  }
  return speakOutput;
}

function switchLanguage(speakOutput, locale) {
  if (speakOutput && locale) {
    return `<lang xml:lang="${locale}">${speakOutput}</lang>`;
  }
  return speakOutput;
}

function getBuyResponseText(productReferenceName, productName) {
  console.log('Function: getBuyResponseText');
  switch(productReferenceName){
    case 'Greetings_Pack':
      return `With the ${productName}, I can now say hello in a variety of languages.`;
    case 'Premium_Subscription':
      return `With the ${productName}, I can now say hello in a variety of languages, in different accents using Amazon Polly.`;
    case 'Goodbyes_Pack':
      return `With the ${productName}, I can now say goodbye in a variety of languages, in different accents using Amazon Polly.`;
    default: 
      console.log('Product Unknown');
     return '';
  }
}

// *****************************************
// *********** Interceptors ************
// *****************************************

const LoadAttributesRequestInterceptor = {
  async process(handlerInput) {
    console.log('Interceptor: LoadAttributesRequestInterceptor');
      const {attributesManager, requestEnvelope} = handlerInput;
      if(requestEnvelope.session['new']){ //is this a new session? this check is not enough if using auto-delegate
          const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
          console.log("Retrieved persistentAttributes: " + JSON.stringify(persistentAttributes));
          //copy persistent attribute to session attributes
          attributesManager.setSessionAttributes(persistentAttributes);
      }
  }
};

const SaveAttributesResponseInterceptor = {
  async process(handlerInput, response) {
      console.log('Interceptor: SaveAttributesResponseInterceptor');
      if(!response) return; // avoid intercepting calls that have no outgoing response due to errors
      const {attributesManager, requestEnvelope} = handlerInput;
      const sessionAttributes = attributesManager.getSessionAttributes();
      const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession); //is this a session end?
      if((shouldEndSession || requestEnvelope.request.type === 'SessionEndedRequest') && Object.keys(sessionAttributes).length > 0) { // skill was stopped or timed out
          attributesManager.setPersistentAttributes(sessionAttributes);
          console.log("Saving persistent attributes: " + JSON.stringify(sessionAttributes));
          await attributesManager.savePersistentAttributes();
      }
  }
};


module.exports = {
    isEntitled,
    isPurchasable,
    isProduct,
    makeUpsell,
    getAllEntitledProducts,
    getAllPurchasableProducts,
    shouldUpsell,
    makeBuyOffer,
    SaveAttributesResponseInterceptor,
    LoadAttributesRequestInterceptor,
    getBuyResponseText,
    switchLanguage,
    switchVoice,
    getResponseBasedOnAccessType,
    getSpeakableListOfProducts,
    getRandomLearnMorePrompt,
    getRandomYesNoQuestion,
    getPremiumOrRandomGoodbye,
    getRemainingCredits,
    getSpecialHello,
    getSpecialGoodbye,
    getSimpleHello,
    randomize,
    skillName,
    GOODBYES_PER_ENTITLEMENT
}