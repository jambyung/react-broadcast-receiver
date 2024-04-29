/**
 * Generate a v4 uuid
 * ref: https://www.geeksforgeeks.org/how-to-create-a-guid-uuid-in-javascript/
 *
 * @returns {string} v4 uuid string
 */
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
