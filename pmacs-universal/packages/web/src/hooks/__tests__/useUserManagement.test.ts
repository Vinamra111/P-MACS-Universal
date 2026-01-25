import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserManagement } from '../useUserManagement';

// Mock fetch
global.fetch = jest.fn();

describe('useUserManagement', () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'User created' }),
      });

      const { result } = renderHook(() => useUserManagement(mockOnRefresh));

      await act(async () => {
        await result.current.createUser({
          empId: 'N001',
          name: 'John Doe',
          role: 'Nurse',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.message).toEqual({
          type: 'success',
          text: 'User created',
        });
      });

      expect(mockOnRefresh).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/users',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should validate required fields', async () => {
      const { result } = renderHook(() => useUserManagement(mockOnRefresh));

      await act(async () => {
        await result.current.createUser({
          empId: '',
          name: '',
          role: 'Nurse',
          password: '',
        });
      });

      expect(result.current.message).toEqual({
        type: 'error',
        text: 'All fields are required',
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      const { result } = renderHook(() => useUserManagement(mockOnRefresh));

      await act(async () => {
        await result.current.createUser({
          empId: 'N001',
          name: 'John Doe',
          role: 'Nurse',
          password: '123', // Too short
        });
      });

      expect(result.current.message).toEqual({
        type: 'error',
        text: 'Password must be at least 4 characters',
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should validate employee ID format', async () => {
      const { result } = renderHook(() => useUserManagement(mockOnRefresh));

      await act(async () => {
        await result.current.createUser({
          empId: 'invalid',
          name: 'John Doe',
          role: 'Nurse',
          password: 'password123',
        });
      });

      expect(result.current.message).toEqual({
        type: 'error',
        text: 'Employee ID format: N001, P001, M001 (letter + numbers)',
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'User already exists' }),
      });

      const { result } = renderHook(() => useUserManagement(mockOnRefresh));

      await act(async () => {
        await result.current.createUser({
          empId: 'N001',
          name: 'John Doe',
          role: 'Nurse',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.message).toEqual({
          type: 'error',
          text: 'User already exists',
        });
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useUserManagement(mockOnRefresh));

      await act(async () => {
        await result.current.createUser({
          empId: 'N001',
          name: 'John Doe',
          role: 'Nurse',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(result.current.message).toEqual({
          type: 'error',
          text: 'Network error occurred',
        });
      });
    });
  });

  describe('whitelistUser', () => {
    it('should whitelist a user successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'User whitelisted' }),
      });

      const { result } = renderHook(() => useUserManagement(mockOnRefresh));

      await act(async () => {
        await result.current.whitelistUser('N001');
      });

      await waitFor(() => {
        expect(result.current.message).toEqual({
          type: 'success',
          text: 'User whitelisted',
        });
      });

      expect(mockOnRefresh).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/users',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ empId: 'N001', action: 'WHITELIST' }),
        })
      );
    });
  });

  describe('blacklistUser', () => {
    it('should blacklist a user successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'User blacklisted' }),
      });

      const { result } = renderHook(() => useUserManagement(mockOnRefresh));

      await act(async () => {
        await result.current.blacklistUser('N001');
      });

      await waitFor(() => {
        expect(result.current.message).toEqual({
          type: 'success',
          text: 'User blacklisted',
        });
      });

      expect(mockOnRefresh).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/users',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ empId: 'N001', action: 'BLACKLIST' }),
        })
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'User deleted' }),
      });

      const { result } = renderHook(() => useUserManagement(mockOnRefresh));

      await act(async () => {
        await result.current.deleteUser('N001');
      });

      await waitFor(() => {
        expect(result.current.message).toEqual({
          type: 'success',
          text: 'User deleted',
        });
      });

      expect(mockOnRefresh).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/users?empId=N001',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('loading state', () => {
    it('should set loading to true during API call', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => ({ success: true }) }), 100)
          )
      );

      const { result } = renderHook(() => useUserManagement(mockOnRefresh));

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.whitelistUser('N001');
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});
