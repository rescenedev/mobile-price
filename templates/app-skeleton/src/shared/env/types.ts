export type TBindingKey = keyof CloudflareEnv;

export interface IEnvAccessor {
  get<K extends TBindingKey>(key: K): CloudflareEnv[K];
}
