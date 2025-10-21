import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface User {
  id: string;
  username: string;
  password: string;
  email?: string;
  role: 'admin' | 'user';
  createdAt: string;
  isSuperAdmin?: boolean;
}

// Ensure data directory exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      console.log('Creating data directory:', DATA_DIR);
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
    throw error;
  }
}

// Initialize with default users if file doesn't exist
function initializeUsers() {
  try {
    ensureDataDir();
    
    if (!fs.existsSync(USERS_FILE)) {
      console.log('Creating default users file:', USERS_FILE);
      const defaultUsers: User[] = [
        {
          id: '1',
          username: 'superadmin',
          password: 'SuperAdmin123!',
          email: undefined,
          role: 'admin',
          isSuperAdmin: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          username: 'admin',
          password: 'Admin123!',
          email: undefined,
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          username: 'user',
          password: 'User123!',
          email: undefined,
          role: 'user',
          createdAt: new Date().toISOString(),
        },
      ];
      
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
      console.log('Default users created successfully');
    }
  } catch (error) {
    console.error('Error initializing users:', error);
    throw error;
  }
}

// Load users from file
export function loadUsers(): User[] {
  try {
    initializeUsers();
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

// Save users to file
export function saveUsers(users: User[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
    throw new Error('Failed to save users');
  }
}

// Get all users
export function getUsers(): User[] {
  return loadUsers();
}

// Add a new user
export function addUser(user: User): void {
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
}

// Update a user
export function updateUser(userId: string, updates: Partial<User>): boolean {
  const users = loadUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) {
    return false;
  }
  
  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return true;
}

// Delete a user
export function deleteUser(userId: string): boolean {
  const users = loadUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) {
    return false;
  }
  
  users.splice(index, 1);
  saveUsers(users);
  return true;
}

// Find user by username
export function findUserByUsername(username: string): User | undefined {
  const users = loadUsers();
  return users.find(u => u.username === username);
}

// Find user by email
export function findUserByEmail(email: string): User | undefined {
  const users = loadUsers();
  return users.find(u => u.email === email);
}

// Find user by ID
export function findUserById(userId: string): User | undefined {
  const users = loadUsers();
  return users.find(u => u.id === userId);
}
