const skillName = 'Premium Hello World';

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
      language: 'hindi', greeting: 'alavida', locale: 'en-IN', voice: ['Aditi', 'Raveena'],
    },
    {
      language: 'german', greeting: 'auf wiedersehen', locale: 'de-DE', voice: ['Hans', 'Marlene', 'Vicki'],
    },
    {
      language: 'spanish', greeting: 'hasta luego', locale: 'es-ES', voice: ['Conchita', 'Enrique'],
    },
    {
      language: 'french', greeting: 'au revoir', locale: 'fr-FR', voice: ['Celine', 'Lea', 'Mathieu'],
    },
    {
      language: 'japanese', greeting: 'sayonara', locale: 'ja-JP', voice: ['Mizuki', 'Takumi'],
    },
    {
      language: 'italian', greeting: 'arrivederci', locale: 'it-IT', voice: ['Carla', 'Giorgio'],
    },
  ];
  return randomize(specialGoodbyes);
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

function getGoodbyesCount(handlerInput, goodbyesPackProduct){  

  const {attributesManager} = handlerInput;
  const sessionAttributes = attributesManager.getSessionAttributes();
      
  const activeEntitlementCount = goodbyesPackProduct[0] ? goodbyesPackProduct[0].activeEntitlementCount : 0;
  const goodbyesUsed = parseInt(sessionAttributes.goodbyesUsed) || 0;
  const goodbyesAvailable = Math.max(0, activeEntitlementCount * 3 - goodbyesUsed);
  
  if (goodbyesAvailable > 0){
    sessionAttributes.goodbyesUsed = goodbyesUsed + 1;
    attributesManager.setSessionAttributes(sessionAttributes);
  }
  return goodbyesAvailable;
  
  
}

function getPremiumOrRandomGoodbye(handlerInput, res) {

  const goodbyesPackProduct = res.inSkillProducts.filter(
    record => record.referenceName === 'Goodbyes_Pack'
  );

  const availableGoodbyes = parseInt(getGoodbyesCount(handlerInput, goodbyesPackProduct)) || 0;

  let speechText;
  let cardText;

  if (availableGoodbyes > 0){

    const specialGoodbye = getSpecialGoodbye();
    const preGoodbyeSpeechText = `Here's your special goodbye: `;
    const postGoodbyeSpeechText = `That's goodbye in ${specialGoodbye.language}`;
    const langSpecialGoodbye = switchLanguage(`${specialGoodbye.greeting}!`, specialGoodbye.locale);
    cardText = `${preGoodbyeSpeechText} ${specialGoodbye.greeting} ${postGoodbyeSpeechText}`;
    const randomVoice = randomize(specialGoodbye.voice);
    speechText = `${preGoodbyeSpeechText} ${switchVoice(langSpecialGoodbye, randomVoice)} ${postGoodbyeSpeechText}.`;

  } else {
    console.log("No premium goodbyes available");
    const goodbyes = [
      'OK.  Goodbye!',
      'Have a great day!',
      'Come back again soon!',
    ];
    speechText = randomize(goodbyes);
  }

  return handlerInput.responseBuilder
    .speak(speechText)
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

  const premiumSubscriptionProduct = res.inSkillProducts.filter(
    record => record.referenceName === 'Premium_Subscription',
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
    if (shouldUpsell(handlerInput) && greetingsPackProduct[0]) {
      console.log("Triggering upsell" + JSON.stringify(greetingsPackProduct));
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

function makeUpsell(preUpsellMessage, product, handlerInput) {
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


const LoadAttributesRequestInterceptor = {
  async process(handlerInput) {
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
    isProduct,
    makeUpsell,
    getAllEntitledProducts,
    shouldUpsell,
    makeBuyOffer,
    SaveAttributesResponseInterceptor,
    LoadAttributesRequestInterceptor,
    LogRequestInterceptor,
    LogResponseInterceptor,
    getBuyResponseText,
    switchLanguage,
    switchVoice,
    getResponseBasedOnAccessType,
    getSpeakableListOfProducts,
    getRandomLearnMorePrompt,
    getRandomYesNoQuestion,
    getPremiumOrRandomGoodbye,
    getGoodbyesCount,
    getSpecialHello,
    getSpecialGoodbye,
    getSimpleHello,
    randomize,
    skillName
}