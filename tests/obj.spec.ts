import { expect } from "chai";
import { ObjectClass } from "./obj";

describe('test Object test', () => {
  let obj: ObjectClass;
  before(() => {
    obj = new ObjectClass(5);
  });
  it('Should exist', () => {
    expect(obj).exist;
  });
  it('Should multiplay correctly', () => {
    const result = obj.multiply(4);
    expect(result).to.equals(20);
  });
});
