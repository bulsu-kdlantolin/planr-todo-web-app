import { describe, it, expect, beforeEach } from 'vitest';
import { useMetaStore } from './useMetaStore';

describe('useMetaStore', () => {
  beforeEach(() => {
    useMetaStore.getState().setUser({
      name: 'Test User',
      email: 'test@planr.app',
      title: 'Productivity User',
      tagline: 'Simple Focus',
      isLoggedIn: false
    });
    useMetaStore.getState().setSettings({
      theme: 'light',
      timeFormat: '12h',
      soundEffects: true,
      soundVolume: 0.5,
      focusDuration: 25,
      deepFocusDuration: 50,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: false,
      notificationsEnabled: false,
      shortcuts: {}
    });
  });

  it('updates user profile metadata', async () => {
    await useMetaStore.getState().updateUser({
      name: 'Alex Morgan',
      title: 'Senior Architect',
      isLoggedIn: true
    });

    const user = useMetaStore.getState().user;
    expect(user.name).toBe('Alex Morgan');
    expect(user.title).toBe('Senior Architect');
    expect(user.isLoggedIn).toBe(true);
  });

  it('toggles theme between light and dark', () => {
    expect(useMetaStore.getState().settings.theme).toBe('light');
    useMetaStore.getState().toggleTheme();
    expect(useMetaStore.getState().settings.theme).toBe('dark');
    useMetaStore.getState().toggleTheme();
    expect(useMetaStore.getState().settings.theme).toBe('light');
  });

  it('updates daily focus intention', async () => {
    await useMetaStore.getState().updateIntention('Ship high-quality code today.');
    expect(useMetaStore.getState().intention).toBe('Ship high-quality code today.');
  });
});
