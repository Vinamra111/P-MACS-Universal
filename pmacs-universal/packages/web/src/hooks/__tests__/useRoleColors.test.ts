import { useRoleColors } from '../useRoleColors';

describe('useRoleColors', () => {
  it('should return violet colors for Nurse role', () => {
    const colors = useRoleColors('Nurse');

    expect(colors.bg).toBe('bg-violet-600');
    expect(colors.bgHover).toBe('hover:bg-violet-700');
    expect(colors.bgActive).toBe('bg-violet-50');
    expect(colors.textActive).toBe('text-violet-700');
    expect(colors.border).toBe('border-violet-500');
    expect(colors.ring).toBe('focus:ring-violet-500');
    expect(colors.badge).toBe('bg-violet-100 text-violet-700');
  });

  it('should return cyan colors for Pharmacist role', () => {
    const colors = useRoleColors('Pharmacist');

    expect(colors.bg).toBe('bg-cyan-600');
    expect(colors.bgHover).toBe('hover:bg-cyan-700');
    expect(colors.bgActive).toBe('bg-cyan-50');
    expect(colors.textActive).toBe('text-cyan-700');
    expect(colors.border).toBe('border-cyan-500');
    expect(colors.ring).toBe('focus:ring-cyan-500');
    expect(colors.badge).toBe('bg-cyan-100 text-cyan-700');
  });

  it('should return orange colors for Master role', () => {
    const colors = useRoleColors('Master');

    expect(colors.bg).toBe('bg-orange-600');
    expect(colors.bgHover).toBe('hover:bg-orange-700');
    expect(colors.bgActive).toBe('bg-orange-50');
    expect(colors.textActive).toBe('text-orange-700');
    expect(colors.border).toBe('border-orange-500');
    expect(colors.ring).toBe('focus:ring-orange-500');
    expect(colors.badge).toBe('bg-orange-100 text-orange-700');
  });

  it('should have all required color properties', () => {
    const colors = useRoleColors('Nurse');

    expect(colors).toHaveProperty('bg');
    expect(colors).toHaveProperty('bgHover');
    expect(colors).toHaveProperty('bgActive');
    expect(colors).toHaveProperty('textActive');
    expect(colors).toHaveProperty('border');
    expect(colors).toHaveProperty('ring');
    expect(colors).toHaveProperty('badge');
  });
});
