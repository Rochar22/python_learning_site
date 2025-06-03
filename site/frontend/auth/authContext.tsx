"use client"
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation"; // Для App Router в Next.js 13+

// Типы
type User = {
  id: number; // или string, в зависимости от бэкенда
  username: string;
  email: string;
  // Добавьте другие поля пользователя, если они есть
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean; // Общая загрузка состояния аутентификации
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>; // Экспортируем для использования вовне
};

// Контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Переменная для хранения Promise текущего запроса на обновление токена
// чтобы избежать множественных одновременных запросов на обновление
let refreshTokenPromise: Promise<boolean> | null = null;

// URL вашего бэкенда
const API_BASE_URL = 'http://localhost:5000/api'; // Убедитесь, что порт правильный

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Начальная загрузка для checkAuth
  const router = useRouter();

  // Функция для выхода пользователя
  const performLogout = useCallback(async (shouldRedirect = true, reason?: string) => {
    if (reason) {
      console.log(`Performing logout. Reason: ${reason}`);
    } else {
      console.log("Performing logout.");
    }
    
    setUser(null); // Сразу сбрасываем пользователя на клиенте
    
    // Очищаем promise, если он был
    refreshTokenPromise = null; 

    try {
      // Запрос на бэкенд для удаления серверных httpOnly cookies
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        // Если CSRF включен для logout, добавьте X-CSRF-TOKEN
      });
      console.log("Logout request to backend successful.");
    } catch (error) {
      console.error("Logout request to backend failed, but client state is cleared:", error);
    }
    
    if (shouldRedirect) {
      router.push('/login'); // Перенаправление на страницу входа
    }
  }, [router]);

  // Функция для попытки обновления токена
  const attemptRefreshToken = useCallback(async (): Promise<boolean> => {
    console.log("Attempting to refresh token...");
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        // Если CSRF включен для refresh, добавьте X-CSRF-TOKEN
        // headers: { 'X-CSRF-TOKEN': getCookie('csrf_refresh_token') } // Пример
      });

      if (refreshResponse.ok) {
        console.log("Token refreshed successfully.");
        // После успешного обновления, можно сразу запросить данные пользователя,
        // чтобы обновить состояние user, если оно еще не актуально
        // Это опционально и зависит от вашей логики.
        // await fetchUserData(); // Пример вызова функции для получения данных пользователя
        return true; // Токены обновлены (новые куки установлены сервером)
      } else {
        const errorText = await refreshResponse.text();
        console.error("Failed to refresh token:", refreshResponse.status, errorText);
        // Если refresh token невалиден или истек, разлогиниваем
        await performLogout(true, "Refresh token failed"); 
        return false;
      }
    } catch (error) {
      console.error('Error during token refresh request:', error);
      await performLogout(true, "Exception during refresh token request"); // Разлогиниваем при ошибке сети и т.п.
      return false;
    }
  }, [performLogout]);

  // Обертка для fetch, которая обрабатывает 401 и пытается обновить токен
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const requestUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`; // Позволяет использовать относительные пути
    
    const requestOptions: RequestInit = {
      ...options,
      credentials: 'include', // Всегда включаем credentials для отправки cookies
      headers: {
        ...(options.headers || {}),
        // Если CSRF включен и это не GET запрос, добавьте X-CSRF-TOKEN
        // 'X-CSRF-TOKEN': (options.method !== 'GET' && options.method !== 'HEAD') ? getCookie('csrf_access_token') : undefined,
      },
    };
    
    let response = await fetch(requestUrl, requestOptions);

    if (response.status === 401) {
        console.log(`Received 401 from ${requestUrl}, attempting token refresh...`);
        let refreshSuccessful = false;

        // Предотвращаем "гонку" за обновлением токена
        if (!refreshTokenPromise) {
            // Запускаем обновление и сохраняем promise
            refreshTokenPromise = attemptRefreshToken().finally(() => {
                // Сбрасываем promise после выполнения (успех или неудача)
                refreshTokenPromise = null; 
            });
        }
        
        try {
          refreshSuccessful = await refreshTokenPromise; // Ожидаем результат (boolean)
        } catch (e) {
          // Это не должно случиться, т.к. attemptRefreshToken сам обрабатывает ошибки,
          // но на всякий случай.
          console.error("Error awaiting refresh token promise:", e);
          refreshSuccessful = false;
        }

        if (refreshSuccessful) {
            console.log(`Retrying original request to ${requestUrl} after successful token refresh.`);
            // Повторяем оригинальный запрос с теми же опциями
            // (новые cookies будут автоматически подставлены браузером)
            response = await fetch(requestUrl, requestOptions);
        } else {
            console.log(`Still unauthorized for ${requestUrl} after refresh attempt or refresh failed.`);
            // performLogout уже был вызван внутри attemptRefreshToken в случае неудачи
            // Если текущий пользователь был (например, старая сессия), но рефреш не удался,
            // то setUser(null) уже должен был быть вызван в performLogout.
        }
    }
    return response;
  }, [attemptRefreshToken]); // performLogout не нужен здесь как прямая зависимость, т.к. он вызывается из attemptRefreshToken

  // Функция для получения данных пользователя (можно использовать после логина или обновления токена)
  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/users/me'); // Относительный путь
      if (response.ok) {
        const userData: User = await response.json();
        setUser(userData);
        return userData;
      } else {
        // Если даже после fetchWithAuth (который пытался рефрешнуть) не ок,
        // то performLogout уже должен был быть вызван.
        // Но для надежности можно еще раз проверить и сбросить user, если он есть.
        if (user) setUser(null);
        console.log("fetchUserData: Could not fetch user data, status:", response.status);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (user) setUser(null);
    }
    return null;
  }, [fetchWithAuth, user]); // user здесь для того, чтобы если он изменится, функция пересоздалась (хотя это спорно, fetchWithAuth важнее)

  // Проверка аутентификации при монтировании компонента
  useEffect(() => {
    const checkInitialAuth = async () => {
      console.log("AuthProvider mounted. Checking initial authentication...");
      setLoading(true);
      await fetchUserData(); // Пытаемся загрузить данные пользователя
      setLoading(false);
      console.log("Initial authentication check complete.");
    };

    checkInitialAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchUserData обернут в useCallback, поэтому здесь можно его указать, но т.к. он вызывается 1 раз, [] тоже ок.
           // Если fetchUserData зависит от чего-то, что может меняться и требовать повторной проверки, то добавить в зависимости.

  // Функция логина
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Если CSRF включен для login, добавьте X-CSRF-TOKEN
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Login failed due to network or parsing error' }));
        throw new Error(errorData.detail || `Login failed with status: ${response.status}`);
      }

      // После успешного логина, сервер установит cookies.
      // Теперь запросим данные пользователя, чтобы обновить состояние.
      const loggedInUser = await fetchUserData(); 
      if (loggedInUser) {
        router.push('/'); // Перенаправляем на главную страницу
      } else {
        // Это странная ситуация: логин успешен, но данные пользователя не получены.
        // Возможно, стоит вызвать performLogout.
        throw new Error("Login succeeded but failed to fetch user data.");
      }
    } catch (error) {
      console.error('Login error:', error);
      await performLogout(false, "Login failed"); // Не перенаправляем, чтобы пользователь видел ошибку на странице логина
      throw error; // Пробрасываем ошибку для обработки в UI
    } finally {
      setLoading(false);
    }
  };

  // Функция логаута (обертка над performLogout)
  const logout = async () => {
    setLoading(true);
    await performLogout(true, "User initiated logout"); // Перенаправляем на /login
    setLoading(false);
  };

  // Значение, предоставляемое контекстом
  const contextValue = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    loading,
    fetchWithAuth, // Предоставляем fetchWithAuth для использования в других частях приложения
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* 
        Можно отображать заглушку загрузки здесь, если children не должны рендериться,
        пока не завершится начальная проверка аутентификации.
        Но обычно это делается на уровне _app.tsx или layout.tsx.
      */}
      {/* {loading && !user ? <p>Authenticating...</p> : children} */}
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
