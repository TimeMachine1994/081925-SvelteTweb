import { encodeBase32LowerCase } from "@oslojs/encoding";
function generateId() {
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  return encodeBase32LowerCase(bytes);
}
export {
  generateId as g
};
