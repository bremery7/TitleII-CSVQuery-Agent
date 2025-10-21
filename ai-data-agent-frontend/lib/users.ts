import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  password: string;
  email?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Initialize with default admin user if no users exist
function initializeUsers() {
  ensureDataDir();
  
  if (!fs.existsSync(USERS_FILE)) {
    const defaultAdmin: User = {
      id: '1',
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10), // Default password
      email: 'admin@example.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    
    fs.writeFileSync(USERS_FILE, JSON.stringify([defaultAdmin], null, 2));
    console.log('Created default admin user (username: admin, password: admin123)');
  }
}

// Read all users
export function getAllUsers(): User[] {
  initializeUsers();
  
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
}

// Get user by username
export async function getUserByUsername(username: string): Promise<User | null> {
  const users = getAllUsers();
  return users.find(u => u.username === username) || null;
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const users = getAllUsers();
  return users.find(u => u.id === id) || null;
}

// Create new user
export async function createUser(
  username: string,
  password: string,
  role: 'admin' | 'user' = 'user',
  email?: string
): Promise<User> {
  const users = getAllUsers();
  
  // Check if username already exists
  if (users.some(u => u.username === username)) {
    throw new Error('Username already exists');
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser: User = {
    id: String(users.length + 1),
    username,
    password: hashedPassword,
    email,
    role,
    createdAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  
  return newUser;
}

// Delete user
export async function deleteUser(id: string): Promise<boolean> {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    return false;
  }
  
  // Prevent deleting the last admin
  const user = users[userIndex];
  if (user.role === 'admin') {
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      throw new Error('Cannot delete the last admin user');
    }
  }
  
  users.splice(userIndex, 1);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  
  return true;
}

// Update user password
export async function updateUserPassword(id: string, newPassword: string): Promise<boolean> {
  const users = getAllUsers();
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return false;
  }
  
  user.password = await bcrypt.hash(newPassword, 10);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  
  return true;
}
