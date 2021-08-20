/* eslint-disable @typescript-eslint/ban-types */
const handles = (requestType: Function) => {
  return (ctor: Function): void => {
    ctor.prototype.__REQUEST_TYPE__ = requestType.prototype.constructor.name;
  };
};

export { handles };
