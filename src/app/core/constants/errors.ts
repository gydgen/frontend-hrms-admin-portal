/**
 * Maps Angular/custom validator error keys to a human-readable message. Used by
 * `FieldErrorComponent` and the `@AsyncCheckFormValidity` decorator so error copy is
 * defined once instead of hand-written per form. Plain English, not translation keys —
 * this project doesn't wire i18n/Transloco.
 */
export const ERROR_TRANSLATIONS: Record<string, string> = {
  required: 'This field is required.',
  email: 'Enter a valid email address.',
  minlength: 'This value is too short.',
  maxlength: 'This value is too long.',
  min: 'This value is too low.',
  max: 'This value is too high.',
  pattern: 'This value is not in the correct format.',
  equal: 'These values must match.',
  uniqueName: 'This name is already in use.',
};

export const DEFAULT_ERROR_TRANSLATION = 'Please check the highlighted fields and try again.';
