import { describe, it, expect } from 'vitest';
import { parseAuthError } from '../services/authService';
import { validateUsername } from '../services/userService';

describe('Auth Error Handler', () => {
  it('converts Firebase invalid-email error code to readable message', () => {
    const error = { code: 'auth/invalid-email' };
    expect(parseAuthError(error)).toBe('Please enter a valid email address.');
  });

  it('converts Firebase weak-password error code to readable message', () => {
    const error = { code: 'auth/weak-password' };
    expect(parseAuthError(error)).toBe('Password should be at least 6 characters long.');
  });

  it('converts Firebase email-already-in-use error code to readable message', () => {
    const error = { code: 'auth/email-already-in-use' };
    expect(parseAuthError(error)).toBe('An account with this email address already exists.');
  });

  it('converts Firebase wrong-password error code to readable message', () => {
    const error = { code: 'auth/wrong-password' };
    expect(parseAuthError(error)).toBe('Invalid email or password.');
  });

  it('converts Firebase too-many-requests error code to readable message', () => {
    const error = { code: 'auth/too-many-requests' };
    expect(parseAuthError(error)).toBe('Too many failed login attempts. Please try again later.');
  });
});

describe('Username Validation Rules', () => {
  it('accepts valid lowercase usernames with numbers and underscores', () => {
    expect(validateUsername('artist_123').valid).toBe(true);
    expect(validateUsername('canvas_creator').valid).toBe(true);
  });

  it('rejects usernames that are too short or too long', () => {
    expect(validateUsername('ab').valid).toBe(false);
    expect(validateUsername('a'.repeat(25)).valid).toBe(false);
  });

  it('rejects usernames containing uppercase, spaces or special characters', () => {
    expect(validateUsername('Artist').valid).toBe(false);
    expect(validateUsername('artist 123').valid).toBe(false);
    expect(validateUsername('artist!').valid).toBe(false);
  });

  it('rejects reserved system usernames', () => {
    expect(validateUsername('admin').valid).toBe(false);
    expect(validateUsername('artflow').valid).toBe(false);
    expect(validateUsername('support').valid).toBe(false);
  });
});
