import Prelude from "@prelude.so/sdk";

function getClient() {
  return new Prelude({ apiToken: process.env.PRELUDE_API_KEY });
}

export async function sendOtp(phone: string): Promise<void> {
  const client = getClient();
  await client.verification.create({
    target: { type: "phone_number", value: phone },
  });
}

export async function checkOtp(phone: string, code: string): Promise<boolean> {
  const client = getClient();
  const result = await client.verification.check({
    target: { type: "phone_number", value: phone },
    code,
  });
  return result.status === "success";
}
