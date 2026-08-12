import { SmsProvider } from "./types";
import { DummySmsProvider } from "./dummy";

// Optional: import { TwilioSmsProvider } from "./twilio";

let providerInstance: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (providerInstance) {
    return providerInstance;
  }

  const providerType = process.env.SMS_PROVIDER || "dummy";

  switch (providerType.toLowerCase()) {
    case "dummy":
      providerInstance = new DummySmsProvider();
      break;
    
    // case "twilio":
    //   providerInstance = new TwilioSmsProvider();
    //   break;
      
    default:
      console.warn(`Unknown SMS_PROVIDER '${providerType}'. Falling back to 'dummy'.`);
      providerInstance = new DummySmsProvider();
      break;
  }

  return providerInstance;
}
