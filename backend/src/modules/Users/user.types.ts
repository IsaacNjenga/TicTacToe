export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  avatar: string;
  countryCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  avatar: string;
  countryCode?: string | null;
  isActivated?: boolean;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  avatar?: string;
  countryCode?: string | null;
}
