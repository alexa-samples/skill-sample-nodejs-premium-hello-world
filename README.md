# Build An Alexa Skill with In-Skill Purchases - Premium Hello World
<img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/fact/header._TTH_.png" />

Adding premium content to your skill is a way for you to monetize your skill.  This Alexa sample skill is a template for a basic ISP skill. It takes the hello world skill and adds greetings in a variety of languages as premium content. This premium content is accessed through a one-time purchase of the "Greetings Pack". It also includes a monthly "Premium Subscription", which greets the customer in multiple languages in a variety of voices using Amazon Polly. Finally, the third type of ISP product is also included (Consumables) as a "Goodbyes Pack" so you get goodbyes in different languages a limited number of times (note that the consumables are tracked in DynamoDB and you need to grant DynamoDB access to your skill Lambda role).

## Skill Architecture
Each skill consists of two basic parts, a front end and a back end.
1. The front end is the voice interface, or VUI. The voice interface is configured through the voice interaction model.
2. The back end is where the logic of your skill resides.

## Three Options for Skill Setup
There are a number of different ways for you to setup your skill, depending on your experience and what tools you have available - Alexa Hosted, AWS Hosted, ASK CLI. For this Hello World Skill, we will be using the Alexa Hosted option. If you'd like to  use the AWS Hosted, or ASK CLI methods, you can check out the instructions here for the Sample Fact skill - [AWS Hosted Instructions](https://github.com/alexa/skill-sample-nodejs-fact/blob/master/instructions/setup-vui-aws-hosted.md) | [ASK CLI instructions](https://github.com/alexa/skill-sample-nodejs-fact/blob/master/instructions/cli.md). If you don't use Alexa Hosted you'll have to add DynamoDB access permissions to your lambda role (as consumables are tracked in persistent storage).


## Alexa Hosted
With an Alexa-hosted skill, you can build, edit, and publish a skill without leaving the developer console. The skill includes a code editor for managing and deploying the backend code for your skill. For details on what the Alexa-Hosted skills service provides, open this page in a new tab.

To **Get Started** using the Alexa Developer Console, click the button below:

[![Get Started](./getting-started.png)](./instructions/1-setup-vui-alexa-hosted.md)

## Additional Resources

### Community
* [Amazon Developer Forums](https://forums.developer.amazon.com/spaces/165/index.html) - Join the conversation!
* [Hackster.io](https://www.hackster.io/amazon-alexa) - See what others are building with Alexa.

### Tutorials & Guides
* [Voice Design Guide](https://developer.amazon.com/designing-for-voice/) - A great resource for learning conversational and voice user interface design.
* [Codecademy: Learn Alexa](https://www.codecademy.com/learn/learn-alexa) - Learn how to build an Alexa Skill from within your browser with this beginner friendly tutorial on Codecademy!

### Documentation
* [Official Alexa Skills Kit SDK for Node.js](http://alexa.design/node-sdk-docs) - The Official Node.js SDK Documentation
* [Official Alexa Skills Kit Documentation](https://developer.amazon.com/docs/ask-overviews/build-skills-with-the-alexa-skills-kit.html) - Official Alexa Skills Kit Documentation
