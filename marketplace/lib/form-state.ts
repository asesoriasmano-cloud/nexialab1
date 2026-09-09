/**
 * Estado compartido de los formularios.
 *
 * Vive fuera de `app/actions.ts` a proposito: un archivo "use server" solo
 * puede exportar funciones async, asi que el tipo y el valor inicial no
 * pueden estar ahi.
 */
export type FormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  /**
   * Lo que la persona alcanzo a escribir. React limpia los campos no
   * controlados despues de correr una action, asi que se devuelven aca y las
   * formas los vuelven a poner como `defaultValue`. Sin esto, un error de
   * validacion borra el formulario entero.
   */
  values?: Record<string, string>;
};

export const emptyFormState: FormState = { ok: false, message: "" };
