const CryptoJS = require('crypto-js');

const encryptPassword = (password: string) => {
  return CryptoJS.MD5(password).toString();
};

export {encryptPassword}