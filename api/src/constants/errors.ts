/**
 * Constantes de respuestas de errores
 */
import { ShippmentError } from "../libs/error";

// Constante de error generico
export const GENERIC_ERROR_CODE = 4000;

export const MISSING_REQUEST_CREDENTIALS_ERROR_CODE = 2000;
export const INVALID_CREDENTIALS_ERROR_CODE = 2001;
export const MISSING_TOKEN_ERROR_CODE = 2004;
export const INVALID_TOKEN_ERROR_CODE = 2005;
export const VALIDATION_ERROR_CODE = 2100;

/**
 * Revisar estas constantes
 */
//TODO: revisar todas estas constantes.
export const genericError =
  "Ha ocurrido un error inesperado, por favor intente nuevamente..";

// Constante de JSON Mal formado
export const JSON_PARSE_FAILED_ERROR_CODE = 3999;

export const MISSING_REQUEST_CREDENTIALS_ERROR = new ShippmentError({
  ack: 2000,
  message: "Falta enviar header de la Autorización",
});

export const MISSING_TOKEN_ERROR = new ShippmentError({
  ack: MISSING_TOKEN_ERROR_CODE,
  message: "Se debe enviar un Access Token",
});

export const INVALID_TOKEN_ERROR = new ShippmentError({
  ack: INVALID_TOKEN_ERROR_CODE,
  message: "Token de acceso invalido",
});

export const CREDENTIALS_NOT_FOUND_ERROR = new ShippmentError({
  ack: 2007,
  message: "Falta enviar las credenciales",
});

export const JSON_PARSE_FAILED_ERROR = new ShippmentError({
  ack: JSON_PARSE_FAILED_ERROR_CODE,
  message: "Estructura del JSON invalida",
});

export const INVALID_CREDENTIALS_ERROR = new ShippmentError({
  ack: INVALID_CREDENTIALS_ERROR_CODE,
  message: "Credenciales invalidas",
});

export const INTERNAL_SERVER_ERROR = new ShippmentError({
  ack: JSON_PARSE_FAILED_ERROR_CODE,
  message: "Error interno del servidor: ${message}",
});

export const GENERIC_ERROR = new ShippmentError({
  ack: GENERIC_ERROR_CODE,
  message: "${message}",
});

export const INVALID_FIELD_VALUE_ERROR = new ShippmentError({
  ack: 2050,
  message: "${message} no contiene un valor válido",
});

export const VALIDATION_ERROR = new ShippmentError({
  ack: VALIDATION_ERROR_CODE,
  message: "Error de validación: ${message}",
});

export const OPERATION_NUMBER_ERROR = new ShippmentError({
  ack: 2102,
  message: "No se encontró un numerador disponible para numerar la operación",
});

export const INVALID_DATA_TYPE_ERROR = new ShippmentError({
  ack: 2103,
  message: "${message} tipo de dato invalido",
});
