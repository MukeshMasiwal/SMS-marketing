import { ISMSProvider } from "./provider";
import { DummySMSProvider } from "./dummy-provider";
// import { TwilioSMSProvider } from "./twilio-provider"; // To be added later

let providerInstance: ISMSProvider | null = null;

export function getSMSProvider(): ISMSProvider {
  if (providerInstance) {
    return providerInstance;
  }

  const providerType = process.env.SMS_PROVIDER || "dummy";

  if (providerType === "dummy") {
    providerInstance = new DummySMSProvider();
  } else if (providerType === "twilio") {
    // providerInstance = new TwilioSMSProvider();
    throw new Error("Twilio provider is not yet implemented.");
  } else {
    throw new Error(`Unsupported SMS provider: ${providerType}`);
  }

  return providerInstance;
}
