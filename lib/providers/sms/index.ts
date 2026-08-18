import { SmsProvider } from "./types";
import { ExotelSmsProvider } from "./exotel";

let providerInstance: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (providerInstance) {
    return providerInstance;
  }

  // Always use real Exotel SMS provider
  providerInstance = new ExotelSmsProvider();
  return providerInstance;
}
