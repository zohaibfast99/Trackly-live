import { randomInt } from "crypto";

// Alphanumeric alphabet (no ambiguous URL characters).
const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// 16 chars over a 62-symbol alphabet ≈ 95 bits of entropy.
const CODE_LENGTH = 16;

export const generateInviteCode = () => {
  let inviteCode = "";

  for (let i = 0; i < CODE_LENGTH; i++) {
    // crypto.randomInt is a CSPRNG and returns an unbiased index.
    const randomIndex = randomInt(ALPHABET.length);
    inviteCode += ALPHABET[randomIndex];
  }

  return inviteCode;
};
