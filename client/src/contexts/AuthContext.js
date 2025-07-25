import React, { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as authAPI from '../services/authAPI';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,
  isAuthenticated: false,
};

// Action types
const AUTH_ACTIONS = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.AUTH_LOGOUT:
      return {
        ...initialState,
        loading: false,
        token: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Save token to localStorage when it changes
  useEffect(() => {
    if (state.token) {
      localStorage.setItem('token', state.token);
      // Set default authorization header
      authAPI.setAuthToken(state.token);
    } else {
      localStorage.removeItem('token');
      authAPI.setAuthToken(null);
    }
  }, [state.token]);

  // Check authentication status
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      return;
    }

    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });
      
      // Set token for API calls
      authAPI.setAuthToken(token);
      
      // Verify token and get user data
      const response = await authAPI.getCurrentUser();
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: {
          user: response.data.user,
          token: token,
        },
      });

    } catch (error) {
      console.error('Auth check failed:', error);
      
      // Token is invalid, remove it
      localStorage.removeItem('token');
      authAPI.setAuthToken(null);
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_FAILURE,
        payload: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
      });
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });
      
      const response = await authAPI.login(credentials);
      
      const { user, token } = response.data;
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: { user, token },
      });

      // Show success message
      toast.success(`¡Bienvenido${user.userType === 'tecnico' ? ' técnico' : ''}, ${user.firstName}!`);
      
      return { success: true, user };

    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_FAILURE,
        payload: errorMessage,
      });

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });
      
      const response = await authAPI.register(userData);
      
      const { user, token } = response.data;
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: { user, token },
      });

      // Show success message
      const message = user.userType === 'tecnico' 
        ? 'Cuenta creada exitosamente. Su certificación SEC será verificada en las próximas 24 horas.'
        : 'Cuenta creada exitosamente. ¡Bienvenido!';
      
      toast.success(message);
      
      return { success: true, user };

    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al crear la cuenta';
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_FAILURE,
        payload: errorMessage,
      });

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // ClaveÚnica login
  const loginWithClaveUnica = async (authData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });
      
      const response = await authAPI.loginWithClaveUnica(authData);
      
      const { user, token } = response.data;
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_SUCCESS,
        payload: { user, token },
      });

      toast.success(`¡Bienvenido, ${user.firstName}! Autenticado con ClaveÚnica`);
      
      return { success: true, user };

    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error en autenticación con ClaveÚnica';
      
      dispatch({
        type: AUTH_ACTIONS.AUTH_FAILURE,
        payload: errorMessage,
      });

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API if user is authenticated
      if (state.isAuthenticated) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    }

    // Clear local state regardless of API call result
    dispatch({ type: AUTH_ACTIONS.AUTH_LOGOUT });
    
    // Clear localStorage
    localStorage.removeItem('token');
    authAPI.setAuthToken(null);
    
    toast.success('Sesión cerrada correctamente');
  };

  // Update user profile
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData,
    });
  };

  // Clear authentication error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await authAPI.forgotPassword({ email });
      toast.success('Si el email existe, recibirás un enlace de restablecimiento');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al enviar enlace de restablecimiento';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      await authAPI.resetPassword({ token, password });
      toast.success('Contraseña restablecida exitosamente');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error al restablecer contraseña';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.userType === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.userType);
  };

  // Check if technician has valid SEC certification
  const hasValidSecCertification = () => {
    if (!state.user || state.user.userType !== 'tecnico') {
      return false;
    }

    const cert = state.user.secCertification;
    if (!cert) return false;

    return cert.verified && new Date(cert.expirationDate) > new Date();
  };

  // Get user's full name
  const getUserDisplayName = () => {
    if (!state.user) return '';
    return `${state.user.firstName} ${state.user.lastName}`;
  };

  // Get user's role display name
  const getUserRoleDisplayName = () => {
    const roleNames = {
      cliente: 'Cliente',
      tecnico: 'Técnico SEC',
      admin: 'Administrador',
    };
    return roleNames[state.user?.userType] || 'Usuario';
  };

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,

    // Actions
    login,
    register,
    loginWithClaveUnica,
    logout,
    updateUser,
    clearError,
    forgotPassword,
    resetPassword,
    checkAuthStatus,

    // Helper functions
    hasRole,
    hasAnyRole,
    hasValidSecCertification,
    getUserDisplayName,
    getUserRoleDisplayName,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export context for testing
export { AuthContext };