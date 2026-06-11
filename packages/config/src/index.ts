export const APP_NAME = 'adda';

export const API_PORT = parseInt(process.env.API_PORT || '4000', 10);
export const WEB_PORT = parseInt(process.env.WEB_PORT || '3000', 10);

export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_PROD = process.env.NODE_ENV === 'production';
export const IS_TEST = process.env.NODE_ENV === 'test';
