import { ObjectId } from "mongodb";

export function toObjectId(value: string | ObjectId | undefined | null): ObjectId | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (!ObjectId.isValid(value)) return null;
  return new ObjectId(value);
}
