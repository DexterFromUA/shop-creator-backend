# Настройка системы авторизации

## Обзор

Система авторизации интегрирует:
- **Backend**: GraphQL + JWT + Prisma + PostgreSQL
- **Frontend**: React + AuthContext + JWT

## Настройка Backend

### 1. Переменные окружения

Создайте файл `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shop_system?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Server
PORT=3000
FRONTEND_URL="http://localhost:3001"

# Environment
NODE_ENV="development"
```

### 2. Установка зависимостей

```bash
cd backend
yarn install
```

### 3. Настройка базы данных

```bash
# Примените миграции Prisma
npx prisma migrate dev

# Сгенерируйте Prisma клиент
npx prisma generate
```

### 4. Запуск сервера

```bash
yarn dev
```

## Настройка Frontend

### 1. Переменные окружения

Создайте файл `shop_admin/.env`:

```env
REACT_APP_GRAPHQL_ENDPOINT="http://localhost:3000/graphql"
```

### 2. Установка зависимостей

```bash
cd shop_admin
npm install
```

### 3. Запуск приложения

```bash
npm start
```

## API авторизации

### Мутации

#### Регистрация
```graphql
mutation Register($email: String!, $password: String!, $name: String) {
  register(email: $email, password: $password, name: $name) {
    token
    client {
      id
      email
      name
      role
    }
  }
}
```

#### Вход
```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    client {
      id
      email
      name
      role
    }
  }
}
```

### Запросы

#### Текущий пользователь
```graphql
query Me {
  me {
    id
    email
    name
    role
    emailVerified
    phoneVerified
  }
}
```

## Структура авторизации

### Токены
- JWT токены с истечением через 24 часа
- Хранятся в localStorage
- Передаются в заголовке `Authorization: Bearer <token>`

### Роли пользователей
- `USER` - обычный пользователь
- `ADMIN` - администратор

### Защищенные маршруты
- Все маршруты админ-панели требуют авторизации
- Перенаправление на `/auth` для неавторизованных пользователей

## Компоненты авторизации

- `AuthContext` - управление состоянием авторизации
- `EmailLogin` - форма входа по email
- `EmailSignUp` - форма регистрации по email
- `PhoneAuth` - авторизация по телефону (в разработке)
- `ProtectedRoute` - HOC для защищенных маршрутов

## Безопасность

- Пароли хешируются с bcryptjs
- JWT токены подписываются секретным ключом
- CORS настроен для frontend домена
- Валидация данных на backend и frontend 