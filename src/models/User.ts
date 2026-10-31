import { Document, Schema, model } from 'mongoose';

export const PAPEIS = ['professor', 'aluno'] as const;
export type Papel = (typeof PAPEIS)[number];

export interface IUser extends Document {
  nome: string;
  email: string;
  passwordHash: string;
  role: Papel;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Formato seguro de usuário exposto pela API (nunca inclui passwordHash). */
export interface UsuarioPublico {
  _id: string;
  nome: string;
  email: string;
  role: Papel;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    nome: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: PAPEIS, required: true, default: 'aluno' },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/** Converte o documento em um objeto seguro para resposta HTTP. */
export const paraUsuarioPublico = (usuario: IUser): UsuarioPublico => ({
  _id: String(usuario._id),
  nome: usuario.nome,
  email: usuario.email,
  role: usuario.role,
  ativo: usuario.ativo,
  createdAt: usuario.createdAt,
  updatedAt: usuario.updatedAt,
});

export const UserModel = model<IUser>('User', UserSchema);
