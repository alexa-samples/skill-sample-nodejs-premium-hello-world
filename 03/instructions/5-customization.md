# Build An Alexa Skill with In-Skill Purchases - Premium Hello World
<img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/header._TTH_.png" />

## Customization / Next Steps

At this point, you should have a working copy of your skill. This is a clone of a sample skill, so if you want to publish the skill, you will first need to customize it so it offers content/functionality not currently available via the Alexa Skill Store.

### Update greetings for "Greetings Pack"

You can expand the "Greetings pack" with greetings in more languages by updating the object `special_greetings` inside index.js.
  ```
  const special_greetings = [
    { language: "hindi", greeting: "Namaste" },
    { language: "french", greeting: "Bonjour" },
    { language: "spanish", greeting: "Hola" },
    { language: "japanese", greeting: "Konichiwa" },
    { language: "italian", greeting: "Ciao" }
  ];
```
## Update/Create In-Skill Products

In the developer console, switch to the **In-Skill Products** sub-section of the **Build** tab.  Unlink/delete/modify products you don't intend to keep in your skill.  Repeat the process we used to add new in-skill products which match your categories.

### In-Skill Product Testing Instructions and Other Placeholders

You may recall we didn't provide testing instructions for our sample in-skill products.  When you are updating your in-skill products, be sure to include those testing instructions.  It does not have to be complex.  At a minimum, provide a simple scenario for how to invoke your skill and request your in-skill product.

Also update the privacy policy, icons and other placeholder values used as part of the sample.  As previously mentioned, your skill won't pass certification with placeholder values.

## Test, Test, Test

After making the above changes, be sure to test thoroughly.  After you're done testing, have a friend or colleague test as well.

## Publication

Once you've customized your skill, proceed to the certification / publication step.

[![Next](./next.png)](./6-submit-for-certification.md)
