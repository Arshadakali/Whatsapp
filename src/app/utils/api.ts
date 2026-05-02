export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost/WhatsApp%20Group%20Dashboard/backend/php/index.php';

function readJsonBody(options: RequestInit) {
  if (typeof options.body !== 'string') return {};

  try {
    return JSON.parse(options.body);
  } catch {
    return {};
  }
}

function mockApiResponse(endpoint: string, options: RequestInit = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  const body = readJsonBody(options);

  if (endpoint === '/settings' && method === 'GET') {
    return {};
  }

  if (endpoint === '/admins' && method === 'GET') {
    return [];
  }

  if (endpoint === '/admins/login' && method === 'POST') {
    return {
      admin: {
        id: 'mock_admin_1',
        name: 'Mock Admin',
        email: body.email ?? 'admin@example.com',
        enabled: 1,
      },
    };
  }

  if ((endpoint === '/users/login' || endpoint === '/users/google-login') && method === 'POST') {
    const email = body.email ?? 'user@example.com';

    return {
      user: {
        id: 'u_mock_user',
        name: typeof email === 'string' ? email.split('@')[0] : 'Mock User',
        email,
      },
    };
  }

  if (endpoint.startsWith('/posts') && method === 'GET') return [];
  if (endpoint.startsWith('/faqs') && method === 'GET') return [];
  if (endpoint.startsWith('/comments') && method === 'GET') return [];
  if (endpoint.startsWith('/questions') && method === 'GET') return [];
  if (endpoint.startsWith('/question-answers') && method === 'GET') return [];
  if (endpoint.startsWith('/users') && method === 'GET') return [];

  if (method === 'DELETE') {
    return null;
  }

  return {
    ok: true,
    id: `mock_${Date.now()}`,
  };
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Fall back to mock responses while backend/database is unavailable.
      if (['database_disconnected', 'not_found', 'db_connect_failed'].includes(errorData.error)) {
        return mockApiResponse(endpoint, options);
      }

      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch {
    return mockApiResponse(endpoint, options);
  }
}

export const api = {
  posts: {
    list: () => fetchAPI('/posts'),
    create: (data: any) => fetchAPI('/posts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string | number, data: any) => fetchAPI(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string | number) => fetchAPI(`/posts/${id}`, { method: 'DELETE' }),
  },
  faqs: {
    list: () => fetchAPI('/faqs'),
    create: (data: any) => fetchAPI('/faqs', { method: 'POST', body: JSON.stringify(data) }),
    answer: (id: string | number, answer: string) => fetchAPI(`/faqs/${id}/answer`, { method: 'POST', body: JSON.stringify({ answer }) }),
    delete: (id: string | number) => fetchAPI(`/faqs/${id}`, { method: 'DELETE' }),
  },
  comments: {
    list: (postId?: string | number) => fetchAPI(postId ? `/comments?post_id=${postId}` : '/comments'),
    create: (data: any) => fetchAPI('/comments', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string | number) => fetchAPI(`/comments/${id}`, { method: 'DELETE' }),
  },
  questions: {
    list: () => fetchAPI('/questions'),
    create: (data: any) => fetchAPI('/questions', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string | number) => fetchAPI(`/questions/${id}`, { method: 'DELETE' }),
  },
  questionAnswers: {
    list: (userId?: string) => fetchAPI(userId ? `/question-answers?user_id=${userId}` : '/question-answers'),
    submit: (data: any) => fetchAPI('/question-answers', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string | number) => fetchAPI(`/question-answers/${id}`, { method: 'DELETE' }),
  },
  admins: {
    list: () => fetchAPI('/admins'),
    create: (data: any) => fetchAPI('/admins', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => fetchAPI('/admins/login', { method: 'POST', body: JSON.stringify(data) }),
    toggle: (id: string | number, enabled: boolean) => fetchAPI(`/admins/${id}`, { method: 'PUT', body: JSON.stringify({ enabled: enabled ? 1 : 0 }) }),
    delete: (id: string | number) => fetchAPI(`/admins/${id}`, { method: 'DELETE' }),
  },
  settings: {
    list: () => fetchAPI('/settings'),
    update: (key: string, value: string) => fetchAPI('/settings', { method: 'POST', body: JSON.stringify({ key, value }) }),
  },
  users: {
    list: () => fetchAPI('/users'),
    get: (id: string) => fetchAPI(`/users?id=${id}`),
    create: (data: any) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => fetchAPI('/users/login', { method: 'POST', body: JSON.stringify(data) }),
    googleLogin: (credential: string) => fetchAPI('/users/google-login', { method: 'POST', body: JSON.stringify({ credential }) }),
    delete: (id: string | number) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
  }
};
