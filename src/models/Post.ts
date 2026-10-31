import { Schema, model, Document, Types } from 'mongoose';

// Interface TypeScript para tipagem do Post
export interface IPost extends Document {
  titulo: string;
  conteudo: string;
  /** Nome do autor exibido no app (derivado do usuário autenticado). */
  autor: string;
  /** Referência ao usuário que criou o post (fonte da verdade da autoria). */
  autorId?: Types.ObjectId;
  criadoEm: Date;
  atualizadoEm: Date;
}

// Esquema do Mongoose (validações do banco)
const PostSchema = new Schema<IPost>(
  {
    titulo: { type: String, required: true, trim: true, maxlength: 200 },
    conteudo: { type: String, required: true, trim: true, maxlength: 20000 },
    autor: { type: String, required: true, trim: true, maxlength: 120 },
    autorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' } }
);

export const PostModel = model<IPost>('Post', PostSchema);